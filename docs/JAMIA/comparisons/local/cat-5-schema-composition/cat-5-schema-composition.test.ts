/**
 * Category 5: Schema Composition
 *
 * Does the system validate schemas at data boundaries, handle mismatched
 * schemas in row binding, detect implicit type coercion, enforce append
 * row types, and prevent duplicate column names?
 *
 * Consolidates error classes: 06, 13, 20, 27, 33.
 */
import { expect } from "@std/expect";
import { createDataFrame, readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";
import {
  captureOutcome,
  type CompileOutcome,
  type Outcome,
  printComparisonTable,
  type ProbeResult,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../../test-helpers.ts";

const BASE = import.meta.url;

// ═══════════════════════════════════════════════════════════════════════════════
// Shared data
// ═══════════════════════════════════════════════════════════════════════════════

const LabSchema = z.object({
  lab_id: z.string(),
  result_value: z.coerce.number(),
});

// Pre-load a valid DataFrame so the compile-time test has a typed instance
const labsDf = await readCSV("lab_id,result_value\nL1,100\nL2,200\n", LabSchema);

const labsA = createDataFrame([
  { id: "P1", value: 100, site: "Main" },
]);
const labsB = createDataFrame([
  { id: "P2", value: 200, ref_range: "4-5" },
]);

const numericDoses = createDataFrame([
  { drug: "Aspirin", dose: 325 },
  { drug: "Lisinopril", dose: 10 },
]);
const textDoses = createDataFrame([
  { drug: "Insulin", dose: "sliding scale" },
  { drug: "Warfarin", dose: "per INR" },
]);

const patients = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30 },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Labels & compile outcomes — single flat array across all error classes
// ═══════════════════════════════════════════════════════════════════════════════

// Scenarios a-c are reported as Category 5 (Data loading); d-j are reported as Category 6 (Schema composition).
// Directory layout is historical; the cat 5 / cat 6 split is applied at the reporting layer.
const LABELS = [
  "a: non-numeric value in numeric column at load time",
  "b: accessing nonexistent column after schema-validated load",
  "c: empty cell in non-null column at load time",
  "d: accessing optional column after mismatched row bind",
  "e: string operation on NaN/NA column after row bind",
  "f: implicit type coercion when binding rows with different column types",
  "g: arithmetic on mixed-type column after coerced row bind",
  "h: appending row with missing column",
  "i: appending row with wrong column type",
  "j: string operation on duplicate column name",
];

// Plain-English task each scenario exercises. See CONTEXT.md (equivalence rule).
const INTENTS = [
  "Load a lab CSV where the value column is declared numeric in the schema; a row contains 'pending'.",
  "Load a lab CSV with a defined schema, then access a column that was not declared in the schema.",
  "Load an encounters CSV where the patient ID column is declared non-null; one row has an empty cell.",
  "Combine two lab tables that share most columns; one has a `reference_range` column the other lacks; then uppercase that column.",
  "Combine two lab tables that share most columns; one has a `site` column the other lacks; then uppercase that column.",
  "Combine two prescription tables where one has numeric doses and the other has string doses ('sliding scale'); then format dose to two decimals.",
  "Combine two prescription tables with mixed numeric/string dose columns; then multiply dose by 2.",
  "Append a row to a patient table that omits one declared column.",
  "Append a row to a patient table where one column has the wrong type.",
  "Construct a DataFrame from row literals containing a duplicate column name, then operate on that column.",
];

const TS_COMPILE: CompileOutcome[] = [
  "—",     // a: CSV content only known at runtime
  "error", // b: schema-typed DataFrame catches missing column
  "—",     // c: CSV content only known at runtime
  "error", // d: ref_range is string | undefined
  "error", // e: site is string | undefined
  "error", // f: toFixed not on number | string
  "error", // g: number | string can't multiply
  "error", // h: age is missing from row
  "error", // i: age should be number, not string
  "error", // j: duplicate property in object literal
];

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];
let polarsResults: ProbeResult[];

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS compile-time
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 5 — Schema Composition: Tidy-TS compile-time", () => {
  // a: CSV content is only known at runtime — no compile-time check

  // b: After readCSV with a schema, accessing a missing column is a compile error
  // @ts-expect-error: missing_col doesn't exist in LabSchema
  expect(() => labsDf.mutate({ x: (r) => r.missing_col })).toThrow();

  // c: Empty cells in non-null columns — runtime validation only

  // d: Accessing optional column without null check — compile error
  const combined = labsA.bindRows(labsB);
  // @ts-expect-error: ref_range is string | undefined — can't call toUpperCase
  expect(() => combined.mutate({ upper: (r) => r.ref_range.toUpperCase() })).toThrow();

  // e: String method on other optional column — compile error
  // @ts-expect-error: site is string | undefined — can't call toUpperCase
  expect(() => combined.mutate({ upper: (r) => r.site.toUpperCase() })).toThrow();

  // f: Treating union column as single type — compile error
  const combinedDoses = numericDoses.bindRows(textDoses);
  // @ts-expect-error: toFixed not available on number | string
  expect(() => combinedDoses.mutate({ formatted: (r) => r.dose.toFixed(2) })).toThrow();

  // g: Arithmetic on union column — compile error
  // @ts-expect-error: number | string can't be multiplied
  combinedDoses.mutate({ doubled: (r) => r.dose * 2 });

  // h: Missing column in appended row — compile error
  expect(() => {
    // @ts-expect-error: age is missing from the row
    patients.append({ patient_id: "P002", name: "Bob" });
  }).toThrow();

  // i: Wrong type in appended row — compile error
  expect(() => {
    // @ts-expect-error: age should be number, not string
    patients.append({ patient_id: "P003", name: "Carol", age: "thirty" });
  }).toThrow();

  // j: Object literal with duplicate key — TS compile error (TS1117)
  // @ts-expect-error: duplicate property 'name' in object literal
  const df = createDataFrame([{ id: 1, name: "Alice", name: "ED" }]);
  df.mutate({ upper: (r) => r.name.toUpperCase() });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS runtime
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 5 — Schema Composition: Tidy-TS runtime", async () => {
  // deno-lint-ignore no-explicit-any
  const dfLabs = labsDf as any;
  // deno-lint-ignore no-explicit-any
  const a = labsA as any;
  // deno-lint-ignore no-explicit-any
  const b = labsB as any;
  // deno-lint-ignore no-explicit-any
  const n = numericDoses as any;
  // deno-lint-ignore no-explicit-any
  const p = patients as any;

  tsResults = [
    // a: Non-numeric in numeric col — readCSV rejects "pending" via Zod
    await (async (): Promise<ProbeResult> => {
      try {
        await readCSV("lab_id,result_value\nL1,100\nL2,pending\nL3,200\n", LabSchema);
        return { outcome: "silent", message: "no error", result: null };
      } catch (e) {
        return { outcome: "error", message: (e as Error).message, result: null };
      }
    })(),
    // b: Accessing missing column after load — proxy throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      dfLabs.mutate({ x: (r: any) => r.missing_col });
    }),
    // c: Null in non-null column — readCSV rejects empty cell via Zod
    await (async (): Promise<ProbeResult> => {
      try {
        await readCSV("lab_id,result_value\nL1,100\nL2,\nL3,200\n", LabSchema);
        return { outcome: "silent", message: "no error", result: null };
      } catch (e) {
        return { outcome: "error", message: (e as Error).message, result: null };
      }
    })(),
    // d: .toUpperCase() on undefined — runtime error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => a.bindRows(b).mutate({ upper: (r: any) => r.ref_range.toUpperCase() })),
    // e: .toUpperCase() on undefined (site col) — runtime error
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => a.bindRows(b).mutate({ upper: (r: any) => r.site.toUpperCase() })),
    // f: bindRows with type mismatch — silent (JS allows mixed arrays)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { n.bindRows(textDoses as any); return "mixed types in column"; }),
    // g: Arithmetic on mixed column — silent (string * 2 = NaN in JS)
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { n.bindRows(textDoses as any).mutate({ doubled: (r: any) => r.dose * 2 }); return "strings produce NaN"; }),
    // h: append with missing column — error
    captureOutcome(() => p.append({ patient_id: "P002", name: "Bob" })),
    // i: append with wrong type — error
    captureOutcome(() => p.append({ patient_id: "P003", name: "Carol", age: "thirty" })),
    // j: JS deduplicates — last value wins, .toUpperCase() works on "ED"
    captureOutcome(() => {
      const rows = JSON.parse('[{"id": 1, "name": "Alice", "name": "ED"}]');
      const df = createDataFrame(rows);
      // deno-lint-ignore no-explicit-any
      df.mutate({ upper: (r: any) => r.name.toUpperCase() }).toArray();
      return "Last value wins, .upper() works";
    }),
  ];

  // a–c: schema validation — all error
  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
  expect(tsResults[2].outcome).toBe("error" as Outcome);
  // d–e: optional col access — error
  expect(tsResults[3].outcome).toBe("error" as Outcome);
  expect(tsResults[4].outcome).toBe("error" as Outcome);
  // f–g: type coercion in bindRows — silent (JS coercion)
  expect(tsResults[5].outcome).toBe("silent" as Outcome);
  expect(tsResults[6].outcome).toBe("silent" as Outcome);
  // h–i: append validation — error
  expect(tsResults[7].outcome).toBe("error" as Outcome);
  expect(tsResults[8].outcome).toBe("error" as Outcome);
  // j: duplicate col — silent (JS deduplication)
  expect(tsResults[9].outcome).toBe("silent" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Pyright (Python static type checker) — strict mode with pandas-stubs
// ═══════════════════════════════════════════════════════════════════════════════

let pyrightResults: ProbeResult[];

Deno.test("Cat 5 — Schema Composition: Pyright", () => {
  pyrightResults = runPythonProbe(probePath(BASE, "./probe-pyright.py"));
  expect(pyrightResults.length).toBe(LABELS.length);

  // Pyright in strict mode catches NONE of the schema composition issues.
  // pandas-stubs do not encode column-level schema information, so pyright
  // has no information to flag any of these cases.
  for (let i = 0; i < LABELS.length; i++) {
    expect(pyrightResults[i].outcome).toBe("silent" as Outcome);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Mypy (Python static type checker) — strict mode with pandas-stubs
// ═══════════════════════════════════════════════════════════════════════════════

let mypyResults: ProbeResult[];

Deno.test("Cat 5 — Schema Composition: Mypy", () => {
  mypyResults = runPythonProbe(probePath(BASE, "./probe-mypy.py"));
  expect(mypyResults.length).toBe(LABELS.length);

  // Mypy in strict mode catches NONE of the schema composition issues.
  // Like pyright, pandas-stubs do not encode column-level schema information.
  for (let i = 0; i < LABELS.length; i++) {
    expect(mypyResults[i].outcome).toBe("silent" as Outcome);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// Python — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 5 — Schema Composition: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(LABELS.length);

  // a: Non-numeric in numeric column — silent (dtype becomes object/str)
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // b: Missing column accessed after load — runtime error
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  // c: Empty cells in column — silent (becomes NaN)
  expect(pyResults[2].outcome).toBe("silent" as Outcome);
  // d: concat with different schemas — silent (fills NaN)
  expect(pyResults[3].outcome).toBe("silent" as Outcome);
  // e: String op on NaN column — silent (NaN propagates)
  expect(pyResults[4].outcome).toBe("silent" as Outcome);
  // f: concat silently coerces to object dtype
  expect(pyResults[5].outcome).toBe("silent" as Outcome);
  // g: * 2 on mixed column repeats strings
  expect(pyResults[6].outcome).toBe("silent" as Outcome);
  // h: Missing column silently filled with NaN
  expect(pyResults[7].outcome).toBe("silent" as Outcome);
  // i: Wrong type silently coerced
  expect(pyResults[8].outcome).toBe("silent" as Outcome);
  // j: .str.upper() on duplicate col — error
  expect(pyResults[9].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Polars — runtime probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 5 — Schema Composition: Polars", () => {
  polarsResults = runPythonProbe(probePath(BASE, "./probe-polars.py"));
  expect(polarsResults.length).toBe(LABELS.length);
});

// ═══════════════════════════════════════════════════════════════════════════════
// R — single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 5 — Schema Composition: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(LABELS.length);

  // a: Non-numeric in numeric column — warning (coerced to NA)
  expect(rResults[0].outcome).toBe("warning" as Outcome);
  // b: Missing column accessed after load — runtime error
  expect(rResults[1].outcome).toBe("error" as Outcome);
  // c: Empty cells in column — silent (becomes NA)
  expect(rResults[2].outcome).toBe("silent" as Outcome);
  // d: bind_rows with different schemas — silent (fills NA)
  expect(rResults[3].outcome).toBe("silent" as Outcome);
  // e: String op on NA column — silent (NA propagates)
  expect(rResults[4].outcome).toBe("silent" as Outcome);
  // f: bind_rows with double + character — R errors
  expect(rResults[5].outcome).toBe("error" as Outcome);
  // g: bind_rows with logical + numeric — silent coercion
  expect(rResults[6].outcome).toBe("silent" as Outcome);
  // h: Missing column silently filled with NA
  expect(rResults[7].outcome).toBe("silent" as Outcome);
  // i: Wrong type — R errors on double + character
  expect(rResults[8].outcome).toBe("error" as Outcome);
  // j: tibble rejects duplicate names at creation — error
  expect(rResults[9].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary — single table for the whole category
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 5 — Schema Composition: Summary", () => {
  printComparisonTable({
    title: "Category 5: Schema Composition",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    pyright: pyrightResults,
    mypy: mypyResults,
    polars: polarsResults,
    r: rResults,
  });
});
