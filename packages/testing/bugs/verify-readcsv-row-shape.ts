import { readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const schema = z.object({
  id: z.number(),
  b: z.number().optional(),
  c: z.number().optional(),
});

const csv = `id,b,c
1,2,3
2,NA,4`;

const d = await readCSV(csv, schema, { naValues: ["NA"] });

// Inferred Zod type with .optional() — what's the shape?
type ZodInferred = z.infer<typeof schema>;
const _check1: ZodInferred = { id: 1, b: 2, c: 3 };
const _check2: ZodInferred = { id: 1 };  // optional → both b and c can be omitted
console.log("schema accepts row without b/c keys:", _check2);

// First row of d
const r0 = d.toRows()[0];
console.log("typeof r0.b:", typeof r0.b);
console.log("'b' in r0:", "b" in r0);
console.log("r0.b:", r0.b);

// Note: the key difference
// - z.number().optional() → { b?: number }     (key may not exist)
// - z.number().nullable() → { b: number | null } (key exists, may be null)
// - explicit `b: number | undefined`            (key exists, may be undefined)

// removeUndefined narrows R[K] via Exclude<R[K], undefined>.
// For optional property R = { b?: number }, R["b"] is `number | undefined` so Exclude should give `number`.
// But the *property modifier* (?: ) stays — so the result is still `{ b?: number }`.
// That's why the column type is still `(number | undefined)[]`!

const d2 = d.removeUndefined("b", "c");
const r2 = d2.toRows()[0];
console.log("'b' in r2 after removeUndefined:", "b" in r2);
