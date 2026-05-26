import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

const d = Temporal.PlainDate.from("2024-01-15");
console.log("typeof:", typeof d);
console.log("String(d):", String(d));
console.log("`${d}`:", `${d}`);
console.log("d.toString():", d.toString());
console.log("JSON.stringify(d):", JSON.stringify(d));
console.log("Object.keys(d):", Object.keys(d));
console.log("d.constructor.name:", d.constructor.name);

// What console.log/Deno.inspect does:
console.log("inspect:", Deno.inspect(d));
