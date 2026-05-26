---
name: dataframe-reshaping
description: pivotLonger, pivotWider, transpose, unnest, bindRows, concatDataFrames — reshape rows ↔ columns and stack DataFrames.
metadata:
  tags: dataframe, pivot, reshape, unnest, bindRows, transpose
---

# Reshaping

## pivotLonger (wide → long)

Field names are **camelCase** (`namesTo`, `valuesTo`).

```typescript
df.pivotLonger({
  cols: ["math", "science", "english"],
  namesTo: "subject",
  valuesTo: "score",
});
```

## pivotWider (long → wide)

Field names are **camelCase** (`namesFrom`, `valuesFrom`, `expectedColumns`). Provide `expectedColumns` to get a statically-typed result — omit it and the result is `Record<string, unknown>`.

```typescript
df.pivotWider({
  namesFrom: "product",
  valuesFrom: "sales",
  expectedColumns: ["Widget A", "Widget B"],
});

// Get expectedColumns dynamically:
df.pivotWider({
  namesFrom: "product",
  valuesFrom: "sales",
  expectedColumns: s.unique(df.product),
});
```

## transpose

`transpose` is the **reversible row↔column flip**. It is *not* the right verb for "make one column's values into the new column headers" — for that, use `pivotLonger` → `pivotWider`.

To drive the output column names from a key column, call `setRowLabels` first; otherwise `transpose` falls back to generic `row_0`, `row_1`, … names. Two bookkeeping columns (a `ROW_LABEL` symbol column carrying the original column names, and a `ROW_TYPES` metadata column) are added so a second `transpose` round-trips back to the original shape — drop them at the end if you want a clean result.

```typescript
const summary = createDataFrame([
  { site: "Site-A", mean: 12, min: 10, max: 14 },
  { site: "Site-B", mean: 21, min: 20, max: 22 },
]);

// Drive output column names from the "site" column.
const flipped = summary
  .setRowLabels(summary.site)
  .transpose({ numberOfRows: 2 }); // current row count (needed for typing)

// flipped now has one row per original column (mean, min, max) and
// one column per site (Site-A, Site-B), plus internal __tidy_row_label__ /
// __tidy_row_types__ bookkeeping columns used to make transpose reversible.

// Flip back: a second transpose returns to the row-per-site shape.
const unflipped = flipped.transpose({ numberOfRows: 4 });
```

`numberOfRows` must be a **literal** number (e.g., `2`, not `summary.nrows()`) because it's used as a const-generic for column-type generation. Pass the row count you know at compile time.

Rule of thumb:

- **Reshape rows ↔ columns symmetrically** (e.g., flip a summary table for display): `setRowLabels` → `transpose`.
- **Promote a column's values to new column headers** (e.g., long → wide): `pivotWider`.
- **Demote columns to rows** (wide → long): `pivotLonger`.

## unnest (explode array column)

Each element of an array column becomes its own row, with other columns duplicated. Type-safe: only array columns compile.

```typescript
const df = createDataFrame([
  { id: 1, tags: ["admin", "user"] },
  { id: 2, tags: ["user"] },
  { id: 3, tags: [] },
]);

df.unnest("tags");
// { id: 1, tags: "admin" }
// { id: 1, tags: "user" }
// { id: 2, tags: "user" }
// { id: 3, tags: null }   ← empty arrays preserve the row with null
```

Chain `unnest` calls to flatten nested arrays:

```typescript
const nested = createDataFrame([{ id: 1, matrix: [[1, 2], [3, 4]] }]);
nested.unnest("matrix").unnest("matrix");
```

## bindRows / concatDataFrames (vertical stack)

```typescript
df1.bindRows(df2, df3)                  // method form
concatDataFrames([df1, df2, df3])       // standalone — better when you have an array
```

Both handle different column sets — missing columns become `undefined` in the combined frame.

## Anti-patterns

- ❌ `unnest` on a non-array column — TypeScript will reject this; if you need to explode objects, `mutate` to extract the array first.
- ❌ `pivotWider` without `expectedColumns` — you lose static types (result becomes `Record<string, unknown>`).
- ❌ `names_from` / `values_from` / `expected_columns` (snake_case) — API is camelCase.
- ❌ Hand-stacking with `[...df1.toRows(), ...df2.toRows()]` — `bindRows` / `concatDataFrames` preserves columns and avoids row materialization.
