import { expect } from "chai";
import request from "supertest";
import { Log } from "@ubccpsc310/project-support";
import Server from "../../src/rest/Server";
import path from "path";
import fs from "fs-extra";
import DatasetManager from "../../src/Dataset/DatasetManager";
import { clearDisk } from "../TestUtil";

describe("Facade C3", function () {
	const serverNum = 4321;
	const server = new Server(serverNum);

	before(function () {
		// TODO: start server here once and handle errors properly
		try {
			void server.start();
		} catch (err) {
			Log.error("Failed to start server:", err);
			expect.fail("Server failed to start");
		}
	});

	after(function () {
		// TODO: stop server here once!
		void server.stop();
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
		DatasetManager.destroyInstance();
		void clearDisk();
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	it("PUT test for adding dataset successfully", async function () {
		// const SERVER_URL = "TBD";
		const SERVER_URL = "http://localhost:4321";
		// const ENDPOINT_URL = "TBD";
		const DATASET_ID = "sections";
		const DATASET_KIND = "sections";
		const ENDPOINT_URL = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		// const ZIP_FILE_DATA = "TBD";
		const zipPath = path.join(__dirname, "../resources/archives/pair.zip");
		const ZIP_FILE_DATA = await fs.readFile(zipPath);

		try {
			const res = await request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/octet-stream");

			const statusCode = 200;
			expect(res.status).to.equal(statusCode);
			// TODO add assertions that check res.body
			expect(res.body).to.have.property("result").that.includes(DATASET_ID);
		} catch (err) {
			Log.error(err);
			expect.fail("Request failed unexpectedly");
		}
	});

	it("PUT test for failing to add dataset", async function () {
		const SERVER_URL = "http://localhost:4321";
		const DATASET_ID = "sections";
		const DATASET_KIND = "section";
		const ENDPOINT_URL = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const zipPath = path.join(__dirname, "../resources/archives/pair.zip");
		const ZIP_FILE_DATA = await fs.readFile(zipPath);

		const res = await request(SERVER_URL)
			.put(ENDPOINT_URL)
			.send(ZIP_FILE_DATA)
			.set("Content-Type", "application/octet-stream");

		const statusCode = 400;
		expect(res.status).to.equal(statusCode);
		expect(res.body).to.have.property("error").that.is.a("string");
	});

	// DELETE
	it("DELETE test for removing dataset successfully", async function () {
		const SERVER_URL = "http://localhost:4321";
		const DATASET_ID = "sections";
		const DATASET_KIND = "sections";
		const ENDADD = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const ENDPOINT_URL = `/dataset/${DATASET_ID}`;
		const zipPath = path.join(__dirname, "../resources/archives/pair.zip");
		const ZIP_FILE_DATA = await fs.readFile(zipPath);

		await request(SERVER_URL).put(ENDADD).send(ZIP_FILE_DATA).set("Content-Type", "application/octet-stream");

		try {
			const res = await request(SERVER_URL).delete(ENDPOINT_URL);
			const statusCode = 200;
			expect(res.status).to.equal(statusCode);
			expect(res.body).to.have.property("result").that.equals(DATASET_ID);
		} catch (err) {
			Log.error(err);
			expect.fail("Request failed unexpectedly");
		}
	});

	it("DELETE test for failing to remove dataset with 404", async function () {
		const SERVER_URL = "http://localhost:4321";
		const DATASET_ID = "sections";
		// const DATASET_KIND = "sections";
		// const ENDADD = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const ENDPOINT_URL = `/dataset/${DATASET_ID}`;
		// const zipPath = path.join(__dirname, "../resources/archives/pair.zip");

		const res = await request(SERVER_URL).delete(ENDPOINT_URL);

		const statusCode = 404;
		expect(res.status).to.equal(statusCode);
		expect(res.body).to.have.property("error").that.is.a("string");
	});

	it("DELETE test for failing to remove dataset with 400", async function () {
		const SERVER_URL = "http://localhost:4321";
		const DATASET_ID = "sections";
		const DATASET_KIND = "sections";
		const ENDADD = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const ENDPOINT_URL = `/dataset/sec_tion`;
		const zipPath = path.join(__dirname, "../resources/archives/pair.zip");
		const ZIP_FILE_DATA = await fs.readFile(zipPath);

		await request(SERVER_URL).put(ENDADD).send(ZIP_FILE_DATA).set("Content-Type", "application/octet-stream");

		const res = await request(SERVER_URL).delete(ENDPOINT_URL);

		const statusCode = 400;
		expect(res.status).to.equal(statusCode);
		expect(res.body).to.have.property("error").that.is.a("string");
	});

	//POST
	it("POST test for performing query successfully", async function () {
		const SERVER_URL = "http://localhost:4321";
		const DATASET_ID = "sections";
		const DATASET_KIND = "sections";
		const ENDADD = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const ENDPOINT_URL = `/query`;
		const zipPath = path.join(__dirname, "../resources/archives/pair.zip");
		const ZIP_FILE_DATA = await fs.readFile(zipPath);

		await request(SERVER_URL).put(ENDADD).send(ZIP_FILE_DATA).set("Content-Type", "application/octet-stream");

		const query = {
			WHERE: {
				GT: {
					sections_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["sections_dept", "sections_avg"],
				ORDER: "sections_avg",
			},
		};

		try {
			const res = await request(SERVER_URL).post(ENDPOINT_URL).send(query).set("Content-Type", "application/json");

			const statusCode = 200;
			expect(res.status).to.equal(statusCode);
			expect(res.body).to.have.property("result").that.is.an("array");
		} catch (err) {
			Log.error(err);
			expect.fail("Request failed unexpectedly");
		}
	});

	it("POST test for failing to perform query", async function () {
		const SERVER_URL = "http://localhost:4321";
		// const DATASET_ID = "sections";
		// const DATASET_KIND = "sections";
		// const ENDADD = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const ENDPOINT_URL = `/query`;
		// const zipPath = path.join(__dirname, "../resources/archives/pair.zip");

		const invalidQuery = {
			WHERE: {},
			OPTIONS: {
				ORDER: "sections_avg",
			},
		};

		const res = await request(SERVER_URL).post(ENDPOINT_URL).send(invalidQuery).set("Content-Type", "application/json");

		const statusCode = 400;
		expect(res.status).to.equal(statusCode);
		expect(res.body).to.have.property("error").that.is.a("string");
	});

	// GET
	it("GET test for listing dataset successfully", async function () {
		const SERVER_URL = "http://localhost:4321";
		const DATASET_ID = "sections";
		const DATASET_KIND = "sections";
		const ENDADD = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const ENDPOINT_URL = `/datasets`;
		const zipPath = path.join(__dirname, "../resources/archives/pair.zip");
		const ZIP_FILE_DATA = await fs.readFile(zipPath);

		await request(SERVER_URL).put(ENDADD).send(ZIP_FILE_DATA).set("Content-Type", "application/octet-stream");

		try {
			const res = await request(SERVER_URL).get(ENDPOINT_URL);

			expect(res.body).to.have.property("result").that.is.an("array").with.lengthOf(1);
			const dataset = res.body.result[0];
			expect(dataset).to.include.all.keys("id", "kind", "numRows");
			expect(dataset.id).to.equal("sections");
			expect(dataset.kind).to.equal("sections");
			expect(dataset.numRows).to.be.a("number");
		} catch (err) {
			Log.error(err);
			expect.fail("Request failed unexpectedly");
		}
	});

	it("GET test for listing empty dataset successfully", async function () {
		const SERVER_URL = "http://localhost:4321";
		// const DATASET_ID = "sections";
		// const DATASET_KIND = "sections";
		// const ENDADD = `/dataset/${DATASET_ID}/${DATASET_KIND}`;
		const ENDPOINT_URL = `/datasets`;
		// const zipPath = path.join(__dirname, "../resources/archives/pair.zip");

		try {
			const res = await request(SERVER_URL).get(ENDPOINT_URL);

			const statusCode = 200;
			expect(res.status).to.equal(statusCode);
			expect(res.body).to.have.property("result").that.is.an("array").that.is.empty;
		} catch (err) {
			Log.error(err);
			expect.fail("Request failed unexpectedly");
		}
	});

	// The other endpoints work similarly. You should be able to find all instructions in the supertest documentation
});
