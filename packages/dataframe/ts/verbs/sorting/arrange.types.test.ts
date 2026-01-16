import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

// Test data
const testData = createDataFrame([
  { name: "Alice", age: 25, city: "NYC", score: 85 },
  { name: "Bob", age: 30, city: "LA", score: 92 },
  { name: "Charlie", age: 22, city: "NYC", score: 78 },
]);

// 1. Test single column arrange (legacy API)
const singleColumnLegacy = testData.arrange("age");
const _singleColumnLegacyTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = singleColumnLegacy;

// 2. Test single column arrange with direction (legacy API)
const singleColumnWithDirection = testData.arrange("age", "desc");
const _singleColumnWithDirectionTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = singleColumnWithDirection;

// 3. Test multiple columns arrange (legacy API)
const multipleColumnsLegacy = testData.arrange(["city", "age"], [
  "asc",
  "desc",
]);
const _multipleColumnsLegacyTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = multipleColumnsLegacy;

// 4. Test rest parameters API
const restParams = testData.arrange("city", "age");
const _restParamsTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = restParams;

// 5. Test array syntax with single direction
const arrayWithDirection = testData.arrange(["age"], "desc");
const _arrayWithDirectionTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = arrayWithDirection;

// 6. Test array syntax with direction array
const arrayWithDirectionArray = testData.arrange(["city", "age"], [
  "asc",
  "desc",
]);
const _arrayWithDirectionArrayTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = arrayWithDirectionArray;

// 7. Test array syntax without descending (default ascending)
const arrayDefault = testData.arrange(["city", "age"]);
const _arrayDefaultTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = arrayDefault;
