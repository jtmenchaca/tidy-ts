import { createDataFrame, readCSV, stats as s } from "@tidy-ts/dataframe";
import { z } from "zod";

// === Case 1: createDataFrame with explicit number | undefined ===
const a = createDataFrame([
  { id: 1, b: 2 as number | undefined, c: 3 as number | undefined },
  { id: 2, b: undefined, c: 4 as number | undefined },
  { id: 3, b: 5 as number | undefined, c: 6 as number | undefined },
]);
const a2 = a.removeUndefined("b", "c");
const _b1: readonly number[] = a2.b;       // expect this to type-check
const _c1: readonly number[] = a2.c;
console.log("createDataFrame removeUndefined.b column:", a2.b);
console.log("createDataFrame removeUndefined.c column:", a2.c);

// === Case 2: readCSV with z.number().optional() ===
const csv = `id,b,c
1,2,3
2,NA,4
3,5,6`;
const schema = z.object({
  id: z.number(),
  b: z.number().optional(),
  c: z.number().optional(),
});
const d = await readCSV(csv, schema, { naValues: ["NA"] });
console.log("readCSV pre-removeUndefined:", d.toRows());

const d2 = d.removeUndefined("b", "c");
// Try to assign as readonly number[] — if this fails, narrowing is broken
const _b2: readonly number[] = d2.b;
const _c2: readonly number[] = d2.c;
console.log("readCSV removeUndefined.b column:", d2.b);
console.log("readCSV removeUndefined.c column:", d2.c);

// === Glm on Case 2 result ===
const justNumeric = d2.select("b", "c");
const _model = s.glm({
  formula: "b ~ c",
  family: "gaussian",
  link: "identity",
  data: justNumeric,
});
console.log("glm coefficients:", _model.coefficients);
