import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("transpose - simple strings and numbers", () => {
  // Original DataFrame: 2 rows, 3 columns
  const original = createDataFrame([
    { name: "Alice", age: 25, score: 95.5 },
    { name: "Bob", age: 30, score: 87.2 },
  ]);

  const _originalTypeCheck: DataFrame<{
    name: string;
    age: number;
    score: number;
  }> = original;

  console.log("Original:");
  original.print();

  // First transpose (no ROW_LABEL column) - creates symbol column + row_* columns
  const transposed = original.transpose({ number_of_rows: 2 }); // 2 = original.nrows()

  // Type should include ROW_LABEL + row types storage + row_0, row_1 columns
  const _typeCheck: DataFrame<{
    "__tidy_row_label__": "name" | "age" | "score";
    "__tidy_row_types__": { name: string; age: number; score: number };
    row_0: string | number;
    row_1: string | number;
  }> = transposed;

  console.log("Transposed:");
  transposed.print();

  // setRowLabels adds the ROW_LABEL symbol column with literal types
  const originalWithRowLabels = original
    .setRowLabels(["first_row", "second_row"]);

  // Type should include ROW_LABEL column with literal row label values
  const _originalWithRowLabelsTypeCheck: DataFrame<{
    "__tidy_row_label__": "first_row" | "second_row";
    name: string;
    age: number;
    score: number;
  }> = originalWithRowLabels;

  const transposedWithRowLabels = originalWithRowLabels
    .transpose({ number_of_rows: 2 }); // 2 = original.nrows()

  // Type should have ROW_LABEL with original column names + row types metadata + columns from row labels
  const _typeCheckWithRowLabels: DataFrame<{
    "__tidy_row_label__": "name" | "age" | "score";
    "__tidy_row_types__": { name: string; age: number; score: number };
    first_row: string | number;
    second_row: string | number;
  }> = transposedWithRowLabels;

  console.log("Transposed:");
  transposedWithRowLabels.print();

  const backToOriginal = transposedWithRowLabels.transpose({
    number_of_rows: 3,
  });

  backToOriginal.print();

  // Double transpose should restore structure + have ROW_LABEL with row labels
  // Should restore exact original types: name: string, age: number, score: number
  const _backToOriginalTypeCheck: DataFrame<{
    "__tidy_row_label__": "first_row" | "second_row";
    "__tidy_row_types__": {
      "first_row": string | number;
      "second_row": string | number;
    };
    name: string;
    age: number;
    score: number;
  }> = backToOriginal;

  // Runtime verification - check that data is preserved correctly
  const originalData = original.toArray();
  const backToOriginalData = backToOriginal.toArray();

  expect(originalData[0].name).toBe("Alice");
  expect(originalData[1].name).toBe("Bob");
  expect(backToOriginalData[0].name).toBe("Alice");
  expect(backToOriginalData[1].name).toBe("Bob");
});

Deno.test("transpose - mutate operations on transposed data", () => {
  const original = createDataFrame([
    { name: "Alice", age: 25, score: 95.5 },
    { name: "Bob", age: 30, score: 87.2 },
  ]);

  const transposed = original.transpose({ number_of_rows: 2 });

  // Mutate on transposed data - should preserve transpose structure
  const mutated = transposed.mutate({
    row_0_doubled: (row) =>
      typeof row.row_0 === "number" ? row.row_0 * 2 : row.row_0,
    row_1_doubled: (row) =>
      typeof row.row_1 === "number" ? row.row_1 * 2 : row.row_1,
  });

  // Type should include original transpose columns + new mutated columns
  const _mutatedTypeCheck: DataFrame<{
    "__tidy_row_label__": "name" | "age" | "score";
    "__tidy_row_types__": { name: string; age: number; score: number };
    row_0: string | number;
    row_1: string | number;
    row_0_doubled: string | number;
    row_1_doubled: string | number;
  }> = mutated;

  console.log("Mutated transposed data:");
  mutated.print();

  // Test with row labels
  const originalWithRowLabels = original.setRowLabels(["person1", "person2"]);
  const transposedWithRowLabels = originalWithRowLabels.transpose({
    number_of_rows: 2,
  });

  const mutatedWithRowLabels = transposedWithRowLabels.mutate({
    person1_processed: (row) => `processed_${row.person1}`,
    person2_processed: (row) => `processed_${row.person2}`,
  });

  // Type should preserve row label column names + add new columns
  const _mutatedWithRowLabelsTypeCheck: DataFrame<{
    "__tidy_row_label__": "name" | "age" | "score";
    "__tidy_row_types__": { name: string; age: number; score: number };
    person1: string | number;
    person2: string | number;
    person1_processed: string;
    person2_processed: string;
  }> = mutatedWithRowLabels;

  console.log("Mutated transposed data with row labels:");
  mutatedWithRowLabels.print();
});

