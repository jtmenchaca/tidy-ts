/**
 * Bug: DataFrame<any> from no_types option causes type errors on reassignment
 *
 * When using `createDataFrame(rows, { no_types: true })`, the returned DataFrame<any>
 * should allow reassignment after mutate() without type errors. Currently, reassigning
 * `result = result.mutate({...})` causes TypeScript errors.
 *
 * Expected: DataFrame<any>.mutate() returns DataFrame<any>, allowing fluid reassignment
 * Actual: Type narrowing or inference issues prevent reassignment
 */

import { expect } from "@std/expect";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// ============================================================================
// IDEAL API - What we wish existed (these will have compile errors)
// ============================================================================

/*
// ---------------------------------------------------------------------------
// Scenario 1: Conditional column additions with mutate
// ---------------------------------------------------------------------------

// IDEAL: undefined values are simply not added as columns
Deno.test("IDEAL: mutate skips undefined values", () => {
  const baseSummary = createDataFrame([
    { id: 1, name: "test" },
    { id: 2, name: "test2" },
  ]);

  const results = {
    visit_diagnoses: createDataFrame([{ a: 1 }, { a: 2 }, { a: 3 }]),
    medications: undefined as DataFrame<{ b: number }> | undefined,
  };

  // undefined values just don't create columns - no skipUndefined option needed
  // This is the natural behavior: "I want these columns if they exist"
  const result = baseSummary.mutate({
    num_visit_diagnoses: results.visit_diagnoses?.nrows(),
    num_medications: results.medications?.nrows(),
  });

  expect(result.columns()).toContain("num_visit_diagnoses");
  expect(result.columns()).not.toContain("num_medications"); // not added because undefined
});


// ---------------------------------------------------------------------------
// Scenario 2: Conditional leftJoins
// ---------------------------------------------------------------------------

// IDEAL: leftJoinAll - batch join multiple DataFrames on the same key
Deno.test("IDEAL: leftJoinAll for multiple conditional joins", () => {
  const patients = createDataFrame([
    { pat_id: "P001", name: "Alice" },
    { pat_id: "P002", name: "Bob" },
  ]);

  const results = {
    visit_diagnoses: createDataFrame([
      { pat_id: "P001", dx: "A01" },
      { pat_id: "P001", dx: "A02" },
    ]),
    labs: createDataFrame([{ pat_id: "P001", lab: "CBC" }]),
    medications: undefined as DataFrame<{ pat_id: string; med: string }> | undefined,
  };

  // Filter out undefined, then join all at once
  const countsToJoin = [
    results.visit_diagnoses?.groupBy("pat_id").summarize({ num_vd: g => g.nrows() }),
    results.labs?.groupBy("pat_id").summarize({ num_labs: g => g.nrows() }),
    results.medications?.groupBy("pat_id").summarize({ num_meds: g => g.nrows() }),
  ].filter(Boolean);

  // Single method that joins all DataFrames on the same key
  const summary = patients.leftJoinAll(countsToJoin, "pat_id");

  expect(summary.columns()).toContain("num_vd");
  expect(summary.columns()).toContain("num_labs");
  expect(summary.columns()).not.toContain("num_meds");
});


// ---------------------------------------------------------------------------
// Scenario 3: Reassignment should just work with DataFrame<any>
// ---------------------------------------------------------------------------

// IDEAL: The original bug - this should just work
Deno.test("IDEAL: DataFrame<any> preserves through operations", () => {
  let df = createDataFrame([{ a: 1 }], { no_types: true });

  // Each operation returns DataFrame<any>, reassignment works
  df = df.mutate({ b: (r) => r.a * 2 });
  df = df.mutate({ c: (r) => r.b + 1 });
  df = df.leftJoin(createDataFrame([{ a: 1, extra: "x" }]), "a");

  expect(df.columns()).toEqual(["a", "b", "c", "extra"]);
});
*/

// ============================================================================
// CURRENT WORKAROUNDS (these actually compile and run)
// ============================================================================

// ============================================================================
// WORKAROUND: Build mutation object first, then apply once
// ============================================================================

Deno.test("workaround: build mutation object upfront", () => {
  const baseSummary = createDataFrame([
    { id: 1, name: "test" },
    { id: 2, name: "test2" },
  ]);

  // Simulate external results
  const results = {
    visit_diagnoses: createDataFrame([{ a: 1 }, { a: 2 }, { a: 3 }]),
    medications: createDataFrame([{ b: 1 }]),
  } as {
    visit_diagnoses?: DataFrame<{ a: number }>;
    medications?: DataFrame<{ b: number }>;
  };

  // Build all mutations upfront
  const mutations: Record<string, unknown> = {};

  if (results.visit_diagnoses) {
    mutations.num_visit_diagnoses = results.visit_diagnoses.nrows();
  }
  if (results.medications) {
    mutations.num_medications = results.medications.nrows();
  }

  // Single mutate call
  const result = baseSummary.mutate(mutations);

  expect(result.nrows()).toBe(2);
  expect(result.columns()).toContain("num_visit_diagnoses");
  expect(result.columns()).toContain("num_medications");
  expect(result.toArray()[0]).toEqual({
    id: 1,
    name: "test",
    num_visit_diagnoses: 3,
    num_medications: 1,
  });
});

