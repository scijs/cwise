import * as staticModule from "static-module";
import parse from "cwise-parser";
import * as uglify from "uglify-js";
import { ArgType } from "cwise-compiler";

export interface UserArgs {
	args: ArgType[];
	pre?: Function;
	body: Function;
	post?: Function;
	funcName?: string;
	blockSize?: number;
	printCode?: boolean;
}

const REQUIRED_FIELDS = ["args", "body"];
const OPTIONAL_FIELDS = ["pre", "post", "printCode", "funcName", "blockSize"];

function processFunc(func: Function) {
	const codeStr = "var X=" + func;
	const minified = uglify.minify(codeStr, { fromString: true, compress: { unused: "keep_assign" } }).code;
	const code = minified.substr(6, minified.length - 7);
	return parse(code);
}

export interface Options { }

export default function cwiseTransform(file: string, opts?: Options) {
	const sm = staticModule({
		cwise(user_args: UserArgs) {
			for (let id in user_args) {
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
			const compileBlock = {
				args: user_args.args,
				pre: processFunc(user_args.pre || function () { }),
				body: processFunc(user_args.body),
				post: processFunc(user_args.post || function () { }),
				debug: !!user_args.printCode,
				funcName: user_args.funcName || user_args.body.name || "cwise",
				blockSize: user_args.blockSize || 64
			};
			const codeStr = "require('cwise/wrapper')(" + JSON.stringify(compileBlock) + ")";
			return codeStr;
		}
	})
	return sm;
}
