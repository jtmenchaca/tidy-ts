import { expect } from "@std/expect";
import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

// Test data
const testData = createDataFrame([
  { id: 1, name: "Alice", score: 85, grade: "B" },
  { id: 2, name: "Bob", score: 92, grade: "A" },
  { id: 3, name: "Charlie", score: 78, grade: "C" },
  { id: 4, name: "Diana", score: 95, grade: "A" },
  { id: 5, name: "Eve", score: 88, grade: "B" },
]);

const sparseData = createDataFrame([
  { a: 1, b: 2, c: undefined },
  { a: 3, b: undefined, c: 4 },
  { a: undefined, b: 5, c: 6 },
  { a: 7, b: 8, c: 9 },
]);

Deno.test("for_each_row - basic iteration", () => {
  const rows: Array<
    { id: number; name: string; score: number; grade: string }
  > = [];
  const indices: number[] = [];

  const result = testData.forEachRow((row, idx) => {
    rows.push({ ...row });
    indices.push(idx);
  });

  // Should return the same DataFrame
  expect(result.toArray()).toEqual(testData.toArray());

  // Should iterate all rows in order
  expect(rows.length).toBe(5);
  expect(rows[0].name).toBe("Alice");
  expect(rows[4].name).toBe("Eve");

  // Should provide correct indices
  expect(indices).toEqual([0, 1, 2, 3, 4]);
});

Deno.test("for_each_row - has access to DataFrame", () => {
  let capturedDf:
    | DataFrame<{ id: number; name: string; score: number; grade: string }>
    | undefined;

  testData.forEachRow((_row, _idx, df) => {
    capturedDf = df;
  });

  expect(capturedDf).toBe(testData);
});

Deno.test("for_each_row - chaining works", () => {
  const collected: string[] = [];

  const result = testData
    .forEachRow((row) => {
      collected.push(row.name);
    })
    .filter((row) => row.score >= 90)
    .forEachRow((row) => {
      collected.push(`High scorer: ${row.name}`);
    });

  expect(collected).toEqual([
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve",
    "High scorer: Bob",
    "High scorer: Diana",
  ]);

  expect(result.nrows()).toBe(2);
});

Deno.test("for_each_row - empty DataFrame", () => {
  const emptyData: { id: number; name: string; age: number }[] = [];

  const emptyDf = createDataFrame(emptyData);
  let callCount = 0;

  const result = emptyDf
    .forEachRow(() => {
      callCount++;
    });

  expect(result.toArray()).toEqual(emptyDf.toArray());
  expect(callCount).toBe(0);
});

Deno.test("for_each_col - basic iteration", () => {
  const columns: Record<string, unknown[]> = {};
  const names: string[] = [];

  const result = testData.forEachCol((colName, df) => {
    const colNameStr = String(colName);
    columns[colNameStr] = [...df[colName]];
    names.push(colNameStr);
  });

  // Should return the same DataFrame (reference equality)
  expect(result).toBe(testData);

  // Should iterate all columns
  expect(names.sort()).toEqual(["grade", "id", "name", "score"]);

  // Should provide correct column values
  expect(columns.id).toEqual([1, 2, 3, 4, 5]);
  expect(columns.name).toEqual(["Alice", "Bob", "Charlie", "Diana", "Eve"]);
  expect(columns.score).toEqual([85, 92, 78, 95, 88]);
  expect(columns.grade).toEqual(["B", "A", "C", "A", "B"]);
});

Deno.test("for_each_col - sparse columns include undefined", () => {
  const columns: Record<string, unknown[]> = {};

  sparseData.forEachCol((colName, df) => {
    const colNameStr = String(colName);
    columns[colNameStr] = [...df[colName]];
  });

  // Column 'a' should have undefined where missing
  expect(columns.a).toEqual([1, 3, undefined, 7]);

  // Column 'b' should have undefined where missing
  expect(columns.b).toEqual([2, undefined, 5, 8]);

  // Column 'c' should have undefined where missing
  expect(columns.c).toEqual([undefined, 4, 6, 9]);
});

Deno.test("forEachCol - first-seen order for column names", () => {
  const names: string[] = [];

  sparseData.forEachCol((colName, _df) => {
    names.push(String(colName));
  });

  // Should be in first-seen order: a, b (from row 0), then c (from row 1)
  expect(names).toEqual(["a", "b", "c"]);
});

Deno.test("forEachCol - has access to DataFrame", () => {
  let capturedDf:
    | DataFrame<{ id: number; name: string; score: number; grade: string }>
    | undefined;

  testData
    .forEachCol((_colName, df) => {
      capturedDf = df;
    });

  expect(capturedDf).toBe(testData);
});

