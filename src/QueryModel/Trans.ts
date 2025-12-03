type Token = "MAX" | "MIN" | "AVG" | "COUNT" | "SUM";

export interface ApplyRule {
	[applyKey: string]: {
		[token in Token]: string;
	};
}
export default class Trans {
	public group: string[];
	public apply: ApplyRule[];

	constructor(group: string[], apply: ApplyRule[]) {
		this.group = group;
		this.apply = apply;
	}
}
