/**
 * Issue 5 proof: mutate returns PromisedDataFrame for generic sync formulas
 *
 * Root cause: NotAPromise<T> (every variant tested — Awaited, extends Promise,
 * extends PromiseLike, structural .then check, reverse check) DEFERS for
 * generic indexed access types like T2[K2 & keyof T2]. This is a fundamental
 * TypeScript limitation — no conditional type on a generic type param resolves.
 * See /tmp/issue5-allsync-exploration.ts Part A for exhaustive proof.
 *
 * Because NotAPromise defers, AllSync<Formulas> defers, and
 * `Formulas & AllSync<Formulas>` doesn't match tier 2 → falls to tier 3 → PromisedDataFrame.
 *
 * Fix tested: Remove `& AllSync<Formulas>` from tier 2 constraint.
 * Result: Tier 2 becomes identical sig to tier 3 but returns DataFrame.
 * Overload resolution picks tier 2 first for EVERYTHING that doesn't match tier 1.
 *
 * RESULTS (removing AllSync from tier 2):
 * | Test                    | Before          | After           | Desired         |
 * |-------------------------|-----------------|-----------------|-----------------|
 * | 1. Generic sync         | PromisedDF      | DataFrame ✅    | DataFrame       |
 * | 2. Concrete sync        | DataFrame       | DataFrame ✅    | DataFrame       |
 * | 3. All async            | PromisedDF      | PromisedDF ✅   | PromisedDataFrame|
 * | 4. Single async         | PromisedDF      | PromisedDF ✅   | PromisedDataFrame|
 * | 5. Implicit async       | PromisedDF      | PromisedDF ✅   | PromisedDataFrame|
 * | 6. Mixed sync+async     | PromisedDF      | DataFrame ❌    | PromisedDataFrame|
 * | 7. Generic sync chain   | PromisedDF      | DataFrame ✅    | DataFrame       |
 * | 8a. anchors (T2-based)  | PromisedDF      | DataFrame ✅    | DataFrame       |
 * | 8b. eventDates (filter→) | PromisedDF     | PromisedDF ❌   | DataFrame       |
 *
 * Test 6 regresses: mixed sync+async mutate now returns DataFrame instead of
 * PromisedDataFrame. Tier 3 becomes dead code since tier 2 always matches first.
 *
 * Test 8b: eventDates still PromisedDataFrame because .filter() produces
 * DataFrame<{ [Key in keyof T]: T[Key] }> and the indexed access through that
 * mapped type has a different shape that still defers somewhere.
 */

import type {
  DataFrame,
  PromisedDataFrame,
} from "@tidy-ts/dataframe";

type HasIdAndDate<K extends string> = { id: string } & Record<K, Date>;
type HasIdDateAndCode<K extends string, C extends string> =
  { id: string } & Record<K, Temporal.PlainDateTime> & Record<C, string>;

// ══════════════════════════════════════════════════════════════════════════════
// Test 1: Generic sync formula (THE BUG)
// Current: returns PromisedDataFrame (WRONG)
// Expected: returns DataFrame
// ══════════════════════════════════════════════════════════════════════════════
function test1_genericSync<K2 extends string, T2 extends HasIdAndDate<K2>>(
  df: DataFrame<T2>,
  fieldName: K2 & keyof T2,
) {
  const result = df.mutate({ _refDate: (r) => r[fieldName] });
  return result;
}
void test1_genericSync;

// ══════════════════════════════════════════════════════════════════════════════
// Test 2: Concrete sync formula
// Should return DataFrame (works today)
// ══════════════════════════════════════════════════════════════════════════════
function test2_concreteSync(df: DataFrame<{ id: string; value: number }>) {
  const result = df.mutate({ doubled: (r) => r.value * 2 });
  return result;
}
void test2_concreteSync;

// ══════════════════════════════════════════════════════════════════════════════
// Test 3: All-async formula
// Should return PromisedDataFrame
// ══════════════════════════════════════════════════════════════════════════════
function test3_allAsync(df: DataFrame<{ id: string; value: number }>) {
  const result = df.mutate({
    fetched: async (r) => await Promise.resolve(r.id),
    other: async (r) => await Promise.resolve(r.value),
  });
  return result;
}
void test3_allAsync;

// ══════════════════════════════════════════════════════════════════════════════
// Test 4: Single async formula
// Should return PromisedDataFrame
// ══════════════════════════════════════════════════════════════════════════════
function test4_singleAsync(df: DataFrame<{ id: string; value: number }>) {
  const result = df.mutate({
    fetched: async (r) => await Promise.resolve(r.id),
  });
  return result;
}
void test4_singleAsync;

