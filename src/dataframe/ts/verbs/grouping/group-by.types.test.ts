import { createDataFrame, type GroupedDataFrame } from "@tidy-ts/dataframe";

// Test data
const testData = createDataFrame([
  { name: "Alice", age: 25, city: "NYC", score: 85, department: "Engineering" },
  { name: "Bob", age: 30, city: "LA", score: 92, department: "Engineering" },
  { name: "Charlie", age: 22, city: "NYC", score: 78, department: "Marketing" },
  { name: "Diana", age: 28, city: "LA", score: 88, department: "Marketing" },
]);

// 1. Test single column groupBy (rest parameters)
const singleColumnRest = testData.groupBy("city");
const _singleColumnRestTypeCheck: GroupedDataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
  department: string;
}, "city"> = singleColumnRest;

// 2. Test single column groupBy (array syntax)
const singleColumnArray = testData.groupBy(["city"]);
const _singleColumnArrayTypeCheck: GroupedDataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
  department: string;
}, "city"> = singleColumnArray;

// 3. Test multiple columns groupBy (rest parameters)
const multipleColumnsRest = testData.groupBy("city", "department");
const _multipleColumnsRestTypeCheck: GroupedDataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
  department: string;
}, "city" | "department"> = multipleColumnsRest;

// 4. Test multiple columns groupBy (array syntax)
const multipleColumnsArray = testData.groupBy(["city", "department"]);
const _multipleColumnsArrayTypeCheck: GroupedDataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
  department: string;
}, "city" | "department"> = multipleColumnsArray;

// 5. Test three columns groupBy (rest parameters)
const threeColumnsRest = testData.groupBy("city", "department", "age");
const _threeColumnsRestTypeCheck: GroupedDataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
  department: string;
}, "city" | "department" | "age"> = threeColumnsRest;

// 6. Test three columns groupBy (array syntax)
const threeColumnsArray = testData.groupBy(["city", "department", "age"]);
const _threeColumnsArrayTypeCheck: GroupedDataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
  department: string;
}, "city" | "department" | "age"> = threeColumnsArray;

// 7. Test no arguments groupBy (returns ungrouped)
const noArgsGroupBy = testData.groupBy();
const _noArgsGroupByTypeCheck: GroupedDataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
  department: string;
}, never> = noArgsGroupBy;
