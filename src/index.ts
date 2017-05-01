import transform, { Options } from "./cwise-transform";
import base, { UserArgs } from "./cwise-esprima";

export default function (a: string | UserArgs, b?: Options) {
	if (typeof a === "string") {
		return transform(a, b);
	} else if (typeof a === "object") {
		return base(a);
	} else {
		throw new Error("cwise: Invalid arguments");
	}
}
