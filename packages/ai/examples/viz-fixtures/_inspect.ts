// Dump the OAS JSON shape of a fixture for inspection.
//   deno run -A _inspect.ts subflow-catch.ts



import { build } from "../../mod.ts";
const name = Deno.args[0] ?? "subflow-catch.ts";
const mod = await import(new URL("./" + name, import.meta.url).href);
const oas = build.toOAS(mod.default) as Record<string, unknown>;
console.log(JSON.stringify(oas, null, 2));
