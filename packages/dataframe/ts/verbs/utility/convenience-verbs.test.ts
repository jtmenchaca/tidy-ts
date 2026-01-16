import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("Convenience Verbs - append, prepend, shuffle", () => {
  // ============================================================================
  // Test Data Setup
  // ============================================================================

  const baseData = createDataFrame([
    { name: "Alice", age: 25, score: 85 },
    { name: "Bob", age: 30, score: 92 },
  ]);

  console.log("Base data:");
  baseData.print();

  // ============================================================================
  // Append Tests
  // ============================================================================

  console.log("\n=== Append Tests ===");

  // Test 1: Append single row
  const appendedOne = baseData.append({ name: "Carol", age: 28, score: 88 });

  console.log("After appending one row:");
  appendedOne.print();

  expect(appendedOne.nrows()).toBe(3);
  expect(appendedOne[0].name).toBe("Alice"); // Original first
  expect(appendedOne[1].name).toBe("Bob"); // Original second
  expect(appendedOne[2].name).toBe("Carol"); // Appended last

  // Test 2: Append multiple rows
  const appendedMultiple = baseData.append(
    { name: "David", age: 32, score: 76 },
    { name: "Eve", age: 27, score: 94 },
  );

  console.log("After appending multiple rows:");
  appendedMultiple.print();

  expect(appendedMultiple.nrows()).toBe(4);
  expect(appendedMultiple[2].name).toBe("David");
  expect(appendedMultiple[3].name).toBe("Eve");

  // Test 3: Append to empty DataFrame
  const emptyData = createDataFrame([] as { name: string; age: number }[]);
  const appendedToEmpty = emptyData.append(
    { name: "First", age: 20 },
    { name: "Second", age: 25 },
  );

  expect(appendedToEmpty.nrows()).toBe(2);
  expect(appendedToEmpty[0].name).toBe("First");

  // ============================================================================
  // Prepend Tests
  // ============================================================================

  console.log("\n=== Prepend Tests ===");

  // Test 1: Prepend single row
  const prependedOne = baseData.prepend({ name: "Zero", age: 20, score: 80 });

  console.log("After prepending one row:");
  prependedOne.print();

  expect(prependedOne.nrows()).toBe(3);
  expect(prependedOne[0].name).toBe("Zero"); // Prepended first
  expect(prependedOne[1].name).toBe("Alice"); // Original moved down
  expect(prependedOne[2].name).toBe("Bob"); // Original moved down

  // Test 2: Prepend multiple rows
  const prependedMultiple = baseData.prepend(
    { name: "First", age: 22, score: 78 },
    { name: "Second", age: 24, score: 82 },
  );

  console.log("After prepending multiple rows:");
  prependedMultiple.print();

  expect(prependedMultiple.nrows()).toBe(4);
  expect(prependedMultiple[0].name).toBe("First"); // Prepended
  expect(prependedMultiple[1].name).toBe("Second"); // Prepended
  expect(prependedMultiple[2].name).toBe("Alice"); // Original
  expect(prependedMultiple[3].name).toBe("Bob"); // Original

  // Test 3: Prepend to empty DataFrame
  const prependedToEmpty = emptyData.prepend(
    { name: "Header", age: 0 },
  );

  expect(prependedToEmpty.nrows()).toBe(1);
  expect(prependedToEmpty[0].name).toBe("Header");

  // ============================================================================
  // Shuffle Tests
  // ============================================================================

  console.log("\n=== Shuffle Tests ===");

  // Create larger dataset for better shuffle testing
  const largeData = createDataFrame([
    { id: 1, value: "A" },
    { id: 2, value: "B" },
    { id: 3, value: "C" },
    { id: 4, value: "D" },
    { id: 5, value: "E" },
    { id: 6, value: "F" },
    { id: 7, value: "G" },
    { id: 8, value: "H" },
  ]);

  console.log("Original order:");
  console.log(largeData.extract("id"));

  // Test 1: Basic shuffle
  const shuffled1 = largeData.shuffle();
  const shuffled2 = largeData.shuffle();

  console.log("Shuffled order 1:", shuffled1.extract("id"));
  console.log("Shuffled order 2:", shuffled2.extract("id"));

  // Should have same number of rows and columns
  expect(shuffled1.nrows()).toBe(8);
  expect(shuffled1.ncols()).toBe(2);

  // Should have same values, just different order
  const originalIds = largeData.extract("id").sort();
  const shuffledIds = shuffled1.extract("id").sort();
  expect(shuffledIds).toEqual(originalIds);

  // Two shuffles should very likely be different (not guaranteed, but very probable)
  const order1 = shuffled1.extract("id");
  const order2 = shuffled2.extract("id");
  const isDifferent = !order1.every((val, i) => val === order2[i]);
  console.log("Two shuffles are different:", isDifferent);

  // Test 2: Shuffle empty DataFrame
  const emptyShuffled = emptyData.shuffle();
  expect(emptyShuffled.nrows()).toBe(0);

  // Test 3: Shuffle single row
  const singleRow = createDataFrame([{ id: 1, name: "Only" }]);
  const singleShuffled = singleRow.shuffle();
  expect(singleShuffled.nrows()).toBe(1);
  expect(singleShuffled[0].name).toBe("Only");

  // ============================================================================
  // Chaining Tests
  // ============================================================================

  console.log("\n=== Chaining Tests ===");

  // Test combining multiple convenience verbs
  const chained = baseData
    .prepend({ name: "Header", age: 0, score: 0 })
    .append({ name: "Footer", age: 99, score: 100 })
    .shuffle();

  console.log("After chaining prepend + append + shuffle:");
  chained.print();

  expect(chained.nrows()).toBe(4);

  // Should contain all expected names
  const names = chained.extract("name").sort();
  expect(names).toEqual(["Alice", "Bob", "Footer", "Header"]);

  // ============================================================================
  // Immutability Tests
  // ============================================================================

  console.log("\n=== Immutability Tests ===");

  // Original DataFrame should remain unchanged
  const originalNames = baseData.extract("name");

  baseData.append({ name: "New", age: 35, score: 90 });
  baseData.prepend({ name: "Before", age: 18, score: 70 });
  baseData.shuffle();

  const stillOriginalNames = baseData.extract("name");
  expect(stillOriginalNames).toEqual(originalNames);
  expect(baseData.nrows()).toBe(2); // Still original size

  console.log("Original DataFrame unchanged:", stillOriginalNames);

  console.log("✅ All convenience verb tests passed!");
});
