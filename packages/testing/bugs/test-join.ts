import { type DataFrame } from "@tidy-ts/dataframe";

type HasIdAndDate<K extends string> = { id: string } & Record<K, Temporal.PlainDateTime>;
type HasIdDateAndCode<K extends string, C extends string> =
  { id: string } & Record<K, Temporal.PlainDateTime> & Record<C, string>;

// ============================================================================
// 1. mutate().select() on generic DataFrame — FIXED
//    TS2349: union type, signatures not compatible
//
//    Root cause (two layers):
//    a) AllSync<F> used `F[K] extends (...) => Promise<any>` which defers on
//       generic return types (TS #52144). Fix: NotAPromise<T> using
//       `[Awaited<T>] extends [T]` which resolves for generics.
//    b) Conditional return type `AnyPropertyIsAsync<F> extends true ? Promised : DF`
//       produced a deferred union. TS can't merge overloaded call signatures
//       across unions (TS #33591). Fix: split into 3 tiers with unconditional
//       return types (tier 2 → DataFrame, tier 3 → PromisedDataFrame).
//    c) RowAfterMutation used Omit<Row, ...> which produces deferred
//       Exclude<keyof T, ...> on generics. Fix: single mapped type with `as` clause.
//    d) WithContextForFunctions overload greedily matched mixed fn+array calls,
//       killing row inference. Fix: removed it; fn|array|null overload provides
//       contextual typing directly.
// ============================================================================

export  function testMutateSelect<
  K2 extends string,
  T2 extends HasIdAndDate<K2>,
>(opts: {
  referenceDates: DataFrame<T2>;
  referenceFieldName: K2 & keyof T2;
}) {
  const anchors = opts.referenceDates
    .mutate({
      _refDate: (r) => r[opts.referenceFieldName],
    })

  const final =  anchors
    .select("id", "_refDate");
  return final;
}

// ============================================================================
// 2. groupBy("id").summarize() on generic DataFrame
//    summarize produces { id: T["id"]; value: number } not { id: string; value: number }
//
//    Root cause: DataFrame<Row> is invariant in Row because Row appears in
//    contravariant positions (e.g., filter takes `(row: Row) => boolean`,
//    summarize's `this: GroupedDataFrame<Row, GN>` creates contravariant check).
//    So DataFrame<Pick<T, "id"> & { value: number }> is NOT assignable to
//    DataFrame<{ id: string; value: number }> even though T["id"] extends string.
//
//    Error chain: checking DF<A> assignable to DF<B> recursively checks
//    every method. For `summarize`, the `this` parameter is contravariant,
//    so GDF<B> must extend GDF<A>, which checks DF<B> extends DF<A>,
//    which checks filter's callback (row: B) => bool assignable to
//    (row: A) => bool, requiring A extends B (contravariant). But
//    Pick<T, "id"> = { id: T["id"] } and CountResult = { id: string },
//    and string is not assignable to T["id"] (T["id"] could be narrower).
//
//    Fix: Change all methods that put Row in contravariant positions to use
//    `this`-based generics instead. Pattern:
//      BEFORE: filter(fn: (row: Row) => boolean): DataFrame<Row>
//      AFTER:  filter<R extends object>(this: DF<R>, fn: (row: R) => bool): DF<R>
//    This removes Row from all contravariant positions, making DataFrame
//    structurally covariant. T["id"] extends string works in covariant
//    position, so Pick<T, "id"> & { value: number } IS assignable to
//    CountResult.
//    Reproduction: /tmp/issue2-variance-v11.ts (passes), v12 (comprehensive)
// ============================================================================

type CountResult = { id: string; value: number };

export function testSummarize<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  codeField: C & keyof T;
}): DataFrame<CountResult> { 
  const df1 = opts.events
    .groupBy("id")
  const df2 = df1
    .summarize({
      value: (g) => g.nrows(),
    }); 
  return df2;
} 

// ============================================================================
// 3. innerJoin(concrete, "id") on generic DataFrame
//    generic DataFrame<T> joining concrete DataFrame<{ id: string; ... }> on "id"
//
//    Root cause (two layers):
//    a) `on` param typed as `Extract<keyof Row, keyof OtherRow>` — defers when
//       Row is generic T. TS can't resolve Extract<keyof T, "id" | "_refDate">
//       because keyof T is deferred. So "id" is not assignable to the deferred type.
//       Fix: change to `K extends keyof Row & keyof OtherRow` (constraint-based)
//       which lets TS infer K = "id" without resolving keyof T first.
//       Note: asofJoin already uses this pattern successfully.
//    b) Even with (a) fixed, the return type DF<T & OtherRow> would be invariant
//       in T, blocking return type annotations. Same covariant fix as issue 2
//       (this-based generics) resolves this.
//    Reproduction: /tmp/issue3-join-repro.ts (approaches 2-4 pass)
// ============================================================================

export function testInnerJoin<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  anchors: DataFrame<{ id: string; _refDate: Temporal.PlainDateTime }>;
}) {
  const df1 = opts.events
  const df2 = df1
    .innerJoin(opts.anchors, "id");
  return df2;
} 

