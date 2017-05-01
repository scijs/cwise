import parse from "cwise-parser";

import compile, { ArgType } from "cwise-compiler";

const REQUIRED_FIELDS = ["args", "body"];
const OPTIONAL_FIELDS = ["pre", "post", "printCode", "funcName", "blockSize"];

export interface UserArgs {
	args: ArgType[];
	pre?: Function;
	body: Function;
	post?: Function;
	funcName?: string;
	blockSize?: number;
	printCode?: boolean;
}

export default function createCWise(user_args: UserArgs) {
	//Check parameters
	for (const id in user_args) {
		if (REQUIRED_FIELDS.indexOf(id) < 0 &&
			OPTIONAL_FIELDS.indexOf(id) < 0) {
			console.warn("cwise: Unknown argument '" + id + "' passed to expression compiler");
		}
	}
	for (let i = 0; i < REQUIRED_FIELDS.length; ++i) {
		if (!user_args[REQUIRED_FIELDS[i]]) {
			throw new Error("cwise: Missing argument: " + REQUIRED_FIELDS[i]);
		}
	}

	//Parse blocks
	return compile({
		args: user_args.args,
		pre: parse(user_args.pre || function () { }),
		body: parse(user_args.body),
		post: parse(user_args.post || function () { }),
		debug: !!user_args.printCode,
		funcName: user_args.funcName || user_args.body.name || "cwise",
		blockSize: user_args.blockSize || 64
	});
}
