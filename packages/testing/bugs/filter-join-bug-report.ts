/**
 * filter-join-bug-report.ts
 *
 * Bug: Joins on a filtered DataFrame ignore the filter and operate on the
 * original unfiltered data. The filter creates a view (bitmask), but the
 * hash-based join implementations read through to the underlying rows.
 *
 * Reproduction: filter a 3-row DataFrame down to 2 rows, then join with
 * another DataFrame. The join result includes the filtered-out row.
 *
 * Tested join types: innerJoin, leftJoin, rightJoin, outerJoin, asofJoin
 *
 * Additional bug found in rightJoin and outerJoin WITH filter:
 *   - rightJoin: When combined with filter, values from wrong rows are
 *     paired with wrong keys (e.g. id=1 gets value=20 instead of null).
 *   - outerJoin: Same scrambled row matching when filter is involved.
 *   On unfiltered data, rightJoin and outerJoin work correctly.
 *
 * Workarounds that FIX the bug (materialize the view first):
 *   - groupBy().summarize() → join: PASS (summarize creates a new DataFrame)
 *   - toArray() → createDataFrame() → join: PASS (explicit materialization)
 *   - rename() → join: PASS (rename appears to materialize)
 *
 * Operations that DO NOT fix the bug (view persists):
 *   - select() → join: BUG
 *   - mutate() → join: BUG
 *   - arrange() → join: BUG
 *   - sliceHead() → join: BUG
 *   - chained filter → join: BUG
 *   - filter on right side: BUG
 *   - filter on both sides: BUG
 *   - bindRows(filtered) → join: BUG (doubles the leaked rows!)
 *   - multi-key join with filter: BUG
 *   - 1-to-many join with filter: BUG (leaked rows get multiplied)
 */

import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// ── Setup ────────────────────────────────────────────────────────────────────

const base = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: 20 },
  { id: 3, value: 30 },
]);

// Filter out id=1. Result should only contain ids 2 and 3.
const filtered = base.filter((r) => r.id >= 2);

console.log("=== Base DataFrame ===");
base.print();

console.log("\n=== Filtered DataFrame (id >= 2) ===");
filtered.print();
console.log("nrows:", filtered.nrows());

// The other DataFrame to join with — has all 3 ids
const other = createDataFrame([
  { id: 1, label: "one" },
  { id: 2, label: "two" },
  { id: 3, label: "three" },
]);

// ══════════════════════════════════════════════════════════════════════════════
// BUG 1: filter() view ignored by hash-based joins
// ══════════════════════════════════════════════════════════════════════════════

// ── innerJoin ────────────────────────────────────────────────────────────────

