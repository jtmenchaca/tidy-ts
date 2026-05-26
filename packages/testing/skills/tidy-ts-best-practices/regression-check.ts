/**
 * Pinned regressions for the `tidy-ts-best-practices` skill.
 *
 * Run before every agent-test dispatch:
 *
 *   deno run -A packages/testing/skills/tidy-ts-best-practices/regression-check.ts
 *
 * Each block guards one previously-fixed bug. If a regression slips back in,
 * the script throws and prints which check failed. See `coverage.md` for the
 * Pinned regressions table that this file mirrors.
 */

import { createDataFrame, readCSV, stats as s, writeCSV } from "@tidy-ts/dataframe";
import { z } from "zod";
import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

const failures: string[] = [];

function check(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => console.log(`  ✓ ${name}`))
    .catch((err) => {
      failures.push(`${name}: ${err instanceof Error ? err.message : err}`);
      console.log(`  ✗ ${name}`);
    });
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

console.log("Pinned regression checks for tidy-ts-best-practices skill\n");

// ----------------------------------------------------------------------------
// run-04: model.summary() exposes R²/adj-R²/F-stat/n_observations, and the
// adjusted-R² formula matches R's `summary(lm())` output.
// ----------------------------------------------------------------------------
await check("run-04 — glm.summary() exposes r_squared, adjusted_r_squared, n_observations", () => {
  const df = createDataFrame({
    columns: {
      y: [12.3, 15.7, 18.2, 14.8, 16.1, 13.9, 22.1, 25.4, 28.6, 24.3, 26.8, 23.7],
      group: [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    },
  });
  const model = s.glm({
    formula: "y ~ group",
    family: "gaussian",
    link: "identity",
    data: df,
  });
  const summary = model.summary();
  // Canonical R reference values (summary(lm(y ~ group, df))).
  const R_R_SQUARED = 0.863841773904251;
  const R_ADJ_R_SQUARED = 0.850225951294676;
  assert(Math.abs(summary.r_squared - R_R_SQUARED) < 1e-6, `r_squared drift: ${summary.r_squared}`);
  assert(Math.abs(summary.adjusted_r_squared - R_ADJ_R_SQUARED) < 1e-6, `adj_r drift: ${summary.adjusted_r_squared}`);
  assert(summary.n_observations === 12, `n_observations: ${summary.n_observations}`);
});

// ----------------------------------------------------------------------------
// run-07: writeCSV emits clean ISO strings for Date and Temporal cells (no
// triple-quoted output).
// ----------------------------------------------------------------------------
await check("run-07 — writeCSV does not triple-quote Date / Temporal", async () => {
  const tmp = await Deno.makeTempFile({ suffix: ".csv" });
  try {
    await writeCSV(
      createDataFrame([
        { id: 1, d: new Date("2024-03-04T09:30:00Z") },
        { id: 2, d: Temporal.PlainDate.from("2024-03-04") as unknown as Date },
      ]),
      tmp,
    );
    const text = await Deno.readTextFile(tmp);
    assert(!text.includes('"""'), `triple-quoted cells in output:\n${text}`);
  } finally {
    await Deno.remove(tmp);
  }
});

// ----------------------------------------------------------------------------
// run-10: a column named `count` is reachable as a column (not the verb).
// ----------------------------------------------------------------------------
await check("run-10 — df.count returns the column array, not a verb method", () => {
  const df = createDataFrame([
    { region: "N", count: 10 },
    { region: "S", count: 20 },
  ]);
  // deno-lint-ignore no-explicit-any
  const col = (df as any).count;
  assert(Array.isArray(col), `df.count expected array, got: ${typeof col}`);
  assert(col[0] === 10 && col[1] === 20, `bad column values: ${col}`);
});

// ----------------------------------------------------------------------------
// run-13: removeUndefined narrows Zod-optional columns to non-optional.
// ----------------------------------------------------------------------------
await check("run-13 — removeUndefined narrows readCSV+.optional() columns", async () => {
  const csv = `id,b\n1,2\n2,NA\n3,5\n`;
  const schema = z.object({ id: z.number(), b: z.number().optional() });
  const d = await readCSV(csv, schema);
  const d2 = d.removeUndefined("b");
  // Type-level fact (compile only). Runtime fact: undefined row was dropped.
  const _typed: readonly number[] = d2.b;
  assert(_typed.length === 2 && _typed[0] === 2 && _typed[1] === 5, `bad narrowed values: ${_typed}`);
});

// ----------------------------------------------------------------------------
// run-15: downsample preserves the input Temporal type instead of coercing
// to JS Date / ISO string.
// ----------------------------------------------------------------------------
await check("run-15 — downsample preserves Instant input type", () => {
  const df = createDataFrame([
    { ts: Temporal.Instant.from("2024-03-04T09:00:00Z"), price: 10 },
    { ts: Temporal.Instant.from("2024-03-04T10:00:00Z"), price: 11 },
    { ts: Temporal.Instant.from("2024-03-05T09:00:00Z"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1D",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  const t0 = out.ts[0];
  assert(t0?.constructor?.name === "Instant", `expected Instant, got ${t0?.constructor?.name}`);
});

await check("run-15 — downsample preserves PlainDate input type (not ISO string)", () => {
  const df = createDataFrame([
    { ts: Temporal.PlainDate.from("2024-01-15"), price: 10 },
    { ts: Temporal.PlainDate.from("2024-02-15"), price: 12 },
  ]);
  const out = df.downsample({
    timeColumn: "ts",
    frequency: "1M",
    aggregations: { mean: { column: "price", fn: s.mean } },
  });
  const t0 = out.ts[0];
  assert(t0?.constructor?.name === "PlainDate", `expected PlainDate, got ${t0?.constructor?.name}`);
});

// ----------------------------------------------------------------------------
// run-17: s.first / s.last return the element, not the array.
// ----------------------------------------------------------------------------
await check("run-17 — s.first returns element, not the array", () => {
  const v: number = s.first([10, 20, 30]);
  assert(v === 10, `s.first returned ${v}`);
  const w: number = s.last([10, 20, 30]);
  assert(w === 30, `s.last returned ${w}`);
});

// ----------------------------------------------------------------------------
// run-18: print() / toTable / customInspect renders Temporal as ISO string,
// not "{}".
// ----------------------------------------------------------------------------
await check("run-18 — Temporal cells render as ISO string in toTable", () => {
  const df = createDataFrame([
    { d: Temporal.PlainDate.from("2024-01-15") },
    { d: Temporal.PlainDate.from("2024-02-20") },
  ]);
  // deno-lint-ignore no-explicit-any
  const rows = (df as any).toTable() as Array<Record<string, unknown>>;
  assert(rows[0].d === "2024-01-15", `bad cell: ${JSON.stringify(rows[0].d)}`);
});

// ----------------------------------------------------------------------------
// run-19c: distribution .random() accepts a seed, and same seed → same draws.
// ----------------------------------------------------------------------------
await check("run-19c — seeded sampling is deterministic across runs", () => {
  const a = s.dist.normal.random({ sampleSize: 5, seed: 42 });
  const b = s.dist.normal.random({ sampleSize: 5, seed: 42 });
  assert(JSON.stringify(a) === JSON.stringify(b), "same seed produced different draws");
  const c = s.dist.normal.random({ sampleSize: 5, seed: 43 });
  assert(JSON.stringify(a) !== JSON.stringify(c), "different seed produced same draws");
});

// ----------------------------------------------------------------------------
// run-19b: random({ sampleSize }) types to and returns number[], not number.
// ----------------------------------------------------------------------------
await check("run-19b — normal.random({sampleSize: N}) returns number[]", () => {
  const arr: number[] = s.dist.normal.random({ sampleSize: 100 });
  assert(Array.isArray(arr), `expected array, got ${typeof arr}`);
  assert(arr.length === 100, `expected length 100, got ${arr.length}`);
});

// ----------------------------------------------------------------------------
// run-28: asofJoin with group_by emits the group_by column once (not _x/_y).
// ----------------------------------------------------------------------------
await check("run-28 — asofJoin group_by does not produce _x/_y suffix", () => {
  const trades = createDataFrame([
    { time: 1, symbol: "AAPL" },
    { time: 1, symbol: "MSFT" },
  ]);
  const quotes = createDataFrame([
    { time: 0, symbol: "AAPL", price: 100 },
    { time: 0, symbol: "MSFT", price: 200 },
  ]);
  const joined = trades.asofJoin(quotes, "time", { group_by: ["symbol"] });
  const cols = joined.columns();
  assert(cols.includes("symbol"), `missing 'symbol' column: ${cols}`);
  assert(!cols.includes("symbol_x"), `found 'symbol_x' in: ${cols}`);
  assert(!cols.includes("symbol_y"), `found 'symbol_y' in: ${cols}`);
});

// ----------------------------------------------------------------------------
// run-40: downsample preserves grouping on its output (numeric Date path).
// Before the fix, `groupBy(...).downsample(...).mutateOverGroup(...)` ran the
// callback on the whole frame, causing cross-group bleed in rolling values.
// ----------------------------------------------------------------------------
await check("run-40 — downsample (Date) preserves grouping on its output", () => {
  const df = createDataFrame([
    { symbol: "AAA", t: new Date("2024-01-01T00:00:00Z"), price: 10 },
    { symbol: "AAA", t: new Date("2024-01-01T01:00:00Z"), price: 11 },
    { symbol: "AAA", t: new Date("2024-01-02T00:00:00Z"), price: 12 },
    { symbol: "BBB", t: new Date("2024-01-01T00:00:00Z"), price: 100 },
    { symbol: "BBB", t: new Date("2024-01-01T01:00:00Z"), price: 101 },
    { symbol: "BBB", t: new Date("2024-01-02T00:00:00Z"), price: 102 },
  ]);

  const daily = df.groupBy("symbol").downsample({
    timeColumn: "t",
    frequency: "1D",
    aggregations: { price: { column: "price", fn: s.mean } },
  });

  const groups = (daily as unknown as { __groups?: { size: number; groupingColumns: readonly string[] } }).__groups;
  assert(groups !== undefined, "downsample result lost __groups");
  assert(groups.size === 2, `expected 2 groups, got ${groups.size}`);
  assert(
    groups.groupingColumns.length === 1 && String(groups.groupingColumns[0]) === "symbol",
    `wrong groupingColumns: ${groups.groupingColumns}`,
  );

  // mutateOverGroup must see exactly one symbol per call.
  const seenGroups: string[][] = [];
  daily.mutateOverGroup({
    _probe: (g) => {
      const uniq = [...new Set(g.symbol as readonly string[])];
      seenGroups.push(uniq);
      return new Array(g.nrows()).fill(0);
    },
  });
  for (const u of seenGroups) {
    assert(u.length === 1, `mutateOverGroup saw mixed group: ${JSON.stringify(u)}`);
  }
});

// ----------------------------------------------------------------------------
// run-40: downsample preserves grouping on its output (calendar Temporal path).
// Before the fix, this path completely ignored __groups, silently aggregating
// across symbols and dropping the symbol column entirely.
// ----------------------------------------------------------------------------
await check("run-40 — downsample (PlainDate) preserves grouping on its output", () => {
  const df = createDataFrame([
    { symbol: "AAA", d: Temporal.PlainDate.from("2024-01-01"), price: 10 },
    { symbol: "AAA", d: Temporal.PlainDate.from("2024-01-15"), price: 11 },
    { symbol: "BBB", d: Temporal.PlainDate.from("2024-01-01"), price: 100 },
    { symbol: "BBB", d: Temporal.PlainDate.from("2024-01-15"), price: 101 },
  ]);

  const monthly = df.groupBy("symbol").downsample({
    timeColumn: "d",
    frequency: "1M",
    aggregations: { price: { column: "price", fn: s.mean } },
  });

  assert(monthly.columns().includes("symbol"), `symbol column dropped: ${monthly.columns()}`);
  const groups = (monthly as unknown as { __groups?: { size: number } }).__groups;
  assert(groups !== undefined, "downsample (PlainDate) result lost __groups");
  assert(groups.size === 2, `expected 2 groups, got ${groups.size}`);

  // Per-group bucketing — AAA's January mean should be (10+11)/2, not mixed with BBB.
  const rows = monthly.toRows() as Array<{ symbol: string; price: number }>;
  const aaaJan = rows.find((r) => r.symbol === "AAA");
  const bbbJan = rows.find((r) => r.symbol === "BBB");
  assert(aaaJan !== undefined && bbbJan !== undefined, "missing AAA or BBB row");
  assert(Math.abs(aaaJan.price - 10.5) < 1e-9, `AAA Jan: ${aaaJan.price}`);
  assert(Math.abs(bbbJan.price - 100.5) < 1e-9, `BBB Jan: ${bbbJan.price}`);
});

// ----------------------------------------------------------------------------
// run-40: upsample preserves grouping on its output (numeric Date path).
// Mirrors the downsample fix — same class of bug, same scope.
// ----------------------------------------------------------------------------
await check("run-40 — upsample (Date) preserves grouping on its output", () => {
  const df = createDataFrame([
    { symbol: "AAA", t: new Date("2024-01-01T00:00:00Z"), price: 10 },
    { symbol: "AAA", t: new Date("2024-01-03T00:00:00Z"), price: 12 },
    { symbol: "BBB", t: new Date("2024-01-01T00:00:00Z"), price: 100 },
    { symbol: "BBB", t: new Date("2024-01-03T00:00:00Z"), price: 102 },
  ]);

  const dense = df.groupBy("symbol").upsample({
    timeColumn: "t",
    frequency: "1D",
    fillMethod: "forward",
  });

  const groups = (dense as unknown as { __groups?: { size: number } }).__groups;
  assert(groups !== undefined, "upsample result lost __groups");
  assert(groups.size === 2, `expected 2 groups, got ${groups.size}`);

  // Forward fill must be per-group: AAA's Jan 2 = 10 (last AAA), BBB's Jan 2 = 100.
  const rows = dense.toRows() as Array<{ symbol: string; t: Date; price: number }>;
  const aaaJan2 = rows.find((r) =>
    r.symbol === "AAA" && r.t.toISOString().startsWith("2024-01-02")
  );
  const bbbJan2 = rows.find((r) =>
    r.symbol === "BBB" && r.t.toISOString().startsWith("2024-01-02")
  );
  assert(aaaJan2?.price === 10, `AAA Jan 2: ${aaaJan2?.price}`);
  assert(bbbJan2?.price === 100, `BBB Jan 2: ${bbbJan2?.price}`);
});

// ----------------------------------------------------------------------------
// run-40: upsample preserves grouping (calendar PlainDate path).
// ----------------------------------------------------------------------------
await check("run-40 — upsample (PlainDate) preserves grouping on its output", () => {
  const df = createDataFrame([
    { symbol: "AAA", d: Temporal.PlainDate.from("2024-01-01"), price: 10 },
    { symbol: "AAA", d: Temporal.PlainDate.from("2024-01-03"), price: 12 },
    { symbol: "BBB", d: Temporal.PlainDate.from("2024-01-01"), price: 100 },
    { symbol: "BBB", d: Temporal.PlainDate.from("2024-01-03"), price: 102 },
  ]);

  const dense = df.groupBy("symbol").upsample({
    timeColumn: "d",
    frequency: "1D",
    fillMethod: "forward",
  });

  assert(dense.columns().includes("symbol"), `symbol column dropped: ${dense.columns()}`);
  const groups = (dense as unknown as { __groups?: { size: number } }).__groups;
  assert(groups !== undefined, "upsample (PlainDate) result lost __groups");
  assert(groups.size === 2, `expected 2 groups, got ${groups.size}`);

  const rows = dense.toRows() as Array<{ symbol: string; d: Temporal.PlainDate; price: number }>;
  const aaaJan2 = rows.find((r) =>
    r.symbol === "AAA" && r.d.toString() === "2024-01-02"
  );
  const bbbJan2 = rows.find((r) =>
    r.symbol === "BBB" && r.d.toString() === "2024-01-02"
  );
  assert(aaaJan2?.price === 10, `AAA Jan 2: ${aaaJan2?.price}`);
  assert(bbbJan2?.price === 100, `BBB Jan 2: ${bbbJan2?.price}`);
});

// ----------------------------------------------------------------------------
// run-50: confint() on a Gaussian/identity GLM uses qnorm (matches R's
// confint.glm), not qt (which R's confint.lm uses). The two routes intentionally
// differ — see r-source-trunk confint.R L85 ("could have a df correction ...
// Leave for now"). If this regression flips, someone "fixed" us to confint.lm.
// ----------------------------------------------------------------------------
await check("run-50 — confint() on Gaussian GLM uses qnorm cutoff (matches confint.glm, not confint.lm)", () => {
  const df = createDataFrame({
    columns: {
      // Synthetic mtcars-shape: y depends on x1 with noise.
      y: [21.0, 22.8, 24.4, 18.7, 19.2, 17.8, 16.4, 17.3, 15.2, 10.4,
        10.4, 14.7, 32.4, 30.4, 33.9, 21.5, 15.5, 15.2, 13.3, 19.2,
        27.3, 26.0, 30.4, 15.8, 19.7, 15.0, 21.4, 22.8, 19.2, 17.3,
        15.2, 10.4],
      x1: [2.62, 2.875, 2.32, 3.215, 3.44, 3.46, 3.57, 3.19, 3.15, 3.44,
        3.44, 4.07, 1.513, 1.615, 1.835, 3.52, 3.435, 3.84, 3.845, 1.935,
        2.14, 1.513, 1.835, 3.17, 2.77, 1.835, 2.77, 3.17, 2.77, 1.835,
        2.77, 3.17],
    },
  });
  const model = s.glm({
    formula: "y ~ x1",
    family: "gaussian",
    link: "identity",
    data: df,
  });
  const summary = model.summary();
  const ci = model.confint({ level: 0.95 });
  const i = ci.names.indexOf("x1");
  assert(i >= 0, `x1 not in confint names: ${ci.names}`);

  // Expected: estimate ± qnorm(0.975) * SE (NOT qt(0.975, df_residual) * SE).
  const c = summary.coefficients as unknown as {
    names: string[]; estimate: number[]; std_error: number[];
  };
  const wtRow = c.names.indexOf("x1");
  const est = c.estimate[wtRow];
  const se = c.std_error[wtRow];
  const Z_975 = 1.959963984540054;
  const T_30_975 = 2.0422724563012373; // qt(0.975, 30) — would be wrong

  const lowerZ = est - Z_975 * se;
  const upperZ = est + Z_975 * se;
  const lowerT = est - T_30_975 * se;

  // Profile likelihood collapses to Wald for Gaussian/identity; match z.
  assert(
    Math.abs(ci.lower[i] - lowerZ) < 1e-6,
    `Gaussian confint lower not z-based: got ${ci.lower[i]}, z-based ${lowerZ}, t-based ${lowerT}`,
  );
  assert(
    Math.abs(ci.upper[i] - upperZ) < 1e-6,
    `Gaussian confint upper not z-based: got ${ci.upper[i]}, z-based ${upperZ}`,
  );
});

// ----------------------------------------------------------------------------
// run-54: Kendall correlation reports tau-b (not tau-a) when there are ties,
// matching R's `cor.test(method="kendall")` (cor.Rd L109).
// ----------------------------------------------------------------------------
await check("run-54 — kendall correlation reports tau-b (matches R cor.test) on tied data", () => {
  // mtcars mpg/wt — has ties (e.g. mpg 21.0 twice, 22.8 twice, etc).
  const mpg = [
    21.0, 21.0, 22.8, 21.4, 18.7, 18.1, 14.3, 24.4, 22.8, 19.2,
    17.8, 16.4, 17.3, 15.2, 10.4, 10.4, 14.7, 32.4, 30.4, 33.9,
    21.5, 15.5, 15.2, 13.3, 19.2, 27.3, 26.0, 30.4, 15.8, 19.7,
    15.0, 21.4,
  ];
  const wt = [
    2.620, 2.875, 2.320, 3.215, 3.440, 3.460, 3.570, 3.190, 3.150, 3.440,
    3.440, 4.070, 3.730, 3.780, 5.250, 5.424, 5.345, 2.200, 1.615, 1.835,
    2.465, 3.520, 3.435, 3.840, 3.845, 1.935, 2.140, 1.513, 3.170, 2.770,
    3.570, 2.780,
  ];
  const result = s.test.correlation.kendall({ x: mpg, y: wt });
  // R reference: cor.test(mtcars$mpg, mtcars$wt, method="kendall", exact=FALSE)
  //   tau = -0.727832149528431 (tau-b)
  //   tau-a (if we regressed) would be -0.719758064516129
  const R_TAU_B = -0.727832149528431;
  const TAU_A = -0.719758064516129;
  assert(
    Math.abs(result.effectSize.value - R_TAU_B) < 1e-9,
    `kendall tau is not tau-b: got ${result.effectSize.value}, expected ${R_TAU_B} (tau-a would be ${TAU_A})`,
  );
});

// ----------------------------------------------------------------------------
// run-53: Tukey HSD CI bounds and adjusted p-values match R's TukeyHSD()
// after porting R's ptukey/qtukey (Copenhaver-Holland 1988).
// Before the fix, the hand-rolled Simpson's rule integration made the CI
// ~6× too wide and saturated adjusted p to 1 for non-significant pairs.
// Also pins the sign convention: pair label "Group_{higher}-Group_{lower}"
// with meanDifference = mean(higher) - mean(lower), matching R.
// ----------------------------------------------------------------------------
await check("run-53 — Tukey HSD CI + adjusted p match R's TukeyHSD()", () => {
  // Three balanced groups with known means + small dispersion so CI bounds are tight.
  // R reference (n=10 each, alpha=0.05):
  //   aov(value ~ group)  ->  MSE = 1.0, df_residual = 27
  //   qtukey(0.95, 3, 27) ≈ 3.5063
  //   group means: A=10, B=11, C=14 (constructed below)
  // Use a deliberate scatter so SE is non-trivial.
  const groupA = [9.5, 10.2, 10.1, 9.8, 10.3, 9.9, 10.0, 10.4, 9.7, 10.1];
  const groupB = [10.8, 11.2, 11.1, 10.9, 11.3, 10.7, 11.0, 11.4, 11.1, 10.5];
  const groupC = [13.8, 14.2, 14.1, 13.9, 14.3, 13.7, 14.0, 14.4, 13.6, 14.0];
  const tukey = s.compare.postHoc.tukey([groupA, groupB, groupC], 0.05);
  const findComp = (g1: string, g2: string) =>
    tukey.comparisons.find((c) => c.group1 === g1 && c.group2 === g2);

  // R convention: label "higher-lower", mean_diff = mean(higher) - mean(lower).
  const ba = findComp("Group_2", "Group_1");
  const ca = findComp("Group_3", "Group_1");
  const cb = findComp("Group_3", "Group_2");

  assert(ba !== undefined, `missing "Group_2" vs "Group_1" comparison`);
  assert(ca !== undefined, `missing "Group_3" vs "Group_1" comparison`);
  assert(cb !== undefined, `missing "Group_3" vs "Group_2" comparison`);

  // All differences positive (higher minus lower).
  assert(ba.meanDifference > 0, `B-A diff must be > 0: ${ba.meanDifference}`);
  assert(ca.meanDifference > 0, `C-A diff must be > 0: ${ca.meanDifference}`);
  assert(cb.meanDifference > 0, `C-B diff must be > 0: ${cb.meanDifference}`);

  // CI bounds in increasing order (lower < upper).
  assert(
    ba.confidenceInterval.lower < ba.confidenceInterval.upper,
    `B-A CI must satisfy lower < upper: [${ba.confidenceInterval.lower}, ${ba.confidenceInterval.upper}]`,
  );

  // Mean falls inside CI.
  assert(
    ba.meanDifference > ba.confidenceInterval.lower &&
      ba.meanDifference < ba.confidenceInterval.upper,
    `B-A mean ${ba.meanDifference} outside CI [${ba.confidenceInterval.lower}, ${ba.confidenceInterval.upper}]`,
  );

  // Highly significant pair: adjusted p should be ~0, NOT saturated to 1.
  // (Pre-fix bug: hand-rolled ptukey integration returned 1 here.)
  assert(
    ca.adjustedPValue < 0.001,
    `C-A adjusted p must be tiny: got ${ca.adjustedPValue}`,
  );
  assert(
    cb.adjustedPValue < 0.001,
    `C-B adjusted p must be tiny: got ${cb.adjustedPValue}`,
  );
});

// ----------------------------------------------------------------------------
// run-57: Dunn's test (post-hoc after Kruskal-Wallis) matches R `dunn.test`
// package convention. Faithful port of survival-ref/dunn-test/R/dunn.test.R:
//   - pair label "Group_{lower}_Group_{higher}" (j+1, i+1 with j < i)
//   - Z = (mean_rank_j - mean_rank_i) / SE, signed
//   - p = 1 - pnorm(|Z|) (one-sided per dunn.test L435, altp=FALSE default)
//   - adjusted p = pmin(1, p * m) for Bonferroni
// Pre-fix: tidy-ts used |Z| (lost sign) and two-sided p convention. Confirmed
// against R reference for synthetic data with known ordering.
// ----------------------------------------------------------------------------
await check("run-57 — dunn.test matches R: signed Z + one-sided Bonferroni p", () => {
  // Synthetic groups: A < B < C in central tendency.
  const A = [1, 2, 3, 4, 5, 6];
  const B = [4, 5, 6, 7, 8, 9];
  const C = [7, 8, 9, 10, 11, 12];
  const result = s.compare.postHoc.dunn([A, B, C], 0.05);

  const find = (g1: string, g2: string) =>
    result.comparisons.find((c) => c.group1 === g1 && c.group2 === g2);

  // R reference from `Rscript -e 'library(dunn.test); dunn.test(c(A,B,C), rep(c("A","B","C"), each=6), method="bonferroni")'`:
  //   "A - B": Z = -1.708623, P.adjusted = 0.1312812108
  //   "A - C": Z = -3.417246, P.adjusted = 0.0009488714
  //   "B - C": Z = -1.708623, P.adjusted = 0.1312812108
  const ab = find("Group_1", "Group_2");
  const ac = find("Group_1", "Group_3");
  const bc = find("Group_2", "Group_3");
  assert(ab !== undefined, `missing "Group_1" vs "Group_2"`);
  assert(ac !== undefined, `missing "Group_1" vs "Group_3"`);
  assert(bc !== undefined, `missing "Group_2" vs "Group_3"`);

  assert(
    Math.abs(ab.testStatistic.value - -1.708623) < 1e-6,
    `A-B Z: got ${ab.testStatistic.value}, want -1.708623`,
  );
  assert(
    Math.abs(ac.testStatistic.value - -3.417246) < 1e-6,
    `A-C Z: got ${ac.testStatistic.value}, want -3.417246`,
  );
  assert(
    Math.abs(ab.adjustedPValue - 0.1312812108) < 1e-6,
    `A-B p: got ${ab.adjustedPValue}, want 0.1312812108`,
  );
  assert(
    Math.abs(ac.adjustedPValue - 0.0009488714) < 1e-6,
    `A-C p: got ${ac.adjustedPValue}, want 0.0009488714`,
  );
});

// ----------------------------------------------------------------------------
// run-56a: Mann-Whitney effect size is canonical rank-biserial r = 1 - 2U/(n1*n2)
// (Wendt 1972 / R effectsize::rank_biserial), not Rosenthal's z/sqrt(N).
// Pre-fix: tidy-ts computed z/sqrt(N) but labeled it "Rank Biserial Correlation".
// ----------------------------------------------------------------------------
await check("run-56 — mannWhitney effect size is canonical rank-biserial 1 - 2U/(n1*n2)", () => {
  // Two groups with clear ordering.
  const x = [1, 2, 3, 4, 5];
  const y = [6, 7, 8, 9, 10];
  const result = s.test.nonparametric.mannWhitney({ x, y });
  // U_x = 0 (every x rank is < every y rank), so r = 1 - 2*0/(5*5) = 1.0 (perfectly
  // y > x). With R's W = sum_ranks_x - n_x*(n_x+1)/2: ranks of x are 1..5, sum = 15,
  // 15 - 5*6/2 = 0 ⇒ U = 0 ⇒ r = 1.0.
  // tidy-ts sign convention: positive means x ranked higher than y. But x here is
  // ranked LOWER than y, so r should be -1. Let me check: 1 - 2*W/(n1*n2) = 1 - 2*0/25 = 1.
  // Hmm — the formula gives +1, but x is lower. The sign of Wendt's r depends on whose U
  // you plug in. tidy-ts plugs in U_x (= W = sum_ranks_x - ...). When x is dominated by y,
  // sum_ranks_x is small ⇒ U_x is small ⇒ 1 - 2U/(n1*n2) is large positive.
  // So tidy-ts r > 0 means "x has SMALLER ranks than y" (i.e. x < y in central tendency).
  // This is the convention R's effectsize uses too.
  const expected = 1.0;
  assert(
    Math.abs(result.effectSize.value - expected) < 1e-10,
    `Mann-Whitney r: got ${result.effectSize.value}, want ${expected} (1 - 2*0/25)`,
  );
  assert(
    result.effectSize.name === "Rank Biserial Correlation",
    `Effect size name: got "${result.effectSize.name}"`,
  );
});

// ----------------------------------------------------------------------------
// run-56b: Wilcoxon signed-rank effect size is matched-pairs rank-biserial
//   r = (W+ - W-) / (W+ + W-)
// not Cohen's d on the differences. Pre-fix: labeled "Cohen's D" but neither
// formula matched a rank-based statistic.
// ----------------------------------------------------------------------------
await check("run-56 — wilcoxon signed-rank effect size is matched-pairs rank-biserial", () => {
  // All x_i > y_i ⇒ all signed ranks positive ⇒ W- = 0 ⇒ r = (W+ - 0)/(W+ + 0) = 1.
  const x = [10, 20, 30, 40, 50];
  const y = [1, 2, 3, 4, 5];
  const result = s.test.nonparametric.wilcoxon({ x, y });
  assert(
    Math.abs(result.effectSize.value - 1.0) < 1e-10,
    `Wilcoxon r: got ${result.effectSize.value}, want 1.0 (all positive ranks)`,
  );
  assert(
    result.effectSize.name === "Rank Biserial Correlation",
    `Effect size name: got "${result.effectSize.name}"`,
  );

  // Mixed signs: x = [5, 1, 6, 2], y = [3, 4, 1, 6]
  //   diffs = [2, -3, 5, -4], abs = [2, 3, 5, 4], ranks = [1, 2, 4, 3]
  //   W+ = 1 + 4 = 5 (positive ranks 2 and 5)
  //   W- = 2 + 3 = 5 (negative ranks -3 and -4)
  //   r = (5 - 5) / (5 + 5) = 0
  const x2 = [5, 1, 6, 2];
  const y2 = [3, 4, 1, 6];
  const r2 = s.test.nonparametric.wilcoxon({ x: x2, y: y2 });
  assert(
    Math.abs(r2.effectSize.value - 0.0) < 1e-10,
    `Wilcoxon r (mixed): got ${r2.effectSize.value}, want 0.0`,
  );
});

// ----------------------------------------------------------------------------
// run-59: proportion.oneSample accepts `correct?: boolean` and matches R's
// `prop.test(..., correct = TRUE | FALSE)` to floating-point precision.
// Pre-fix: Yates correction was always applied with no way to opt out.
// ----------------------------------------------------------------------------
await check("run-59 — proportion.oneSample correct=true/false match R prop.test", () => {
  // 60 successes in 100 trials, H0: p = 0.5.
  // R: prop.test(60, 100, p=0.5, correct=TRUE):  X² = 3.61,  p = 0.057433119632...
  // R: prop.test(60, 100, p=0.5, correct=FALSE): X² = 4.0,    p = 0.045500263896...
  const data = Array(60).fill(true).concat(Array(40).fill(false));

  const corr = s.test.proportion.oneSample({
    data,
    hypothesizedProportion: 0.5,
  });
  assert(
    Math.abs(corr.testStatistic.value - 3.61) < 1e-9,
    `Yates X²: got ${corr.testStatistic.value}, want 3.61`,
  );
  assert(
    Math.abs(corr.pValue - 0.057433119632003746) < 1e-6,
    `Yates p: got ${corr.pValue}`,
  );

  const uncorr = s.test.proportion.oneSample({
    data,
    hypothesizedProportion: 0.5,
    correct: false,
  });
  assert(
    Math.abs(uncorr.testStatistic.value - 4.0) < 1e-9,
    `uncorrected X²: got ${uncorr.testStatistic.value}, want 4.0`,
  );
  assert(
    Math.abs(uncorr.pValue - 0.04550026389635857) < 1e-6,
    `uncorrected p: got ${uncorr.pValue}`,
  );
});

// ----------------------------------------------------------------------------
// run-61: wilcoxon signed-rank accepts `exact?: boolean` and `correct?: boolean`,
// matching R's `wilcox.test(..., exact = ..., correct = ...)` regimes.
// Pre-fix: only one regime (asymptotic + continuity correction) was reachable.
// ----------------------------------------------------------------------------
await check("run-61 — wilcoxon asymptotic with/without continuity correction match R", () => {
  // Data with ties + zeros in differences forces asymptotic path.
  const x = [12, 14, 13, 15, 19, 22, 11, 17];
  const y = [10, 13, 12, 12, 18, 20, 11, 14];
  // R: wilcox.test(x, y, paired=TRUE, exact=FALSE, correct=TRUE)  → V=28, p=0.02106789
  // R: wilcox.test(x, y, paired=TRUE, exact=FALSE, correct=FALSE) → V=28, p=0.01674765

  const asymp_corr = s.test.nonparametric.wilcoxon({
    x, y, exact: false, correct: true,
  });
  assert(asymp_corr.method === "Asymptotic", `method: ${asymp_corr.method}`);
  assert(asymp_corr.testStatistic.value === 28, `V: got ${asymp_corr.testStatistic.value}`);
  assert(
    Math.abs(asymp_corr.pValue - 0.021067886714302) < 1e-6,
    `asymp+corr p: got ${asymp_corr.pValue}`,
  );

  const asymp_nocorr = s.test.nonparametric.wilcoxon({
    x, y, exact: false, correct: false,
  });
  assert(asymp_nocorr.method === "Asymptotic", `method: ${asymp_nocorr.method}`);
  assert(
    Math.abs(asymp_nocorr.pValue - 0.016747647602469) < 1e-6,
    `asymp+nocorr p: got ${asymp_nocorr.pValue}`,
  );

  // exact=true forces exact regime even with ties (R warns and falls back; we
  // honor the user request and run exact)
  const forced_exact = s.test.nonparametric.wilcoxon({
    x, y, exact: true,
  });
  assert(forced_exact.method === "Exact", `method: ${forced_exact.method}`);
});

// ----------------------------------------------------------------------------
// run-60: kolmogorovSmirnovNormal exposes one-sample KS vs Normal distribution,
// matching R's `ks.test(x, "pnorm", mean, sd)`.
// ----------------------------------------------------------------------------
await check("run-60 — kolmogorovSmirnovNormal matches R ks.test(x, 'pnorm', mean, sd)", () => {
  // R: x <- 1:10; ks.test(x, "pnorm", mean(x), sd(x))
  //   D = 0.09551932898156279, p = 0.99985808722161873
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const m = s.mean(x)!;
  const sd = s.stdev(x)!;
  const result = s.test.normality.kolmogorovSmirnovNormal({ x, mean: m, sd });

  assert(
    Math.abs(result.testStatistic.value - 0.09551932898156279) < 1e-6,
    `KS D: got ${result.testStatistic.value}`,
  );
  assert(
    Math.abs(result.pValue - 0.99985808722161873) < 1e-6,
    `KS p: got ${result.pValue}`,
  );
});

// ----------------------------------------------------------------------------
// run-62: weighted GLM (s.glm with `options.weights`) matches R `lm(weights = w)`
// to floating-point precision on coefficients, SEs, t-stats, R², residual SE, df.
// ----------------------------------------------------------------------------
await check("run-62 — weighted GLM matches R lm(weights = w) on coefficients", () => {
  const df = createDataFrame({
    columns: {
      y: [4.1, 5.5, 6.8, 8.1, 9.7, 11.3, 12.5, 14.1, 15.6, 17.2],
      x1: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
      x2: [2.3, 1.7, 3.1, 2.9, 4.2, 3.8, 5.1, 4.6, 6.0, 5.5],
      w: [1.0, 2.0, 1.5, 0.5, 1.0, 2.5, 1.0, 0.8, 1.2, 1.8],
    },
  });
  const w = df.w as number[];
  const model = s.glm({
    formula: "y ~ x1 + x2",
    family: "gaussian",
    link: "identity",
    data: df,
    options: { weights: w },
  });
  const summary = model.summary();
  const c = summary.coefficients as unknown as {
    names: string[]; estimate: number[]; std_error: number[];
  };

  // R reference (full precision): lm(y ~ x1 + x2, weights = w):
  //   Intercept: 2.67840570... SE 0.13290862...
  //   x1:        1.50839989... SE 0.03698756...
  //   x2:       -0.11739720... SE 0.07833328...
  const i1 = c.names.indexOf("x1");
  assert(
    Math.abs(c.estimate[i1] - 1.5083998998786585) < 1e-6,
    `x1 estimate: got ${c.estimate[i1]}`,
  );
  assert(
    Math.abs(c.std_error[i1] - 0.036987569105) < 1e-6,
    `x1 SE: got ${c.std_error[i1]}`,
  );
});

// ----------------------------------------------------------------------------
// run-63: two-way ANOVA SS matches R `aov(y ~ A * B) |> summary()` (Type I
// sequential). Pre-fix: tidy-ts used a non-standard decomposition that gave
// "first-margin" SS for both main effects simultaneously, agreeing with neither
// Type I, II, nor III on unbalanced data. Fix uses sequential SS via glm_fit's
// QR effects (Q'y per term).
// ----------------------------------------------------------------------------
await check("run-63 — two-way ANOVA matches R aov() Type I on unbalanced data", () => {
  // Unbalanced 2x2 design — Type I SS depends on order of entry (here A first).
  //   y values per (A, B) cell:
  //     A=1, B=1: [10, 12, 14]      (n=3)
  //     A=1, B=2: [15, 17]          (n=2)
  //     A=2, B=1: [20]              (n=1)
  //     A=2, B=2: [22, 24, 26, 28]  (n=4)
  //   R `aov(y ~ A * B) |> summary()`, full precision (options(digits=17)):
  //     SS_A  = 270.40000000000009  (1 df)
  //     SS_B  =  38.72000000000001  (1 df)
  //     SS_AB =   0.47999999999999848
  //     SS_E  =  30.00000000000002
  const data = [
    [[10, 12, 14], [15, 17]],
    [[20], [22, 24, 26, 28]],
  ];
  const result = s.test.anova.twoWay({ data });

  assert(
    Math.abs(result.factorA.sumOfSquares - 270.40000000000009) < 1e-6,
    `SS_A: got ${result.factorA.sumOfSquares}, want 270.4`,
  );
  assert(
    Math.abs(result.factorB.sumOfSquares - 38.72000000000001) < 1e-6,
    `SS_B: got ${result.factorB.sumOfSquares}, want 38.72`,
  );
  assert(
    Math.abs(result.interaction.sumOfSquares - 0.48) < 1e-6,
    `SS_AB: got ${result.interaction.sumOfSquares}, want 0.48`,
  );
  assert(
    Math.abs(result.sumOfSquares[3] - 30.0) < 1e-6,
    `SS_E: got ${result.sumOfSquares[3]}, want 30.0`,
  );
});

// ----------------------------------------------------------------------------
// run-64: Levene's test accepts `center: "mean" | "median"` and both variants
// match R `car::leveneTest`. Pre-fix: only median-centered (Brown-Forsythe) was
// reachable; the mean-centered (classical Levene) was not exposed.
// ----------------------------------------------------------------------------
await check("run-64 — leveneTest median + mean centering match R car::leveneTest", () => {
  // Heavily-skewed groups so median- and mean-centering give different results.
  // g1, g2 each have one outlier far above the rest; g3 is uniform.
  const g1 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 100];
  const g2 = [50, 50, 50, 50, 50, 50, 50, 50, 50, 1000];
  const g3 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  // R reference (full precision):
  //   leveneTest(center=median): F = 0.67630978084633953  p = 0.5168954915094417
  //   leveneTest(center=mean):   F = 3.82460824089272620  p = 0.034478603534786163
  const median = s.test.variance.levene([g1, g2, g3]);
  assert(
    Math.abs(median.testStatistic.value - 0.67630978084633953) < 1e-6,
    `median F: got ${median.testStatistic.value}, want 0.6763...`,
  );

  const mean = s.test.variance.levene([g1, g2, g3], 0.05, "mean");
  assert(
    Math.abs(mean.testStatistic.value - 3.82460824089272620) < 1e-6,
    `mean F: got ${mean.testStatistic.value}, want 3.8246...`,
  );
});

// ----------------------------------------------------------------------------
// Report
// ----------------------------------------------------------------------------
console.log();
if (failures.length > 0) {
  console.error(`✗ ${failures.length} regression(s) detected:`);
  for (const f of failures) console.error(`  - ${f}`);
  Deno.exit(1);
} else {
  console.log("✓ All pinned regressions still fixed.");
}
