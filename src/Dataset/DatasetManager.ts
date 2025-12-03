import fs from "fs-extra";
import path from "path";
import Section from "./Section";
import Room from "./Room";
import JSZip from "jszip";
import { Buffer } from "node:buffer";
import { promises as fss } from "fs";
import { InsightDatasetKind, InsightError, NotFoundError } from "../controller/IInsightFacade";
import * as RoomUtils from "./RoomUtils";
import * as HtmlUtils from "./HtmlUtils";
import * as parse5 from "parse5";

const DATASET_DIR = path.join(__dirname, "../../data");

//=>this file is implemented with help from chatGPT
export default class DatasetManager {
	private static instance: DatasetManager | undefined;
	private datasetMap: Map<string, any[]>;
	private kindMap: Map<string, InsightDatasetKind>;

	private constructor() {
		this.datasetMap = new Map<string, any[]>();
		this.kindMap = new Map<string, InsightDatasetKind>();
	}

	//Generate by Copilot =>
	public static destroyInstance(): void {
		DatasetManager.instance?.datasetMap.clear();
		DatasetManager.instance?.kindMap.clear();
		DatasetManager.instance = undefined;
	}
	//Generate by Copilot <=

	public static async getInstance(): Promise<DatasetManager> {
		if (!DatasetManager.instance) {
			DatasetManager.instance = new DatasetManager();
			//generate by Copilot =>
			await DatasetManager.instance.loadDatasetsFromDisk();
			//generate by Copilot <=
		}
		return DatasetManager.instance;
	}

	//Generate by Copilot with modification =>
	public static printInstance(): void {
		if (!DatasetManager.instance) {
			//console.log("the instance is null");
		} else {
			// console.log([...DatasetManager.instance.datasetMap.keys()]);
			//console.log([...DatasetManager.instance.kindMap.entries()]);
		}
	}
	//Generate by Copilot with modification<=

	private async addDatasetRooms(id: string, content: string, kind: InsightDatasetKind): Promise<boolean> {
		const unzip: JSZip = await this.checkIDFileAndGetUnzip(id, content);
		const htmlContent: string = await HtmlUtils.getIndexHtmlContentInString(unzip);
		const htmlTree = parse5.parse(htmlContent);

		const buildingTable = HtmlUtils.findTableForBuildingList(htmlTree);
		if (!buildingTable) throw new InsightError("the building table is not found");

		const tbodyNode = HtmlUtils.getTbodyNode(buildingTable);
		if (!tbodyNode) throw new InsightError("the tbodyNode is not found");

		const buildingListtr = HtmlUtils.gettrList(tbodyNode);
		if (buildingListtr.length === 0) throw new InsightError("the buildingListtr is empty");

		const rooms: Room[] = [];
		await RoomUtils.addRoomsWithBuildingList(buildingListtr, rooms, unzip);
		if (!(rooms.length > 0)) throw new InsightError("fail to add rooms");

		this.datasetMap.set(id, rooms);
		this.kindMap.set(id, kind);

		try {
			await this.saveDatasetToDisk(id, rooms, kind);
		} catch {
			throw new InsightError("fail to save the dataset about rooms to disk");
		}

		return true;
	}

	private async addDatasetSection(id: string, content: string, kind: InsightDatasetKind): Promise<boolean> {
		const zip: JSZip = await this.checkIDFileAndGetUnzip(id, content);

		if (!Object.keys(zip.files).includes("courses/")) {
			throw new InsightError("the zip file does not contain a folder named courses");
		}

		//get the courses folder
		const coursesFolder = zip.folder("courses");
		const sections: Section[] = [];
		//iterate through the courses folder
		await this.iterateThroughCoursesFolder(coursesFolder, sections);
		if (sections.length === 0) {
			throw new InsightError("there is no valid section in the courses folder");
		}
		this.datasetMap.set(id, sections);
		this.kindMap.set(id, kind);

		try {
			await this.saveDatasetToDisk(id, sections, kind);
		} catch {
			throw new InsightError("fail to save the dataset about sections to disk");
		}
		return true;
	}

	private async checkIDFileAndGetUnzip(id: string, content: string): Promise<JSZip> {
		if (!this.checkID(id)) {
			throw new InsightError("the id is invalid");
		}

		//check the raw file is a zip file and is base64
		if (!this.isBase64ZipFile(content)) {
			throw new InsightError("the file is not a zip file or is not base64");
		}
		//unzip the file
		let unzip: JSZip;
		try {
			unzip = await JSZip.loadAsync(content, { base64: true });
		} catch (error) {
			throw new InsightError("fail to unzip the file" + error);
		}
		return unzip;
	}

