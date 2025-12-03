type ComparatorType = "AND" | "OR" | "GT" | "LT" | "EQ" | "IS" | "NOT";

export interface Filter {
	[key: string]: any;
}
export default class Where {
	public filter: Filter;

	constructor(filter: Filter) {
		this.filter = filter;
	}

	public getFilterType(): ComparatorType {
		const filterKeys = Object.keys(this.filter);
		// if (filterKeys.length === 0) {
		// 	throw new Error("Filter is empty.");
		// }
		return filterKeys[0] as ComparatorType;
	}

	public getFilterValue(): any {
		return this.filter[this.getFilterType()];
	}
}
