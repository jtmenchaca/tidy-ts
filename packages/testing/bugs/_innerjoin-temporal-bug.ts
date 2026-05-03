/**
 * Standalone repro: tidy-ts innerJoin crashes on Temporal.PlainDateTime columns.
 *
 * The innerJoin implementation internally coerces join-key values via `"" + v`
 * (string concatenation), which calls `.valueOf()` on the value. Temporal types
 * explicitly throw on `.valueOf()` to prevent implicit coercion — the spec
 * requires using `.toString()` or `Temporal.PlainDateTime.compare()` instead.
 *
 * Error: "Do not use Temporal.PlainDateTime.prototype.valueOf; use
 *         Temporal.PlainDateTime.prototype.compare for comparison."
 *
 * This blocks any innerJoin where the join key includes a PlainDateTime column,
 * e.g. joining events with max-date-per-patient on ["id", "effectiveDateTime"].
 *
 * Run: deno test --allow-ffi --allow-env packages/protocol/src/events-qicore/recency/_innerjoin-temporal-bug.ts
 */

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const dt = (str: string) => Temporal.PlainDateTime.from(str);

// ============================================================================
// Case 1: innerJoin on a PlainDateTime column — crashes
// ============================================================================

Deno.test("innerJoin on PlainDateTime column crashes with valueOf error", () => {
  const events = createDataFrame([
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 120 },
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 110 },
    { id: "P1", effectiveDateTime: dt("2025-01-01"), value: 80 },
  ]);

  // Summarize to get max date per id
  const maxDates = events
    .groupBy("id")
    .summarize({ effectiveDateTime: (g) => s.max(g.effectiveDateTime)! });

  // This join crashes because innerJoin converts PlainDateTime via "" + v
  try {
    const joined = events.innerJoin(maxDates, ["id", "effectiveDateTime"]);
    console.log("  joined rows:", joined.nrows());
    // If this doesn't throw, the bug is fixed
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.log("  CRASH:", msg);
    if (!msg.includes("valueOf")) {
      throw e; // unexpected error
    }
    // Expected: "Do not use Temporal.PlainDateTime.prototype.valueOf"
  }
});

// ============================================================================
// Case 2: innerJoin on string column works fine (control)
// ============================================================================

Deno.test("innerJoin on string column works (control)", () => {
  const events = createDataFrame([
    { id: "P1", dateStr: "2025-06-01", value: 120 },
    { id: "P1", dateStr: "2025-06-01", value: 110 },
    { id: "P1", dateStr: "2025-01-01", value: 80 },
  ]);

  const maxDates = createDataFrame([
    { id: "P1", dateStr: "2025-06-01" },
  ]);

  const joined = events.innerJoin(maxDates, ["id", "dateStr"]);
  console.log("  joined rows:", joined.nrows()); // should be 2
});

// ============================================================================
// Case 3: innerJoin on just "id" (string) with PlainDateTime in other columns — works
// ============================================================================

Deno.test("innerJoin on 'id' only, with PlainDateTime in non-join columns — works", () => {
  const events = createDataFrame([
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 120 },
    { id: "P1", effectiveDateTime: dt("2025-01-01"), value: 80 },
    { id: "P2", effectiveDateTime: dt("2025-03-01"), value: 90 },
  ]);

  const ids = createDataFrame([{ id: "P1" }]);

  // Joining on "id" only — PlainDateTime is not a join key, so no valueOf() call
  const joined = events.innerJoin(ids, "id");
  console.log("  joined rows:", joined.nrows()); // should be 2
});

// ============================================================================
// Case 4: The workaround — convert PlainDateTime to string before joining
// ============================================================================

Deno.test("workaround: convert to string, join, then filter back", () => {
  const events = createDataFrame([
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 120 },
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 110 },
    { id: "P1", effectiveDateTime: dt("2025-01-01"), value: 80 },
  ]);

  const maxDates = events
    .groupBy("id")
    .summarize({ effectiveDateTime: (g) => s.max(g.effectiveDateTime)! });

  // Workaround: convert PlainDateTime to string for join
  const eventsWithStr = events
    .mutate({ _dateStr: (r) => r.effectiveDateTime.toString() });

  const maxDatesWithStr = maxDates
    .mutate({ _dateStr: (r) => r.effectiveDateTime.toString() })
    .select("id", "_dateStr");

  const joined = eventsWithStr.innerJoin(maxDatesWithStr, ["id", "_dateStr"]);
  console.log("  joined rows:", joined.nrows()); // should be 2 (both Jun 1 rows)
});

// ============================================================================
// Case 5: Verify s.max() on PlainDateTime works in isolation
// ============================================================================

Deno.test("s.max on PlainDateTime column works in isolation", () => {
  const events = createDataFrame([
    { id: "P1", effectiveDateTime: dt("2025-06-01"), value: 120 },
    { id: "P1", effectiveDateTime: dt("2025-01-01"), value: 80 },
  ]);

  const maxDates = events
    .groupBy("id")
    .summarize({ effectiveDateTime: (g) => s.max(g.effectiveDateTime)! });

  const dates = maxDates.extract("effectiveDateTime");
  console.log("  max date:", dates[0].toString()); // should be 2025-06-01T00:00:00
});
