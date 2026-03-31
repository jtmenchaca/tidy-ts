/**
 * Join type exploration — testing alternative type formulations
 * against the rules in join-type-rules.md.
 *
 * Goal: find simpler type definitions that produce the same results
 * but with less tsc work (fewer instantiations, less depth-limit hitting).
 *
 * Current type chain for a simple left join:
 *   LeftJoinMethod<Row>
 *     → overload 1: Prettify<LeftJoinResult<Row, OtherRow, K>>
 *       → LeftJoinResult = RequiredUndefined<L & Partial<R>>
 *         → RequiredUndefined = { [K in keyof T]-?: T[K] }
 *         → Prettify = { [Key in keyof Type]: Type[Key] } & {}
 *
 *     → overload 2: UnifyUnion<SuffixAwareLeftJoinResult<...>>
 *       → SuffixAwareLeftJoinResult dispatches:
 *         → LeftJoinWithSuffixes (5-way intersection using Pick/Omit/ApplySuffix/MakeUndefined)
 *         → or SimpleLeftJoinResult → RowAfterLeftJoin → Prettify<L & MakeUndefined<Omit<R, K>>>
 *       → UnifyUnion = Prettify<{ [K in keyof MergeUnionAllKeys<T>]: MergeUnionAllKeys<T>[K] }>
 *
 * The complexity explosion comes from:
 *   1. Two overloads per join method (simple + suffix-aware)
 *   2. Suffix-aware path uses deep conditional types (ExtractJoinKeys, ExtractSuffixes)
 *   3. UnifyUnion wraps MergeUnionAllKeys which iterates union members
 *   4. Multiple Prettify layers (result.types has RequiredUndefined, then method.types wraps in Prettify)
 *   5. The "backwards compat" types in core.types.ts duplicate logic
 *
 * This file tests whether simpler alternatives produce equivalent types.
 */

import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// ============================================================================
// Test data setup
// ============================================================================

const employees = createDataFrame([
  { id: 1, name: "Alice", dept_id: 10 },
  { id: 2, name: "Bob", dept_id: 20 },
  { id: 3, name: "Charlie", dept_id: 99 },
]);

const departments = createDataFrame([
  { dept_id: 10, dept_name: "Engineering", budget: 500000 },
  { dept_id: 20, dept_name: "Sales", budget: 300000 },
  { dept_id: 30, dept_name: "Marketing", budget: 200000 },
]);

// Different-named key columns
const empWithDifferentKeys = createDataFrame([
  { emp_id: 1, emp_dept: 10, name: "Alice" },
]);

const deptWithDifferentKeys = createDataFrame([
  { d_id: 10, d_name: "Engineering" },
]);

// Overlapping non-key columns (for suffix testing)
const events = createDataFrame([
  { id: "a", date: "2024-01-15", start: "2024-01-01", end: "2024-01-31" },
]);

const intervals = createDataFrame([
  { id: "a", start: "2024-01-10", end: "2024-01-20" },
]);

// ============================================================================
// SECTION 1: Current simple API result types (what we need to match)
// ============================================================================

// --- Inner Join: L ∪ R\K (all required) ---
const innerResult = employees.innerJoin(departments, "dept_id");
type InnerActual = typeof innerResult extends DataFrame<infer R> ? R : never;
// Expected: { id: number; name: string; dept_id: number; dept_name: string; budget: number }

// Type assertions — these must compile
const _innerCheck: InnerActual = {
  id: 1, name: "Alice", dept_id: 10, dept_name: "Engineering", budget: 500000,
};

// --- Left Join: L ∪ (R\K)? (right non-keys become T | undefined) ---
const leftResult = employees.leftJoin(departments, "dept_id");
type LeftActual = typeof leftResult extends DataFrame<infer R> ? R : never;

const _leftCheck: LeftActual = {
  id: 1, name: "Alice", dept_id: 10, dept_name: "Engineering", budget: 500000,
};
// Also valid: undefined for right-side non-key fields
const _leftCheckUndefined: LeftActual = {
  id: 3, name: "Charlie", dept_id: 99, dept_name: undefined, budget: undefined,
};
 
