# Mutate Async Detection: Complete Analysis

## The Problem

When `df.mutate()` is called with a formula whose return type is a **generic indexed access** (e.g., `T[K & keyof T]`), the result is typed as `PromisedDataFrame` instead of `DataFrame`. This is wrong — the formula is synchronous.

**Failing pattern** ([test-join.ts:33-36](packages/testing/bugs/test-join.ts#L33-L36)):
```typescript
function testMutateSelect<K2 extends string, T2 extends HasIdAndDate<K2>>(opts: {
  referenceDates: DataFrame<T2>;
  referenceFieldName: K2 & keyof T2;
}) {
  const anchors = opts.referenceDates
    .mutate({ _refDate: (r) => r[opts.referenceFieldName] })  // ← returns PromisedDataFrame (WRONG)
    .select("id", "_refDate");
}
```

**Consequences:**
- IDE shows `PromisedDataFrame` instead of `DataFrame` for sync code
- `.innerJoin(anchors, "id")` errors because `innerJoin` only accepts `DataFrame`, not `PromisedDataFrame` ([test-join.ts:192](packages/testing/bugs/test-join.ts#L192))
- Return type annotations fail — can't assign `PromisedDataFrame` to `DataFrame` ([test-join.test.ts:26](packages/testing/bugs/test-join.test.ts#L26))

**Current errors** (run `deno check --unstable-tsgo packages/testing/bugs/test-join.test.ts`):
1. Line 26: `PromisedDataFrame<...>` not assignable to `DataFrame<...>`
2. Line 192: `innerJoin(anchors, "id")` — no overload matches (PromisedDataFrame arg)
3. Line 216: `r._refDate` not found on InnerJoinResult (separate issue 6)

---

## How Mutate's Type System Works

The overload system lives in [mutate.types.ts:194-292](packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts#L194-L292).

### The 3-Tier Overload Pattern

TypeScript tries overloads top to bottom, picking the first that matches:

**Tier 1** — All-async detection ([mutate.types.ts:223-232](packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts#L223-L232)):
```typescript
<R extends object, Formulas extends Record<string, (row: R, ...) => Promise<any>>>(
  this: DataFrame<R>, formulas: Formulas,
): PromisedDataFrame<RowAfterMutation<R, Formulas>>;
```
Matches when **every** formula returns `Promise<any>`. Returns `PromisedDataFrame`.

**Tier 2** — All-sync detection ([mutate.types.ts:251-262](packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts#L251-L262)):
```typescript
<R extends object, Formulas extends Record<string, (row: R, ...) => unknown>>(
  this: DataFrame<R>, formulas: Formulas & AllSync<Formulas>,
): DataFrame<RowAfterMutation<R, Formulas>>;
```
Matches when `Formulas & AllSync<Formulas>` is satisfiable — i.e., no formula returns a Promise. Returns `DataFrame`.

**Tier 3** — Fallback ([mutate.types.ts:281-292](packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts#L281-L292)):
```typescript
<R extends object, Formulas extends Record<string, (row: R, ...) => unknown>>(
  this: DataFrame<R>, formulas: Formulas,
): PromisedDataFrame<RowAfterMutation<R, Formulas>>;
```
Catches everything tier 2 rejected (mixed sync+async). Returns `PromisedDataFrame`.

### The AllSync Gate

`AllSync` and `NotAPromise` are defined at [mutate.types.ts:114-130](packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts#L114-L130):

```typescript
type NotAPromise<T> = [Awaited<T>] extends [T] ? true : false;

type AllSync<F> = {
  [K in keyof F]: F[K] extends (...args: any[]) => infer R
    ? NotAPromise<R> extends true ? F[K] : never
    : F[K];
};
```

For each formula property:
- If the return type `R` is **not a Promise**, `NotAPromise<R>` = `true` → property passes through
- If the return type `R` **is a Promise**, `NotAPromise<R>` = `false` → property mapped to `never`

`Formulas & AllSync<Formulas>` then becomes unsatisfiable if any formula returns Promise, because `((r) => Promise<X>) & never` = `never`.

### How It Works for Concrete Types

| Call | Tier 1 | Tier 2 (AllSync) | Tier 3 | Result |
|------|--------|------------------|--------|--------|
| `{ x: (r) => r.val * 2 }` | ✗ (number ≠ Promise) | ✓ (NotAPromise\<number\> = true) | — | **DataFrame** ✅ |
| `{ x: async (r) => r.val * 2 }` | ✓ (Promise\<number\>) | — | — | **PromisedDataFrame** ✅ |
| `{ sync: (r) => ..., async: async (r) => ... }` | ✗ (not all async) | ✗ (async→never) | ✓ | **PromisedDataFrame** ✅ |
| `{ x: (r) => fetchData(r.id) }` (returns Promise) | ✓ (Promise\<string\>) | — | — | **PromisedDataFrame** ✅ |

All correct. The system works perfectly for concrete types.

---

## The Root Cause: Conditional Type Deferral

When the formula return type is a **generic indexed access** like `T[K & keyof T]`:

```typescript
df.mutate({ _refDate: (r) => r[opts.referenceFieldName] })
//                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                            Return type: T2[K2 & keyof T2]  (generic, unresolved)
```

TypeScript **cannot evaluate** `NotAPromise<T2[K2 & keyof T2]>`:

```typescript
type NotAPromise<T> = [Awaited<T>] extends [T] ? true : false;
//                     ^^^^^^^^^^^^^^^^^^^^^^^^^^
//   Awaited<T2[K2 & keyof T2]> — can't resolve, T2 is a type parameter
//   The entire conditional DEFERS — it's neither true nor false
```

Because `NotAPromise` defers, `AllSync<Formulas>` defers. Because `AllSync` defers, `Formulas & AllSync<Formulas>` is an unresolved intersection type. TypeScript can't confirm the argument matches tier 2, so it **skips** tier 2 and falls to tier 3 → `PromisedDataFrame`.

This is a known TypeScript limitation:
- [TS #36927](https://github.com/microsoft/TypeScript/issues/36927) — conditional types on generic params defer
- [TS #49946](https://github.com/microsoft/TypeScript/issues/49946) — `Awaited<T>` still extends Promise for generic T

Both marked "Working as Intended".

### Proof

[mutate-async-detection-proof.ts](packages/testing/bugs/mutate-async-detection-proof.ts) tests 5, 9, 10 prove deferral. Test 15 proves the bug end-to-end. All using isolated custom interfaces with string literal returns (`"DF"` / `"PDF"`) to avoid any interference from real DataFrame types.

---

## Every Alternative Explored

Each alternative is proven in [mutate-async-detection-proof.ts](packages/testing/bugs/mutate-async-detection-proof.ts) using isolated overload interfaces.

### 1. Remove AllSync (Section D, tests 17-21)

```
Tier 1: all-async → "PDF"
Tier 2: catch-all → "DF"
```

| Scenario | Result |
|----------|--------|
| Concrete sync | DF ✅ |
| All async | PDF ✅ |
| Mixed sync+async | **DF ❌** (should be PDF) |
| Implicit async | PDF ✅ |
| Generic sync | DF ✅ |

**Fixes generic sync. Breaks mixed.** Tier 2 is a catch-all that matches everything tier 1 doesn't, including mixed.

### 2. SyncReturn in Parameter Position (Section E, tests 22-26)

Instead of `AllSync` as a mapped type intersection, put the Awaited check directly on each formula in the parameter type:

```typescript
type SyncReturn<F> = F extends (...) => infer R
  ? [Awaited<R>] extends [R] ? F : never : F;

// Tier 2 param: { [K in keyof F]: SyncReturn<F[K]> }
```

| Scenario | Result |
|----------|--------|
| Concrete sync | DF ✅ |
| Mixed sync+async | PDF ✅ |
| Generic sync | **PDF ❌** |

**Identical behavior to AllSync.** The deferral comes from `[Awaited<R>] extends [R]`, not from where the check is placed. Moving it to the parameter position doesn't help.

### 3. Exclude\<unknown, PromiseLike\> (Section F, tests 27-31)

Constrain tier 2's return type to `Exclude<unknown, PromiseLike<any>>`:

```typescript
// Tier 2: (row: R) => Exclude<unknown, PromiseLike<any>>
```

**Dead on arrival.** `Exclude<unknown, PromiseLike<any>>` evaluates to `unknown`. It's a no-op. The constraint is identical to `=> unknown`, making tier 2 a catch-all. Same results as "Remove AllSync".

### 4. Extra Tier Between AllSync and Fallback (Section G, tests 32-36)

```
Tier 1:   all-async → "PDF"
Tier 2:   AllSync   → "DF"   (catches concrete sync)
Tier 2.5: catch-all → "DF"   (catches generic sync)
Tier 3:   catch-all → "PDF"  (catches mixed)
```

| Scenario | Result |
|----------|--------|
| Concrete sync | DF ✅ |
| All async | PDF ✅ |
| Mixed sync+async | **DF ❌** |
| Generic sync | DF ✅ |

**Tier 3 is dead code.** Tiers 2.5 and 3 have identical parameter signatures. TypeScript always picks the first matching overload → tier 2.5 catches everything tier 2 doesn't, including mixed. Tier 3 never fires.

---

## The Fundamental Constraint

Every approach to distinguish sync from async must inspect the formula's return type. Every inspection mechanism available in TypeScript — `extends Promise<any>`, `[Awaited<T>] extends [T]`, structural `.then` check — is a **conditional type**. All conditional types **defer** on generic type parameters.

This means:
- Any constraint that **blocks** async in tier 2 (AllSync, SyncReturn) also blocks generics → generic sync falls to fallback → PromisedDataFrame
- Any constraint that **lets through** generics in tier 2 (no AllSync, Exclude, extra tier) also lets through mixed → mixed gets DataFrame

**No overload parameter constraint in TypeScript can distinguish "generic sync return `T[K]`" from "concrete async return `Promise<X>`".**

---

## Files Reference

| File | Purpose |
|------|---------|
| [mutate.types.ts](packages/dataframe/ts/verbs/transformation/mutate/mutate.types.ts) | The 3-tier overload system (lines 194-292) |
| [mutate-async-detection-proof.ts](packages/testing/bugs/mutate-async-detection-proof.ts) | 39-test proof covering all alternatives |
| [test-join.ts](packages/testing/bugs/test-join.ts) | Original failing patterns (issues 5 and 6) |
| [test-join.test.ts](packages/testing/bugs/test-join.test.ts) | Runtime tests showing the 3 type errors |
| [testing-types.test.ts](packages/testing/bugs/testing-types.test.ts) | Type-level tests (passes but doesn't check return type wrapper) |
| [error-handling.types.test.ts](packages/dataframe/ts/promised-dataframe/error-handling.types.test.ts) | Mixed async type test (line 301) |

---

## What's Next

A solution must work **around** the conditional type deferral, not through it. The proof file shows that no overload-parameter-based approach can solve this within TypeScript's type system as it exists today. A different architectural approach is needed.