console.log("\n=== innerJoin (filtered.innerJoin(other, 'id')) ===");
console.log("Expected: 2 rows (ids 2, 3)");
const innerResult = filtered.innerJoin(other, "id");
innerResult.print();
console.log(
  `Actual: ${innerResult.nrows()} rows — ${
    innerResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── leftJoin ─────────────────────────────────────────────────────────────────

console.log("\n=== leftJoin (filtered.leftJoin(other, 'id')) ===");
console.log("Expected: 2 rows (ids 2, 3)");
const leftResult = filtered.leftJoin(other, "id");
leftResult.print();
console.log(
  `Actual: ${leftResult.nrows()} rows — ${
    leftResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── rightJoin ────────────────────────────────────────────────────────────────

console.log("\n=== rightJoin (filtered.rightJoin(other, 'id')) ===");
console.log(
  "Expected: 3 rows (ids 1, 2, 3 — id=1 should have null value from left)",
);
const rightResult = filtered.rightJoin(other, "id");
rightResult.print();
// Right join keeps all rows from `other` (3 rows), so 3 rows is correct.
// But id=1's `value` column should be null/undefined since it was filtered out.
console.log("Checking id=1's value (should be null since filtered out):");
const rightIds = rightResult.extract("id");
const rightValues = rightResult.extract("value");
const rightLabels = rightResult.extract("label");
for (let i = 0; i < rightIds.length; i++) {
  console.log(
    `  row ${i}: id=${rightIds[i]}, value=${rightValues[i]}, label=${
      rightLabels[i]
    }`,
  );
}

// ── outerJoin ────────────────────────────────────────────────────────────────

console.log("\n=== outerJoin (filtered.outerJoin(other, 'id')) ===");
console.log(
  "Expected: 3 rows (ids 1, 2, 3 — id=1 should have null value from left)",
);
const outerResult = filtered.outerJoin(other, "id");
outerResult.print();
console.log("Checking id-value-label alignment:");
const outerIds = outerResult.extract("id");
const outerValues = outerResult.extract("value");
const outerLabels = outerResult.extract("label");
for (let i = 0; i < outerIds.length; i++) {
  console.log(
    `  row ${i}: id=${outerIds[i]}, value=${outerValues[i]}, label=${
      outerLabels[i]
    }`,
  );
}

// ── asofJoin ─────────────────────────────────────────────────────────────────

console.log("\n=== asofJoin (filtered on left side) ===");

const timeBase = createDataFrame([
  { ts: 1, event: "a" },
  { ts: 3, event: "b" },
  { ts: 5, event: "c" },
]);

// Filter out ts=1
const timeFiltered = timeBase.filter((r) => r.ts >= 3);

const timeOther = createDataFrame([
  { ts: 1, price: 100 },
  { ts: 2, price: 200 },
  { ts: 4, price: 300 },
  { ts: 6, price: 400 },
]);

console.log("Filtered time DataFrame (ts >= 3):");
timeFiltered.print();
console.log("Expected: 2 rows (ts 3, 5)");

const asofResult = timeFiltered.asofJoin(timeOther, "ts", {
  direction: "backward",
});
asofResult.print();
console.log(
  `Actual: ${asofResult.nrows()} rows — ${
    asofResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── Filter on RIGHT side of join ─────────────────────────────────────────────

console.log("\n=== innerJoin with filter on RIGHT side ===");
const otherFiltered = other.filter((r) => r.id >= 2);
console.log("Right side filtered (id >= 2):");
otherFiltered.print();
console.log("Expected: 2 rows (ids 2, 3)");
const rightFilteredResult = base.innerJoin(otherFiltered, "id");
rightFilteredResult.print();
console.log(
  `Actual: ${rightFilteredResult.nrows()} rows — ${
    rightFilteredResult.nrows() === 2
      ? "PASS"
      : "BUG: filtered-out rows reappeared"
  }`,
);

// ── Chained filter → filter → join ──────────────────────────────────────────

console.log("\n=== Chained: filter → filter → innerJoin ===");
const doubleFiltered = base.filter((r) => r.id >= 2).filter((r) =>
  r.value <= 20
);
console.log("Double-filtered (id >= 2 AND value <= 20):");
doubleFiltered.print();
console.log("Expected: 1 row (id=2, value=20)");
const chainResult = doubleFiltered.innerJoin(other, "id");
chainResult.print();
console.log(
  `Actual: ${chainResult.nrows()} rows — ${
    chainResult.nrows() === 1 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ══════════════════════════════════════════════════════════════════════════════
// BUG 2: rightJoin and outerJoin produce SCRAMBLED row matching
// These bugs exist EVEN WITHOUT filter() — they are separate issues.
// ══════════════════════════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(72));
console.log("BUG 2: rightJoin / outerJoin SCRAMBLED MATCHING (with filter)");
console.log("First: confirm they work correctly on UNFILTERED data.");
console.log(
  "Then: show they produce scrambled results when filter is involved.",
);
console.log("═".repeat(72));

// ── rightJoin on unfiltered data ─────────────────────────────────────────────

console.log("\n=== rightJoin on UNFILTERED data ===");
const leftDf = createDataFrame([
  { id: 1, left_val: "A" },
  { id: 2, left_val: "B" },
]);
const rightDf = createDataFrame([
  { id: 2, right_val: "X" },
  { id: 3, right_val: "Y" },
]);
console.log("Left:");
leftDf.print();
console.log("Right:");
rightDf.print();
console.log(
  "Expected rightJoin: id=2 → left_val=B, right_val=X; id=3 → left_val=null, right_val=Y",
);
const rj = leftDf.rightJoin(rightDf, "id");
rj.print();
const rjIds = rj.extract("id");
const rjLeftVals = rj.extract("left_val");
const rjRightVals = rj.extract("right_val");
for (let i = 0; i < rjIds.length; i++) {
  const id = rjIds[i];
  const lv = rjLeftVals[i];
  const rv = rjRightVals[i];
  const expected = id === 2
    ? lv === "B" && rv === "X"
    : id === 3
    ? (lv == null) && rv === "Y"
    : false;
  console.log(
    `  id=${id}, left_val=${lv}, right_val=${rv} — ${
      expected ? "PASS" : "BUG: values misaligned"
    }`,
  );
}

// ── outerJoin on unfiltered data ─────────────────────────────────────────────

console.log("\n=== outerJoin on UNFILTERED data ===");
console.log("Expected: id=1 → left_val=A, right_val=null");
console.log("          id=2 → left_val=B, right_val=X");
console.log("          id=3 → left_val=null, right_val=Y");
const oj = leftDf.outerJoin(rightDf, "id");
oj.print();
const ojIds = oj.extract("id");
const ojLeftVals = oj.extract("left_val");
const ojRightVals = oj.extract("right_val");
for (let i = 0; i < ojIds.length; i++) {
  const id = ojIds[i];
  const lv = ojLeftVals[i];
  const rv = ojRightVals[i];
  let expected = false;
  if (id === 1) expected = lv === "A" && rv == null;
  else if (id === 2) expected = lv === "B" && rv === "X";
  else if (id === 3) expected = lv == null && rv === "Y";
  console.log(
    `  id=${id}, left_val=${lv}, right_val=${rv} — ${
      expected ? "PASS" : "BUG: values misaligned"
    }`,
  );
}

// ── rightJoin with distinct values to show positional vs key-based ────────────

console.log("\n=== rightJoin with unique values per key (alignment test) ===");
const leftUnique = createDataFrame([
  { id: 10, color: "red" },
  { id: 20, color: "blue" },
  { id: 30, color: "green" },
]);
const rightUnique = createDataFrame([
  { id: 20, shape: "circle" },
  { id: 30, shape: "square" },
  { id: 40, shape: "triangle" },
]);
console.log("Left:");
leftUnique.print();
console.log("Right:");
rightUnique.print();
console.log("Expected: id=20 → color=blue, shape=circle");
console.log("          id=30 → color=green, shape=square");
console.log("          id=40 → color=null, shape=triangle");
const rjUnique = leftUnique.rightJoin(rightUnique, "id");
rjUnique.print();
const rjuIds = rjUnique.extract("id");
const rjuColors = rjUnique.extract("color");
const rjuShapes = rjUnique.extract("shape");
for (let i = 0; i < rjuIds.length; i++) {
  const id = rjuIds[i];
  const c = rjuColors[i];
  const sh = rjuShapes[i];
  let expected = false;
  if (id === 20) expected = c === "blue" && sh === "circle";
  else if (id === 30) expected = c === "green" && sh === "square";
  else if (id === 40) expected = c == null && sh === "triangle";
  console.log(
    `  id=${id}, color=${c}, shape=${sh} — ${
      expected ? "PASS" : "BUG: values misaligned"
    }`,
  );
}

// ── rightJoin WITH filter — scrambled matching ──────────────────────────────

console.log("\n=== rightJoin WITH FILTER — scrambled matching ===");
console.log(
  "Using the original filtered DataFrame (ids 2, 3) joined with other (ids 1, 2, 3):",
);
console.log("Expected: id=1 → value=null (filtered out), label=one");
console.log("          id=2 → value=20, label=two");
console.log("          id=3 → value=30, label=three");
console.log("Actual (from rightJoin output above):");
const rjFilteredIds = rightResult.extract("id");
const rjFilteredVals = rightResult.extract("value");
const rjFilteredLabels = rightResult.extract("label");
for (let i = 0; i < rjFilteredIds.length; i++) {
  const id = rjFilteredIds[i];
  const v = rjFilteredVals[i];
  const l = rjFilteredLabels[i];
  let expected = false;
  if (id === 1) expected = v == null && l === "one";
  else if (id === 2) expected = v === 20 && l === "two";
  else if (id === 3) expected = v === 30 && l === "three";
  console.log(
    `  id=${id}, value=${v}, label=${l} — ${
      expected ? "PASS" : "BUG: values misaligned"
    }`,
  );
}

// ── outerJoin WITH filter — scrambled matching ──────────────────────────────

console.log("\n=== outerJoin WITH FILTER — scrambled matching ===");
console.log("Expected: id=1 → value=null (filtered out), label=one");
console.log("          id=2 → value=20, label=two");
console.log("          id=3 → value=30, label=three");
console.log("Actual (from outerJoin output above):");
const ojFilteredIds = outerResult.extract("id");
const ojFilteredVals = outerResult.extract("value");
const ojFilteredLabels = outerResult.extract("label");
for (let i = 0; i < ojFilteredIds.length; i++) {
  const id = ojFilteredIds[i];
  const v = ojFilteredVals[i];
  const l = ojFilteredLabels[i];
  let expected = false;
  if (id === 1) expected = v == null && l === "one";
  else if (id === 2) expected = v === 20 && l === "two";
  else if (id === 3) expected = v === 30 && l === "three";
  console.log(
    `  id=${id}, value=${v}, label=${l} — ${
      expected ? "PASS" : "BUG: values misaligned"
    }`,
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADDITIONAL VARIANTS — probing which operations respect/break the view
// ══════════════════════════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(72));
console.log("ADDITIONAL VARIANTS — which operations respect the filter view?");
console.log("═".repeat(72));

// ── select() before join ────────────────────────────────────────────────────

console.log("\n=== filter → select() → innerJoin ===");
const selected = filtered.select("id", "value");
console.log("select() after filter:");
selected.print();
console.log("Expected: 2 rows (ids 2, 3)");
const selectResult = selected.innerJoin(other, "id");
selectResult.print();
console.log(
  `Actual: ${selectResult.nrows()} rows — ${
    selectResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── mutate() before join ────────────────────────────────────────────────────

console.log("\n=== filter → mutate() → innerJoin ===");
const mutated = filtered.mutate({ doubled: (r) => r.value * 2 });
console.log("mutate() after filter:");
mutated.print();
console.log("Expected: 2 rows (ids 2, 3)");
const mutateResult = mutated.innerJoin(other, "id");
mutateResult.print();
console.log(
  `Actual: ${mutateResult.nrows()} rows — ${
    mutateResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── groupBy().summarize() before join ───────────────────────────────────────

console.log("\n=== filter → groupBy().summarize() → innerJoin ===");
const grouped = filtered.groupBy("id").summarize({
  total: (group) => s.sum(group.value),
});
console.log("groupBy().summarize() after filter:");
grouped.print();
console.log("Expected: 2 rows (ids 2, 3)");
const groupResult = grouped.innerJoin(other, "id");
groupResult.print();
console.log(
  `Actual: ${groupResult.nrows()} rows — ${
    groupResult.nrows() === 2 ? "PASS" : "BUG persists after summarize"
  }`,
);

// ── materialize via toArray() + createDataFrame ─────────────────────────────

console.log(
  "\n=== Materialize: createDataFrame(filtered.toArray()) → innerJoin ===",
);
const materializedArr = filtered.toArray();
console.log("toArray() returned", materializedArr.length, "rows");
const materialized = createDataFrame(materializedArr);
console.log("Materialized DataFrame:");
materialized.print();
console.log("Expected: 2 rows (ids 2, 3)");
const materializeResult = materialized.innerJoin(other, "id");
materializeResult.print();
console.log(
  `Actual: ${materializeResult.nrows()} rows — ${
    materializeResult.nrows() === 2
      ? "PASS (materialization fixes it)"
      : "BUG persists even after materialization"
  }`,
);

// ── rename() before join ────────────────────────────────────────────────────

console.log("\n=== filter → rename() → innerJoin ===");
const renamed = filtered.rename({ value: "val" });
console.log("Renamed after filter:");
renamed.print();
const renameResult = renamed.innerJoin(other, "id");
renameResult.print();
console.log(
  `Actual: ${renameResult.nrows()} rows — ${
    renameResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── no-op filter (keeps all rows) ───────────────────────────────────────────

console.log("\n=== No-op filter (keeps all rows) → innerJoin ===");
const noopFiltered = base.filter(() => true);
console.log("No-op filtered:");
noopFiltered.print();
console.log("Expected: 3 rows (ids 1, 2, 3)");
const noopResult = noopFiltered.innerJoin(other, "id");
noopResult.print();
console.log(
  `Actual: ${noopResult.nrows()} rows — ${
    noopResult.nrows() === 3 ? "PASS" : "BUG: row count differs"
  }`,
);

// ── filter that removes ALL rows ────────────────────────────────────────────

console.log("\n=== Filter removes all rows → innerJoin ===");
const emptyFiltered = base.filter(() => false);
console.log("Empty filtered:");
emptyFiltered.print();
console.log("nrows:", emptyFiltered.nrows());
console.log("Expected: 0 rows after join");
const emptyResult = emptyFiltered.innerJoin(other, "id");
emptyResult.print();
console.log(
  `Actual: ${emptyResult.nrows()} rows — ${
    emptyResult.nrows() === 0 ? "PASS" : "BUG: all filtered-out rows reappeared"
  }`,
);

// ── filter AFTER join (control — should work) ───────────────────────────────

console.log("\n=== Control: join first, THEN filter ===");
const joinFirst = base.innerJoin(other, "id");
const filterAfter = joinFirst.filter((r) => r.id >= 2);
console.log("Expected: 2 rows (ids 2, 3)");
filterAfter.print();
console.log(
  `Actual: ${filterAfter.nrows()} rows — ${
    filterAfter.nrows() === 2 ? "PASS" : "BUG"
  }`,
);

// ── filter on BOTH sides of join ────────────────────────────────────────────

console.log("\n=== Filter on BOTH sides → innerJoin ===");
const leftFiltered = base.filter((r) => r.id >= 2); // ids 2, 3
const rightFiltered2 = other.filter((r) => r.id <= 2); // ids 1, 2
console.log("Left filtered (id >= 2):");
leftFiltered.print();
console.log("Right filtered (id <= 2):");
rightFiltered2.print();
console.log("Expected: 1 row (id=2 is the only overlap)");
const bothFilteredResult = leftFiltered.innerJoin(rightFiltered2, "id");
bothFilteredResult.print();
console.log(
  `Actual: ${bothFilteredResult.nrows()} rows — ${
    bothFilteredResult.nrows() === 1
      ? "PASS"
      : "BUG: filtered-out rows reappeared"
  }`,
);

// ── chain: buggy join → filter → join ───────────────────────────────────────

console.log("\n=== Chain: buggy join result → filter → second join ===");
const third = createDataFrame([
  { id: 1, extra: "x" },
  { id: 2, extra: "y" },
  { id: 3, extra: "z" },
]);
console.log("First join result (from filtered.innerJoin — already buggy):");
innerResult.print();
const secondJoin = innerResult.filter((r) => r.id >= 2).innerJoin(third, "id");
console.log("Second join after re-filtering the buggy result:");
secondJoin.print();
console.log(
  `Actual: ${secondJoin.nrows()} rows — ${
    secondJoin.nrows() === 2 ? "PASS" : "BUG compounds across joins"
  }`,
);

// ── extract() respects filter ───────────────────────────────────────────────

console.log("\n=== extract() on filtered DataFrame ===");
const extractedIds = filtered.extract("id");
console.log("filtered.extract('id'):", extractedIds);
console.log(
  `Length: ${extractedIds.length} — ${
    extractedIds.length === 2 ? "PASS (extract respects filter)" : "BUG"
  }`,
);

// ── arrange() before join ───────────────────────────────────────────────────

console.log("\n=== filter → arrange() → innerJoin ===");
const arranged = filtered.arrange("id", "desc");
console.log("arrange() after filter:");
arranged.print();
console.log("Expected: 2 rows (ids 3, 2 — descending)");
const arrangeResult = arranged.innerJoin(other, "id");
arrangeResult.print();
console.log(
  `Actual: ${arrangeResult.nrows()} rows — ${
    arrangeResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── sliceHead() before join ─────────────────────────────────────────────────

console.log("\n=== filter → sliceHead() → innerJoin ===");
const sliced = filtered.sliceHead(1);
console.log("sliceHead(1) after filter:");
sliced.print();
console.log("Expected: 1 row");
const sliceResult = sliced.innerJoin(other, "id");
sliceResult.print();
console.log(
  `Actual: ${sliceResult.nrows()} rows — ${
    sliceResult.nrows() === 1 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── bindRows() with filtered DataFrames ─────────────────────────────────────

console.log("\n=== bindRows() with filtered DataFrames → innerJoin ===");
const part1 = base.filter((r) => r.id === 2); // just id=2
const part2 = base.filter((r) => r.id === 3); // just id=3
console.log("part1 (id=2):");
part1.print();
console.log("part2 (id=3):");
part2.print();
const bound = part1.bindRows(part2);
console.log("bindRows result:");
bound.print();
console.log("Expected after join: 2 rows (ids 2, 3)");
const bindResult = bound.innerJoin(other, "id");
bindResult.print();
console.log(
  `Actual: ${bindResult.nrows()} rows — ${
    bindResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── Multi-key join with filter ──────────────────────────────────────────────

console.log("\n=== Multi-key join with filter ===");
const multiBase = createDataFrame([
  { a: 1, b: 10, val: "x" },
  { a: 1, b: 20, val: "y" },
  { a: 2, b: 10, val: "z" },
]);
const multiOther = createDataFrame([
  { a: 1, b: 10, info: "match1" },
  { a: 1, b: 20, info: "match2" },
  { a: 2, b: 10, info: "match3" },
]);
const multiFiltered = multiBase.filter((r) => r.a === 1); // rows with a=1 only
console.log("Filtered (a=1):");
multiFiltered.print();
console.log("Expected: 2 rows (a=1,b=10 and a=1,b=20)");
const multiResult = multiFiltered.innerJoin(multiOther, ["a", "b"]);
multiResult.print();
console.log(
  `Actual: ${multiResult.nrows()} rows — ${
    multiResult.nrows() === 2 ? "PASS" : "BUG: filtered-out rows reappeared"
  }`,
);

// ── 1-to-many join with filter (does it multiply leaked rows?) ──────────────

console.log("\n=== 1-to-many join with filter ===");
const oneToManyOther = createDataFrame([
  { id: 1, tag: "a" },
  { id: 1, tag: "b" },
  { id: 2, tag: "c" },
  { id: 3, tag: "d" },
  { id: 3, tag: "e" },
]);
console.log("Filtered left (ids 2, 3):");
filtered.print();
console.log("Right side (1-to-many):");
oneToManyOther.print();
console.log("Expected: 3 rows (id=2→tag=c, id=3→tag=d, id=3→tag=e)");
const oneToManyResult = filtered.innerJoin(oneToManyOther, "id");
oneToManyResult.print();
const otmIds = oneToManyResult.extract("id");
const otmTags = oneToManyResult.extract("tag");
console.log(
  `Actual: ${oneToManyResult.nrows()} rows — ${
    oneToManyResult.nrows() === 3 ? "PASS" : "BUG"
  }`,
);
for (let i = 0; i < otmIds.length; i++) {
  console.log(`  id=${otmIds[i]}, tag=${otmTags[i]}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ══════════════════════════════════════════════════════════════════════════════

console.log("\n" + "═".repeat(72));
console.log("SUMMARY");
console.log("═".repeat(72));

console.log("\nBug 1: filter() view ignored by hash-based joins:");
console.log(
  `  innerJoin after filter:        ${innerResult.nrows()} rows (expected 2)`,
);
console.log(
  `  leftJoin after filter:         ${leftResult.nrows()} rows (expected 2)`,
);
console.log(
  `  asofJoin after filter:         ${asofResult.nrows()} rows (expected 2)`,
);
console.log(
  `  innerJoin filter on right:     ${rightFilteredResult.nrows()} rows (expected 2)`,
);
console.log(
  `  chained filter → join:         ${chainResult.nrows()} rows (expected 1)`,
);
console.log(
  `  filter → select → join:        ${selectResult.nrows()} rows (expected 2)`,
);
console.log(
  `  filter → mutate → join:        ${mutateResult.nrows()} rows (expected 2)`,
);
console.log(
  `  filter → summarize → join:     ${groupResult.nrows()} rows (expected 2)`,
);
console.log(
  `  filter → toArray → new DF → join: ${materializeResult.nrows()} rows (expected 2)`,
);
console.log(
  `  filter → rename → join:        ${renameResult.nrows()} rows (expected 2)`,
);
console.log(
  `  no-op filter → join:           ${noopResult.nrows()} rows (expected 3)`,
);
console.log(
  `  empty filter → join:           ${emptyResult.nrows()} rows (expected 0)`,
);
console.log(
  `  join then filter (control):    ${filterAfter.nrows()} rows (expected 2)`,
);
console.log(
  `  filter BOTH sides → join:      ${bothFilteredResult.nrows()} rows (expected 1)`,
);
console.log(
  `  buggy join → filter → join:    ${secondJoin.nrows()} rows (expected 2)`,
);
console.log(
  `  filter → arrange → join:       ${arrangeResult.nrows()} rows (expected 2)`,
);
console.log(
  `  filter → sliceHead → join:     ${sliceResult.nrows()} rows (expected 1)`,
);
console.log(
  `  bindRows(filtered) → join:     ${bindResult.nrows()} rows (expected 2)`,
);
console.log(
  `  multi-key join with filter:    ${multiResult.nrows()} rows (expected 2)`,
);
console.log(
  `  1-to-many join with filter:    ${oneToManyResult.nrows()} rows (expected 3)`,
);
