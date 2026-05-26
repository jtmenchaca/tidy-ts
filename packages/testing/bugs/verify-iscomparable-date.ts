import { isComparable } from "../../dataframe/ts/stats/helpers.ts";
console.log("Date has Date.compare?", typeof (Date as unknown as { compare?: unknown }).compare);
console.log("isComparable(new Date()):", isComparable(new Date()));

import { Temporal } from "@tidy-ts/shims/temporal-polyfill";
const d = Temporal.PlainDate.from("2024-01-15");
console.log("isComparable(PlainDate):", isComparable(d));
