# Prettify<T> Type Instantiation Analysis

## Definition

```typescript
// packages/dataframe/ts/dataframe/types/utility-types.ts:10
export type Prettify<Type> = { [Key in keyof Type]: Type[Key] } & {};
```

Every instantiation creates a fresh anonymous mapped type (`__type` in trace data). These can't be cached by tsc because the `& {}` intersection makes each structurally unique. The profiling trace shows **8,826 `__type` anonymous instances** — Prettify is the primary factory.

## Scale

- **217 occurrences** across **50 files** in `packages/dataframe/ts/`
- Heaviest consumers by occurrence count:
  | File | Count |
  |------|-------|
  | mutate.types.ts | 30 |
  | filter.verb.ts | 15 |
  | dataframe.type.ts | 13 |
  | mutate.overloads.ts | 12 |
  | mutate-columns.verb.ts | 8 |
  | pivot.verb.ts | 6 |
  | core.types.ts (joins) | 6 |
  | asof-join.verb.ts | 6 |
  | method.types.ts (joins) | 5 |
  | pivot-types.ts | 5 |
  | left-join-parallel.verb.ts | 5 |
  | cross-join.verb.ts | 4 |
  | bind-rows types/verb | 4+3 |

## Double-Prettify Pattern (redundant wrapping)

Several `RowAfter*` types already apply `Prettify` in their definition. Wrapping them in another `Prettify<>` at the call site is redundant — `Prettify<Prettify<T>>` produces the same tooltip as `Prettify<T>` but creates an extra anonymous type per instantiation.

### Types that already contain Prettify internally

| Type | Definition | Location |
|------|-----------|----------|
| `RowAfterMutation<Row, A>` | `Prettify<Omit<Row, ...> & { ... }>` | mutate.types.ts:57-69 |
| `RowAfterFilter<Row>` | `Prettify<Row>` | filter.types.ts:50 |
| `RowAfterArrange<Row>` | `Prettify<Row>` | arrange.types.ts:11-13 |
| `RowAfterPivotLonger<...>` | `Prettify<...>` | pivot-types.ts:27-32 |

### Types that do NOT contain Prettify (outer Prettify is needed)

| Type | Definition | Location |
|------|-----------|----------|
| `InnerJoinResult<L, R, K>` | `L & Omit<R, K>` | result.types.ts:12-16 |
| `LeftJoinResult<L, R, K>` | `L & ExcludeKeysAndMakeUndefined<R, K>` | result.types.ts:22-26 |
| `RightJoinResult<L, R, K>` | `ExcludeKeysAndMakeUndefined<L, K> & R` | result.types.ts:32-36 |
| `FullJoinResult<L, R, K>` | `Pick<L, K> & ... & ...` | result.types.ts:42-49 |

### Redundant double-Prettify sites in mutate.types.ts

All 29 `Prettify<RowAfterMutation<...>>` in mutate.types.ts are redundant since `RowAfterMutation` already wraps in `Prettify`. These appear in two forms:

1. **Row type parameter**: `DataFrame<Prettify<RowAfterMutation<Row, Formulas>>>` → could be `DataFrame<RowAfterMutation<Row, Formulas>>`
2. **GroupName extraction**: `Extract<GroupName, keyof Prettify<RowAfterMutation<Row, Formulas>>>` → could be `Extract<GroupName, keyof RowAfterMutation<Row, Formulas>>`

The second form is especially wasteful — `keyof Prettify<T>` produces the same keys as `keyof T`, but forces tsc to first expand the Prettify mapped type just to extract its keys.

### Specific lines (all in mutate.types.ts)

```
Lines 228-229, 232-233  — Grouped async formulas (2× redundant)
Lines 279-280, 283-284  — Grouped async assignments (2× redundant)
Lines 331-332           — Ungrouped async formulas (1× redundant)
Lines 373-374           — Ungrouped async assignments (1× redundant)
Lines 426-427           — Grouped formulas + concurrency (2× redundant)
Lines 475-476           — Grouped assignments + concurrency (2× redundant)
Lines 523               — Ungrouped formulas + concurrency (1× redundant)
Lines 563               — Ungrouped assignments + concurrency (1× redundant)
Lines 609-610           — Grouped sync formulas (2× redundant)
Lines 655-656           — Grouped sync assignments (2× redundant)
Lines 706-707           — Grouped sync mixed (no scalars) (2× redundant)
Lines 752               — Ungrouped sync formulas (1× redundant)
Lines 792-793           — Ungrouped async with context (1× redundant)
Lines 839               — Ungrouped sync mixed (no scalars) (1× redundant)
Lines 878               — Ungrouped sync assignments fallback (1× redundant)
```

## Non-redundant Prettify sites (must keep)

These wrap types that are raw intersections without internal Prettify:

- **Join method.types.ts** (lines 94, 233, 317, 421, 524) — wrapping `InnerJoinResult`, `LeftJoinResult`, etc.
- **Join verb files** (outer-join.verb.ts:167, right-join.verb.ts:126, etc.) — wrapping join results
- **core.types.ts** (lines 46, 51, 58, 65, 74, 80) — `RowAfterInnerJoin` etc. definitions use Prettify on raw intersections
- **dataframe.type.ts** — method return types for verbs whose `RowAfter*` types don't internally prettify
- **Various verb files** — where the wrapped type is a raw `Pick`, `Omit`, or intersection

## Proposed change

Remove the outer `Prettify<>` from all `Prettify<RowAfterMutation<...>>` sites in mutate.types.ts (29 occurrences). This eliminates 29 redundant anonymous type instantiations per Row type parameter without any tooltip or API change, since `RowAfterMutation` already applies `Prettify`.

**Does NOT affect tooltips**: The user sees the same flattened object type because the inner `Prettify` in `RowAfterMutation` already does the work.

**Does NOT affect API**: Return types are structurally identical.

**Estimated impact**: mutate.types.ts contributes 1,310 anonymous types (from deep analysis). Removing the double-wrapping should reduce a meaningful fraction of those.
