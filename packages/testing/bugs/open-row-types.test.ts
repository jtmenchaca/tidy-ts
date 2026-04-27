import { expect } from "@std/expect";
import type { DataFrame } from "../../dataframe/ts/index.ts";
import { createDataFrame } from "../../dataframe/ts/index.ts";

// Can we have a DataFrame where we know *some* columns exist but allow others?
// This matters for: generic pipeline functions, plugin systems, join results
// where one side is known and the other is dynamic.

type Roster = { pat_id: string; name: string };

// ── 1. Generic constraint: "at least these columns" ──
// This is the pattern that works: `Row extends Roster`

function summarizeRoster<Row extends Roster>(df: DataFrame<Row>) {
  return df.groupBy("pat_id").summarize({
    name: (g) => g.toRows()[0].name,
  });
}

Deno.test("generic function requiring Roster columns — extra columns preserved", () => {
  const df = createDataFrame([
    { pat_id: "A", name: "Alice", sbp: 120 },
    { pat_id: "B", name: "Bob", sbp: 130 },
  ]);

  // df has { pat_id, name, sbp } — satisfies Roster constraint
  const result = summarizeRoster(df);
  expect(result.nrows()).toBe(2);
});

// ── 2. Minimal constraint: just one required column ──

function countByPatient<Row extends { pat_id: string }>(df: DataFrame<Row>) {
  return df.groupBy("pat_id").summarize({
    n: (g) => g.nrows(),
  });
}

Deno.test("function accepting any df with pat_id column", () => {
  const encounters = createDataFrame([
    { pat_id: "A", encounter_type: "office", date: "2024-01-01" },
    { pat_id: "A", encounter_type: "lab", date: "2024-02-01" },
    { pat_id: "B", encounter_type: "er", date: "2024-01-15" },
  ]);

  const counts = countByPatient(encounters);
  const rows = counts.arrange("pat_id").toRows();
  expect(rows[0]).toEqual({ pat_id: "A", n: 2 });
  expect(rows[1]).toEqual({ pat_id: "B", n: 1 });
});

// ── 3. Direct assignment to a wider type ──

Deno.test("assign concrete df to DataFrame<Roster> — works if columns match", () => {
  const df = createDataFrame([
    { pat_id: "A", name: "Alice" },
  ]);

  // Exact match — works fine
  const roster: DataFrame<Roster> = df;
  expect(roster.toRows()[0].name).toBe("Alice");
});

// ── 4. Intersection with index signature — does NOT work ──
// DataFrame<Roster & Record<string, unknown>> fails because the index signature
// widens column names to `string`, breaking methods like arrange() that require
// literal column name unions. This is a fundamental TS limitation.

// ── 5. Superset df assigned to narrower type ──

Deno.test("DataFrame<Roster> accepts df with extra columns — types are covariant", () => {
  const df = createDataFrame([
    { pat_id: "A", name: "Alice", sbp: 120 },
  ]);

  // This works — DataFrame is covariant on Row, so { pat_id, name, sbp } extends Roster.
  // But the extra column 'sbp' is lost from the type.
  const roster: DataFrame<Roster> = df;
  expect(roster.toRows()[0].name).toBe("Alice");
  // roster.toRows()[0].sbp would be a type error — sbp is erased
});

// ── 6. The working pattern: generic constraints ──

Deno.test("generic constraint is the correct pattern for 'at least these columns'", () => {
  // Instead of DataFrame<Roster & any>, use:
  //   function foo<Row extends Roster>(df: DataFrame<Row>) { ... }
  //
  // This preserves the full Row type while guaranteeing pat_id and name exist.
  // The caller's extra columns survive through the generic.

  function getNames<Row extends Roster>(df: DataFrame<Row>): string[] {
    return df.toRows().map((r) => r.name);
  }

  const df = createDataFrame([
    { pat_id: "A", name: "Alice", sbp: 120, dbp: 80 },
    { pat_id: "B", name: "Bob", sbp: 130, dbp: 85 },
  ]);

  // pat_id, name, sbp, dbp all preserved — and name is typed as string
  expect(getNames(df)).toEqual(["Alice", "Bob"]);
});

// ── 7. Missing required column is a type error ──

Deno.test("generic constraint rejects df missing required columns", () => {
  const df = createDataFrame([
    { pat_id: "A", sbp: 120 },
  ]);

  // @ts-expect-error — 'name' is missing, doesn't extend Roster
  summarizeRoster(df);
});
