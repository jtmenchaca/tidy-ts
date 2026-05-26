import {
  readCSV,
  stats as s,
  writeCSV,
} from "@tidy-ts/dataframe";
import { z } from "zod";

const componentSchema = z.object({
  NAME: z.string(),
  COMPONENT_ID: z.string(),
  ABBREVIATION: z.string().optional(),
  EXTERNAL_NAME: z.string().optional(),
  BASE_NAME: z.string().optional(),
  COMPONENT_TYPE: z.string().optional(),
  LAB_DATA_TYPE_C: z.string().optional(),
  COMMON_NAME: z.string().optional(),
  LOINC_CODE: z.string().optional(),
  COMPONENT_SUBTYPE_C: z.string().optional(),
  RECORD_STATE: z.string().optional(),
  GROUP_TYPE_C: z.string().optional(),
  DEFAULT_LOW: z.string().optional(),
  DEFAULT_HIGH: z.string().optional(),
  DFLT_UNITS: z.string().optional(),
});

const baseSchema = z.object({
  BASE_NAME: z.string(),
});

const componentsPath =
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/component_names.csv";
const basesPath =
  "/Users/jtmenchaca/tidy-ts/packages/examples/fixtures/base_names.csv";

// The component_names.csv has two trailing empty headers. Schema omits them;
// per the skill, "A schema with fewer columns than the CSV is fine — only
// the schema's columns are loaded." But empty repeated headers are treated as
// duplicates, so we opt in.
const components = await readCSV(componentsPath, componentSchema, {
  allowDuplicateHeaders: true,
});

const bases = await readCSV(basesPath, baseSchema);

// Task 1: row counts and unique BASE_NAME counts
const componentRows = components.nrows();
const baseRows = bases.nrows();

// Unique base_name in file A: some rows have missing BASE_NAME (undefined).
const uniqueBasesA = new Set(
  components.BASE_NAME.filter((b): b is string => b !== undefined),
).size;
const uniqueBasesB = new Set(bases.BASE_NAME).size;

console.log("Task 1:");
console.log(`  File A rows: ${componentRows}`);
console.log(`  File B rows: ${baseRows}`);
console.log(`  Unique BASE_NAME in A: ${uniqueBasesA}`);
console.log(`  Unique BASE_NAME in B: ${uniqueBasesB}`);

// Task 2: find rows in A whose BASE_NAME appears in B.
// Use an inner join on BASE_NAME (skill notes WASM-backed joins).
// To ensure exact matching, first drop A rows with no BASE_NAME and
// drop B duplicates so the join doesn't multiply.
const componentsWithBase = components.removeUndefined("BASE_NAME");
const distinctBases = bases.distinct("BASE_NAME");
const matched = componentsWithBase.innerJoin(distinctBases, "BASE_NAME");

console.log("\nTask 2:");
console.log(`  Matched components: ${matched.nrows()}`);

// Task 3: of matched components, count non-missing LOINC_CODE.
// LOINC_CODE is optional (undefined when missing). Empty strings show as ""
// in the CSV preview, so treat empty string as missing too — but the schema
// says CSV's default naValues ("", "NA", ...) coerce to undefined when
// .optional() is on the field. So undefined alone should cover it.
const withLoinc = matched.removeUndefined("LOINC_CODE");
console.log("\nTask 3:");
console.log(`  Matched with non-missing LOINC_CODE: ${withLoinc.nrows()}`);

// Task 4: bases in B not in A.
const basesInA = new Set(componentsWithBase.BASE_NAME);
const missing = bases
  .distinct("BASE_NAME")
  .filter((r) => !basesInA.has(r.BASE_NAME));
console.log("\nTask 4: bases in B not in A:");
missing.print();

// Task 5: matched components grouped by BASE_NAME, count NAME aliases.
const topAliases = matched
  .groupBy("BASE_NAME")
  .summarize({
    alias_count: (g) => g.nrows(),
  })
  .arrange("alias_count", "desc")
  .sliceHead(10);

console.log("\nTask 5: top 10 BASE_NAMEs by NAME alias count:");
topAliases.print();

// Task 6: write matched components.
const outPath =
  "/Users/jtmenchaca/tidy-ts/packages/testing/bugs/matched-components.csv";
await writeCSV(matched, outPath);
console.log(`\nTask 6: wrote ${matched.nrows()} rows to ${outPath}`);

// Silence the unused import lint when stats isn't used directly above.
void s;