// --- Right Join: (L\K)? ∪ R (left non-keys become T | undefined) ---
const rightResult = employees.rightJoin(departments, "dept_id");
type RightActual = typeof rightResult extends DataFrame<infer R> ? R : never;

const _rightCheck: RightActual = {
  id: 1, name: "Alice", dept_id: 10, dept_name: "Engineering", budget: 500000,
};
const _rightCheckUndefined: RightActual = {
  id: undefined, name: undefined, dept_id: 30, dept_name: "Marketing", budget: 200000,
};

// --- Outer Join: (L\K)? ∪ (R\K)? ∪ Pick<L, K> (keys required, all non-keys T | undefined) ---
const outerResult = employees.outerJoin(departments, "dept_id");
type OuterActual = typeof outerResult extends DataFrame<infer R> ? R : never;

const _outerCheck: OuterActual = {
  id: 1, name: "Alice", dept_id: 10, dept_name: "Engineering", budget: 500000,
};
const _outerCheckBothUndefined: OuterActual = {
  id: undefined, name: undefined, dept_id: 30, dept_name: undefined, budget: undefined,
};

// ============================================================================
// SECTION 2: Suffix-aware API result types (object API)
// ============================================================================

// --- Inner join with suffixes ---
const innerSuffix = events.innerJoin(intervals, {
  keys: ["id"],
  suffixes: { left: "", right: "_window" },
});
type InnerSuffixActual = typeof innerSuffix extends DataFrame<infer R> ? R : never;

const _innerSuffixCheck: InnerSuffixActual = {
  id: "a", date: "2024-01-15", start: "2024-01-01", end: "2024-01-31",
  start_window: "2024-01-10", end_window: "2024-01-20",
};

// --- Left join with suffixes ---
const leftSuffix = events.leftJoin(intervals, {
  keys: ["id"],
  suffixes: { left: "", right: "_window" },
});
type LeftSuffixActual = typeof leftSuffix extends DataFrame<infer R> ? R : never;

const _leftSuffixCheck: LeftSuffixActual = {
  id: "a", date: "2024-01-15", start: "2024-01-01", end: "2024-01-31",
  start_window: "2024-01-10", end_window: "2024-01-20",
};

// --- Right join with suffixes ---
const rightSuffix = events.rightJoin(intervals, {
  keys: ["id"],
  suffixes: { left: "_event", right: "" },
});
type RightSuffixActual = typeof rightSuffix extends DataFrame<infer R> ? R : never;

const _rightSuffixCheck: RightSuffixActual = {
  id: "a", date: "2024-01-15", start_event: "2024-01-01", end_event: "2024-01-31",
  start: "2024-01-10", end: "2024-01-20",
};

// --- Outer join with suffixes ---
const outerSuffix = events.outerJoin(intervals, {
  keys: ["id"],
  suffixes: { left: "_L", right: "_R" },
});
type OuterSuffixActual = typeof outerSuffix extends DataFrame<infer R> ? R : never;

const _outerSuffixCheck: OuterSuffixActual = {
  id: "a", date: "2024-01-15",
  start_L: "2024-01-01", end_L: "2024-01-31",
  start_R: "2024-01-10", end_R: "2024-01-20",
};

// ============================================================================
// SECTION 3: Different-key join (object API with { left, right } keys)
// ============================================================================

const diffKeyLeft = empWithDifferentKeys.leftJoin(deptWithDifferentKeys, {
  keys: { left: "emp_dept", right: "d_id" },
});
type DiffKeyLeftActual = typeof diffKeyLeft extends DataFrame<infer R> ? R : never;

const _diffKeyLeftCheck: DiffKeyLeftActual = {
  emp_id: 1, emp_dept: 10, name: "Alice",
  d_id: 10, d_name: "Engineering",
};

// ============================================================================
// SECTION 4: Multi-key joins
// ============================================================================

