import { IInsightFacade, InsightDatasetKind, InsightError } from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
// import * as fs from "fs";
// import path from "node:path";
//import QueryParser from "../../src/QueryValidation/QueryParser";
//import ValidateQuery from "../../src/QueryValidation/ValidateQuery";
import DatasetManager from "../../src/Dataset/DatasetManager";
//import path from "path";
//import fs from "fs-extra";

use(chaiAsPromised);

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let rooms: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		rooms = await getContentFromArchives("campus.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
		DatasetManager.destroyInstance();
	});

	describe("AddDataset(room)", function () {
		beforeEach(async function () {
			DatasetManager.destroyInstance();
			await clearDisk();
			facade = new InsightFacade();
		});

		it("room: AddDataset should successfully add the dataset and return the id", async function () {
			// Read the "Free Mutant Walkthrough" in the spec for tips on how to get started!

			try {
				const result = await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				//console.log(result);
				expect(result).to.have.members(["rooms"]);
			} catch (err) {
				//console.log(err);
				expect.fail("Should not  throw!" + err);
			}
		});

		it("room: AddDataset should successfully add 2 dataset and return the list of added id", async function () {
			// Read the "Free Mutant Walkthrough" in the spec for tips on how to get started!

			try {
				const result1 = await facade.addDataset("rooms1", rooms, InsightDatasetKind.Rooms);
				//console.log(result1);
				expect(result1).to.have.members(["rooms1"]);
				//DatasetManager.destroyInstance();
				const result2 = await facade.addDataset("rooms2", rooms, InsightDatasetKind.Rooms);
				//console.log(result2);
				expect(result2).to.have.members(["rooms2", "rooms1"]);
			} catch (err) {
				expect.fail("Should not  throw!" + err);
			}
		});

		it("room: AddDataset should reject with an empty dataset id", async function () {
			// Read the "Free Mutant Walkthrough" in the spec for tips on how to get started!
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		it("room: AddDataset should reject with only whitespace characters id", async function () {
			try {
				await facade.addDataset(" ", sections, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("room: AddDataset should reject with underscore id", async function () {
			try {
				await facade.addDataset("f_____fg", sections, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("room: AddDataset should reject with txt file", async function () {
			const txtFile = await getContentFromArchives("AANB530B.txt");
			try {
				await facade.addDataset("sections", txtFile, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("room: AddDataset should reject with not course folder", async function () {
			const noCoursesFolder = await getContentFromArchives("noCourseFolder.zip");
			// const noCoursesFolder = await getContentFromArchives("courses.zip");
			try {
				await facade.addDataset("sections", noCoursesFolder, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("room: AddDataset should reject with empty dataset", async function () {
			const empty = await getContentFromArchives("courses.zip");
			try {
				await facade.addDataset("sections", empty, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("room: AddDataset should reject with not base64 dataset", async function () {
			//const not64 = await getContentFromArchives("not_base64.zip");
			try {
				await facade.addDataset("sections", "*", InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("room: AddDataset should reject with no folder named campus", async function () {
			const noCFolder = await getContentFromArchives("noCampusFolder.zip");
			try {
				await facade.addDataset("noCFolder", noCFolder, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		//Generate by Copilot =>
		it("room: AddDataset should reject the add since using saveToDisk to add so that disk has", async function () {
			const datasetManager = await DatasetManager.getInstance();
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			const temp = datasetManager.getDatasetMap().get("rooms");
			if (!temp) {
				throw new Error("Dataset 'sections' not found");
			}
			await facade.removeDataset("rooms");
			await datasetManager.saveDatasetToDisk("rooms", temp, InsightDatasetKind.Rooms);

			try {
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown an InsightError");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		//Generate by Copilot <=

		it("AddDataset should reject with the same id added again", async function () {
			facade = new InsightFacade();
			await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
			try {
				await facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err)
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("rooms: AddDataset should add a one room dataset", async function () {
			//const datasetManager = await DatasetManager.getInstance();
			//const dataset = datasetManager.getDatasetMap();
			const oneRoom = await getContentFromArchives("oneRoom.zip");
			try {
				//console.log(dataset.get("sections")?.length);
				const result = await facade.addDataset("oneRoom", oneRoom, InsightDatasetKind.Rooms);
				//console.log(result);

				expect(result).to.have.members(["oneRoom"]);
			} catch (err) {
				//console.log(dataset.get("sections")?.length);
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("rooms: successfully add one room dateset but with empty number on room number", async function () {
			try {
				const oneRoomWithEmptyRoomNum = await getContentFromArchives("oneRoomWithEmptyRoomNum.zip");
				//console.log(dataset.get("sections")?.length);
				const result = await facade.addDataset(
					"oneRoomWithEmptyRoomNum",
					oneRoomWithEmptyRoomNum,
					InsightDatasetKind.Rooms
				);
				//console.log(result);

				expect(result).to.have.members(["oneRoomWithEmptyRoomNum"]);
			} catch (err) {
				expect.fail("should not be here" + err);
				//console.log(dataset.get("sections")?.length);
				//console.log(err);
				//expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("rooms: successfully add one room dateset but with empty string on furniture type", async function () {
			try {
				const oneRoomWithEmptyFurniture = await getContentFromArchives("oneRoomWithEmptyFurniture.zip");
				//console.log(dataset.get("sections")?.length);
				const result = await facade.addDataset(
					"oneRoomWithEmptyFurniture",
					oneRoomWithEmptyFurniture,
					InsightDatasetKind.Rooms
				);
				//console.log(result);

				expect(result).to.have.members(["oneRoomWithEmptyFurniture"]);
			} catch (err) {
				//console.log(dataset.get("sections")?.length);
				//console.log(err);
				expect.fail("should not be here" + err);
				//expect(err).to.be.instanceOf(InsightError);
			}
		});
	});
});