Deno.test("forEachCol - chaining works", () => {
  const statValues: Record<string, number> = {};

  const result = testData
    .select("id", "score")
    .forEachCol((colName, df) => {
      if (colName === "score") {
        statValues.mean = stats.mean(df.score);
      }
    })
    .mutate({ normalized: (row) => row.score / 100 });

  expect(statValues.mean).toBeCloseTo(87.6, 1);
  expect(result.nrows()).toBe(5);
  expect(result[0].normalized).toBe(0.85);
});

Deno.test("forEachCol - empty DataFrame", () => {
  const emptyDf = createDataFrame([]);
  let callCount = 0;

  // @ts-expect-error - empty dataframe
  const result = emptyDf.forEachCol(() => {
    callCount++;
  });

  expect(result.toArray()).toEqual([]);
  expect(callCount).toBe(0);
});

Deno.test("forEachRow - grouped DataFrame preserves groups", () => {
  const grouped = testData.groupBy("grade");
  const grades: string[] = [];

  const result = grouped.forEachRow((row) => {
    grades.push(row.grade);
  });

  // Should preserve grouping metadata (cast to check internal structure)
  expect(result.__groups).toBeDefined();
  expect(result.__groups?.groupingColumns).toEqual(["grade"]);

  // Should preserve the GroupedDataFrame type
  expect(result.toArray()).toEqual(grouped.toArray());

  // Should iterate all rows
  expect(grades.sort()).toEqual(["A", "A", "B", "B", "C"]);

  // Can continue with grouped operations
  const summary = result.summarise({
    count: (df) => df.nrows(),
    avg_score: (df) => stats.mean(df.score),
  });

  expect(summary.nrows()).toBe(3);
});

Deno.test("forEachCol - grouped DataFrame works", () => {
  const grouped = testData.groupBy("grade");
  const colNames: string[] = [];

  const result = grouped.forEachCol((colName, _df) => {
    colNames.push(String(colName));
  });

  // Should preserve grouping metadata
  expect(result.__groups).toBeDefined();

  // Should still iterate all columns
  expect(colNames.sort()).toEqual(["grade", "id", "name", "score"]);
});

Deno.test("forEachRow - side effects example", () => {
  const sideEffects: string[] = [];

  testData
    .forEachRow((row) => {
      // Simulate side effect like sending email
      if (row.score >= 90) {
        sideEffects.push(`Congratulations ${row.name}!`);
      }
    })
    .forEachRow((row) => {
      // Another side effect
      if (row.grade === "C") {
        sideEffects.push(`${row.name} needs help`);
      }
    });

  expect(sideEffects).toEqual([
    "Congratulations Bob!",
    "Congratulations Diana!",
    "Charlie needs help",
  ]);
});

Deno.test("forEachCol - completeness analysis example", () => {
  const completeness: Record<string, number> = {};

  sparseData.forEachCol((colName, df) => {
    const filled = df[colName].filter((v) => v !== null && v !== undefined)
      .length;
    completeness[String(colName)] = filled / df[colName].length;
  });

  expect(completeness.a).toBeCloseTo(0.75, 2); // 3/4 filled
  expect(completeness.b).toBeCloseTo(0.75, 2); // 3/4 filled
  expect(completeness.c).toBeCloseTo(0.75, 2); // 3/4 filled
});

Deno.test("forEach methods - type safety", () => {
  // Type tests - these should compile
  const _typeCheck1: DataFrame<
    { id: number; name: string; score: number; grade: string }
  > = testData.forEachRow((row) => {
    const _: Readonly<
      { id: number; name: string; score: number; grade: string }
    > = row;
  });

  const _typeCheck2: DataFrame<
    { id: number; name: string; score: number; grade: string }
  > = testData.forEachCol((colName, df) => {
    const _: ReadonlyArray<string | number> = df[colName];
    const __: keyof { id: number; name: string; score: number; grade: string } =
      colName;
  });

  // Chaining preserves types
  const _typeCheck3: DataFrame<{ id: number; normalized: number }> = testData
    .select("id", "score")
    .forEachRow(() => {})
    .mutate({ normalized: (row) => row.score / 100 })
    .forEachCol(() => {})
    .drop("score");
});

Deno.test("forEachRow - exception propagation", () => {
  expect(() => {
    testData.forEachRow((_row, idx) => {
      if (idx === 2) {
        throw new Error("Test error");
      }
    });
  }).toThrow("Test error");
});

Deno.test("forEachCol - exception propagation", () => {
  expect(() => {
    testData.forEachCol((colName) => {
      if (colName === "score") {
        throw new Error("Column error");
      }
    });
  }).toThrow("Column error");
});

Deno.test("forEach methods - reference equality", () => {
  const result1 = testData.forEachRow(() => {});
  const result2 = testData.forEachCol(() => {});

  // Should return the exact same object reference
  expect(result1).toBe(testData);
  expect(result2).toBe(testData);
});