const multiKeyLeft = createDataFrame([
  { country: "US", year: 2020, gdp: 21000 },
  { country: "UK", year: 2020, gdp: 2800 },
]);
const multiKeyRight = createDataFrame([
  { country: "US", year: 2020, pop: 331 },
  { country: "UK", year: 2020, pop: 67 },
]);

const multiKeyInner = multiKeyLeft.innerJoin(multiKeyRight, ["country", "year"]);
type MultiKeyInnerActual = typeof multiKeyInner extends DataFrame<infer R> ? R : never;

const _multiKeyCheck: MultiKeyInnerActual = {
  country: "US", year: 2020, gdp: 21000, pop: 331,
};

// ============================================================================
// SECTION 5: Generic DataFrame join types (the consumer pain point)
//
// When a consumer writes `function analyze<T extends SomeRow>(df: DataFrame<T>)`
// and chains joins, tsc must structurally compare DataFrame<T> against the
// join method signatures. Each join method type has 2 overloads with complex
// conditional return types, causing depth-limit hits.
// ============================================================================

type BaseRow = { id: number; value: string };

// This is the pattern that triggers expensive comparisons in consumer code
function genericInnerJoin<T extends BaseRow>(
  df: DataFrame<T>,
  other: DataFrame<{ id: number; extra: string }>,
) {
  return df.innerJoin(other, "id");
}

function genericLeftJoin<T extends BaseRow>(
  df: DataFrame<T>,
  other: DataFrame<{ id: number; extra: string }>,
) {
  return df.leftJoin(other, "id");
}

function genericOuterJoin<T extends BaseRow>(
  df: DataFrame<T>,
  other: DataFrame<{ id: number; extra: string }>,
) {
  return df.outerJoin(other, "id");
}

// Cross join (no keys)
function genericCrossJoin<T extends BaseRow>(
  df: DataFrame<T>,
  other: DataFrame<{ color: string }>,
) {
  return df.crossJoin(other);
}

// ============================================================================
// SECTION 6: Alternative type formulations to explore
//
// These are standalone type-level experiments. If any produce equivalent
// results with less complexity, we can replace the current definitions.
// ============================================================================

// --- Alternative 1: Simplified LeftJoinResult using Omit + MakeUndefined directly ---
// Current: RequiredUndefined<L & Partial<R>>
// Alternative: L & MakeUndefined<Omit<R, K>>
// (This is what RowAfterLeftJoin already does in core.types.ts)
type MakeUndefined<T> = { [K in keyof T]: T[K] | undefined };
type Alt_LeftJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = L & MakeUndefined<Omit<R, K>>;

// Test: does it produce the same type?
type Alt_LeftTest = Alt_LeftJoinResult<
  { id: number; name: string; dept_id: number },
  { dept_id: number; dept_name: string; budget: number },
  "dept_id"
>;
// Should be: { id: number; name: string; dept_id: number; dept_name: string | undefined; budget: number | undefined }
const _altLeftTest: Alt_LeftTest = {
  id: 1, name: "Alice", dept_id: 10, dept_name: undefined, budget: undefined,
};

// --- Alternative 2: Simplified RightJoinResult ---
// Current: RequiredUndefined<Partial<L> & R>
// Alternative: MakeUndefined<Omit<L, K>> & R
type Alt_RightJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = MakeUndefined<Omit<L, K>> & R;

type Alt_RightTest = Alt_RightJoinResult<
  { id: number; name: string; dept_id: number },
  { dept_id: number; dept_name: string; budget: number },
  "dept_id"
>;
const _altRightTest: Alt_RightTest = {
  id: undefined, name: undefined, dept_id: 10, dept_name: "Engineering", budget: 500000,
};

// --- Alternative 3: Simplified FullJoinResult ---
// Current: RequiredUndefined<Pick<L, K> & Partial<L> & Partial<R>>
// Alternative: Pick<L, K> & MakeUndefined<Omit<L, K>> & MakeUndefined<Omit<R, K>>
type Alt_FullJoinResult<
  L extends object,
  R extends object,
  K extends keyof L & keyof R,
