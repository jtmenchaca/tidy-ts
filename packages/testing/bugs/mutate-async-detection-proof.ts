// /**
//  * mutate-async-detection-proof.ts
//  *
//  * Comprehensive proof of mutate's sync/async overload resolution behavior.
//  *
//  * METHODOLOGY: Each section defines a CUSTOM overload interface that returns
//  * string literals "DF" or "PDF" instead of real types. This isolates the
//  * overload resolution logic from DataFrame/PromisedDataFrame invariance.
//  * When a test assigns to "DF", it compiles only if that overload was selected.
//  * When it errors, a different overload fired.
//  *
//  * Run:  deno check --unstable-tsgo packages/testing/bugs/mutate-async-detection-proof.ts
//  *
//  * ┌──────────┬─────────────────────────────────────────────────────────────┐
//  * │ Section  │ What it proves                                             │
//  * ├──────────┼─────────────────────────────────────────────────────────────┤
//  * │ A (1-5)  │ NotAPromise resolves for concrete types, defers for generics│
//  * │ B (6-10) │ AllSync resolves for concrete, defers for generics          │
//  * │ C (11-16)│ 3-tier with AllSync: which tier fires for each scenario     │
//  * │ D (17-21)│ 2-tier no AllSync: fixes generic, regresses mixed           │
//  * │ E (22-26)│ SyncReturn in parameter position: same deferral as AllSync  │
//  * │ F (27-31)│ Exclude<unknown, PromiseLike> as return constraint          │
//  * │ G (32-36)│ Extra tier between AllSync and fallback                     │
//  * │ H (37-39)│ Summary                                                     │
//  * └──────────┴─────────────────────────────────────────────────────────────┘
//  */

// // ─── Shared type helpers ─────────────────────────────────────────────────────

// type HasId = { id: string };
// type HasIdAndDate<K extends string> = { id: string } & Record<K, Temporal.PlainDateTime>;

// type NotAPromise<T> = [Awaited<T>] extends [T] ? true : false;

// // deno-lint-ignore no-explicit-any
// type AllSync<F> = {
//   // deno-lint-ignore no-explicit-any
//   [K in keyof F]: F[K] extends (...args: any[]) => infer R
//     ? NotAPromise<R> extends true ? F[K] : never
//     : F[K];
// };

// // Dummy this-type to simulate DataFrame<R> without importing real types
// interface FakeDF<Row extends object> { __row: Row; __brand: "FakeDF" }


// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION A: NotAPromise — does it resolve or defer?
// // ═══════════════════════════════════════════════════════════════════════════════

// // ── 1. NotAPromise<number> → true ───────────────────────────────────────────
// function test1() {
//   type Result = NotAPromise<number>;
//   const _: true = null! as Result; // COMPILES
//   void _;
// }
// void test1;

// // ── 2. NotAPromise<string> → true ───────────────────────────────────────────
// function test2() {
//   type Result = NotAPromise<string>;
//   const _: true = null! as Result; // COMPILES
//   void _;
// }
// void test2;

// // ── 3. NotAPromise<Promise<number>> → false ─────────────────────────────────
// function test3() {
//   type Result = NotAPromise<Promise<number>>;
//   const _: false = null! as Result; // COMPILES
//   void _;
// }
// void test3;

// // ── 4. NotAPromise<Promise<string>> → false ─────────────────────────────────
// function test4() {
//   type Result = NotAPromise<Promise<string>>;
//   const _: false = null! as Result; // COMPILES
//   void _;
// }
// void test4;

// // ── 5. NotAPromise<T[K & keyof T]> where T is generic → DEFERS ─────────────
// //    TypeScript cannot evaluate [Awaited<T[K]>] extends [T[K]] because
// //    T[K] is unresolved. The result is a deferred conditional, not `true`.
// function test5<K extends string, T extends HasIdAndDate<K>>(fieldName: K & keyof T) {
//   type ReturnT = T[K & keyof T];
//   type Result = NotAPromise<ReturnT>;
//   const _: true = null! as Result; // ERRORS: deferred conditional ≠ true
//   void _;
// }
// void test5;


// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION B: AllSync — does it resolve or defer?
// // ═══════════════════════════════════════════════════════════════════════════════

