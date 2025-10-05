import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("count() shorthand - basic usage", () => {
  const messages = createDataFrame([
    { user_role: "Clinician", tofrom_pat_c: "1" },
    { user_role: "Clinician", tofrom_pat_c: "2" },
    { user_role: "RN", tofrom_pat_c: "1" },
    { user_role: "MA", tofrom_pat_c: "1" },
    { user_role: "Clinician", tofrom_pat_c: "1" },
  ]);

  // Verbose version
  const verbose = messages
    .groupBy("user_role")
    .summarize({
      n: (g) => g.nrows(),
    });

  // Shorthand version
  const result = messages.count("user_role");

  verbose.print();
  result.print();

  expect(verbose.nrows()).toBe(3);
  expect(result.nrows()).toBe(3);

  // Both should produce the same result
  expect(result.toArray()).toEqual(verbose.toArray());
});

Deno.test("count() with multiple variables", () => {
  const messages = createDataFrame([
    { user_role: "Clinician", tofrom_pat_c: "1" },
    { user_role: "Clinician", tofrom_pat_c: "2" },
    { user_role: "RN", tofrom_pat_c: "1" },
    { user_role: "MA", tofrom_pat_c: "1" },
    { user_role: "Clinician", tofrom_pat_c: "1" },
  ]);

  // Verbose version
  const verbose = messages
    .groupBy("user_role", "tofrom_pat_c")
    .summarize({
      n: (g) => g.nrows(),
    });

  // Shorthand version
  const result = messages.count("user_role", "tofrom_pat_c");

  verbose.print();
  result.print();

  expect(verbose.nrows()).toBe(4);
  expect(result.nrows()).toBe(4);

  // Both should produce the same result
  expect(result.toArray()).toEqual(verbose.toArray());
});
