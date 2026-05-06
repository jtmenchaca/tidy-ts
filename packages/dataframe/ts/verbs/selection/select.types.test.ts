import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// Test data
const testData = createDataFrame([
  { name: "Alice", age: 25, city: "NYC", score: 85 },
  { name: "Bob", age: 30, city: "LA", score: 92 },
]);

// 1. Test specific column selection with type inference (rest parameters)
const selectedColumns = testData.select("name", "age");
const _selectedColumnsTypeCheck: DataFrame<{
  name: string;
  age: number;
}> = selectedColumns;

// 2. Test single column selection
const singleColumn = testData.select("name");
const _singleColumnTypeCheck: DataFrame<{
  name: string;
}> = singleColumn;

// 3. Select all columns explicitly
const allColumns = testData.select("name", "age", "city", "score");
const _allColumnsTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = allColumns;

// 4. Test column reordering
const reorderedColumns = testData.select("score", "name", "city");
const _reorderedTypeCheck: DataFrame<{
  score: number;
  name: string;
  city: string;
}> = reorderedColumns;
