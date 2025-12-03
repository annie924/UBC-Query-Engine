import express, { Application, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Log } from "@ubccpsc310/project-support";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import { InsightDatasetKind, InsightError, NotFoundError } from "../controller/IInsightFacade";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;

	constructor(port: number) {
		Log.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public async start(): Promise<void> {
		return new Promise((resolve, reject) => {
			Log.info("Server::start() - start");
			if (this.server !== undefined) {
				Log.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						Log.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						Log.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public async stop(): Promise<void> {
		Log.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				Log.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					Log.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware(): void {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({ type: "application/*", limit: "10mb" }));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes(): void {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", Server.addDataset.bind(this));
		this.express.delete("/dataset/:id", Server.removeDataset.bind(this));
		this.express.post("/query", Server.performQuery.bind(this));
		this.express.get("/datasets", Server.listDatasets.bind(this));
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response): void {
		try {
			Log.info(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(StatusCodes.OK).json({ result: response });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: err });
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}

	private static async addDataset(req: Request, res: Response): Promise<void> {
		const { id, kind } = req.params;

		try {
			let ikind: InsightDatasetKind;
			if (kind === InsightDatasetKind.Sections) {
				ikind = InsightDatasetKind.Sections;
			} else if (kind === InsightDatasetKind.Rooms) {
				ikind = InsightDatasetKind.Rooms;
			} else {
				throw new InsightError(`Invalid dataset kind: ${kind}`);
			}

			const facade = new InsightFacade();
			const content = req.body.toString("base64");
			const result = await facade.addDataset(id, content, ikind);
			res.status(StatusCodes.OK).json({ result });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: (err as Error).message });
		}
	}

	private static async removeDataset(req: Request, res: Response): Promise<void> {
		const { id } = req.params;

		try {
			const facade = new InsightFacade();
			const result = await facade.removeDataset(id);
			res.status(StatusCodes.OK).json({ result });
		} catch (err) {
			if (err instanceof NotFoundError) {
				res.status(StatusCodes.NOT_FOUND).json({ error: (err as Error).message });
			} else if (err instanceof InsightError) {
				res.status(StatusCodes.BAD_REQUEST).json({ error: (err as Error).message });
			} else {
				// fallback for unexpected errors
				res.status(StatusCodes.BAD_REQUEST).json({ error: "Unknown error" });
			}
		}
	}

	private static async performQuery(req: Request, res: Response): Promise<void> {
		try {
			const facade = new InsightFacade();
			const query = req.body;
			const result = await facade.performQuery(query);
			res.status(StatusCodes.OK).json({ result });
		} catch (err) {
			res.status(StatusCodes.BAD_REQUEST).json({ error: (err as Error).message });
		}
	}

	private static async listDatasets(req: Request, res: Response): Promise<void> {
		const facade = new InsightFacade();
		const result = await facade.listDatasets();
		res.status(StatusCodes.OK).json({ result });
	}
}
