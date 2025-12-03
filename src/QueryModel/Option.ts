export default class Option {
	public column: string[];
	public order?: string | { dir: "UP" | "DOWN"; keys: string[] };

	constructor(column: string[], order?: string | { dir: "UP" | "DOWN"; keys: string[] }) {
		this.column = column;
		this.order = order;
	}
}
