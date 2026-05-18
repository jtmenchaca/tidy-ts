import { readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

const csv = `id,age,weight
1,30,70
2,,80
3,25,
4,40,75`;

const optionalSchema = z.object({
  id: z.number(),
  age: z.number().optional(),
  weight: z.number().optional(),
});

const nullableSchema = z.object({
  id: z.number(),
  age: z.number().nullable(),
  weight: z.number().nullable(),
});

const dfOpt = await readCSV(csv, optionalSchema);
console.log("=== .optional() ===");
console.log("age column:    ", dfOpt.age);
console.log("weight column: ", dfOpt.weight);
console.log("age types:     ", dfOpt.age.map((v) => v === undefined ? "undefined" : v === null ? "null" : typeof v));

const dfNull = await readCSV(csv, nullableSchema);
console.log("\n=== .nullable() ===");
console.log("age column:    ", dfNull.age);
console.log("weight column: ", dfNull.weight);
console.log("age types:     ", dfNull.age.map((v) => v === undefined ? "undefined" : v === null ? "null" : typeof v));

// Type check: dfOpt.age should be (number | undefined)[], dfNull.age should be (number | null)[]
const _ageOpt: (number | undefined)[] = dfOpt.age as unknown as (number | undefined)[];
const _ageNull: (number | null)[] = dfNull.age as unknown as (number | null)[];
console.log("\nType tags compile-time:");
console.log("  optional →", typeof dfOpt.age);
console.log("  nullable →", typeof dfNull.age);