// ══════════════════════════════════════════════════════════════════════════════
// Test 5: Implicit async (non-async fn returning Promise)
// Should return PromisedDataFrame
// ══════════════════════════════════════════════════════════════════════════════
function test5_implicitAsync(df: DataFrame<{ id: string; value: number }>) {
  const fetchData = (id: string): Promise<string> => Promise.resolve(id);
  const result = df.mutate({
    fetched: (r) => fetchData(r.id),
  });
  return result;
}
void test5_implicitAsync;

// ══════════════════════════════════════════════════════════════════════════════
// Test 6: Mixed sync+async
// Should return PromisedDataFrame (KNOWN RISK with two-tier)
// ══════════════════════════════════════════════════════════════════════════════
function test6_mixed(df: DataFrame<{ id: string; value: number }>) {
  const result = df.mutate({
    doubled: (r) => r.value * 2,
    fetched: async (r) => await Promise.resolve(r.id),
  });
  return result;
}
void test6_mixed;

// ══════════════════════════════════════════════════════════════════════════════
// Test 7: Generic sync → .select() chain
// Should return DataFrame (not PromisedDataFrame)
// ══════════════════════════════════════════════════════════════════════════════
function test7_genericSyncChain<K2 extends string, T2 extends HasIdAndDate<K2>>(
  df: DataFrame<T2>,
  fieldName: K2 & keyof T2,
) {
  const result = df
    .mutate({ _refDate: (r) => r[fieldName] })
    .select("id", "_refDate");
  return result;
}
void test7_genericSyncChain;

// ══════════════════════════════════════════════════════════════════════════════
// Test 8: Full pattern from test-join.ts issue 5
// ══════════════════════════════════════════════════════════════════════════════
function test8_fullPattern<
  K extends string, C extends string,
  T extends HasIdDateAndCode<K, C>,
  K2 extends string, T2 extends HasIdAndDate<K2>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  referenceDates: DataFrame<T2>;
  referenceFieldName: K2 & keyof T2;
}) {
  const anchors = opts.referenceDates
    .mutate({ _refDate: (r) => r[opts.referenceFieldName] })
    .select("id", "_refDate");

  const eventDates = opts.events
    .filter((r) => true)
    .mutate({ _eventDate: (r) => r[opts.fieldName] })
    .select("id", "_eventDate");

  return { anchors, eventDates };
}
void test8_fullPattern;

// ══════════════════════════════════════════════════════════════════════════════
// INVESTIGATION: Test 8b — Why does filter→mutate differ from direct mutate?
// ══════════════════════════════════════════════════════════════════════════════

// 8b-i: What type does filter return for generic T?
function test8b_filterType<
  K extends string, C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: { events: DataFrame<T>; fieldName: K & keyof T }) {
  const filtered = opts.events.filter((r) => true);
  // What is `filtered`?
  const _f: typeof filtered = null as any; void _f;
  return filtered;
}
void test8b_filterType;

