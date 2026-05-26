---
name: dataframe-pipeline
description: Core DataFrame pipeline verbs — creation, mutate / transmute, arrange, distinct, rename, select/drop, filter, slice family, and extraction. Sync vs async split is enforced at the type level.
metadata:
  tags: dataframe, mutate, filter, select, arrange, distinct, slice, extract, transmute
---

# Pipeline verbs

All verbs return a new DataFrame; chaining is the norm. Verb categories below.

## Creating DataFrames

```typescript
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// From rows
const a = createDataFrame([{ name: "Alice", age: 30 }, { name: "Bob", age: 25 }]);

// From columns (no row materialization — preferred when you already have arrays)
const b = createDataFrame({ columns: { name: ["Alice", "Bob"], age: [30, 25] } });

// With Zod schema (passed as the second arg)
import { z } from "zod";
const schema = z.object({ name: z.string(), age: z.number() });
const c = createDataFrame([{ name: "Alice", age: 30 }], schema);

// Dynamic / unknown schema — last resort, loses type safety
const d = createDataFrame(userData, { no_types: true });
```

`zDataFrame({ x: z.number(), y: z.string() })` builds a Zod schema that parses columnar input `{ x: [1, 2], y: ["a", "b"] }` straight into a typed DataFrame.

## Mutate / transmute

`mutate` adds or transforms columns. Sync only — TypeScript rejects async functions.

```typescript
df.mutate({ revenue: (row) => row.price * row.quantity })
df.mutate({ status: ["Active", "Pending", "Active"] })  // per-row array
df.mutate({ tax_rate: () => 0.08 })                      // broadcast scalar
df.mutate({ removed: null })                              // clear column
```

For async formulas, use `mutateAsync`:

```typescript
await df.mutateAsync(
  { data: async (row) => await fetch(row.url).then((r) => r.json()) },
  { concurrency: 3 },
);
```

For grouped per-row column computation (returns one array per group), use `mutateOverGroup`:

```typescript
df.groupBy("symbol").mutateOverGroup({
  prev_price: (g) => s.lag(g.extract("price"), { defaultValue: 0 }),
});
```

## Arrange (sort)

```typescript
df.arrange("age")                                    // ascending
df.arrange("revenue", "desc")                        // descending
df.arrange("lastName", "firstName")                  // multi-key — primary then secondary
df.arrange(["category", "price"], ["asc", "desc"])   // multi-key with per-column directions
df.groupBy("category").arrange("price", "desc")      // sort within groups
```

WASM-backed; ~2.9× faster than Arquero on 500K rows.

## Distinct

```typescript
df.distinct("region")              // unique region values (returns only region column)
df.distinct("region", "product")   // unique region+product combos
df.groupBy("year").distinct("product")
```

## Rename / select / drop

```typescript
df.rename({ mass: "weight" })
df.rename({ name: "character_name", mass: "weight" })

df.select("name", "age")    // keep only these columns
df.drop("id", "temp_field") // remove these columns
```

## Filter

Sync only — TypeScript rejects async predicates.

```typescript
df.filter((row) => row.age > 25)
df.filter((row) => row.region === "North" && row.quantity > 10)
df.filter(boolMask)                           // boolean[] aligned to rows
df.filter((r): r is Row & { x: number } => r.x != null)  // type predicate
```

For async predicates, use `filterAsync`:

```typescript
await df.filterAsync(async (row) => (await lookup(row.id)).ok);
```

Chained filters combine BitSet masks with bitwise AND — multiple filters do not copy data.

## Slice (positional)

```typescript
df.slice({ start: 0, end: 10 })   // first 10 rows
df.slice({ start: 10 })           // skip first 10
df.slice({ step: 2 })             // every other row
```

## Slice variants

```typescript
df.sliceHead(3)                  // first n
df.sliceTail(2)                  // last n
df.sliceMax("hp", 3)             // top n by column
df.sliceMin("mpg", 2)            // bottom n
df.sliceSample(5, 42)            // n random rows (seeded)
df.groupBy("cyl").sliceMax("hp", 1)  // top 1 per group
```

## Extract (column → array)

Direct property access (`df.colName`) is preferred for reads — stats functions and hypothesis tests accept `readonly number[]`, so column access works directly. Use `extract` when you specifically need a mutable copy, or for positional / sampled / unique variants:

```typescript
const ages = df.extract("age");             // T[] (mutable copy)
const topName = df.sliceMax("score", 1).extractHead("name", 1);  // single value when n=1
const recent = df.arrange("date").extractTail("name", 2);        // array when n>1
const at = df.extractNth("name", 0);        // index access (or undefined)
const sample = df.extractSample("name", 3); // random sample
const distinct = df.extractUnique("category");  // [...new Set(...)]

// Stats accept readonly arrays — no extract needed:
s.mean(df.bodyMass);
s.test.t.oneSample({ data: df.bodyMass, mu: 0 });
s.test.correlation.pearson({ x: df.height, y: df.weight });
```

## Shape & introspection

```typescript
df.nrows()                          // number — row count
df.columns()                        // string[] — column names in current order
```

## Display

```typescript
df.print()                          // formatted table
df.print("Sales Analysis:")         // with title
const s = df.toString("Sales");     // same formatting as string
const rows = df.toRows();           // materialize as Row[] (respects filter mask)
```

**Anti-patterns:**
- `console.log(df)` / `console.log(df.toRows())` — use `print()`
- `df.toRows().map(r => r.col)` for column reads — use `df.col` or `df.extract("col")`
- `df.columnNames()` / `Object.keys(df.toRows()[0])` — use `df.columns()`

## Anti-patterns at a glance

- ❌ `df.toRows().filter(...)` — use `df.filter(...)` (BitSet, no copy)
- ❌ async function inside `mutate` / `filter` / `summarize` — use the `*Async` variant
- ❌ `df.groupBy("x").map(...)` — `groupBy` is not iterable; use `summarize` / `mutateOverGroup` / `sliceMax`
- ❌ `console.log(df)` — use `df.print()`
