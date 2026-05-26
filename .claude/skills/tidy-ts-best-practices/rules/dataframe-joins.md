---
name: dataframe-joins
description: Joins — innerJoin, leftJoin, rightJoin, outerJoin, crossJoin, asofJoin. Non-matches are undefined (not null). Two overloads — string keys vs the { keys, suffixes } object form. WASM-backed.
metadata:
  tags: dataframe, joins, leftJoin, innerJoin, asofJoin, undefined
---

# Joins

All joins are WASM-backed hash joins (except `asofJoin`, which does nearest-key matching on a sorted column). Performance on 500K rows:

- `leftJoin`: 50ms (~8× faster than Arquero)
- `innerJoin`: 66ms (~4.5×)
- `outerJoin`: 99ms (~12.6×)

## Semantics

- Non-matches produce `undefined`, **not `null`**. `leftJoin` keeps all left rows; right-side non-key columns become `T | undefined` when no match.
- `rightJoin` mirrors that for the left side.
- `outerJoin` can leave either side undefined.
- `innerJoin` only emits matched rows, so no undefined from a missing partner.
- `Date` and `Temporal.*` values work as join keys.

## Two overloads

**Overload 1 — string keys** (column names match between DataFrames):

```typescript
df.innerJoin(other, "id")
df.leftJoin(other, ["region", "product"])
users.leftJoin(orders, "user_id", { suffixes: { left: "_user", right: "_order" } })
```

**Overload 2 — `{ keys, suffixes }` object form** (keys with different names):

```typescript
df.leftJoin(other, { keys: { left: "user_id", right: "id" } })

employees.leftJoin(departments, {
  keys: { left: "emp_dept", right: "dept_id" },
});

// Multi-key with different names + suffixes
salesData.leftJoin(targetsData, {
  keys: {
    left: ["sales_region", "sales_product", "sales_quarter"],
    right: ["target_region", "target_product", "target_quarter"],
  },
  suffixes: { left: "_actual", right: "_target" },
});
```

The object overload preserves literal suffix types on colliding column names in TypeScript.

## When to use `keys: { left, right }` vs `suffixes`

- **Different key column names** → use `keys: { left, right }`.
- **Same key names but other columns collide** (e.g. both have `quarter`) → use `suffixes`.

```typescript
// Same key, colliding non-key column:
const result = left.leftJoin(right, {
  keys: ["region", "product"],
  suffixes: { left: "_actual", right: "_target" },
});
// result columns: region, product, quarter_actual, quarter_target
```

**Both key columns appear in the result when names differ.** With `keys: { left: "emp_id", right: "employee_id" }`, the output has *both* `emp_id` and `employee_id`. Drop the redundant one downstream if you only want one:

```typescript
const out = employees
  .leftJoin(reviews, {
    keys: { left: "emp_id", right: "employee_id" },
  })
  .drop("employee_id");
```

## Chaining joins

```typescript
const summary = countsToJoin.reduce(
  (df, counts) => df.leftJoin(counts, "pat_id"),
  patients,
);
```

## Validate keys when dynamic

```typescript
const leftCols = left.columns();
const rightCols = right.columns();
if (!leftCols.includes(keyCol)) {
  throw new Error(`Left missing key "${keyCol}". Available: ${leftCols.join(", ")}`);
}
if (!rightCols.includes(keyCol)) {
  throw new Error(`Right missing key "${keyCol}". Available: ${rightCols.join(", ")}`);
}
```

## asofJoin (time-series)

Match each left row to the nearest right row on a sorted column. `direction` default is `'backward'` (match prior value). Use `tolerance` to cap how far to look; `group_by` to partition matches (e.g. by symbol).

```typescript
trades.asofJoin(quotes, "time", { direction: "backward" });
events.asofJoin(logs, "timestamp", { direction: "forward" });
trades.asofJoin(quotes, "time", { direction: "nearest", tolerance: 1000 });
trades.asofJoin(quotes, "time", { direction: "backward", group_by: ["symbol"] });
```

Data **must be sorted** on the `by` column.

## crossJoin (Cartesian)

Output is `left.nrows() × right.nrows()` — always pass `maxRows` when either side can be large.

```typescript
products.crossJoin(colors)
df1.crossJoin(df2, 10_000)                             // cap explosion
df1.crossJoin(df2, undefined, { left: "_a", right: "_b" })
```

**Common use: materialise every combination of two key sets** (analogous to dplyr's `complete()` / tidyr's `expand_grid()`). Build small DataFrames of the unique keys, `crossJoin` them, then `leftJoin` the observations:

```typescript
const employeeKeys = employees.select("emp_id", "name");
const years = createDataFrame({ columns: { year: [2022, 2023] } });

// 10 rows = 5 employees × 2 years, with every combination present
const grid = employeeKeys.crossJoin(years);

const enriched = grid.leftJoin(reviews, {
  keys: { left: ["emp_id", "year"], right: ["employee_id", "year"] },
});
```

## Anti-patterns

- ❌ Using `suffixes` when the key column names differ — use `keys: { left, right }` instead.
- ❌ Using `keys: { left, right }` purely to rename non-key columns — that's not its purpose.
- ❌ `crossJoin` two wide tables without `maxRows` — can exhaust memory.
- ❌ `asofJoin` on unsorted data, or expecting exact matches from it.
- ❌ Hand-written JS join loops on large data — WASM joins are 4-13× faster.
