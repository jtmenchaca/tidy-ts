/**
 * Two real-world use cases exercising cumulative + lag in mutate.
 *
 * All stats functions take arrays, return arrays. No closure magic.
 * In grouped mutate, use (row, i, df) => s.fn(df.extract("col"))[i].
 */

import { expect } from "@std/expect";
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// ─────────────────────────────────────────────────────────────────────────────
// Example 1: collapsedDays — merge overlapping date intervals
//
// Input: coverage periods per patient (may overlap)
// Goal:  total non-overlapping coverage days per patient
//
//   A: |---Jan 1–10---|
//   A:      |---Jan 5–15---|
//   A:                          |---Jan 20–25---|
//   B: |---Feb 1–10---|
//
//   A collapsed = 14 days (Jan 1–15) + 5 days (Jan 20–25) = 19
//   B collapsed = 9 days
// ─────────────────────────────────────────────────────────────────────────────

Deno.test("collapsedDays", () => {
  const df = createDataFrame([
    { id: "A", start: new Date("2024-01-01"), end: new Date("2024-01-10") },
    { id: "A", start: new Date("2024-01-05"), end: new Date("2024-01-15") },
    { id: "A", start: new Date("2024-01-20"), end: new Date("2024-01-25") },
    { id: "B", start: new Date("2024-02-01"), end: new Date("2024-02-10") },
  ]);

  const df1 = df
    .arrange(["id", "start"], ["asc", "asc"])
    .groupBy("id")
    .mutate({ maxEndSoFar: s.cummax(df.extract("end")) })
  
  const df2 = df1
    .mutate({ prevMaxEnd: s.lag(df1.extract("maxEndSoFar")) })
    .mutate({ effectiveStart: (row) => row.prevMaxEnd && row.start < row.prevMaxEnd ? row.prevMaxEnd : row.start })
    .mutate({ contribution: (row) => Math.max(0, (row.end.getTime() - row.effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) })
    .groupBy("id")
    .summarize({ days: (g) => s.sum(g.extract("contribution")) });

  const a = df2.filter((row) => row.id === "A").extract("days")[0];
  const b = df2.filter((row) => row.id === "B").extract("days")[0];
  expect(a).toBe(19);
  expect(b).toBe(9);
});

// ─────────────────────────────────────────────────────────────────────────────
// Example 2: consecutiveEventValuesMatch — find patients with N+ consecutive
//            abnormal lab values
//
// Input: daily lab results
// Goal:  which patients have a streak of >= 3 consecutive abnormal values?
//
//   A: Day1=5.2(Y) Day2=5.5(Y) Day3=4.0(N) Day4=6.1(Y) Day5=6.3(Y) Day6=6.0(Y)
//        streak 1 (len=2)                    streak 2 (len=3) -- qualifies
//
//   B: Day1=5.0(Y) Day2=4.5(N)
//        streak 1 (len=1) -- does not qualify
// ─────────────────────────────────────────────────────────────────────────────

const ABNORMAL_THRESHOLD = 5.0;
const MIN_STREAK = 3;

Deno.test("consecutiveEventValuesMatch", () => {
  const df = createDataFrame([
    { id: "A", date: "2024-01-01", value: 5.2 },
    { id: "A", date: "2024-01-02", value: 5.5 },
    { id: "A", date: "2024-01-03", value: 4.0 },
    { id: "A", date: "2024-01-04", value: 6.1 },
    { id: "A", date: "2024-01-05", value: 6.3 },
    { id: "A", date: "2024-01-06", value: 6.0 },
    { id: "B", date: "2024-01-01", value: 5.0 },
    { id: "B", date: "2024-01-02", value: 4.5 },
  ]);

  const out = df
    .arrange(["id", "date"], ["asc", "asc"])
    .groupBy("id")
    .mutate({match: (row) => row.value >= ABNORMAL_THRESHOLD ? 1 : 0})
    .mutate({ prevMatch: (_, i, df) => s.lag(df.extract("match"), { defaultValue: 0 })[i]})
    .mutate({ streakStart: (row) => row.match === 1 && row.prevMatch === 0 ? 1 : 0 })
    .groupBy("id").mutate({ streakId: (_, i, df) => s.cumsum(df.extract("streakStart"))[i] })
    .filter((row) => row.match === 1)
    .count("id", "streakId")
    .filter((row) => row.count >= MIN_STREAK)
    .distinct("id");

  expect(out.extract("id")).toContain("A");
  expect(out.extract("id")).not.toContain("B");
});