	public getDatasetMap(): Map<string, any[]> {
		return this.datasetMap;
	}

	public getKindMap(): Map<string, InsightDatasetKind> {
		return this.kindMap;
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<boolean> {
		if (kind === InsightDatasetKind.Sections) {
			return this.addDatasetSection(id, content, kind);
		} else if (kind === InsightDatasetKind.Rooms) {
			return this.addDatasetRooms(id, content, kind);
		} else {
			throw new InsightError("the kind is invalid");
		}
	}

	private async iterateThroughCoursesFolder(coursesFolder: JSZip | null, sections: Section[]): Promise<void> {
		const promises: Promise<void>[] = [];
		if (!coursesFolder) {
			throw new InsightError("the courses folder is null");
		}
		//Generate by ChatGPT with modified code =>
		coursesFolder.forEach((relativePath: string, file: JSZip.JSZipObject) => {
			if (!file.dir && !relativePath.includes("__MACOSX/") && !relativePath.includes(".DS_Store")) {
				promises.push(this.processSection(file, sections));
			}
		});
		await Promise.all(promises);
	}
	//Generate by ChatGPT with modified code <=

	private async processSection(file: JSZip.JSZipObject, sections: Section[]): Promise<void> {
		try {
			//Generate by Copilot with modified code =>
			const content = await file.async("text");
			const data = JSON.parse(content);
			if (data && Array.isArray(data.result)) {
				for (const section of data.result) {
					if (this.isValidSection(section)) {
						const newSection = new Section(
							Number(section.Avg),
							Number(section.Pass),
							Number(section.Fail),
							Number(section.Audit),
							Number(section.Year),
							section.Subject.toString(),
							section.Course.toString(),
							section.Professor.toString(),
							section.Title.toString(),
							section.id.toString()
						);
						sections.push(newSection);
					}
					//Generate by Copilot with modified code<=
				}
			}
		} catch (error) {
			//console.log("fail to process this section" + error);
			// throw new Error("fail to process this section" + error);
			throw new InsightError("fail to process the section" + error);
		}
	}

	private isValidSection(section: any): boolean {
		return (
			//Generated by ChatGPT with modified code=>
			typeof section.Avg !== null &&
			!isNaN(section.Avg) &&
			typeof section.Pass !== null &&
			!isNaN(section.Pass) &&
			typeof section.Fail !== null &&
			!isNaN(section.Fail) &&
			typeof section.Audit !== null &&
			!isNaN(section.Audit) &&
			typeof section.Year !== null &&
			!isNaN(section.Year) &&
			typeof section.Subject !== null &&
			typeof section.id !== null &&
			typeof section.Professor !== null &&
			typeof section.Course !== null &&
			typeof section.Title !== null
			//<=Generated by ChatGPT with modified code
		);
	}

	private checkID(id: string): boolean {
		//Generated by ChatGPT with modified code=>
		if (!id || id.trim() === "" || id.includes("_") || this.datasetMap.has(id)) return false;
		return true;

		//Generated by ChatGPT with modified code<=
	}

	private isBase64ZipFile(content: string): boolean {
		try {
			//Generated by DeepSeek=>
			const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
			if (!base64Regex.test(content)) {
				return false;
			}
			const buffer = Buffer.from(content, "base64");

			if (buffer.length < 2) {
				return false;
			}

			const signature = buffer.slice(0, 2).toString();
			return signature === "PK";
			//<=Generated by DeepSeek
		} catch (error) {
			throw new InsightError("something unexpected happened when checking the file type" + error);
		}
	}

	public async reloadDataset(): Promise<void> {
		await this.loadDatasetsFromDisk();
	}

	public async removeDataset(id: string): Promise<boolean> {
		if (!id || id.trim() === "" || id.includes("_")) {
			throw new InsightError("invalid id");
		}
		await this.reloadDataset();
		if (!this.datasetMap.has(id)) {
			throw new NotFoundError("the dataset is not found");
		}

		//Generate by Copilot =>
		try {
			await this.removeDatasetFromDisk(id);
			this.datasetMap.delete(id);
			this.kindMap.delete(id);
			return true;
		} catch (error) {
			throw new InsightError("fail to remove the dataset1" + error);
		}
		//<=Generate by Copilot
	}

	//Generate by ChatGPT =>
	public async saveDatasetToDisk(id: string, dataset: any[], kind: InsightDatasetKind): Promise<void> {
		const datasetPath = path.join(DATASET_DIR, `${id}.json`);
		const data = {
			dataset: dataset,
			kind: kind,
		};
		await fs.ensureDir(DATASET_DIR);
		await fs.writeFile(datasetPath, JSON.stringify(data));
	}

	private async loadDatasetsFromDisk(): Promise<void> {
		await fs.ensureDir(DATASET_DIR);
		const files = await fs.readdir(DATASET_DIR);
		this.datasetMap.clear();
		this.kindMap.clear();
		await Promise.all(
			files.map(async (file) => {
				const datasetPath = path.join(DATASET_DIR, file);
				const data = await fss.readFile(datasetPath, "utf8");
				const parsedData = JSON.parse(data);
				const datasetId = file.replace(".json", "");
				this.datasetMap.set(datasetId, parsedData.dataset);
				this.kindMap.set(datasetId, parsedData.kind);
			})
		);
	}
	//<= Generate by ChatGPT

	//Generate by DeepSeek =>
	public async removeDatasetFromDisk(id: string): Promise<void> {
		const datasetPath = path.join(DATASET_DIR, `${id}.json`);

		try {
			await fs.access(datasetPath); // Check if the file exists
			await fs.remove(datasetPath);
		} catch (error: any) {
			if (error.code === "ENOENT") {
				throw new NotFoundError("The dataset is not found from removeDatasetFromDisk");
			} else {
				throw new InsightError("Failed to remove dataset from disk2: " + error.message);
			}
		}
	}
	//<= Generate by DeepSeek
}

//<=this file is implemented with help from chatGPT
// private gettrList(table: any): any[] {
// 	const queue = [table];
// 	const rowNodes: any[] = [];
//
// 	while (queue.length > 0) {
// 		const node = queue.shift();
// 		if (node.nodeName === "tr") {
// 			rowNodes.push(node);
// 		}
//
// 		if (node.childNodes && node.childNodes.length > 0) {
// 			queue.push(...node.childNodes);
// 		}
// 	}
// 	return rowNodes;
// }
// private getTextContentInAnchor(row: any, targetClass: string): string | null {
// 	if (!row?.childNodes || row.childNodes.length === 0) {
// 		return null;
// 	}
// 	// Iterate over all immediate children (expected to be td elements)
// 	for (const cell of row.childNodes) {
// 		if (cell.nodeName === "td" && cell.attrs) {
// 			const classAttr = cell.attrs.find((attr: any) => attr.name === "class");
// 			if (classAttr && classAttr.value === targetClass) {
// 				// Look for an anchor (<a>) element within the td
// 				const anchor = this.findAnchor(cell);
// 				if (anchor?.childNodes) {
// 					// Iterate over the anchor's child nodes to get the text content
// 					for (const child of anchor.childNodes) {
// 						if (child.nodeName === "#text" && child.value) {
// 							return child.value.trim();
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// 	return null;
// }

//given a node, find the anchorNode
// private findAnchor(node: any): any | null {
// 	const queue = [node];
// 	while (queue.length > 0) {
// 		const current = queue.shift();
// 		if (current.nodeName === "a") {
// 			return current;
// 		}
// 		if (current.childNodes) {
// 			queue.push(...current.childNodes);
// 		}
// 	}
// 	return null;
// }

// private getTextContentNotInAnchor(rowtrLevel: any, targetClass: string): string | null {
// 	if (!rowtrLevel?.childNodes || rowtrLevel.childNodes.length === 0) {
// 		return null;
// 	}
// 	// Iterate over the td elements within the row.
// 	for (const tdLevel of rowtrLevel.childNodes) {
// 		if (tdLevel.nodeName === "td" && tdLevel.attrs) {
// 			const classAttr = tdLevel.attrs.find((attr: any) => attr.name === "class");
// 			if (classAttr && classAttr.value === targetClass) {
// 				// Once a matching tdLevel is found, search its childNodes for text.
// 				if (tdLevel.childNodes && tdLevel.childNodes.length > 0) {
// 					for (const child of tdLevel.childNodes) {
// 						if (child.nodeName === "#text" && child.value) {
// 							return child.value.trim();
// 						}
// 					}
// 				}
// 			}
// 		}
// 	}
// 	return null;
// }
//help with chatgpt =>
// private getTbodyNode(tableNode:any):any {
// 	if (!tableNode.childNodes) {
// 		return null;
// 	}
// 	for (const child of tableNode.childNodes) {
// 		if (child.nodeName === "tbody") {
// 			return child;
// 		}
// 	}
//
// 	return null;
// }
// private async getIndexHtmlContentInString(unzip: JSZip): Promise<string> {
// 	const htmlfile = unzip.file("index.htm");
// 	if (!htmlfile) {
// 	throw new InsightError("the zip file does not have index.html")
// }
//
// //Generate by Copilot with modified code =>
// let htmlContent: string;
// try {
// 	htmlContent = await htmlfile.async("text");
// } catch (error) {
// 	throw new InsightError("fail to read the html file" + error);
// }
// return htmlContent;
// }
// private getShortName(buildingNode:any):string | null {
// 	return RoomUtils.getTextContentNotInAnchor(buildingNode, "views-field views-field-field-building-code");
// }
//
// private getFullName(buildingNode:any):string | null {
// 	return RoomUtils.getTextContentInAnchor(buildingNode, "views-field views-field-title");
// }
// private getAddress(buildingNode:any):string | null {
// 	return RoomUtils.getTextContentNotInAnchor(buildingNode, "views-field views-field-field-building-address");
// }
// private getHerf(buildingNode:any):string | null {
// 	return this.getHerfInAnchor(buildingNode, "views-field views-field-nothing");
// }
// private getSeats(room: any): number | null {
// 	const text = RoomUtils.getTextContentNotInAnchor(room, "views-field views-field-field-room-capacity");
// 	if (text === null) {
// 		return null;
// 	}
// 	const num = Number(text);
// 	return isNaN(num) ? null : num;
// }
//
// private getFurnitureType(room: any): string | null {
// 	return RoomUtils.getTextContentNotInAnchor(room, "views-field views-field-field-room-furniture");
// }
//
// private getRoomType(room: any): string | null {
// 	return RoomUtils.getTextContentNotInAnchor(room, "views-field views-field-field-room-type");
// }
//
// private getRoomNumber(room: any): string | null {
// 	return RoomUtils.getTextContentInAnchor(room, "views-field views-field-field-room-number");
// }

//private async addRoomsWithBuildingListHelper(htmlTree:any, rooms:any, buildingShortName:string,
// 											 buildingFullName:string, buildingAddres:string, buildingLink:string):
// 	Promise<void> {
// 	//find the table for room list
// 	const roomTable = this.findTableForRoomList(htmlTree);
// 	if (!roomTable) return;
//
// 	// Locate the tbody within the table
// 	const roomTbodt = RoomUtils.getTbodyNode(roomTable);
// 	if (!roomTbodt) return;
//
// 	// Get room list (each room is a <tr>) inside the tbody
// 	const roomList = RoomUtils.gettrList(roomTbodt);
// 	const buildingGeoInfo:GeoResponse = await this.getGeo(buildingAddres);
// 	if (buildingGeoInfo.error) {
// 		//console.log("Error getting geo info for building: " + buildingGeoInfo.error);
// 		return;
// 	}
//
// 	for (const room of roomList) {
// 		// Initialize variables for each piece of room info.
// 		const roomNumber:string | null = RoomUtils.getRoomNumber(room);
// 		const seats:number | null = RoomUtils.getSeats(room);
// 		const furnitureType:string | null = RoomUtils.getFurnitureType(room);
// 		const roomType:string | null = RoomUtils.getRoomType(room);
//
// 		if (roomNumber && seats && furnitureType && roomType) {
// 			this.pushRoom(rooms, buildingShortName, buildingFullName, buildingAddres, buildingLink,
// 				buildingGeoInfo, roomNumber, seats, furnitureType, roomType);
// 		}
//
//
// 	}
// }

// private findTableForBuildingList(root: any): any | null {
// 	const queue = [root];
//
// 	while (queue.length > 0) {
// 		const node = queue.shift();
// 		if (node.nodeName === "table") {
// 			if (this.tableHasBuildingList(node)) {
// 				return node;
// 			}
// 		}
//
// 		if (node.childNodes && node.childNodes.length > 0) {
// 			queue.push(...node.childNodes);
// 		}
// 	}
// 	return null;
// }
// private tableHasBuildingList(tableNode: any):boolean {
// 	const queue = [tableNode];
// 	while (queue.length > 0) {
// 		const node = queue.shift();
// 		if (node.nodeName === "td" && node.attrs) {
// 			const classAttr = node.attrs.find((attr:any) => attr.name === "class");
// 			if (classAttr && (classAttr.value === "views-field views-field-title")) {
// 				return true;
// 			}
// 		}
//
// 		if (node.childNodes && node.childNodes.length > 0) {
// 			queue.push(...node.childNodes);
// 		}
// 	}
// 	return false;
// }

// private findTableForRoomList(root: any): any | null {
// 	const queue = [root];
// 	while (queue.length > 0) {
// 		const node = queue.shift();
// 		if (node.nodeName === "table") {
// 			if (this.tableHasRoomList(node)) {
// 				return node;
// 			}
// 		}
// 		if (node.childNodes && node.childNodes.length > 0) {
// 			queue.push(...node.childNodes);
// 		}
// 	}
// 	return null;
// }

// private tableHasRoomList(tableNode: any):boolean {
// 	const queue = [tableNode];
// 	while (queue.length > 0) {
// 		const node = queue.shift();
// 		if (node.nodeName === "td" && node.attrs) {
// 			const classAttr = node.attrs.find((attr:any) => attr.name === "class");
// 			if (classAttr && (classAttr.value === "views-field views-field-field-room-number")) {
// 				return true;
// 			}
// 		}
// 		if (node.childNodes && node.childNodes.length > 0) {
// 			queue.push(...node.childNodes);
// 		}
// 	}
// 	return false;
// }
// private async addDatasetRooms(id: string, content: string, kind: InsightDatasetKind): Promise<boolean> {
//
// 	const unzip: JSZip = await this.checkIDFileAndGetUnzip(id, content);
// 	const htmlContent:string = await RoomUtils.getIndexHtmlContentInString(unzip);
// 	const htmlTree = parse5.parse(htmlContent);
//
// 	const buildingTable = this.findTableForBuildingList(htmlTree);
// 	if (!buildingTable) throw new InsightError("the building table is not found");
//
// 	const tbodyNode = RoomUtils.getTbodyNode(buildingTable);
// 	if (!tbodyNode) throw new InsightError("the tbodyNode is not found");
//
// 	const buildingListtr = RoomUtils.gettrList(tbodyNode);
// 	if (buildingListtr.length === 0) throw new InsightError("the buildingListtr is empty");
//
// 	const rooms: Room[] = [];
// 	await this.addRoomsWithBuildingList(buildingListtr, rooms, unzip);
// 	if (!(rooms.length > 0)) throw new InsightError("fail to add rooms");
//
//
// 	this.datasetRoomsMap.set(id, rooms);
// 	this.kindMap.set(id, kind);
//
// 	return true;
// }

// private getHerfInAnchor(buildingNode: any, targetClass: string): string | null {
// 	if (!buildingNode?.childNodes || buildingNode.childNodes.length === 0) {
// 		return null;
// 	}
// 	// Iterate over each child (expected to be td elements)
// 	for (const cell of buildingNode.childNodes) {
// 		if (cell.nodeName === "td" && cell.attrs) {
// 			const classAttr = cell.attrs.find((attr: any) => attr.name === "class");
// 			if (classAttr && classAttr.value === targetClass) {
// 				// Use getHerfContent to extract the href from the found td within this cell.
// 				return this.getHerfContent(cell);
// 			}
// 		}
// 	}
// 	return null;
// }
// private getHerfContent(td:any):string | null {
// 	//get the anchorNode
// 	const anchor = RoomUtils.findAnchor(td);
// 	if (!anchor) {
// 		return null;
// 	}
// 	for (const attr of anchor.attrs) {
// 		if (attr.name === "href") {
// 			return attr.value;
// 		}
// 	}
// 	return null;
// }

//private async getGeo(address: string): Promise<GeoResponse> {
// 	return new Promise((resolve) => {
// 		// Encode the address using encodeURIComponent.
// 		const encodedAddress = encodeURIComponent(address);
// 		const teamNumber = "210"; // Replace with your team number.
// 		const requestUrl = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team${teamNumber}/${encodedAddress}`;
//
// 		http.get(requestUrl, (res) => {
// 			let rawData = "";
//
// 			// Set the response encoding to UTF-8.
// 			res.setEncoding("utf8");
//
// 			res.on("data", (chunk) => {
// 				rawData += chunk;
// 			});
//
// 			res.on("end", () => {
// 				if (res.statusCode !== 200) {
// 					resolve({ error: `HTTP Error: ${res.statusCode}` });
// 					return;
// 				}
// 				try {
// 					const geoResponse: GeoResponse = JSON.parse(rawData);
// 					resolve(geoResponse);
// 				} catch {
// 					resolve({ error: "Error parsing JSON response" });
// 				}
// 			});
// 		}).on("error", (err) => {
// 			resolve({ error: err.message });
// 		});
// 	});
// }

// private async openAndParseHtmlFileFromZip(zip:JSZip, filePath:string): Promise<any> {
// 	const normalizedPath = filePath.replace(/^\.\/+/, '');
//
// 	// Retrieve the file from the zip archive
// 	const htmlFile = zip.file(normalizedPath);
// 	if (!htmlFile) {
// 		throw new InsightError(`File not found in zip: ${normalizedPath}`);
// 	}
//
// 	// Read the file contents as text with proper error handling
// 	let htmlContent: string;
// 	try {
// 		htmlContent = await htmlFile.async("text");
// 	} catch (error) {
// 		throw new InsightError("Failed to read the HTML file: " + error);
// 	}
//
// 	// Parse the HTML content into a document tree using parse5
// 	const htmlTree = parse5.parse(htmlContent);
// 	return htmlTree;
// }

// private async addRoomsWithBuildingList(buildingList: any[], rooms: any[], unzip: JSZip): Promise<void> {
// 	const promises: Promise<void>[] = [];
// for (const building of buildingList) {
// 	if (!building.childNodes) {
// 		continue;
// 	}
//
// 	const buildingShortName: string | null = RoomUtils.getShortName(building);
// 	const buildingFullName: string | null = RoomUtils.getFullName(building);
// 	const buildingAddress: string | null = RoomUtils.getAddress(building);
// 	const buildingLink: string | null = RoomUtils.getHerf(building);
//
// 	if (buildingShortName && buildingFullName && buildingAddress && buildingLink) {
// 		// Chain the asynchronous operations (opening and parsing, then processing the room table)
// 		const promise = this.openAndParseHtmlFileFromZip(unzip, buildingLink)
// 			.then(async (htmlTree: any) => {
// 				if (htmlTree) {
// 					return this.addRoomsWithBuildingListHelper(htmlTree, rooms, buildingShortName,
// 						buildingFullName, buildingAddress, buildingLink);
// 				}
// 			})
// 			.catch((err) => {
// 				// Optionally handle errors for this building here.
// 				console.error("Error processing building", buildingLink, err);
// 			});
// 		promises.push(promise);
// 	}
// }
// // Wait for all asynchronous room additions to finish concurrently.
// await Promise.all(promises);
// }

// private pushRoom(
// 	rooms: any,
// 	buildingShortName: string,
// 	buildingFullName: string,
// 	buildingAddres: string,
// 	buildingLink: string,
// 	buildingGeoInfo: GeoResponse,
// 	roomNumber: string,
// 	seats: number,
// 	furnitureType: string,
// 	roomType: string
// ): void {
// 	// Use the GeoResponse to obtain latitude and longitude.
// 	// If an error occurred, we default lat and lon to 0.
// 	const lat: number | undefined = buildingGeoInfo.lat;
// 	const lon: number | undefined = buildingGeoInfo.lon;
//
// 	// Construct the room name as "shortname_roomNumber"
// 	const name: string = `${buildingShortName}_${roomNumber}`;
//
// 	// Create a new Room instance.
// 	// The Room constructor expects:
// 	// (fullname, shortname, number, name, address, lat, lon, seats, type, furniture, href)
// 	const room = new Room(
// 		buildingFullName,    // fullname: full building name
// 		buildingShortName,   // shortname: building's short name
// 		roomNumber,          // number: the room number
// 		name,                // name: built as buildingShortName + "_" + roomNumber
// 		buildingAddres,      // address: the building's address (from the dataset)
// 		lat,                 // latitude from geolocation (or 0 if error)
// 		lon,                 // longitude from geolocation (or 0 if error)
// 		seats,               // seats: capacity of the room
// 		roomType,            // type: room type (e.g., "Small Group")
// 		furnitureType,       // furniture: furniture type (e.g., "Classroom-Movable Tables & Chairs")
// 		buildingLink         // href: the building link (as provided)
// 	);
//
// 	// Push the new room into the rooms array.
// 	rooms.push(room);
// }