// 8b-ii: mutate directly on DataFrame<T> (no filter first)
function test8b_directMutate<
  K extends string, C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: { events: DataFrame<T>; fieldName: K & keyof T }) {
  const result = opts.events.mutate({ _eventDate: (r) => r[opts.fieldName] });
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_directMutate;

// 8b-iii: mutate on filter result — is the row type different?
function test8b_filterThenMutate<
  K extends string, C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: { events: DataFrame<T>; fieldName: K & keyof T }) {
  const filtered = opts.events.filter((r) => true);
  const result = filtered.mutate({ _eventDate: (r) => r[opts.fieldName] });
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_filterThenMutate;

// 8b-iv: What if we chain directly without intermediate variable?
function test8b_chainedFilterMutate<
  K extends string, C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: { events: DataFrame<T>; fieldName: K & keyof T }) {
  const result = opts.events
    .filter((r) => true)
    .mutate({ _eventDate: (r) => r[opts.fieldName] });
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_chainedFilterMutate;

// ══════════════════════════════════════════════════════════════════════════════
// INVESTIGATION: Test 6 — Mixed async approaches
// Can we catch mixed async WITHOUT using a conditional on the return type?
// ══════════════════════════════════════════════════════════════════════════════

// 8b-v-pre: Same constraint as test 1 but using T/K instead of T2/K2
function test8b_simpleConstraint<K extends string, T extends HasIdAndDate<K>>(
  df: DataFrame<T>,
  fieldName: K & keyof T,
) {
  const result = df.mutate({ _refDate: (r) => r[fieldName] })
    .select("id", "_refDate");
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_simpleConstraint;

// 8b-v-pre2: Triple intersection constraint with T2/K2 naming
function test8b_tripleConstraint<K2 extends string, C2 extends string, T2 extends HasIdDateAndCode<K2, C2>>(
  df: DataFrame<T2>,
  fieldName: K2 & keyof T2,
) {
  const result = df.mutate({ _eventDate: (r) => r[fieldName] })
    .select("id", "_eventDate");
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_tripleConstraint;

// 8b-v-pre3: Double intersection (no third Record)
type HasIdAndTwoKeys<K extends string, C extends string> =
  { id: string } & Record<K, Date> & Record<C, string>;

function test8b_doubleIntersection<K extends string, C extends string, T extends HasIdAndTwoKeys<K, C>>(
  df: DataFrame<T>,
  fieldName: K & keyof T,
) {
  const result = df.mutate({ _eventDate: (r) => r[fieldName] })
    .select("id", "_eventDate");
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_doubleIntersection;

// 8b-v-pre4: Extra type param but single Record
function test8b_extraParamSingleRecord<K extends string, C extends string, T extends HasIdAndDate<K>>(
  df: DataFrame<T>,
  fieldName: K & keyof T,
) {
  const result = df.mutate({ _eventDate: (r) => r[fieldName] })
    .select("id", "_eventDate");
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_extraParamSingleRecord;

// 8b-v-pre5: Double intersection with PlainDateTime (matches HasIdDateAndCode structure)
type HasIdAndTwoKeysPDT<K extends string, C extends string> =
  { id: string } & Record<K, Temporal.PlainDateTime> & Record<C, string>;

function test8b_doubleWithPDT<K extends string, C extends string, T extends HasIdAndTwoKeysPDT<K, C>>(
  df: DataFrame<T>,
  fieldName: K & keyof T,
) {
  const result = df.mutate({ _eventDate: (r) => r[fieldName] })
    .select("id", "_eventDate");
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_doubleWithPDT;

// 8b-v-pre6: Does PlainDateTime have .then? Does T[K] match Promise<any>?
function test8b_pdtThenCheck<
  K extends string, C extends string,
  T extends { id: string } & Record<K, Temporal.PlainDateTime> & Record<C, string>,
>(fieldName: K & keyof T) {
  // Does PlainDateTime itself have .then?
  type PDTHasThen = Temporal.PlainDateTime extends { then: any } ? "YES" : "NO";
  const _pdt: PDTHasThen = null as any; void _pdt;

  // Does (r: T) => T[K & keyof T] match the tier 1 async constraint?
  type Fn = (r: T, idx: number, df: DataFrame<T>) => T[K & keyof T];
  type AsyncFn = (r: T, idx: number, df: DataFrame<T>) => Promise<any>;
  type MatchesTier1 = Fn extends AsyncFn ? "TIER1" : "NO";
  const _m: MatchesTier1 = null as any; void _m;

  // Same check with Date constraint
  type FnDate<T2 extends { id: string } & Record<K, Date> & Record<C, string>> =
    (r: T2, idx: number, df: DataFrame<T2>) => T2[K & keyof T2];
  // (can't easily test this without a separate function)
}
void test8b_pdtThenCheck;

// 8b-v-pre7: What overload does mutate select for the PDT case? Check mutate result directly.
function test8b_pdtMutateOnly<
  K extends string, C extends string,
  T extends { id: string } & Record<K, Temporal.PlainDateTime> & Record<C, string>,
>(df: DataFrame<T>, fieldName: K & keyof T) {
  const result = df.mutate({ _eventDate: (r) => r[fieldName] });
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_pdtMutateOnly;

// 8b-v-pre8: Same but with Date (should work)
function test8b_dateMutateOnly<
  K extends string, C extends string,
  T extends { id: string } & Record<K, Date> & Record<C, string>,
>(df: DataFrame<T>, fieldName: K & keyof T) {
  const result = df.mutate({ _eventDate: (r) => r[fieldName] });
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_dateMutateOnly;

// 8b-v-pre9: Check if PlainDateTime extends Promise<any> or has .then structurally
function test8b_pdtPromiseCheck() {
  type A = Temporal.PlainDateTime extends Promise<any> ? "YES" : "NO";
  type B = Temporal.PlainDateTime extends PromiseLike<any> ? "YES" : "NO";
  type C = Temporal.PlainDateTime extends { then: any } ? "YES" : "NO";
  type D = Temporal.PlainDateTime extends { then(...args: any[]): any } ? "YES" : "NO";
  const _a: A = null as any; void _a;
  const _b: B = null as any; void _b;
  const _c: C = null as any; void _c;
  const _d: D = null as any; void _d;
}
void test8b_pdtPromiseCheck;

// 8b-v: Direct mutate on T WITHOUT filter — test whether T[K & keyof T] behaves
// differently from T2[K2 & keyof T2]
function test8b_directT<
  K extends string, C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: { events: DataFrame<T>; fieldName: K & keyof T }) {
  const result = opts.events.mutate({ _eventDate: (r) => r[opts.fieldName] })
    .select("id", "_eventDate");
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_directT;

// 8b-vi: Filter then mutate then select — the full 8b chain isolated
function test8b_fullChain<
  K extends string, C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: { events: DataFrame<T>; fieldName: K & keyof T }) {
  const result = opts.events
    .filter((r) => true)
    .mutate({ _eventDate: (r) => r[opts.fieldName] })
    .select("id", "_eventDate");
  const _r: typeof result = null as any; void _r;
  return result;
}
void test8b_fullChain;

// 6-i: Does the mixed formula object match Record<string, (...) => Promise<any>>?
// If yes → tier 1 catches it. If no → it falls through.
function test6_doesMixedMatchAllAsync(df: DataFrame<{ id: string; value: number }>) {
  // The formulas object type:
  type F = {
    doubled: (r: { id: string; value: number }) => number;
    fetched: (r: { id: string; value: number }) => Promise<string>;
  };
  // Does F extend Record<string, (...) => Promise<any>>?
  type Check = F extends Record<string, (...args: any[]) => Promise<any>> ? "YES" : "NO";
  const _c: Check = null as any; void _c;
}
void test6_doesMixedMatchAllAsync;

// 6-ii: What if tier 1 uses "at least one async" instead of "all async"?
// We can't express this as a constraint directly, but what if we use a
// broader tier 1: formulas where EVERY fn returns Promise<any> | unknown,
// but at least one key's value extends (...) => Promise<any>?
// That's not expressible as a single extends constraint.

// 6-iii: What if we use a DIFFERENT overload trick — tier 1 catches
// individual async properties by having the formula property type be
// (...) => Promise<any> for at least one? We could use a union constraint:
// Formulas extends { [K in keyof Formulas]: (...) => Promise<any> | unknown }
// & { [K in string]: (...) => Promise<any> }
// ... but that doesn't work either.

// 6-iv: What if we accept the mixed regression and instead provide a
// type assertion helper? E.g., `asAsync(formulas)` that forces PromisedDF?
// Or document that mixed sync/async should use separate mutate calls?

// 6-v: What if tier 2 uses a NEGATIVE constraint — "formulas where
// NO property returns Promise"? This is AllSync again, which defers.
// But for CONCRETE types it resolves. So the regression is only for
// concrete mixed, not generic mixed (generic already falls to tier 3 today).
// Let's verify: does concrete mixed currently hit tier 2 or tier 3?
// Answer: tier 2 with AllSync correctly maps the async fn to never,
// F & AllSync<F> doesn't match, falls to tier 3. Without AllSync,
// tier 2 matches. So the regression is concrete-only.

// 6-vi: What if we keep AllSync on tier 2 BUT add a new tier between
// tier 1 and tier 2 that catches the generic case without AllSync?
// Tier 1:   all-async constraint → PromisedDF
// Tier 1.5: formulas-only, no AllSync → DataFrame (catches generic sync)
// Tier 2:   AllSync constraint → DataFrame (catches concrete sync, rejects mixed)
// Tier 3:   fallback → PromisedDF (catches mixed)
//
// Problem: tier 1.5 has same sig as tier 3 minus the return type.
// Overload resolution: tier 1.5 matches everything tier 3 does,
// so tier 3 is dead code again. Mixed still hits tier 1.5 → DataFrame.
//
// UNLESS: tier 1.5 has a NARROWER constraint than tier 3.
// What if tier 1.5 only matches single-property formulas?
// Or only matches when Formulas has specific shapes?

// 6-vii: What about a 4-overload design where tier 1 uses
// Record<string, (...) => Promise<any>> (catches ALL-async including single),
// tier 2 uses a constraint that's narrower than "any formulas" but wider
// than AllSync? E.g., formulas where return type is `Exclude<unknown, Promise<any>>`?
// Exclude<unknown, Promise<any>> = unknown (Exclude on non-union = identity).
// So that's the same as unknown. Doesn't help.

// 6-viii: DIFFERENT ANGLE — what if we invert the tier order?
// Tier 1: AllSync → DataFrame (concrete sync matches, generic defers → skip)
// Tier 2: all formulas → PromisedDataFrame (catches everything else)
// Then for generics: AllSync defers → tier 1 skipped → tier 2 → PromisedDF.
// That's the same as current behavior. No improvement.

// 6-ix: What about an EXPLICIT async check per-property using the
// return type of the function directly in the extends clause?
// I.e., instead of a mapped type, put the constraint on the parameter itself:
// formulas: { [K in keyof F]: F[K] extends (...) => Promise<any> ? never : F[K] }
// This is exactly NoneAsync/AllSync but inline. Still defers for generics.

// 6-x: KEY INSIGHT — The mixed async case uses CONCRETE types, not generics.
// And for concrete types, AllSync resolves correctly (it only defers on generics).
// So if we keep AllSync for tier 2, concrete mixed correctly falls to tier 3.
// The issue is ONLY that generic sync also falls to tier 3.
//
// What if we add a tier AFTER tier 2 (AllSync) but BEFORE tier 3 (fallback)
// that ONLY matches when the formulas are all "non-Promise-returning"
// using the OVERLOAD MATCHING approach (not a mapped constraint)?
//
// Tier 1:   Record<string, (...) => Promise<any>> → PromisedDF (all-async)
// Tier 2:   Formulas & AllSync<Formulas> → DataFrame (concrete sync)
// Tier 2.5: Record<string, (...) => unknown> → DataFrame (generic sync fallthrough)
// Tier 3:   Formulas → PromisedDF (mixed async fallback)
//
// For concrete sync: matches tier 2 (AllSync resolves) → DataFrame ✅
// For all-async: matches tier 1 → PromisedDF ✅
// For generic sync: AllSync defers → tier 2 skips → tier 2.5 matches → DataFrame ✅
// For mixed concrete: AllSync maps async→never → tier 2 skips →
//   does mixed match tier 2.5? tier 2.5 is Record<string, (...) => unknown>.
//   The async fn returns Promise<string> which extends unknown. So YES it matches.
//   → DataFrame ❌
//
// Same problem. Tier 2.5 catches mixed too because Promise<any> extends unknown.

// 6-xi: What if tier 2.5 uses a DIFFERENT return constraint that
// Promise<any> does NOT extend? Like `Exclude<unknown, PromiseLike<any>>`?
// Exclude<unknown, PromiseLike<any>> = unknown. Nope.
// What about `string | number | boolean | object | void | null | undefined`?
// That's specific. Promise<string> extends object → matches. Still no good.

// 6-xii: FINAL IDEA — What about tier 2.5 requiring that each formula's
// return type is NOT assignable to PromiseLike? We need this as a parameter
// constraint, not a mapped type. What if we use an INTERSECTION overload
// where the parameter type INTERSECTS with a "no-promises" version?
//
// Actually wait. Let's revisit the original insight from test 6-x.
// The issue is: for CONCRETE mixed, AllSync works (correctly rejects).
// For GENERIC sync, AllSync defers (incorrectly rejects).
// We need something that:
//   - resolves for generic sync → "pass" (like no-AllSync tier 2)
//   - resolves for concrete mixed → "fail" (like AllSync)
//
// The difference: generic sync has return type T2[K2], concrete mixed has
// return type number | Promise<string>. The key: for mixed, at least one
// formula's PARAMETER TYPE literally includes `async`. TS DOES know this
// at the overload matching level — the mixed object won't match
// Record<string, (...) => Promise<any>> because not ALL are async.
// But it WILL match Record<string, (...) => unknown> because all return unknown.
//
// There's no way to express "none return Promise" in a non-deferred way.
// The only non-deferred check is the overload parameter constraint itself.
//
// CONCLUSION FOR TEST 6: The only way to distinguish "generic sync" from
// "concrete mixed" at the overload level is AllSync — which defers on generics.
// We cannot have both. We must choose:
//   A) Keep AllSync → generic sync breaks (current behavior, issue 5)
//   B) Remove AllSync → concrete mixed breaks (test 6 regression)
//
// Option B is likely better because:
//   - Generic sync is the user's actual use case (test-join.ts issue 5)
//   - Mixed sync+async in a single mutate is uncommon
//   - Mixed can be split into two separate mutate calls
//   - The runtime still handles mixed correctly (it awaits all promises)
//   - Only the TYPE is wrong — the value would still be a PromisedDataFrame
//     at runtime, but TypeScript would think it's a DataFrame