> = Pick<L, K> & MakeUndefined<Omit<L, K>> & MakeUndefined<Omit<R, K>>;

type Alt_FullTest = Alt_FullJoinResult<
  { id: number; name: string; dept_id: number },
  { dept_id: number; dept_name: string; budget: number },
  "dept_id"
>;
const _altFullTest: Alt_FullTest = {
  id: undefined, name: undefined, dept_id: 10, dept_name: undefined, budget: undefined,
};

// ============================================================================
// SECTION 7: Bidirectional assignability tests
//
// For each alternative, verify it's assignable TO and FROM the current type.
// This ensures they are equivalent (not just one-directional).
// ============================================================================

// Left join: current vs alternative
type Current_LeftResult = LeftActual;
type Alt_LeftResult_Concrete = Alt_LeftJoinResult<
  { id: number; name: string; dept_id: number },
  { dept_id: number; dept_name: string; budget: number },
  "dept_id"
>;

// Direction 1: current → alternative
const _leftCurrentToAlt: Alt_LeftResult_Concrete = {} as Current_LeftResult;
// Direction 2: alternative → current
const _leftAltToCurrent: Current_LeftResult = {} as Alt_LeftResult_Concrete;

// Right join: current vs alternative
type Current_RightResult = RightActual;
type Alt_RightResult_Concrete = Alt_RightJoinResult<
  { id: number; name: string; dept_id: number },
  { dept_id: number; dept_name: string; budget: number },
  "dept_id"
>;

const _rightCurrentToAlt: Alt_RightResult_Concrete = {} as Current_RightResult;
const _rightAltToCurrent: Current_RightResult = {} as Alt_RightResult_Concrete;

// Outer join: current vs alternative
type Current_OuterResult = OuterActual;
type Alt_OuterResult_Concrete = Alt_FullJoinResult<
  { id: number; name: string; dept_id: number },
  { dept_id: number; dept_name: string; budget: number },
  "dept_id"
>;

const _outerCurrentToAlt: Alt_OuterResult_Concrete = {} as Current_OuterResult;
const _outerAltToCurrent: Current_OuterResult = {} as Alt_OuterResult_Concrete;

// ============================================================================
// SECTION 8: The key question — do alternatives work with generics?
//
// The real test: when L is a generic type parameter, does the alternative
// still produce correct types? This is where Omit<T, K> can break because
// it defers when T is generic.
// ============================================================================

// Prettify wrapper to match the method signature pattern
type Prettify<T> = { [K in keyof T]: T[K] } & {};

// Test: Alt formulation with generic L
function testGenericLeftAlt<
  L extends { id: number; name: string },
  R extends { id: number; extra: string },
>(left: DataFrame<L>, right: DataFrame<R>) {
  // This is what the method would return with the alt formulation:
  type Result = Prettify<L & MakeUndefined<Omit<R, "id">>>;

  // Can we index it with known keys?
  type _HasId = Result extends { id: number } ? true : false;
  type _HasName = Result extends { name: string } ? true : false;
  type _HasExtra = Result extends { extra: string | undefined } ? true : false;
}

// Test: current formulation with generic L (conditional mapped type)
function testGenericLeftCurrent<
  L extends { id: number; name: string },
  R extends { id: number; extra: string },
>(left: DataFrame<L>, right: DataFrame<R>) {
  // Current approach: L & { [P in keyof R]: P extends keyof L ? R[P] : R[P] | undefined }
  type Result = Prettify<L & {
    [P in keyof R]: P extends keyof L ? R[P] : R[P] | undefined;
  }>;

  // L's properties keep their type, R-only properties get | undefined.
  // The conditional `P extends keyof L` defers when L is generic, but
  // the intersection with L preserves indexability for L's keys.
}

