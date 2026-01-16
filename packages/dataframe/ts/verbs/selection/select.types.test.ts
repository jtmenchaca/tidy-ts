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

// 2. Test array syntax for column selection
const selectedColumnsArray = testData.select(["name", "age"]);
const _selectedColumnsArrayTypeCheck: DataFrame<{
  name: string;
  age: number;
}> = selectedColumnsArray;

// 3. Test single column selection (rest parameters)
const singleColumn = testData.select("name");
const _singleColumnTypeCheck: DataFrame<{
  name: string;
}> = singleColumn;

// 4. Test single column selection (array syntax)
const singleColumnArray = testData.select(["name"]);
const _singleColumnArrayTypeCheck: DataFrame<{
  name: string;
}> = singleColumnArray;

// 5. Select all columns explicitly (rest parameters)
const allColumns = testData.select("name", "age", "city", "score");
const _allColumnsTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = allColumns;

// 6. Select all columns explicitly (array syntax)
const allColumnsArray = testData.select(["name", "age", "city", "score"]);
const _allColumnsArrayTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = allColumnsArray;

// 7. Test column reordering (rest parameters)
const reorderedColumns = testData.select("score", "name", "city");
const _reorderedTypeCheck: DataFrame<{
  score: number;
  name: string;
  city: string;
}> = reorderedColumns;

// 8. Test column reordering (array syntax)
const reorderedColumnsArray = testData.select(["score", "name", "city"]);
const _reorderedArrayTypeCheck: DataFrame<{
  score: number;
  name: string;
  city: string;
}> = reorderedColumnsArray;
