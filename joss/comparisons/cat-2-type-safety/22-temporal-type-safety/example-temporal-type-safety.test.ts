/**
 * Error Class 22: Temporal Type Safety
 *
 * Tidy-TS uses Temporal types (PlainDate, etc.) which are strongly
 * typed. Invalid date strings fail at construction, not silently.
 * Date-to-number comparisons and arithmetic are blocked at compile time.
 * Python's pd.to_datetime silently produces NaT for invalid strings;
 * pandas 3.x rejects date-int comparisons/arithmetic.
 * R's as.Date produces NA silently and allows date-to-number operations
 * (Date is internally days-since-epoch).
 */
import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";
import {
  captureOutcome,
  deriveCompileOutcomes,
  type Outcome,
  printComparisonTable,
  type ProbeResult,
  probePath,
  runPythonProbe,
  runRProbe,
} from "../../test-helpers.ts";

const BASE = import.meta.url;

const LABELS = [
  "22a: invalid date parse",
  "22b: date compared to number",
  "22c: date + number arithmetic",
];

// Collected results for the summary table
let tsResults: ProbeResult[];
let pyResults: ProbeResult[];
let rResults: ProbeResult[];

// String-based DataFrame for 22a (invalid date parse)
const rawEncounters = createDataFrame([
  { patient_id: "P001", admit_date: "2024-01-15", los_days: 3 },
  { patient_id: "P002", admit_date: "2024-02-20", los_days: 7 },
  { patient_id: "P003", admit_date: "not-a-date", los_days: 5 },
]);

// Temporal-typed DataFrame for 22b, 22c
const encounters = createDataFrame([
  { patient_id: "P001", admit_date: Temporal.PlainDate.from("2024-01-15"), los_days: 3 },
  { patient_id: "P002", admit_date: Temporal.PlainDate.from("2024-02-20"), los_days: 7 },
]);

// ── Tidy-TS ────────────────────────────────────────────────────────────────

Deno.test("22 — Temporal Type Safety: Tidy-TS compile-time", () => {
  // 22a: Temporal.PlainDate.from() accepts string at compile time —
  // invalid strings only fail at runtime. compile: N/A
  expect(() => Temporal.PlainDate.from("not-a-date")).toThrow();

  // Temporal valueOf() throws at runtime, so wrap in try/catch
  try {
    // 22b: compare date to number — PlainDate > number has no overlap
    // @ts-expect-error: PlainDate and number have no overlap
    encounters.filter((r) => r.admit_date > 100);

    // 22c: add number to date — PlainDate + number is not valid
    // @ts-expect-error: PlainDate + number is not valid arithmetic
    encounters.mutate({ shifted: (r) => r.admit_date + 7 });
  } catch { /* Temporal valueOf() throws at runtime — expected */ }
});

Deno.test("22 — Temporal Type Safety: Tidy-TS runtime", () => {
  // deno-lint-ignore no-explicit-any
  const raw = rawEncounters as any;
  // deno-lint-ignore no-explicit-any
  const enc = encounters as any;

  tsResults = [
    // 22a: Parsing invalid date in mutate — runtime error
    captureOutcome(() =>
      raw.mutate({
        // deno-lint-ignore no-explicit-any
        parsed: (r: any) => Temporal.PlainDate.from(r.admit_date),
      })
    ),
    // 22b: compare date to number — Temporal valueOf() throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const result = enc.filter((r: any) => r.admit_date > 100);
      return `${result.nrows()} rows (date > 100)`;
    }),
    // 22c: date + number — Temporal valueOf() throws
    captureOutcome(() => {
      // deno-lint-ignore no-explicit-any
      const result = enc.mutate({ shifted: (r: any) => r.admit_date + 7 });
      const val = result.toArray()[0].shifted;
      return `date+7=${typeof val === "string" ? "string concat" : val}`;
    }),
  ];

  expect(tsResults[0].outcome).toBe("error" as Outcome);
  // 22b: > comparison doesn't trigger valueOf — silent (returns 0 rows)
  expect(tsResults[1].outcome).toBe("silent" as Outcome);
  // 22c: + triggers Temporal valueOf() which throws
  expect(tsResults[2].outcome).toBe("error" as Outcome);
});

// ── Python ─────────────────────────────────────────────────────────────────

Deno.test("22 — Temporal Type Safety: Python", () => {
  pyResults = runPythonProbe(probePath(BASE, "./probe.py"));
  expect(pyResults.length).toBe(3);
  // 22a: Invalid date silently becomes NaT
  expect(pyResults[0].outcome).toBe("silent" as Outcome);
  // 22b: date > 100 — error (pandas 3.x rejects datetime vs int)
  expect(pyResults[1].outcome).toBe("error" as Outcome);
  // 22c: date + 7 — error (pandas 3.x rejects int addition to datetime)
  expect(pyResults[2].outcome).toBe("error" as Outcome);
});

// ── R ──────────────────────────────────────────────────────────────────────

Deno.test("22 — Temporal Type Safety: R", () => {
  rResults = runRProbe(probePath(BASE, "./probe.R"));
  expect(rResults.length).toBe(3);
  // 22a: Invalid date — silent (as.Date produces NA silently)
  expect(rResults[0].outcome).toBe("silent" as Outcome);
  // 22b: date > 100 — silent (Date is internally integer, compares to days-since-epoch)
  expect(rResults[1].outcome).toBe("silent" as Outcome);
  // 22c: date + 7 — silent (adds 7 days)
  expect(rResults[2].outcome).toBe("silent" as Outcome);
});

// ── Summary ────────────────────────────────────────────────────────────────

const TS_COMPILE = deriveCompileOutcomes(import.meta.url, LABELS);

Deno.test("22 — Temporal Type Safety: Summary", () => {
  printComparisonTable({
    title: "Error Class 22: Temporal Type Safety",
    labels: LABELS,
    tsCompile: TS_COMPILE,
    tidyTS: tsResults,
    python: pyResults,
    r: rResults,
  });
});
