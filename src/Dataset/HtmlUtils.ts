import JSZip from "jszip";
import { InsightError } from "../controller/IInsightFacade";
import * as HtmlUtils from "./HtmlUtils";
import * as parse5 from "parse5";

//=>this file is implemented with help from chatGPT

export async function getIndexHtmlContentInString(unzip: JSZip): Promise<string> {
	const htmlfile = unzip.file("index.htm");
	if (!htmlfile) {
		throw new InsightError("the zip file does not have index.html");
	}

	let htmlContent: string;
	try {
		htmlContent = await htmlfile.async("text");
	} catch (error) {
		throw new InsightError("fail to read the html file" + error);
	}
	return htmlContent;
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

//assume the file path is valid
export async function openAndParseHtmlFileFromPath(zip: JSZip, filePath: string): Promise<any> {
	const normalizedPath = filePath.replace(/^\.\/+/, "");

	// Retrieve the file from the zip archive
	const htmlFile = zip.file(normalizedPath);
	if (!htmlFile) {
		throw new Error("the openAndParseHtmlFileFromZip should have a valid filePath");
	}

	// Read the file contents as text with proper error handling
	let htmlContent: string;
	try {
		htmlContent = await htmlFile.async("text");
	} catch (error) {
		throw new InsightError("Failed to read the HTML file: " + error);
	}

	// Parse the HTML content into a document tree using parse5
	const htmlTree = parse5.parse(htmlContent);
	return htmlTree;
}

export function getHerfContent(td: any): string | null {
	//get the anchorNode
	const anchor = HtmlUtils.findAnchor(td);
	if (!anchor) {
		return null;
	}
	for (const attr of anchor.attrs) {
		if (attr.name === "href") {
			return attr.value;
		}
	}
	return null;
}

export function findTableForBuildingList(root: any): any | null {
	const queue = [root];

	while (queue.length > 0) {
		const node = queue.shift();
		if (node.nodeName === "table") {
			if (HtmlUtils.tableHasBuildingList(node)) {
				return node;
			}
		}

		if (node.childNodes && node.childNodes.length > 0) {
			queue.push(...node.childNodes);
		}
	}
	return null;
}

export function tableHasBuildingList(tableNode: any): boolean {
	const queue = [tableNode];
	while (queue.length > 0) {
		const node = queue.shift();
		if (node.nodeName === "td" && node.attrs) {
			const classAttr = node.attrs.find((attr: any) => attr.name === "class");
			if (classAttr && classAttr.value === "views-field views-field-title") {
				return true;
			}
		}

		if (node.childNodes && node.childNodes.length > 0) {
			queue.push(...node.childNodes);
		}
	}
	return false;
}

export function findTableForRoomList(root: any): any | null {
	const queue = [root];
	while (queue.length > 0) {
		const node = queue.shift();
		if (node.nodeName === "table") {
			if (HtmlUtils.tableHasRoomList(node)) {
				return node;
			}
		}
		if (node.childNodes && node.childNodes.length > 0) {
			queue.push(...node.childNodes);
		}
	}
	return null;
}

export function tableHasRoomList(tableNode: any): boolean {
	const queue = [tableNode];
	while (queue.length > 0) {
		const node = queue.shift();
		if (node.nodeName === "td" && node.attrs) {
			const classAttr = node.attrs.find((attr: any) => attr.name === "class");
			if (classAttr && classAttr.value === "views-field views-field-field-room-number") {
				return true;
			}
		}
		if (node.childNodes && node.childNodes.length > 0) {
			queue.push(...node.childNodes);
		}
	}
	return false;
}

export function findAnchor(node: any): any | null {
	const queue = [node];
	while (queue.length > 0) {
		const current = queue.shift();
		if (current.nodeName === "a") {
			return current;
		}
		if (current.childNodes) {
			queue.push(...current.childNodes);
		}
	}
	return null;
}

export function getTextContentInAnchor(row: any, targetClass: string): string | null {
	if (!row?.childNodes || row.childNodes.length === 0) return null;
	for (const cell of row.childNodes) {
		if (cell.nodeName === "td" && cell.attrs) {
			const classAttr = cell.attrs.find((attr: any) => attr.name === "class");
			if (classAttr && classAttr.value === targetClass) {
				const anchor = findAnchor(cell);
				if (anchor?.childNodes) {
					for (const child of anchor.childNodes) {
						if (child.nodeName === "#text" && child.value) {
							return child.value.trim();
						}
					}
				}
			}
		}
	}
	return null;
}
export function getTextContentNotInAnchor(row: any, targetClass: string): string | null {
	if (!row?.childNodes || row.childNodes.length === 0) return null;
	for (const td of row.childNodes) {
		if (td.nodeName === "td" && td.attrs) {
			const classAttr = td.attrs.find((attr: any) => attr.name === "class");
			if (classAttr && classAttr.value === targetClass) {
				if (td.childNodes && td.childNodes.length > 0) {
					for (const child of td.childNodes) {
						if (child.nodeName === "#text" && child.value) {
							return child.value.trim();
						}
					}
				}
			}
		}
	}
	return null;
}
export function getTbodyNode(tableNode: any): any | null {
	if (!tableNode.childNodes) return null;
	for (const child of tableNode.childNodes) {
		if (child.nodeName === "tbody") {
			return child;
		}
	}
	return null;
}
export function gettrList(root: any): any[] {
	const queue = [root];
	const rows: any[] = [];
	while (queue.length > 0) {
		const node = queue.shift();
		if (node.nodeName === "tr") {
			rows.push(node);
		}
		if (node.childNodes && node.childNodes.length > 0) {
			queue.push(...node.childNodes);
		}
	}
	return rows;
}

//<=this file is implemented with help from chatGPT
