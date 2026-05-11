/**
 * Category 4: Join Safety
 *
 * Does the join key exist? Are null-introduced columns tracked?
 * Are colliding column names disambiguated in the type system?
 *
 * Consolidates error classes: 03, 17, 18.
 */
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import {
  captureOutcome,
  type CompileOutcome,
  type Outcome,
  printComparisonTable,
  type ProbeResult,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../test-helpers.ts";

const BASE = import.meta.url;

// ═══════════════════════════════════════════════════════════════════════════════
// Shared data
// ═══════════════════════════════════════════════════════════════════════════════

const patients03 = createDataFrame([
  { patient_id: "P001", name: "Alice" },
]);
const encounters03 = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED" },
]);
const labs03 = createDataFrame([
  { lab_id: "L001", encounter_id: "E001", patient_id: "P001", result_value: 7.2 },
]);

const patients17 = createDataFrame([
  { patient_id: "P1", name: "Alice" },
  { patient_id: "P2", name: "Bob" },
]);
const encounters17 = createDataFrame([
  { patient_id: "P1", department: "ED", los_days: 3 },
]);

const admissions = createDataFrame([
  { patient_id: "P1", date: "2024-01-15", department: "ED" },
]);
const discharges = createDataFrame([
  { patient_id: "P1", date: "2024-01-18", disposition: "Home" },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// Labels & compile outcomes -- single flat array across all error classes
// ═══════════════════════════════════════════════════════════════════════════════

const LABELS = [
  "a: join on key not in left table",
  "b: join on misspelled key",
  "c: access missing column post-join",
  "d: string method on join-introduced null",
  "e: arithmetic on join-introduced null",
  "f: comparison silently excludes null rows",
  "g: explicit suffix then access original name",
  "h: default suffix then access original name",
];

const TS_COMPILE: CompileOutcome[] = [
  "error", "error", "error",  // a-c: join key errors
  "error", "error", "error",  // d-f: join nullability
  "error", "error",            // g-h: column name collision
];

let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS compile-time
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 4 — Join Safety: Tidy-TS compile-time", () => {
  // a: join on key not in left table
  // @ts-expect-error: 'encounter_id' is not a key of patients03
  expect(() => patients03.leftJoin(labs03, "encounter_id")).toThrow();

  // b: join on misspelled key
  // @ts-expect-error: 'patient_ID' does not exist on either table
  expect(() => patients03.leftJoin(encounters03, "patient_ID")).toThrow();

  // c: access missing column post-join
  const joined03 = patients03.leftJoin(encounters03, "patient_id");
  // @ts-expect-error: 'prescription_id' not in joined schema
  expect(() => joined03.mutate({ note: (r) => r.prescription_id })).toThrow();

  // d: string method on join-introduced null
  const joined17 = patients17.leftJoin(encounters17, "patient_id");
  // @ts-expect-error: department is string | undefined
  expect(() => joined17.mutate({ upper: (r) => r.department.toUpperCase() })).toThrow();

  // e: arithmetic on join-introduced null
  // @ts-expect-error: los_days is number | undefined
  joined17.mutate({ weeks: (r) => r.los_days / 7 });

  // f: comparison silently excludes null rows
  // @ts-expect-error: los_days is number | undefined -- can't compare with >
  joined17.filter((r) => r.los_days > 2);

  // g: explicit suffix then access original name
  const withSuffixes = admissions.innerJoin(discharges, {
    keys: ["patient_id"],
    suffixes: { left: "_admit", right: "_discharge" },
  });
  // @ts-expect-error: date no longer exists after suffixed join
  expect(() => withSuffixes.mutate({ d: (r) => r.date })).toThrow();

  // h: default suffix then access original name
  const noSuffixes = admissions.innerJoin(discharges, {
    keys: ["patient_id"],
  });
  // @ts-expect-error: date no longer exists -- now date_x and date_y
  expect(() => noSuffixes.mutate({ d: (r) => r.date })).toThrow();
});

