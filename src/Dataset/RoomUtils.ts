import JSZip from "jszip";
//import {InsightError} from "../controller/IInsightFacade";
import * as RoomUtils from "./RoomUtils";
import * as HtmlUtils from "./HtmlUtils";
import Room from "./Room";
import http from "node:http";

//=>this file is implemented with help from chatGPT
const goodCode: number = 200;

interface GeoResponse {
	lat?: number;

	lon?: number;

	error?: string;
}

export function getShortName(buildingNode: any): string | null {
	return HtmlUtils.getTextContentNotInAnchor(buildingNode, "views-field views-field-field-building-code");
}

export function getFullName(buildingNode: any): string | null {
	return HtmlUtils.getTextContentInAnchor(buildingNode, "views-field views-field-title");
}
export function getAddress(buildingNode: any): string | null {
	return HtmlUtils.getTextContentNotInAnchor(buildingNode, "views-field views-field-field-building-address");
}

export function getBuildingHerf(buildingNode: any): string | null {
	return HtmlUtils.getHerfInAnchor(buildingNode, "views-field views-field-nothing");
}

export function getRoomOnlineHerf(room: any): string | null {
	return HtmlUtils.getHerfInAnchor(room, "views-field views-field-nothing");
}

export function getSeats(room: any): number | null {
	const text = HtmlUtils.getTextContentNotInAnchor(room, "views-field views-field-field-room-capacity");
	if (text === null) {
		return null;
	}
	const num = Number(text);
	return isNaN(num) ? null : num;
}
export function getFurnitureType(room: any): string | null {
	return HtmlUtils.getTextContentNotInAnchor(room, "views-field views-field-field-room-furniture");
}
export function getRoomType(room: any): string | null {
	return HtmlUtils.getTextContentNotInAnchor(room, "views-field views-field-field-room-type");
}
export function getRoomNumber(room: any): string | null {
	return HtmlUtils.getTextContentInAnchor(room, "views-field views-field-field-room-number");
}
export function getHerfInAnchor(buildingNode: any, targetClass: string): string | null {
	if (!buildingNode?.childNodes || buildingNode.childNodes.length === 0) {
		return null;
	}
	// Iterate over each child (expected to be td elements)
	for (const cell of buildingNode.childNodes) {
		if (cell.nodeName === "td" && cell.attrs) {
			const classAttr = cell.attrs.find((attr: any) => attr.name === "class");
			if (classAttr && classAttr.value === targetClass) {
				// Use getHerfContent to extract the href from the found td within this cell.
				return HtmlUtils.getHerfContent(cell);
			}
		}
	}
	return null;
}

export function pushRoom(
	rooms: any,
	buildingShortName: string,
	buildingFullName: string,
	buildingAddres: string,
	buildingGeoInfo: GeoResponse,
	roomNumber: string,
	seats: number,
	furnitureType: string,
	roomType: string,
	roomHerf: string
): void {
	// Use the GeoResponse to obtain latitude and longitude.
	// If an error occurred, we default lat and lon to 0.
	const lat: number | undefined = buildingGeoInfo.lat;
	const lon: number | undefined = buildingGeoInfo.lon;

	// Construct the room name as "shortname_roomNumber"
	const name: string = `${buildingShortName}_${roomNumber}`;

	// Create a new Room instance.
	// The Room constructor expects:
	// (fullname, shortname, number, name, address, lat, lon, seats, type, furniture, href)
	const room = new Room(
		buildingFullName, // fullname: full building name
		buildingShortName, // shortname: building's short name
		roomNumber, // number: the room number
		name, // name: built as buildingShortName + "_" + roomNumber
		buildingAddres, // address: the building's address (from the dataset)
		lat, // latitude from geolocation (or 0 if error)
		lon, // longitude from geolocation (or 0 if error)
		seats, // seats: capacity of the room
		roomType, // type: room type (e.g., "Small Group")
		furnitureType, // furniture: furniture type (e.g., "Classroom-Movable Tables & Chairs")
		roomHerf // href: the building link (as provided)
	);

	// Push the new room into the rooms array.
	rooms.push(room);
}

