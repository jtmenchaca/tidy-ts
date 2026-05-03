import { createDataFrame } from "@tidy-ts/dataframe";
import { stats as s } from "@tidy-ts/dataframe";

// deno-lint-ignore no-explicit-any
function tryGroupSummarize(label: string, df: any) {
  try {
    const result = df.groupBy("id").summarize({
      // deno-lint-ignore no-explicit-any
      value: (g: any) => g.nrows(),
    });
    const rows = [...result];
    console.log(label, "OK, rows:", rows.length);
  } catch (e) {
    console.log(label, "FAIL:", (e as Error).message);
  }
}

// deno-lint-ignore no-explicit-any
function tryGroupSummarizeUnique(label: string, df: any) {
  try {
    const result = df.groupBy("id").summarize({
      // deno-lint-ignore no-explicit-any
      value: (g: any) => s.unique(g._dateStr).length,
    });
    const rows = [...result];
    console.log(label, "OK, rows:", rows.length);
  } catch (e) {
    console.log(label, "FAIL:", (e as Error).message);
  }
}

// ── Shared test data ────────────────────────────────────────────────────────

const vitalsData = [
  { id: "P1", code: "8480-6", codeSystem: "LOINC", value: 120, date: "2025-03-15" },
  { id: "P1", code: "8480-6", codeSystem: "LOINC", value: 118, date: "2025-03-16" },
  { id: "P1", code: "8480-6", codeSystem: "LOINC", value: 122, date: "2025-06-01" },
  { id: "P1", code: "8462-4", codeSystem: "LOINC", value: 80, date: "2025-03-15" },
  { id: "P2", code: "8480-6", codeSystem: "LOINC", value: 130, date: "2025-04-10" },
  { id: "P2", code: "8480-6", codeSystem: "LOINC", value: 128, date: "2025-04-11" },
  { id: "P2", code: "8462-4", codeSystem: "LOINC", value: 85, date: "2025-04-10" },
  { id: "P3", code: "8480-6", codeSystem: "LOINC", value: 115, date: "2025-05-20" },
];
const events = createDataFrame(vitalsData);
const targetCode = "8480-6";

// ── 1-6: Basic groupBy.summarize (nrows) ────────────────────────────────────

// 1: groupBy.summarize directly on the DataFrame
tryGroupSummarize("1 (raw vitals)", events);

// 2: after filter
const filtered = events.filter((r: any) => r.code === targetCode);
tryGroupSummarize("2 (filtered)", filtered);

// 3: after filter, re-materialized
const rematFiltered = createDataFrame([...filtered]);
tryGroupSummarize("3 (filtered, re-materialized)", rematFiltered);

// 4: simple df with nested objects, no filter
const simple = createDataFrame([
  { id: "P1", code: "A", nested: { x: 1 } },
  { id: "P1", code: "A", nested: { x: 2 } },
  { id: "P2", code: "A", nested: { x: 3 } },
]);
tryGroupSummarize("4 (simple with nested, no filter)", simple);

// 5: simple df with nested objects, filtered
const simpleFiltered = simple.filter((r: any) => r.code === "A");
tryGroupSummarize("5 (simple with nested, filtered)", simpleFiltered);

// 6: simple df WITHOUT nested objects, filtered
const flat = createDataFrame([
  { id: "P1", code: "A", val: 1 },
  { id: "P1", code: "A", val: 2 },
  { id: "P2", code: "A", val: 3 },
]);
const flatFiltered = flat.filter((r: any) => r.code === "A");
tryGroupSummarize("6 (flat, filtered)", flatFiltered);

// ── 7-15: s.unique variants ─────────────────────────────────────────────────

// 7: filter→mutate→select, s.unique
const chain7 = events
  .filter((r: any) => r.code === targetCode)
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("7 (filter→mutate→select, s.unique)", chain7);

// 8: filter→mutate only (no select), s.unique on _dateStr
const chain8 = events
  .filter((r: any) => r.code === targetCode)
  .mutate({ _dateStr: (r: any) => r.date });
tryGroupSummarizeUnique("8 (filter→mutate no select, s.unique)", chain8);

// 9: re-materialized after full chain, s.unique
const chain9 = createDataFrame([...chain7]);
tryGroupSummarizeUnique("9 (re-materialized from 7, s.unique)", chain9);

// 10: re-materialized after filter→mutate, then select, s.unique
const chain10 = createDataFrame([...chain8]).select("id", "_dateStr");
tryGroupSummarizeUnique("10 (re-mat from 8 then select, s.unique)", chain10);

// 11: nrows on chain7 (same chain, different summarize fn)
tryGroupSummarize("11 (filter→mutate→select, nrows)", chain7);

// 12: mutate→select only (no filter), s.unique
const chain12 = events
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("12 (mutate→select only, no filter, s.unique)", chain12);

// 13: filter→mutate→select, simple filter (no interval check), s.unique
const chain13filtered = events.filter((r: any) => r.code === targetCode);
const chain13 = chain13filtered
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("13 (filter→mutate→select, no interval check, s.unique)", chain13);

// 14: same as 7 but with new Set instead of s.unique
try {
  const result14 = chain7.groupBy("id").summarize({
    // deno-lint-ignore no-explicit-any
    value: (g: any) => new Set(g._dateStr).size,
  });
  const rows14 = [...result14];
  console.log("14 (same chain as 7, new Set)", "OK, rows:", rows14.length);
} catch (e) {
  console.log("14 (same chain as 7, new Set)", "FAIL:", (e as Error).message);
}

// 15: filter that keeps all rows → mutate → select → s.unique
const chain15 = events
  .filter((r: any) => r.codeSystem === "LOINC")
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("15 (filter keeps ALL rows, mutate, select, s.unique)", chain15);