// ═══════════════════════════════════════════════════════════════════════════════
// Tidy-TS runtime
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 4 — Join Safety: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const p03 = patients03 as any;
  // deno-lint-ignore no-explicit-any
  const p17 = patients17 as any;
  // deno-lint-ignore no-explicit-any
  const a = admissions as any;

  // deno-lint-ignore no-explicit-any
  const joined03 = p03.leftJoin(encounters03, "patient_id");
  // deno-lint-ignore no-explicit-any
  const joined17 = p17.leftJoin(encounters17, "patient_id");

  tsResults = [
    // a: join on key not in left table
    captureOutcome(() => p03.leftJoin(labs03, "encounter_id")),
    // b: join on misspelled key
    captureOutcome(() => p03.leftJoin(encounters03, "patient_ID")),
    // c: access missing column post-join
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => joined03.mutate({ note: (r: any) => r.prescription_id })),
    // d: string method on join-introduced null
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => joined17.mutate({ upper: (r: any) => r.department.toUpperCase() })),
    // e: arithmetic on join-introduced null
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { joined17.mutate({ weeks: (r: any) => r.los_days / 7 }); return "produced NaN silently"; }),
    // f: comparison silently excludes null rows
    // deno-lint-ignore no-explicit-any
    captureOutcome(() => { joined17.filter((r: any) => r.los_days > 3); return "excluded undefined rows"; }),
    // g: explicit suffix then access original name
    captureOutcome(() => {
      const j = a.innerJoin(discharges, {
        keys: ["patient_id"],
        suffixes: { left: "_admit", right: "_discharge" },
      });
      // deno-lint-ignore no-explicit-any
      j.mutate({ d: (r: any) => r.date });
    }),
    // h: default suffix then access original name
    captureOutcome(() => {
      const j = a.innerJoin(discharges, { keys: ["patient_id"] });
      // deno-lint-ignore no-explicit-any
      j.mutate({ d: (r: any) => r.date });
    }),
  ];

  // a-c: join key errors -- all runtime error
  expect(tsResults[0].outcome).toBe("error" as Outcome);
  expect(tsResults[1].outcome).toBe("error" as Outcome);
  expect(tsResults[2].outcome).toBe("error" as Outcome);
  // d: .toUpperCase() on undefined -- runtime error
  expect(tsResults[3].outcome).toBe("error" as Outcome);
  // e: undefined / 7 -- silent (JS produces NaN)
  expect(tsResults[4].outcome).toBe("silent" as Outcome);
  // f: undefined > 3 -- silent (JS evaluates to false)
  expect(tsResults[5].outcome).toBe("silent" as Outcome);
  // g-h: column name collision -- runtime error
  expect(tsResults[6].outcome).toBe("error" as Outcome);
  expect(tsResults[7].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Python -- single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 4 — Join Safety: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(LABELS.length);

  // a-c: join key errors -- all error
  expect(pyResults[0].outcome).toBe("error" as Outcome);
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  expect(pyResults[2].outcome).toBe("error" as Outcome);
  // d: str.upper() on NaN from join -- silent
  expect(pyResults[3].outcome).toBe("silent" as Outcome);
  expect(pyResults[3].result).toBe("produced 2 NaN silently");
  // e: arithmetic on NaN from join -- silent
  expect(pyResults[4].outcome).toBe("silent" as Outcome);
  expect(pyResults[4].result).toBe("produced 2 NaN silently");
  // f: comparison silently excludes NaN rows
  expect(pyResults[5].outcome).toBe("silent" as Outcome);
  expect(pyResults[5].result).toBe("excluded 2 NaN rows");
  // g-h: column name collision -- both error
  expect(pyResults[6].outcome).toBe("error" as Outcome);
  expect(pyResults[7].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// R -- single consolidated probe
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 4 — Join Safety: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(LABELS.length);

  // a-c: join key errors -- all error
  expect(rResults[0].outcome).toBe("error" as Outcome);
  expect(rResults[1].outcome).toBe("error" as Outcome);
  expect(rResults[2].outcome).toBe("error" as Outcome);
  // d: toupper() on NA from join -- silent
  expect(rResults[3].outcome).toBe("silent" as Outcome);
  // e: arithmetic on NA from join -- silent
  expect(rResults[4].outcome).toBe("silent" as Outcome);
  // f: filter() silently drops NA rows
  expect(rResults[5].outcome).toBe("silent" as Outcome);
  // g-h: column name collision -- both error
  expect(rResults[6].outcome).toBe("error" as Outcome);
  expect(rResults[7].outcome).toBe("error" as Outcome);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary -- single table for the whole category
// ═══════════════════════════════════════════════════════════════════════════════

Deno.test("Cat 4 — Join Safety: Summary", () => {
  printComparisonTable({
    title: "Category 4: Join Safety",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
