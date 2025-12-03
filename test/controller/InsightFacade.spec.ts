import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import { clearDisk, getContentFromArchives, loadTestQuery } from "../TestUtil";

import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import QueryParser from "../../src/QueryValidation/QueryParser";
import DatasetManager from "../../src/Dataset/DatasetManager";
import path from "path";
import fs from "fs-extra";

use(chaiAsPromised);

export interface ITestQuery {
	title?: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let sectionsAdded1: string;
	let rooms: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		sectionsAdded1 = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");
		rooms = await getContentFromArchives("campus.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
		DatasetManager.destroyInstance();
	});

	describe("AddDataset(Section)", function () {
		beforeEach(async function () {
			DatasetManager.destroyInstance();
			await clearDisk();
			facade = new InsightFacade();
		});

		// afterEach(async function () {
		// 	dataset.clear();
		// });

		it("AddDataset should reject with an empty dataset id", async function () {
			// Read the "Free Mutant Walkthrough" in the spec for tips on how to get started!
			try {
				await facade.addDataset("", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		it("AddDataset should reject with only whitespace characters id", async function () {
			try {
				await facade.addDataset(" ", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("AddDataset should reject with underscore id", async function () {
			try {
				await facade.addDataset("f_____fg", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("AddDataset should reject with txt file", async function () {
			const txtFile = await getContentFromArchives("AANB530B.txt");
			try {
				await facade.addDataset("sections", txtFile, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				// console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("AddDataset should reject with not course folder", async function () {
			const noCoursesFolder = await getContentFromArchives("noCourseFolder.zip");
			// const noCoursesFolder = await getContentFromArchives("courses.zip");
			try {
				await facade.addDataset("sections", noCoursesFolder, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("AddDataset should reject with empty dataset", async function () {
			const empty = await getContentFromArchives("courses.zip");
			try {
				await facade.addDataset("sections", empty, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("AddDataset should reject with not base64 dataset", async function () {
			//const not64 = await getContentFromArchives("not_base64.zip");
			try {
				await facade.addDataset("sections", "*", InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("AddDataset should successfully add a small dataset", async function () {
			// dataset.set("sections", [new Section(1,1,1,1,1,"1","1","1","1","1")]);
			// if (dataset.has("sections")) {console.log("yes");}
			// console.log(dataset.get("sections"));
			const oneValidSection = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");
			//const oneValidSection = await getContentFromArchives("testing.zip");
			const result = await facade.addDataset("sections", oneValidSection, InsightDatasetKind.Sections);
			expect(result).to.have.members(["sections"]);
			//console.log(dataset.get("sections"));
		});

		//Generate by Copilot =>
		it("AddDataset should reject the add since i use saveToDisk to add", async function () {
			const datasetManager = await DatasetManager.getInstance();
			await facade.addDataset("sections", sectionsAdded1, InsightDatasetKind.Sections);
			const tempSections = datasetManager.getDatasetMap().get("sections");
			if (!tempSections) {
				throw new Error("Dataset 'sections' not found");
			}
			await facade.removeDataset("sections");
			await datasetManager.saveDatasetToDisk("sections", tempSections, InsightDatasetKind.Sections);

			try {
				await facade.addDataset("sections", sectionsAdded1, InsightDatasetKind.Sections);
				expect.fail("Should have thrown an InsightError");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});
		//Generate by Copilot <=

		it("AddDataset should successfully add a dataset", async function () {
			const result = await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			expect(result).to.have.members(["sections"]);
			//console.log(dataset.get("sections")?.length);
		});

		it("AddDataset should reject with the same id added again", async function () {
			facade = new InsightFacade();
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("AddDataset should reject with not valid Section", async function () {
			//const datasetManager = await DatasetManager.getInstance();
			//const dataset = datasetManager.getDatasetMap();
			const notValidSection = await getContentFromArchives("noValidSection.zip");
			try {
				//console.log(dataset.get("sections")?.length);
				await facade.addDataset("sections", notValidSection, InsightDatasetKind.Sections);
				expect.fail("Should have thrown!");
			} catch (err) {
				//console.log(dataset.get("sections")?.length);
				//console.log(err);
				expect(err).to.be.instanceOf(InsightError);
			}
		});
	});

	//.............................................................................................................
	describe("removeDataset", function () {
		beforeEach(async function () {
			DatasetManager.destroyInstance();
			await clearDisk();
			facade = new InsightFacade();
		});

		it("removeDataset should reject with an empty dataset id", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("removeDataset should reject with underscore id", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("_");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("removeDataset should reject with only whitespace id", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset(" ");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(InsightError);
			}
		});

		it("removeDataset should reject with not existed id", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("section");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("removeDataset should reject with not dataset in an empty disk", async function () {
			try {
				await facade.removeDataset("section");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("removeDataset should remove 1 successfully", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				const result = await facade.removeDataset("sections");
				expect(result).to.be.equals("sections");
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("removeDataset should remove 1 successfully on a new insightFacade", async function () {
			try {
				await facade.addDataset("sectionsAdded1", sectionsAdded1, InsightDatasetKind.Sections);
				const facade2: IInsightFacade = new InsightFacade();
				DatasetManager.printInstance();
				DatasetManager.destroyInstance();
				DatasetManager.printInstance();
				const result = await facade2.removeDataset("sectionsAdded1");
				DatasetManager.printInstance();
				//console.log(await facade2.listDatasets());
				//console.log(result);
				expect(result).to.be.equals("sectionsAdded1");
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("add 3 remove 3 add 1", async function () {
			try {
				const facade2: IInsightFacade = new InsightFacade();
				const facade3: IInsightFacade = new InsightFacade();
				DatasetManager.printInstance();
				DatasetManager.destroyInstance();
				await facade.addDataset("sections1", sectionsAdded1, InsightDatasetKind.Sections);
				DatasetManager.printInstance();
				DatasetManager.destroyInstance();
				await facade2.addDataset("sections2", sectionsAdded1, InsightDatasetKind.Sections);
				DatasetManager.printInstance();
				DatasetManager.destroyInstance();
				await facade.addDataset("sections3", sectionsAdded1, InsightDatasetKind.Sections);
				DatasetManager.printInstance();
				DatasetManager.destroyInstance();

				await facade.removeDataset("sections1");
				await facade2.removeDataset("sections3");
				const result = await facade3.removeDataset("sections2");
				expect(result).to.be.equals("sections2");
				await facade.addDataset("sections3", sectionsAdded1, InsightDatasetKind.Sections);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("add three dataset, remove one of it and then add back to it", async function () {
			try {
				await facade.addDataset("sections1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("sections2", sections, InsightDatasetKind.Sections);
				await facade.addDataset("sections3", sections, InsightDatasetKind.Sections);

				//await facade.removeDataset("sections1");
				const result = await facade.removeDataset("sections1");
				await facade.addDataset("sections1", sections, InsightDatasetKind.Sections);
				expect(result).to.be.equals("sections1");
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("add 1 dataset, remove it from disk and then do removeDataset(), result should be NotFoundError", async function () {
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				const DATASET_DIR = path.join(__dirname, "../../data");
				const datasetPath = path.join(DATASET_DIR, `${"sections"}.json`);
				// try {
				// 	await fs.remove(datasetPath);
				// } catch (error) {
				// 	// console.error("Failed to remove dataset from disk:", error);
				// 	throw new Error("Failed to remove dataset from disk" + error);
				// }
				await fs.remove(datasetPath);
				await facade.removeDataset("sections");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});

		it("removeDatasetFromDisk(), should throw since there is no such json file", async function () {
			try {
				const datasetManager: DatasetManager = await DatasetManager.getInstance();
				await datasetManager.removeDatasetFromDisk("sections");
				expect.fail("Should have thrown!");
			} catch (err) {
				expect(err).to.be.instanceOf(NotFoundError);
			}
		});
	});

	//.............................................................................................................

	describe("listDatasets", function () {
		beforeEach(async function () {
			DatasetManager.destroyInstance();
			await clearDisk();
			facade = new InsightFacade();
		});

		it("should return 0 dataset", async function () {
			let result: InsightDataset[] = [];
			const zeroAdded: InsightDataset[] = [];
			try {
				result = await facade.listDatasets();
				expect(result).to.have.deep.members(zeroAdded);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("should return 1 dataset", async function () {
			const correctResult: InsightDataset[] = [
				{
					id: "sections",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			let result: InsightDataset[] = [];
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				result = await facade.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("return 1 dataset on a new insightFacade", async function () {
			const correctResult: InsightDataset[] = [
				{
					id: "sections",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			let result: InsightDataset[] = [];
			const facade2: IInsightFacade = new InsightFacade();
			try {
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				DatasetManager.destroyInstance();
				result = await facade2.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("should return 2 dataset", async function () {
			const correctResult: InsightDataset[] = [
				{
					id: "sections1",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
				{
					id: "sections2",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			// const zeroAdded: InsightDataset[] = [];
			let result: InsightDataset[] = [];
			try {
				await facade.addDataset("sections1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("sections2", sections, InsightDatasetKind.Sections);
				result = await facade.listDatasets();
				//Generate by Copilot =>
				expect(result).to.have.deep.members(correctResult);
				//Generate by Copilot <=
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("should return 2 different dataset", async function () {
			const correctResult: InsightDataset[] = [
				{
					id: "sections1",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
				{
					id: "sections2",
					kind: InsightDatasetKind.Sections,
					numRows: 7,
				},
			];
			let result: InsightDataset[] = [];
			const oneValidSection = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");
			try {
				await facade.addDataset("sections1", sections, InsightDatasetKind.Sections);
				await facade.addDataset("sections2", oneValidSection, InsightDatasetKind.Sections);
				result = await facade.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		//const facade2: IInsightFacade = new InsightFacade();

		it("add 1 create new facade/instance remove 1 add 1, should list 1 dataset", async function () {
			const correctResult: InsightDataset[] = [
				{
					id: "sections",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			// const zeroAdded: InsightDataset[] = [];
			let result: InsightDataset[] = [];
			try {
				const oneValidSection = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");
				await facade.addDataset("sections1", oneValidSection, InsightDatasetKind.Sections);
				DatasetManager.destroyInstance();
				const facade2: IInsightFacade = new InsightFacade();
				await facade2.removeDataset("sections1");
				await facade2.addDataset("sections", sections, InsightDatasetKind.Sections);
				result = await facade2.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("add 1 remove 1 add 1, should list 1 dataset", async function () {
			const correctResult: InsightDataset[] = [
				{
					id: "sections",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			// const zeroAdded: InsightDataset[] = [];
			let result: InsightDataset[] = [];
			try {
				const oneValidSection = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");
				await facade.addDataset("sections1", oneValidSection, InsightDatasetKind.Sections);
				await facade.removeDataset("sections1");

				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				result = await facade.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("add 1 add 1 remove 1, should list 1 dataset", async function () {
			const correctResult: InsightDataset[] = [
				{
					id: "sections",
					kind: InsightDatasetKind.Sections,
					numRows: 64612,
				},
			];
			// const zeroAdded: InsightDataset[] = [];
			let result: InsightDataset[] = [];
			try {
				const oneValidSection = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");

				await facade.addDataset("sections1", oneValidSection, InsightDatasetKind.Sections);
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("sections1");

				result = await facade.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("add 2 remove 2, should list 0 dataset", async function () {
			const correctResult: InsightDataset[] = [];
			let result: InsightDataset[] = [];
			try {
				const oneValidSection = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");

				await facade.addDataset("sections1", oneValidSection, InsightDatasetKind.Sections);
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("sections");
				await facade.removeDataset("sections1");

				result = await facade.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});

		it("add 1 remove 1 add 1 remove 1, should list 0 dataset", async function () {
			const correctResult: InsightDataset[] = [];
			let result: InsightDataset[] = [];
			try {
				const oneValidSection = await getContentFromArchives("oneValidCourseWith7ValidSections.zip");

				await facade.addDataset("sections1", oneValidSection, InsightDatasetKind.Sections);
				await facade.removeDataset("sections1");
				await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
				await facade.removeDataset("sections");

				result = await facade.listDatasets();
				expect(result).to.have.deep.members(correctResult);
			} catch (err) {
				expect.fail(`Should not throw, but threw: ${err}`);
			}
		});
	});

	//.............................................................................................................

	describe("QueryParser", function () {
		it("should success parse query", function () {
			const rawQuery = {
				WHERE: {
					GT: { courses_avg: 90 },
				},
				OPTIONS: {
					COLUMNS: ["courses_dept", "courses_avg"],
					ORDER: "courses_avg",
				},
			};

			const q = QueryParser.parseQuery(rawQuery, "courses");
			expect(q.id).to.equal("courses");
			expect(q.where.filter).to.deep.equal({
				GT: { courses_avg: 90 },
			});
			expect(q.option.column).to.deep.equal(["courses_dept", "courses_avg"]);
			expect(q.option.order).to.equal("courses_avg");
		});

		it("should success parse query with transformations", function () {
			const rawQuery = {
				WHERE: {
					GT: { courses_avg: 90 },
				},
				OPTIONS: {
					COLUMNS: ["courses_dept", "overallAvg"],
					ORDER: "overallAvg",
				},
				TRANSFORMATIONS: {
					GROUP: ["courses_dept"],
					APPLY: { overallAvg: { AVG: "courses_avg" } },
				},
			};

			const q = QueryParser.parseQuery(rawQuery, "courses");
			expect(q.id).to.equal("courses");
			expect(q.where.filter).to.deep.equal({
				GT: { courses_avg: 90 },
			});
			expect(q.option.column).to.deep.equal(["courses_dept", "overallAvg"]);
			expect(q.option.order).to.equal("overallAvg");
			if (q.transformations) {
				expect(q.transformations.group).to.deep.equal(["courses_dept"]);
				expect(q.transformations.apply).to.deep.equal({ overallAvg: { AVG: "courses_avg" } });
			}
		});
	});

	describe("PerformQuery", function () {
		let datasetManager: DatasetManager;
		let dataset: Map<string, any>;
		/**
		 * Loads the TestQuery specified in the test name and asserts the behaviour of performQuery.
		 *
		 * Note: the 'this' parameter is automatically set by Mocha and contains information about the test.
		 */
		async function checkQuery(this: Mocha.Context): Promise<void> {
			if (!this.test) {
				throw new Error(
					"Invalid call to checkQuery." +
						"Usage: 'checkQuery' must be passed as the second parameter of Mocha's it(..) function." +
						"Do not invoke the function directly."
				);
			}
			// Destructuring assignment to reduce property accesses
			const { input, expected, errorExpected } = await loadTestQuery(this.test.title);
			let result: InsightResult[] = []; // dummy value before being reassigned
			try {
				result = await facade.performQuery(input);
				if (errorExpected) {
					expect.fail(`performQuery resolved when it should have rejected with ${expected}`);
				}
			} catch (err) {
				// console.error("performQuery threw error:", err);

				if (!errorExpected) {
					expect.fail(`performQuery threw unexpected error: ${err}`);
				}
				if (errorExpected) {
					if (expected === "ResultTooLargeError") {
						expect(err).to.be.instanceOf(ResultTooLargeError);
					} else if (expected === "InsightError") {
						expect(err).to.be.instanceOf(InsightError);
					} else {
						expect.fail(`Unexpected error`);
					}
				}
			}

			if (!errorExpected) {
				expect(result).to.have.deep.members(expected);
				// expect(result).to.deep.equal(expected);
			}
		}

		before(async function () {
			facade = new InsightFacade();
			datasetManager = await DatasetManager.getInstance();
			dataset = datasetManager.getDatasetMap();
			dataset.clear();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises: Promise<string[]>[] = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		// after(async function () {
		// 	await clearDisk();
		// });

		// valid tests
		it("[valid/simple.json] SELECT dept, avg WHERE avg > 97", checkQuery);
		it("[valid/validAsterisk.json] Valid use of asterisk ends", checkQuery);
		it("[valid/validAsterisk-1.json] Valid use of asterisk starts", checkQuery);
		it("[valid/validAsterisk-2.json] Valid use of asterisk both", checkQuery);
		it("[valid/complex.json] Complex query", checkQuery);
		it("[valid/validNot.json] valid not", checkQuery);
		it("[valid/validLT.json] valid comparator LT", checkQuery);
		it("[valid/validOrder.json] Valid query with empty order", checkQuery);
		it("[valid/validEmptyResult.json] valid empty result", checkQuery);

		it("[valid/validTrans.json] valid query with transformations", checkQuery);
		it("[valid/complexT.json] valid complex with transformations", checkQuery);
		it("[valid/validUp.json] valid query with UP sort", checkQuery);
		it("[valid/validSum.json] valid query with Sum", checkQuery);
		it("[valid/validCount.json] valid query with Count", checkQuery);
		it("[valid/emptyResult.json] empty result", checkQuery);
		it("[valid/multipleApply.json] valid query with multiple apply rules", checkQuery);
		it("[valid/emptyApply.json] valid query with empty applyRule list", checkQuery);
		it("[valid/multipleSort.json] valid query with multiple sort keys", checkQuery);
		it("[valid/validAvg.json] valid query with Avg", checkQuery);
		it("[valid/validSumResult.json] valid query with sum in decimal", checkQuery);

		// invalid tests
		// invalid structure of query
		it("[invalid/invalid.json] Query missing WHERE", checkQuery);
		it("[invalid/invalidOption.json] Missing options", checkQuery);
		it("[invalid/invalidColumn.json] Missing column", checkQuery);
		it("[invalid/invalidObjectWhere.json] Invalid where object", checkQuery);

		// invalid keys
		it("[invalid/invalid-1.json] Invalid query keys", checkQuery);
		it("[invalid/invalid-2.json] Invalid dataset keys", checkQuery);
		it("[invalid/invalidReference.json] Reference two datasets", checkQuery);
		it("[invalid/invalidUnderscore.json] Missing underscore in query keys", checkQuery);
		it("[invalid/invalidKey.json] Invalid where key", checkQuery);
		it("[invalid/invalidKeyFormat.json] Invalid key format", checkQuery);
		it("[invalid/invalidOrder.json] Invalid order keys", checkQuery);

		// invalid order
		it("[invalid/invalidOrderString.json] Invalid order string", checkQuery);
		it("[invalid/invalidDir.json] Invalid direction keys", checkQuery);
		it("[invalid/invalidSort.json] Invalid sort keys", checkQuery);
		it("[invalid/invalidSortKey.json] empty sort key list", checkQuery);

		// invalid column
		it("[invalid/invalidEmptyColumn.json] Column with empty key list", checkQuery);
		it("[invalid/invalidColumnString.json] Column with non-string key", checkQuery);
		it("[invalid/invalidColumnGroup.json] Columns key don't appear in group", checkQuery);

		// invalid comparator
		it("[invalid/invalidNot.json] Invalid use of NOT", checkQuery);
		it("[invalid/invalidComparator.json] Invalid use of MComparator", checkQuery);
		it("[invalid/invalidLogic.json] Invalid use of And", checkQuery);
		it("[invalid/invalidFilter.json] Invalid use of filter_list", checkQuery);
		it("[invalid/invalidFilterType.json] Invalid filter type in WHERE", checkQuery);
		it("[invalid/emptyFilterType.json] Empty filter type", checkQuery);
		it("[invalid/invalidLT.json] Columns key don't appear in group", checkQuery);

		// invalid wildcards
		it("[invalid/asterisk.json] Invalid use of asterisk", checkQuery);

		// invalid transformations
		it("[invalid/invalidTrans.json] Invalid Transformations", checkQuery);
		it("[invalid/invalidGroup.json] Invalid group key", checkQuery);
		it("[invalid/invalidRule.json] Invalid token name", checkQuery);
		it("[invalid/invalidApply.json] Invalid apply key", checkQuery);
		it("[invalid/invalidToken.json] Invalid token key", checkQuery);
		it("[invalid/invalidApplyKey.json] Duplicate apply keys", checkQuery);
		it("[invalid/emptyApplykey.json] empty apply key", checkQuery);
		it("[invalid/invalidRulekey.json] Invalid rule key", checkQuery);

		// ResultTooLargeError
		it("[invalid/largeResult.json] Result too large", checkQuery);
	});
});