// // ── 6. AllSync on concrete sync → identity ──────────────────────────────────
// function test6() {
//   type F = { x: (r: HasId) => number };
//   const _: AllSync<F> = null! as F; // COMPILES: sync fn preserved
//   void _;
// }
// void test6;

// // ── 7. AllSync on concrete async → never ────────────────────────────────────
// function test7() {
//   type F = { x: (r: HasId) => Promise<number> };
//   const _: AllSync<F> = null! as F; // ERRORS: x became never
//   void _;
// }
// void test7;

// // ── 8. AllSync on concrete mixed → async prop becomes never ─────────────────
// function test8() {
//   type F = {
//     sync: (r: HasId) => number;
//     async: (r: HasId) => Promise<string>;
//   };
//   const _: F & AllSync<F> = null! as F; // ERRORS: async prop ∩ never = never
//   void _;
// }
// void test8;

// // ── 9. AllSync on generic formula → DEFERS ──────────────────────────────────
// function test9<K extends string, T extends HasIdAndDate<K>>(fieldName: K & keyof T) {
//   type F = { _ref: (r: T) => T[K & keyof T] };
//   const _: F & AllSync<F> = null! as F; // ERRORS: AllSync deferred
//   void _;
// }
// void test9;

// // ── 10. AllSync defers even for simplest generic ────────────────────────────
// function test10<T extends HasId>(key: keyof T) {
//   type F = { _val: (r: T) => T[keyof T] };
//   const _: F & AllSync<F> = null! as F; // ERRORS: deferred
//   void _;
// }
// void test10;


// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION C: 3-tier with AllSync (current production pattern)
// //
// //   Tier 1: all formulas → Promise<any>  →  "PDF"
// //   Tier 2: formulas & AllSync<formulas> →  "DF"
// //   Tier 3: fallback                     →  "PDF"
// // ═══════════════════════════════════════════════════════════════════════════════

// interface Mutate3Tier {
//   // deno-lint-ignore no-explicit-any
//   <R extends object, F extends Record<string, (row: R) => Promise<any>>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";

//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F & AllSync<F>,
//   ): "DF";

//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";
// }

// // ── 11. Concrete sync → DF (tier 2, AllSync resolves) ──────────────────────
// function test11(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate3Tier }) {
//   const result = df.mutate({ x: (r) => r.val * 2 });
//   const _: "DF" = result; // COMPILES
//   void _;
// }
// void test11;

// // ── 12. Concrete all-async → PDF (tier 1) ──────────────────────────────────
// function test12(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate3Tier }) {
//   const result = df.mutate({ x: async (r) => r.val * 2 });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test12;

// // ── 13. Concrete mixed sync+async → PDF (tier 2 rejects via AllSync, tier 3)
// function test13(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate3Tier }) {
//   const result = df.mutate({
//     sync: (r) => r.val * 2,
//     async: async (r) => r.val * 3,
//   });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test13;

// // ── 14. Concrete implicit async (sync fn returning Promise) → PDF (tier 1) ─
// function test14(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate3Tier }) {
//   const fetchData = (id: string): Promise<string> => Promise.resolve(id);
//   const result = df.mutate({ fetched: (r) => fetchData(r.id) });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test14;

// // ── 15. Generic sync → SHOULD be DF, but AllSync defers → tier 3 → PDF ────
// //    THIS IS THE BUG.
// function test15<K extends string, T extends HasIdAndDate<K>>(
//   df: FakeDF<T> & { mutate: Mutate3Tier }, fieldName: K & keyof T,
// ) {
//   const result = df.mutate({ _ref: (r: T) => r[fieldName] });
//   const _: "DF" = result; // ERRORS: got "PDF"
//   void _;
// }
// void test15;

// // ── 16. Generic Row but CONCRETE return type → DF (AllSync resolves) ────────
// //    r.id.length returns `number` (concrete), not T[K] (generic).
// //    AllSync can evaluate NotAPromise<number> = true → tier 2 matches.
// function test16<T extends HasId>(
//   df: FakeDF<T> & { mutate: Mutate3Tier },
// ) {
//   const result = df.mutate({ _val: (r: T) => r.id.length });
//   const _: "DF" = result; // COMPILES: return type is concrete `number`
//   void _;
// }
// void test16;

 
// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION D: 2-tier no AllSync
// //
// //   Tier 1: all formulas → Promise<any>  →  "PDF"
// //   Tier 2: catch-all                    →  "DF"
// // ═══════════════════════════════════════════════════════════════════════════════