// ============================================================================
// SECTION 9: Cost comparison — which types instantiate more?
//
// The suffix-aware path is the most complex. Let's trace the type layers:
//
// SuffixAwareLeftJoinResult<L, R, Options>
//   → Options extends { suffixes: _ } ?
//     → YES: LeftJoinWithSuffixes<L, R, ExtractJoinKeys<Options>, ExtractSuffixes<Options>>
//       → ConflictingColumns<L, R, K>     (Exclude + Extract intersection)
//       → ApplySuffix<Pick<...>, ...>     (template literal mapped type)
//       → MakeUndefined<Omit<...>>        (another mapped type)
//       → 5-way intersection
//     → NO: SimpleLeftJoinResult = RowAfterLeftJoin = Prettify<L & MakeUndefined<Omit<R, shared>>>
//   → Wrapped in UnifyUnion = Prettify<MergeUnionAllKeys<T>>
//
// The NO path still does Prettify<L & MakeUndefined<Omit<R, shared>>> but then
// wraps in UnifyUnion unnecessarily (there's no union to unify in the simple case).
//
// Questions to investigate:
// 1. Can we avoid the conditional dispatch and just use the suffix path with default suffixes?
// 2. Can we simplify the suffix path itself (the 5-way intersection)?
// 3. Is UnifyUnion needed at all for the simple case?
// 4. Are the "backwards compat" types in core.types.ts dead weight?
// ============================================================================

// Verify: RowAfterLeftJoin from core.types.ts is the same as the simple path
// RowAfterLeftJoin<L, R> = Prettify<L & MakeUndefined<Omit<R, keyof L & keyof R>>>
// SimpleLeftJoinResult<L, R> = RowAfterLeftJoin<L, R>  (literally an alias)
// So SimpleLeftJoinResult is just: Prettify<L & MakeUndefined<Omit<R, sharedKeys>>>
//
// LeftJoinResult<L, R, K> = L & { [P in keyof R]: P extends keyof L ? R[P] : R[P] | undefined }
// SimpleLeftJoinResult (core.types.ts) = Prettify<L & MakeUndefined<Omit<R, shared>>>
//
// These use different mechanisms but should produce equivalent results.
// Let's verify:

type FromResultTypes =
  { id: number; name: string; dept_id: number } &
  { [P in keyof { dept_id: number; dept_name: string; budget: number }]:
    P extends keyof { id: number; name: string; dept_id: number }
      ? { dept_id: number; dept_name: string; budget: number }[P]
      : { dept_id: number; dept_name: string; budget: number }[P] | undefined };

type FromCoreTypes_Inner =
  { id: number; name: string; dept_id: number } &
  MakeUndefined<Omit<{ dept_id: number; dept_name: string; budget: number }, "dept_id">>;

// Both should give: { id: number; name: string; dept_id: number; dept_name: string | undefined; budget: number | undefined }

// They should be equivalent:
const _resultToCore: FromCoreTypes_Inner = {} as FromResultTypes;
const _coreToResult: FromResultTypes = {} as FromCoreTypes_Inner;

// ============================================================================
// SECTION 10: The duplication problem
//
// There are TWO separate type hierarchies for join results:
//
// PATH A (simple overload in method.types.ts):
//   result.types.ts → InnerJoinResult, LeftJoinResult, etc.
//   Uses: L & { [P in keyof R]: P extends keyof L ? R[P] : R[P] | undefined }
//
// PATH B (suffix-aware overload in method.types.ts → suffix.types.ts):
//   suffix.types.ts → SuffixAwareLeftJoinResult dispatches to:
//     → LeftJoinWithSuffixes (5-way intersection)
//     → OR SimpleLeftJoinResult → core.types.ts → RowAfterLeftJoin
//   Uses: L & MakeUndefined<Omit<R, shared>>
//
// These compute equivalent results but through different type machinery.
// Every time tsc evaluates a join method on DataFrameBase<Row>, it must
// instantiate BOTH overloads to determine which one matches.
//
// Potential simplification: unify both paths into a single formulation.
// ============================================================================

console.log("All join type assertions compile successfully.");
