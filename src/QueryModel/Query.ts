import Where from "./Where";
import Option from "./Option";
import Trans from "./Trans";

export default class Query {
	public where: Where;
	public option: Option;
	public transformations: Trans | null;
	public id: string;

	constructor(where: Where, option: Option, transformations: Trans | null, id: string) {
		this.where = where;
		this.option = option;
		this.id = id;
		this.transformations = transformations;
	}
}