// ── 16-22: isolate filter + s.unique on simple/flat data ─────────────────

// 16: flat data, filter→mutate→select, s.unique
const flat16 = createDataFrame([
  { id: "P1", code: "A", date: "2025-01-01" },
  { id: "P1", code: "A", date: "2025-02-01" },
  { id: "P1", code: "B", date: "2025-03-01" },
  { id: "P2", code: "A", date: "2025-04-01" },
  { id: "P2", code: "A", date: "2025-05-01" },
]);
const chain16 = flat16
  .filter((r: any) => r.code === "A")
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("16 (flat, filter→mutate→select, s.unique)", chain16);

// 17: flat data, no filter, mutate→select, s.unique
const chain17 = flat16
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("17 (flat, no filter, mutate→select, s.unique)", chain17);

// 18: nested data, filter keeps all rows, mutate→select, s.unique
const nested18 = createDataFrame([
  { id: "P1", code: "A", nested: { x: 1 }, date: "2025-01-01" },
  { id: "P1", code: "A", nested: { x: 2 }, date: "2025-02-01" },
  { id: "P2", code: "A", nested: { x: 3 }, date: "2025-04-01" },
]);
const chain18 = nested18
  .filter((r: any) => r.code === "A")
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("18 (nested, filter keeps all rows, mutate, s.unique)", chain18);

// 19: filter only (no mutate), s.unique on pre-existing string column
try {
  const result19 = events
    .filter((r: any) => r.code === targetCode)
    .groupBy("id")
    .summarize({
      // deno-lint-ignore no-explicit-any
      value: (g: any) => s.unique(g.code).length,
    });
  const rows19 = [...result19];
  console.log("19 (filter, s.unique on pre-existing col)", "OK, rows:", rows19.length);
} catch (e) {
  console.log("19 (filter, s.unique on pre-existing col)", "FAIL:", (e as Error).message);
}

// 20: filter + mutate (no select), s.unique on _dateStr
const chain20 = events
  .filter((r: any) => r.code === targetCode)
  .mutate({ _dateStr: (r: any) => r.date });
tryGroupSummarizeUnique("20 (filter+mutate no select, s.unique on _dateStr)", chain20);

// 21: filter only, s.unique on different pre-existing string column
try {
  const result21 = events
    .filter((r: any) => r.code === targetCode)
    .groupBy("id")
    .summarize({
      // deno-lint-ignore no-explicit-any
      value: (g: any) => s.unique(g.codeSystem).length,
    });
  const rows21 = [...result21];
  console.log("21 (filter, s.unique on codeSystem)", "OK, rows:", rows21.length);
} catch (e) {
  console.log("21 (filter, s.unique on codeSystem)", "FAIL:", (e as Error).message);
}

// 22a: flat data, filter REMOVES rows, mutate, s.unique
const flat22a = createDataFrame([
  { id: "P1", code: "A", date: "2025-01-01" },
  { id: "P1", code: "A", date: "2025-02-01" },
  { id: "P1", code: "B", date: "2025-03-01" },
  { id: "P2", code: "A", date: "2025-04-01" },
]);
const chain22a = flat22a
  .filter((r: any) => r.code === "A")
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("22a (flat, filter removes rows, mutate, s.unique)", chain22a);

// 22b: nested data, filter REMOVES rows, mutate, s.unique
const nested22b = createDataFrame([
  { id: "P1", code: "A", nested: { x: 1 }, date: "2025-01-01" },
  { id: "P1", code: "A", nested: { x: 2 }, date: "2025-02-01" },
  { id: "P1", code: "B", nested: { x: 9 }, date: "2025-99-99" },
  { id: "P2", code: "A", nested: { x: 3 }, date: "2025-04-01" },
]);
const chain22b = nested22b
  .filter((r: any) => r.code === "A")
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("22b (nested, filter removes rows, mutate, s.unique)", chain22b);

// 22c: flat data, filter removes NO rows, mutate, s.unique
const flat22c = createDataFrame([
  { id: "P1", code: "A", date: "2025-01-01" },
  { id: "P1", code: "A", date: "2025-02-01" },
  { id: "P2", code: "A", date: "2025-04-01" },
]);
const chain22c = flat22c
  .filter((r: any) => r.code === "A")
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("22c (flat, filter removes NO rows, mutate, s.unique)", chain22c);

// 22d: larger flat data (>5 rows), filter removes rows, mutate, s.unique
const flat22d = createDataFrame([
  { id: "P1", code: "A", date: "2025-01-01" },
  { id: "P1", code: "A", date: "2025-02-01" },
  { id: "P1", code: "B", date: "2025-03-01" },
  { id: "P2", code: "A", date: "2025-04-01" },
  { id: "P2", code: "A", date: "2025-05-01" },
  { id: "P2", code: "B", date: "2025-06-01" },
  { id: "P3", code: "A", date: "2025-07-01" },
]);
const chain22d = flat22d
  .filter((r: any) => r.code === "A")
  .mutate({ _dateStr: (r: any) => r.date })
  .select("id", "_dateStr");
tryGroupSummarizeUnique("22d (flat 7 rows, filter removes rows, mutate, s.unique)", chain22d);

// 22: filter→select (no mutate), s.unique on pre-existing column
try {
  const chain22 = events
    .filter((r: any) => r.code === targetCode)
    .select("id", "code");
  // deno-lint-ignore no-explicit-any
  const result22 = chain22.groupBy("id").summarize({
    // deno-lint-ignore no-explicit-any
    value: (g: any) => s.unique(g.code).length,
  });
  const rows22 = [...result22];
  console.log("22 (filter→select, s.unique on pre-existing col)", "OK, rows:", rows22.length);
} catch (e) {
  console.log("22 (filter→select, s.unique on pre-existing col)", "FAIL:", (e as Error).message);
}
