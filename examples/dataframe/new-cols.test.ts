import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

Deno.test("Creating DataFrame from Columns", () => {
  // ============================================================================
  // 1. CREATING DATAFRAME FROM COLUMNS
  // ============================================================================
  console.log("=== Creating DataFrame from Columns ===\n");

  // Create DataFrame from columns
  const df1 = createDataFrame({
    columns: {
      name: ["Alice", "Bob", "Charlie", "Diana"],
      age: [25, 30, 28, 35],
      city: ["New York", "Los Angeles", "Chicago", "Houston"],
      score: [85, 92, 78, 88],
    },
  });

  console.log("DataFrame created from columns:");
  df1.print();

  // Type should be inferred correctly
  const _typeCheck1: DataFrame<{
    name: string;
    age: number;
    city: string;
    score: number;
  }> = df1;

  // ============================================================================
  // 2. ADDING NEW COLUMNS FROM ARRAYS USING MUTATE
  // ============================================================================
  console.log("\n=== Adding New Columns from Arrays Using Mutate ===\n");

  // Start with a base dataframe
  const baseDF = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
    { id: 3, name: "Charlie", age: 28 },
    { id: 4, name: "Diana", age: 35 },
  ]);

  console.log("Base DataFrame:");
  baseDF.print();

  // Method 1: Add single column using array with mutate
  const withScore = baseDF.mutate({
    score: [85, 92, 78, 88], // Array directly, not a function!
  });

  console.log("\nAfter adding score column with mutate (array):");
  withScore.print();

  // Type check - mutate returns proper typed DataFrame
  const _typeCheck2: DataFrame<{
    id: number;
    name: string;
    age: number;
    score: number;
  }> = withScore;

  // Method 2: Mix arrays, functions, and scalars in one mutate
  const withMultiple = baseDF
    .mutate({
      score: [85, 92, 78, 88], // Array of values
      grade: ["B", "A", "C", "B"], // Another array
      passed: [true, true, false, true], // Boolean array
      doubled_age: (row: { id: number; name: string; age: number }) =>
        row.age * 2, // Function (computed)
      school: "Springfield High", // Scalar (repeated for all rows)
    });

  console.log("\nAfter adding multiple columns (arrays, functions, scalars):");
  withMultiple.print();

  // Type check for multiple columns
  const _typeCheck3: DataFrame<{
    id: number;
    name: string;
    age: number;
    score: number;
    grade: string;
    passed: boolean;
    doubled_age: number;
    school: string;
  }> = withMultiple;
  console.log(
    "Type check 3 passed:",
    _typeCheck3.columns().includes("doubled_age"),
  );

  // Method 3: Column assignment via property setter (runtime only)
  // This still works but requires @ts-ignore
  const mutableDF = createDataFrame([
    { id: 1, name: "Alice", age: 25 },
    { id: 2, name: "Bob", age: 30 },
    { id: 3, name: "Charlie", age: 28 },
  ]);

  // @ts-ignore - TypeScript can't track dynamic column additions
  mutableDF.score = [85, 92, 78];

  console.log("\nColumn assignment via property setter (runtime mutation):");
  mutableDF.print();

  // ============================================================================
  // 3. ERROR CASES
  // ============================================================================
  console.log("\n=== Error Cases ===\n");

  // This should ideally give a compile error - both rows and columns specified
  // Note: In practice, this would need to be handled at runtime since TypeScript
  // can't enforce mutual exclusivity of object properties in a single overload
  try {
    const invalidInput = {
      rows: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      columns: {
        age: [25, 30],
        city: ["New York", "Los Angeles"],
      },
      // deno-lint-ignore no-explicit-any
    } as any; // Cast to any to bypass TypeScript checking for this error test

    const _errorDF = createDataFrame(invalidInput);
    console.log("ERROR: Should have thrown for both rows and columns");
  } catch (error) {
    console.log("✅ Correctly threw error for both rows and columns specified");
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
  }

  // This should throw runtime error - mismatched array lengths
  try {
    const _mismatchDF = createDataFrame({
      columns: {
        name: ["Alice", "Bob", "Charlie"], // 3 elements
        age: [25, 30], // 2 elements - mismatch!
      },
    });
    console.log("ERROR: Should have thrown for mismatched column lengths");
  } catch (error) {
    console.log("✅ Correctly threw error for mismatched column lengths");
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
  }

  // This should throw runtime error - assigning wrong length array
  try {
    const df = createDataFrame([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" },
    ]);

    // @ts-ignore - TypeScript can't track dynamic column additions
    df.score = [1, 2]; // Only 2 values for 3 rows
  } catch (error) {
    console.log("✅ Correctly threw error for mismatched array assignment");
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
  }
});