// interface Mutate2Tier {
//   // deno-lint-ignore no-explicit-any
//   <R extends object, F extends Record<string, (row: R) => Promise<any>>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";

//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F,
//   ): "DF";
// }

// // ── 17. Concrete sync → DF ──────────────────────────────────────────────────
// function test17(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate2Tier }) {
//   const result = df.mutate({ x: (r) => r.val * 2 });
//   const _: "DF" = result; // COMPILES
//   void _;
// }
// void test17;

// // ── 18. Concrete all-async → PDF ────────────────────────────────────────────
// function test18(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate2Tier }) {
//   const result = df.mutate({ x: async (r) => r.val * 2 });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test18;

// // ── 19. Concrete mixed → REGRESSION: tier 1 fails (not ALL async), tier 2 → DF
// function test19(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate2Tier }) {
//   const result = df.mutate({
//     sync: (r) => r.val * 2,
//     async: async (r) => r.val * 3,
//   });
//   const _: "PDF" = result; // ERRORS: got "DF" — mixed regression
//   void _;
// }
// void test19;

// // ── 20. Generic sync → DF (THE FIX) ────────────────────────────────────────
// function test20<K extends string, T extends HasIdAndDate<K>>(
//   df: FakeDF<T> & { mutate: Mutate2Tier }, fieldName: K & keyof T,
// ) {
//   const result = df.mutate({ _ref: (r: T) => r[fieldName] });
//   const _: "DF" = result; // COMPILES — generic sync now works
//   void _;
// }
// void test20;

// // ── 21. Implicit async → PDF ────────────────────────────────────────────────
// function test21(df: FakeDF<{ id: string; val: number }> & { mutate: Mutate2Tier }) {
//   const fetchData = (id: string): Promise<string> => Promise.resolve(id);
//   const result = df.mutate({ fetched: (r) => fetchData(r.id) });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test21;


// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION E: SyncReturn in parameter position
// //
// // Instead of AllSync as a mapped intersection, put the Awaited check
// // directly in each formula's parameter type.
// //
// //   Tier 1: all formulas → Promise<any>             →  "PDF"
// //   Tier 2: formulas: { [K]: SyncReturn<F[K]> }    →  "DF"
// //   Tier 3: fallback                                →  "PDF"
// // ═══════════════════════════════════════════════════════════════════════════════

// // deno-lint-ignore no-explicit-any
// type SyncReturn<F> = F extends (...args: any[]) => infer R
//   ? [Awaited<R>] extends [R] ? F : never
//   : F;

// interface MutateSyncReturn {
//   // deno-lint-ignore no-explicit-any
//   <R extends object, F extends Record<string, (row: R) => Promise<any>>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";

//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: { [K in keyof F]: SyncReturn<F[K]> },
//   ): "DF";

//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";
// }

// // ── 22. Concrete sync → DF ──────────────────────────────────────────────────
// function test22(df: FakeDF<{ id: string; val: number }> & { mutate: MutateSyncReturn }) {
//   const result = df.mutate({ x: (r) => r.val * 2 });
//   const _: "DF" = result; // COMPILES
//   void _;
// }
// void test22;

// // ── 23. Concrete mixed → PDF ────────────────────────────────────────────────
// function test23(df: FakeDF<{ id: string; val: number }> & { mutate: MutateSyncReturn }) {
//   const result = df.mutate({
//     sync: (r) => r.val * 2,
//     async: async (r) => r.val * 3,
//   });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test23;

// // ── 24. Generic sync → STILL PDF (SyncReturn defers same as AllSync) ───────
// function test24<K extends string, T extends HasIdAndDate<K>>(
//   df: FakeDF<T> & { mutate: MutateSyncReturn }, fieldName: K & keyof T,
// ) {
//   const result = df.mutate({ _ref: (r: T) => r[fieldName] });
//   const _: "DF" = result; // ERRORS: got "PDF" — same deferral
//   void _;
// }
// void test24;