Deno.test("workaround: build mutation object - partial conditions", () => {
  const baseSummary = createDataFrame([{ id: 1, name: "test" }]);

  // Only some conditions are true
  const results = {
    visit_diagnoses: createDataFrame([{ a: 1 }, { a: 2 }]),
    medications: undefined, // This one doesn't exist
  } as {
    visit_diagnoses?: DataFrame<{ a: number }>;
    medications?: DataFrame<{ b: number }>;
  };

  const mutations: Record<string, unknown> = {};

  if (results.visit_diagnoses) {
    mutations.num_visit_diagnoses = results.visit_diagnoses.nrows();
  }
  if (results.medications) {
    mutations.num_medications = results.medications.nrows();
  }

  const result = baseSummary.mutate(mutations);

  expect(result.columns()).toContain("num_visit_diagnoses");
  expect(result.columns()).not.toContain("num_medications");
  expect(result.toArray()[0]).toEqual({
    id: 1,
    name: "test",
    num_visit_diagnoses: 2,
  });
});

// ============================================================================
// WORKAROUND: leftJoin with reduce pattern
// ============================================================================

// deno-lint-ignore no-explicit-any
type AnyDataFrame = DataFrame<any>;

Deno.test("workaround: leftJoin with reduce pattern", () => {
  // Base summary
  const patients = createDataFrame([
    { pat_id: "P001", name: "Alice" },
    { pat_id: "P002", name: "Bob" },
    { pat_id: "P003", name: "Charlie" },
  ]);

  // Simulated query results (some patients have data, some don't)
  const results = {
    visit_diagnoses: createDataFrame([
      { pat_id: "P001", dx: "A01" },
      { pat_id: "P001", dx: "A02" },
      { pat_id: "P002", dx: "B01" },
    ]),
    labs: createDataFrame([{ pat_id: "P001", lab: "CBC" }]),
    medications: undefined as
      | DataFrame<{ pat_id: string; med: string }>
      | undefined,
  };

  // Build array of count DataFrames to join (need unknown cast due to DataFrame type bug)
  const countsToJoin: AnyDataFrame[] = [];

  if (results.visit_diagnoses?.nrows()) {
    countsToJoin.push(
      results.visit_diagnoses
        .groupBy("pat_id")
        .summarize({
          num_visit_diagnoses: (g) => g.nrows(),
        }) as unknown as AnyDataFrame,
    );
  }

  if (results.labs?.nrows()) {
    countsToJoin.push(
      results.labs
        .groupBy("pat_id")
        .summarize({ num_labs: (g) => g.nrows() }) as unknown as AnyDataFrame,
    );
  }

  if (results.medications?.nrows()) {
    countsToJoin.push(
      results.medications
        .groupBy("pat_id")
        .summarize({
          num_medications: (g) => g.nrows(),
        }) as unknown as AnyDataFrame,
    );
  }

  // Single reduce to apply all joins
  const summary = countsToJoin.reduce(
    (df, counts) => df.leftJoin(counts, "pat_id"),
    patients as unknown as AnyDataFrame,
  );

  expect(summary.nrows()).toBe(3);
  expect(summary.columns()).toContain("num_visit_diagnoses");
  expect(summary.columns()).toContain("num_labs");
  expect(summary.columns()).not.toContain("num_medications");

  const rows = summary.toArray();
  // P001 has 2 diagnoses and 1 lab
  expect(rows.find((r: { pat_id: string }) => r.pat_id === "P001")).toEqual({
    pat_id: "P001",
    name: "Alice",
    num_visit_diagnoses: 2,
    num_labs: 1,
  });
  // P002 has 1 diagnosis, no labs (undefined from left join)
  expect(rows.find((r: { pat_id: string }) => r.pat_id === "P002")).toEqual({
    pat_id: "P002",
    name: "Bob",
    num_visit_diagnoses: 1,
    num_labs: undefined,
  });
  // P003 has neither
  expect(rows.find((r: { pat_id: string }) => r.pat_id === "P003")).toEqual({
    pat_id: "P003",
    name: "Charlie",
    num_visit_diagnoses: undefined,
    num_labs: undefined,
  });
});

// ============================================================================

Deno.test("IDEAL: mutate skips undefined values", () => {
  const baseSummary = createDataFrame([
    { id: 1, name: "test" },
    { id: 2, name: "test2" },
  ]);

  const results = {
    visit_diagnoses: createDataFrame([{ a: 1 }, { a: 2 }, { a: 3 }]),
    medications: undefined as DataFrame<{ b: number }> | undefined,
  };

  // undefined values just don't create columns - no skipUndefined option needed
  // This is the natural behavior: "I want these columns if they exist"
  const result = baseSummary
    .mutate({
      num_visit_diagnoses: results.visit_diagnoses?.nrows(),
      num_medications: results.medications?.nrows(),
    });

  expect(result.columns()).toContain("num_visit_diagnoses");
  expect(result.columns()).not.toContain("num_medications"); // not added because undefined
});