Deno.test("transpose - filter operations on transposed data", () => {
  const original = createDataFrame([
    { name: "Alice", age: 25, score: 95.5 },
    { name: "Bob", age: 30, score: 87.2 },
    { name: "Charlie", age: 35, score: 78.9 },
  ]);

  const transposed = original.transpose({ number_of_rows: 3 });

  // Filter on transposed data - should preserve transpose structure
  const filtered = transposed.filter((row) => {
    // Filter rows where the row label is "age" or "score" (numeric columns)
    return row.__tidy_row_label__ === "age" ||
      row.__tidy_row_label__ === "score";
  });

  // Type should preserve transpose structure but with filtered row labels
  // @ts-expect-error - This is a known issue, will need to fix that the row label is not filtered
  const _filteredTypeCheck: DataFrame<{
    __tidy_row_label__: "age" | "score";
    __tidy_row_types__: { name: string; age: number; score: number };
    row_0: string | number;
    row_1: string | number;
    row_2: string | number;
  }> = filtered;

  console.log("Filtered transposed data (only numeric columns):");
  filtered.print();

  // Test filtering on actual data values
  const filteredByValues = transposed.filter((row) => {
    // Filter rows where any of the row values is greater than 30
    return (typeof row.row_0 === "number" && row.row_0 > 30) ||
      (typeof row.row_1 === "number" && row.row_1 > 30) ||
      (typeof row.row_2 === "number" && row.row_2 > 30);
  });

  console.log("Filtered transposed data (values > 30):");
  filteredByValues.print();

  // Test with row labels
  const originalWithRowLabels = original.setRowLabels([
    "alice",
    "bob",
    "charlie",
  ]);
  const transposedWithRowLabels = originalWithRowLabels.transpose({
    number_of_rows: 3,
  });

  const filteredWithRowLabels = transposedWithRowLabels.filter((row) => {
    // Filter rows where the row label is "age" or "score"
    return row.__tidy_row_label__ === "age" ||
      row.__tidy_row_label__ === "score";
  });

  // Type should preserve row label column names but with filtered row labels
  // @ts-expect-error - This is a known issue, will need to fix that the row label is not filtered
  const _filteredWithRowLabelsTypeCheck: DataFrame<{
    "__tidy_row_label__": "age" | "score";
    "__tidy_row_types__": { name: string; age: number; score: number };
    alice: string | number;
    bob: string | number;
    charlie: string | number;
  }> = filteredWithRowLabels;

  console.log("Filtered transposed data with row labels:");
  filteredWithRowLabels.print();
});

Deno.test("transpose - complex chain operations", () => {
  const original = createDataFrame([
    { name: "Alice", age: 25, score: 95.5 },
    { name: "Bob", age: 30, score: 87.2 },
    { name: "Charlie", age: 35, score: 78.9 },
  ]);

  const originalWithRowLabels = original.setRowLabels([
    "alice",
    "bob",
    "charlie",
  ]);

  // Complex chain: transpose -> filter -> mutate -> arrange
  const result = originalWithRowLabels
    .transpose({ number_of_rows: 3 })
    .filter((row) =>
      row.__tidy_row_label__ === "age" || row.__tidy_row_label__ === "score"
    )
    .mutate({
      alice_normalized: (row) =>
        typeof row.alice === "number" ? row.alice / 100 : row.alice,
      bob_normalized: (row) =>
        typeof row.bob === "number" ? row.bob / 100 : row.bob,
      charlie_normalized: (row) =>
        typeof row.charlie === "number" ? row.charlie / 100 : row.charlie,
    })
    .arrange("__tidy_row_label__");

  // Type should reflect the entire chain: transpose structure + filtered row labels + new columns
  // @ts-expect-error - This is a known issue, will need to fix that the row label is not filtered
  const _complexChainTypeCheck: DataFrame<{
    "__tidy_row_label__": "age" | "score";
    "__tidy_row_types__": { name: string; age: number; score: number };
    alice: string | number;
    bob: string | number;
    charlie: string | number;
    alice_normalized: string | number;
    bob_normalized: string | number;
    charlie_normalized: string | number;
  }> = result;

  console.log("Complex chain result:");
  result.print();

  // Verify the data makes sense
  const data = result.toArray();
  expect(data).toHaveLength(2); // Should have 2 rows (age and score)
  expect(data[0].__tidy_row_label__).toBe("age");
  expect(data[1].__tidy_row_label__).toBe("score");
});