// // ── 25. Concrete all-async → PDF ────────────────────────────────────────────
// function test25(df: FakeDF<{ id: string; val: number }> & { mutate: MutateSyncReturn }) {
//   const result = df.mutate({ x: async (r) => r.val * 2 });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test25;

// // ── 26. Implicit async → PDF ────────────────────────────────────────────────
// function test26(df: FakeDF<{ id: string; val: number }> & { mutate: MutateSyncReturn }) {
//   const fetchData = (id: string): Promise<string> => Promise.resolve(id);
//   const result = df.mutate({ fetched: (r) => fetchData(r.id) });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test26;


// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION F: Exclude<unknown, PromiseLike> as return constraint
// //
// //   Tier 1: all formulas → Promise<any>                          →  "PDF"
// //   Tier 2: formulas → Exclude<unknown, PromiseLike<any>>        →  "DF"
// //   Tier 3: fallback                                              →  "PDF"
// //
// // Exclude<unknown, PromiseLike<any>> = unknown. So tier 2 = catch-all.
// // ═══════════════════════════════════════════════════════════════════════════════

// interface MutateExclude {
//   // deno-lint-ignore no-explicit-any
//   <R extends object, F extends Record<string, (row: R) => Promise<any>>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";

//   // deno-lint-ignore no-explicit-any
//   <R extends object, F extends Record<string, (row: R) => Exclude<unknown, PromiseLike<any>>>>(
//     this: FakeDF<R>, formulas: F,
//   ): "DF";

//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";
// }

// // ── 27. Exclude resolves to unknown (proof) ─────────────────────────────────
// function test27() {
//   // deno-lint-ignore no-explicit-any
//   type Result = Exclude<unknown, PromiseLike<any>>;
//   const _: unknown = null! as Result; // COMPILES: it's just `unknown`
//   void _;
// }
// void test27;

// // ── 28. Concrete sync → DF ──────────────────────────────────────────────────
// function test28(df: FakeDF<{ id: string; val: number }> & { mutate: MutateExclude }) {
//   const result = df.mutate({ x: (r) => r.val * 2 });
//   const _: "DF" = result; // COMPILES
//   void _;
// }
// void test28;

// // ── 29. Concrete mixed → REGRESSION (tier 2 = catch-all → DF) ──────────────
// function test29(df: FakeDF<{ id: string; val: number }> & { mutate: MutateExclude }) {
//   const result = df.mutate({
//     sync: (r) => r.val * 2,
//     async: async (r) => r.val * 3,
//   });
//   const _: "PDF" = result; // ERRORS: got "DF"
//   void _;
// }
// void test29;

// // ── 30. Generic sync → DF (same as no-AllSync since tier 2 = catch-all) ────
// function test30<K extends string, T extends HasIdAndDate<K>>(
//   df: FakeDF<T> & { mutate: MutateExclude }, fieldName: K & keyof T,
// ) {
//   const result = df.mutate({ _ref: (r: T) => r[fieldName] });
//   const _: "DF" = result; // COMPILES
//   void _;
// }
// void test30;

// // ── 31. Concrete all-async → PDF ────────────────────────────────────────────
// function test31(df: FakeDF<{ id: string; val: number }> & { mutate: MutateExclude }) {
//   const result = df.mutate({ x: async (r) => r.val * 2 });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test31;


// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION G: Extra tier between AllSync and fallback
// //
// //   Tier 1:   all formulas → Promise<any>  →  "PDF"
// //   Tier 2:   formulas & AllSync           →  "DF"   (concrete sync)
// //   Tier 2.5: catch-all                    →  "DF"   (catches generic sync?)
// //   Tier 3:   catch-all                    →  "PDF"  (dead code?)
// // ═══════════════════════════════════════════════════════════════════════════════

// interface MutateExtraTier {
//   // deno-lint-ignore no-explicit-any
//   <R extends object, F extends Record<string, (row: R) => Promise<any>>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";

//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F & AllSync<F>,
//   ): "DF";

//   // Tier 2.5
//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F,
//   ): "DF";

//   // Tier 3 — identical sig to 2.5 but different return
//   <R extends object, F extends Record<string, (row: R) => unknown>>(
//     this: FakeDF<R>, formulas: F,
//   ): "PDF";
// }