// ============================================================================
// 4. select() with dynamic generic key names
//    .select("id", opts.fieldName, opts.codeField) where fieldName/codeField are generic
//
//    Root cause:
//    a) select uses `ColName extends keyof Row` — when mixing literal "id" with
//       generic `K & keyof T`, TS infers ColName as `"id" | (K & keyof T)`.
//       But K is just `string`, so TS widens to string, then "id" is not
//       assignable to string (fails for the generic arg, not "id").
//       Fix: use `const tuple` approach: `<const Cols extends readonly (keyof R)[]>`
//       which preserves each element's literal type independently.
//    b) The return type `: DataFrame<T>` is incorrect — selecting 3 columns
//       from T produces Pick<T, "id" | K | C>, not T itself. T may have
//       additional properties. This is a user-side annotation issue.
//    c) sliceMax with generic key: same constraint-based fix as issue 3
//       (use `K extends keyof Row` instead of a computed key type).
//    Reproduction: /tmp/issue4-select-v2.ts (select call passes, return type
//    correctly errors because Pick<T, subset> ≠ T)
// ============================================================================

export function testDynamicSelect<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
}) {

  const df1 = opts.events
    .select("id", opts.fieldName, opts.codeField)
  const df2 = df1
    .groupBy("id")
  const df3 = df2
    .sliceMax(opts.fieldName, 1)
    .ungroup()
  return df3;
}

// ============================================================================
// 5. mutate().select() result passed to innerJoin
//    PromisedDataFrame from mutate on generic can't be used as innerJoin arg
// ============================================================================

export  function testMutateSelectAsJoinArg<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
  K2 extends string,
  T2 extends HasIdAndDate<K2>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  referenceDates: DataFrame<T2>;
  referenceFieldName: K2 & keyof T2;
}) {
  const anchors = opts.referenceDates
    .mutate({
      _refDate: (r) => r[opts.referenceFieldName],
    })
    .select("id", "_refDate");
  const eventDates = opts.events
    .filter((_r) => true)
    .mutate({ _eventDate: (r) => r[opts.fieldName] })
    .select("id", "_eventDate");
  const joined = eventDates
    .innerJoin(anchors, "id");
  return joined;
}

// ============================================================================
// 6. innerJoin result doesn't expose joined fields with generics
//    r._refDate / r._wStart not accessible on InnerJoinResult<T, concrete>
// ============================================================================

export  function testJoinedFieldAccess_innerJoin<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  anchors: DataFrame<{ id: string; _refDate: Temporal.PlainDateTime }>;
}) {
  const joined = opts.events
    .innerJoin(opts.anchors, "id");
  const filtered = joined
    .filter((r) => {
      const d = r[opts.fieldName];
      const wStart = r._refDate.add({ days: -14 });
      return Temporal.PlainDateTime.compare(d, wStart) >= 0;
    });
  return filtered;
}

// ============================================================================
// 6b. leftJoin result doesn't expose joined fields with generics
// ============================================================================

export  function testJoinedFieldAccess_leftJoin<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  anchors: DataFrame<{ id: string; _refDate: Temporal.PlainDateTime }>;
}) {
  const joined = opts.events
    .leftJoin(opts.anchors, "id");
  const filtered = joined
    .filter((r) => {
      const d = r[opts.fieldName];
      const wStart = r._refDate?.add({ days: -14 });
      return wStart != null && Temporal.PlainDateTime.compare(d, wStart) >= 0;
    });
  return filtered;
}

// ============================================================================
// 6c. rightJoin result doesn't expose joined fields with generics
// ============================================================================

export  function testJoinedFieldAccess_rightJoin<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  anchors: DataFrame<{ id: string; _refDate: Temporal.PlainDateTime }>;
}) {
  const joined = opts.events
    .rightJoin(opts.anchors, "id");
  // Right join: right-side fields (like _refDate) are required,
  // left-side non-key fields become T | undefined
  const filtered = joined
    .filter((r) => {
      const wStart = r._refDate.add({ days: -14 });
      const d = r[opts.fieldName];
      return wStart != null;
    });
  return filtered;
}

// ============================================================================
// 6d. outerJoin result doesn't expose joined fields with generics
// ============================================================================

export  function testJoinedFieldAccess_outerJoin<
  K extends string,
  C extends string,
  T extends HasIdDateAndCode<K, C>,
>(opts: {
  events: DataFrame<T>;
  fieldName: K & keyof T;
  codeField: C & keyof T;
  anchors: DataFrame<{ id: string; _refDate: Temporal.PlainDateTime }>;
}) {
  const joined = opts.events
    .outerJoin(opts.anchors, "id");
  // Outer join: non-key fields from both sides become T | undefined
  const filtered = joined
    .filter((r) => {
      const wStart = r._refDate?.add({ days: -14 });
      const d = r[opts.fieldName];
      return wStart != null;
    });
  return filtered;
}