export async function addRoomsWithBuildingList(buildingList: any[], rooms: any[], unzip: JSZip): Promise<void> {
	const promises: Promise<void>[] = [];
	for (const building of buildingList) {
		if (!building.childNodes) {
			continue;
		}
		const buildingSN: string | null = RoomUtils.getShortName(building);
		const buildingFullName: string | null = RoomUtils.getFullName(building);
		const buildingAddress: string | null = RoomUtils.getAddress(building);
		const buildingLink: string | null = RoomUtils.getBuildingHerf(building);
		if (buildingSN !== null && buildingFullName !== null && buildingAddress !== null && buildingLink !== null) {
			// Normalize the path.
			const normalizedPath = buildingLink.replace(/^\.\/+/, "");
			// Check that the file exists in the zip.
			const htmlFile = unzip.file(normalizedPath);
			if (!htmlFile) {
				// File not found in zip; skip this building.
				//console.log("i skip this building");
				continue;
			}

			// Chain the asynchronous operations (opening and parsing, then processing the room table)
			const promise = HtmlUtils.openAndParseHtmlFileFromPath(unzip, buildingLink)
				.then(async (htmlTree: any) => {
					if (htmlTree) {
						return RoomUtils.addRoomsWithBuildingListHelper(
							htmlTree,
							rooms,
							buildingSN,
							buildingFullName,
							buildingAddress
						);
					}
				})
				.catch((err) => {
					// Optionally handle errors for this building here.
					//console.error("Error processing building", buildingLink, err);
				});
			promises.push(promise);
		}
	}
	// Wait for all asynchronous room additions to finish concurrently.
	await Promise.all(promises);
}

export async function getGeo(address: string): Promise<GeoResponse> {
	return new Promise((resolve) => {
		// Encode the address using encodeURIComponent.
		const encodedAddress = encodeURIComponent(address);
		const teamNumber = "210"; // Replace with your team number.
		const requestUrl = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team${teamNumber}/${encodedAddress}`;

		http
			.get(requestUrl, (res) => {
				let rawData = "";

				// Set the response encoding to UTF-8.
				res.setEncoding("utf8");

				res.on("data", (chunk) => {
					rawData += chunk;
				});

				res.on("end", () => {
					if (res.statusCode !== goodCode) {
						resolve({ error: `HTTP Error: ${res.statusCode}` });
						return;
					}
					try {
						const geoResponse: GeoResponse = JSON.parse(rawData);
						resolve(geoResponse);
					} catch {
						resolve({ error: "Error parsing JSON response" });
					}
				});
			})
			.on("error", (err) => {
				resolve({ error: err.message });
			});
	});
}

export async function addRoomsWithBuildingListHelper(
	htmlTree: any,
	rooms: any,
	buildingSN: string,
	buildingFN: string,
	bAdd: string
): Promise<void> {
	//find the table for room list
	const roomTable = HtmlUtils.findTableForRoomList(htmlTree);
	if (!roomTable) return;
	// Locate the tbody within the table
	const roomTbodt = HtmlUtils.getTbodyNode(roomTable);
	if (!roomTbodt) return;

	// Get room list (each room is a <tr>) inside the tbody
	const roomList = HtmlUtils.gettrList(roomTbodt);
	const bGInfo: GeoResponse = await RoomUtils.getGeo(bAdd);
	if (!bGInfo || bGInfo.error) return;

	for (const room of roomList) {
		// Initialize variables for each piece of room info.
		const roomNum: string | null = RoomUtils.getRoomNumber(room);
		const seats: number | null = RoomUtils.getSeats(room);
		const furnType: string | null = RoomUtils.getFurnitureType(room);
		const roomType: string | null = RoomUtils.getRoomType(room);
		const rHerf: string | null = RoomUtils.getRoomOnlineHerf(room);

		if (roomNum !== null && seats !== null && furnType !== null && roomType !== null && rHerf !== null) {
			RoomUtils.pushRoom(rooms, buildingSN, buildingFN, bAdd, bGInfo, roomNum, seats, furnType, roomType, rHerf);
		}
	}
}
//<=this file is implemented with help from chatGPT