// // ── 32. Concrete sync → DF (tier 2 AllSync resolves) ────────────────────────
// function test32(df: FakeDF<{ id: string; val: number }> & { mutate: MutateExtraTier }) {
//   const result = df.mutate({ x: (r) => r.val * 2 });
//   const _: "DF" = result; // COMPILES
//   void _;
// }
// void test32;

// // ── 33. Concrete all-async → PDF (tier 1) ──────────────────────────────────
// function test33(df: FakeDF<{ id: string; val: number }> & { mutate: MutateExtraTier }) {
//   const result = df.mutate({ x: async (r) => r.val * 2 });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test33;

// // ── 34. Generic sync → DF (tier 2 defers, tier 2.5 catches) ────────────────
// function test34<K extends string, T extends HasIdAndDate<K>>(
//   df: FakeDF<T> & { mutate: MutateExtraTier }, fieldName: K & keyof T,
// ) {
//   const result = df.mutate({ _ref: (r: T) => r[fieldName] });
//   const _: "DF" = result; // COMPILES — generic sync fixed!
//   void _;
// }
// void test34;

// // ── 35. Concrete mixed → REGRESSION (tier 2.5 catches, tier 3 dead) ────────
// function test35(df: FakeDF<{ id: string; val: number }> & { mutate: MutateExtraTier }) {
//   const result = df.mutate({
//     sync: (r) => r.val * 2,
//     async: async (r) => r.val * 3,
//   });
//   const _: "PDF" = result; // ERRORS: got "DF" — tier 2.5 catches mixed too
//   void _;
// }
// void test35;

// // ── 36. Implicit async → PDF (tier 1) ──────────────────────────────────────
// function test36(df: FakeDF<{ id: string; val: number }> & { mutate: MutateExtraTier }) {
//   const fetchData = (id: string): Promise<string> => Promise.resolve(id);
//   const result = df.mutate({ fetched: (r) => fetchData(r.id) });
//   const _: "PDF" = result; // COMPILES
//   void _;
// }
// void test36;


// // ═══════════════════════════════════════════════════════════════════════════════
// // SECTION H: Summary
// //
// // ── 37. Results table ───────────────────────────────────────────────────────
// //
// // | Test | Approach             | Concrete sync | All async | Mixed   | Implicit async | Generic sync |
// // |------|----------------------|--------------|-----------|---------|----------------|--------------|
// // | C    | 3-tier + AllSync     | DF ✅         | PDF ✅     | PDF ✅   | PDF ✅          | PDF ❌        |
// // | D    | 2-tier no AllSync    | DF ✅         | PDF ✅     | DF ❌   | PDF ✅          | DF ✅         |
// // | E    | SyncReturn param     | DF ✅         | PDF ✅     | PDF ✅   | PDF ✅          | PDF ❌        |
// // | F    | Exclude<PromiseLike> | DF ✅         | PDF ✅     | DF ❌   | PDF ✅*         | DF ✅         |
// // | G    | Extra tier           | DF ✅         | PDF ✅     | DF ❌   | PDF ✅          | DF ✅         |
// //
// // * F implicit async not tested but tier 1 catches same as D
// //
// // ── 38. Why no approach gets both ✅ ────────────────────────────────────────
// //
// // To distinguish sync from async, you must inspect the formula return type.
// // Every inspection — extends Promise, Awaited check, structural .then —
// // is a conditional type. All conditionals defer on generic type params.
// // (TS #36927, #49946: "Working as Intended")
// //
// // Any approach that blocks async in tier 2 (AllSync, SyncReturn) also
// // blocks generics. Any approach that lets generics through tier 2 (no
// // AllSync, Exclude, extra tier) also lets mixed through.
// //
// // ── 39. The constraint ──────────────────────────────────────────────────────
// //
// // There is no overload parameter constraint in TypeScript that can
// // distinguish "generic sync return T[K]" from "concrete async return
// // Promise<X>" — because both require evaluating a conditional on the
// // return type, and generics defer that evaluation.
// //
// // A solution must work around this fundamental limitation, not through it.
// //
// // ═══════════════════════════════════════════════════════════════════════════════
