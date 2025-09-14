import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import {
  as_date,
  as_integer,
  as_logical,
  as_number,
  as_string,
} from "./index.ts";
import { expect } from "@std/expect";

console.log("Running convert type checking tests...");

// Note: Removed penguins dataset loading - outdated test data

const testData1 = [
  {
    name: "Alice",
    age: "25",
    score: "85.5",
    active: "true",
    birth_date: "1990-01-15",
    salary: "$1,234.56",
    empty: "",
    null_val: null,
    undefined_val: undefined,
  },
  {
    name: "Bob",
    age: "30",
    score: "92.0",
    active: "false",
    birth_date: "1985-06-20",
    salary: "$2,500.00",
    empty: "NA",
    null_val: null,
    undefined_val: undefined,
  },
  {
    name: "Charlie",
    age: "28",
    score: "78.25",
    active: "yes",
    birth_date: "1988-12-10",
    salary: "$1,800.75",
    empty: "null",
    null_val: null,
    undefined_val: undefined,
  },
];

// Test data for various conversion scenarios
const testData = createDataFrame(testData1);

// 1. Test as_number conversion
const numberConversion = testData.mutate({
  age_number: (r) => as_number(r.age),
  score_number: (r) => as_number(r.score),
  salary_number: (r) => as_number(r.salary),
  empty_number: (r) => as_number(r.empty),
  null_number: (r) => as_number(r.null_val),
});

const _numberTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  age_number: number | null;
  score_number: number | null;
  salary_number: number | null;
  empty_number: number | null;
  null_number: number | null;
}> = numberConversion;

console.log("as_number type checking passed!");

// 2. Test as_integer conversion
const integerConversion = testData.mutate({
  age_integer: (r) => as_integer(r.age),
  score_integer: (r) => as_integer(r.score),
  salary_integer: (r) => as_integer(r.salary),
});

const _integerTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  age_integer: number | null;
  score_integer: number | null;
  salary_integer: number | null;
}> = integerConversion;

console.log("as_integer type checking passed!");

// 3. Test as_string conversion
const stringConversion = testData.mutate({
  age_string: (r) => as_string(r.age),
  null_string: (r) => as_string(r.null_val),
  undefined_string: (r) => as_string(r.undefined_val),
  empty_string: (r) => as_string(r.empty),
});

const _stringTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  age_string: string;
  null_string: string;
  undefined_string: string;
  empty_string: string;
}> = stringConversion;

console.log("as_string type checking passed!");

// 4. Test as_logical conversion
const logicalConversion = testData.mutate({
  active_logical: (r) => as_logical(r.active),
  age_logical: (r) => as_logical(r.age),
  null_logical: (r) => as_logical(r.null_val),
});

const _logicalTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  active_logical: boolean | null;
  age_logical: boolean | null;
  null_logical: boolean | null;
}> = logicalConversion;

console.log("as_logical type checking passed!");

// 5. Test as_date conversion
const dateConversion = testData.mutate({
  birth_date_obj: (r) => as_date(r.birth_date),
  timestamp_date: () => as_date(1640995200000), // 2022-01-01
  null_date: (r) => as_date(r.null_val),
});

const _dateTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  birth_date_obj: Date | null;
  timestamp_date: Date | null;
  null_date: Date | null;
}> = dateConversion;

console.log("as_date type checking passed!");

// 5a. Test as_date numeric scales and edge cases
Deno.test("as_date - numeric epoch scales", () => {
  // Test seconds (should multiply by 1000)
  const secondsDate = as_date(1700000000);
  expect(secondsDate).toBeInstanceOf(Date);
  expect(secondsDate?.toISOString().startsWith("2023")).toBe(true);

  // Test milliseconds (should use as-is)
  const msDate = as_date(1700000000000);
  expect(msDate).toBeInstanceOf(Date);
  expect(msDate?.toISOString().startsWith("2023")).toBe(true);

  // Test microseconds (should divide by 1000)
  const microsDate = as_date(1700000000000000);
  expect(microsDate).toBeInstanceOf(Date);
  expect(microsDate?.toISOString().startsWith("2023")).toBe(true);

  // Test nanoseconds (should divide by 1000000)
  const nanosDate = as_date(1700000000000000000);
  expect(nanosDate).toBeInstanceOf(Date);
  expect(nanosDate?.toISOString().startsWith("2023")).toBe(true);
});

Deno.test("as_date - ISO timestamp formats", () => {
  // Test strict YYYY-MM-DD (UTC)
  const dateOnly = as_date("2024-01-02");
  expect(dateOnly).toBeInstanceOf(Date);
  expect(dateOnly?.getUTCFullYear()).toBe(2024);
  expect(dateOnly?.getUTCMonth()).toBe(0); // January is 0
  expect(dateOnly?.getUTCDate()).toBe(2);

  // Test full ISO with milliseconds
  const fullISO = as_date("2024-01-02T03:04:05.123Z");
  expect(fullISO).toBeInstanceOf(Date);
  expect(fullISO?.getUTCMilliseconds()).toBe(123);

  // Test variable-length fractional seconds
  const oneDigit = as_date("2024-01-02T03:04:05.7Z");
  expect(oneDigit).toBeInstanceOf(Date);
  expect(oneDigit?.getUTCMilliseconds()).toBe(700);

  const twoDigits = as_date("2024-01-02T03:04:05.42Z");
  expect(twoDigits).toBeInstanceOf(Date);
  expect(twoDigits?.getUTCMilliseconds()).toBe(420);

  const sixDigits = as_date("2024-01-02T03:04:05.123456Z");
  expect(sixDigits).toBeInstanceOf(Date);
  // JavaScript truncates beyond milliseconds
  expect(sixDigits?.getUTCMilliseconds()).toBe(123);
});

Deno.test("as_date - timezone behavior", () => {
  // Test bare timestamp (interpreted in local time)
  const bareTimestamp = as_date("2024-01-02T12:00:00");
  expect(bareTimestamp).toBeInstanceOf(Date);

  // Test UTC timestamp
  const utcTimestamp = as_date("2024-01-02T12:00:00Z");
  expect(utcTimestamp).toBeInstanceOf(Date);
  expect(utcTimestamp?.getUTCHours()).toBe(12);

  // Test offset timestamp
  const offsetTimestamp = as_date("2024-01-02T12:00:00+05:00");
  expect(offsetTimestamp).toBeInstanceOf(Date);
});

Deno.test("as_date - edge cases", () => {
  // Test invalid dates
  expect(as_date("2024-02-30")).toBeNull(); // February 30th doesn't exist
  expect(as_date("invalid-date")).toBeNull();
  expect(as_date("")).toBeNull();

  // Test null/undefined
  expect(as_date(null)).toBeNull();
  expect(as_date(undefined)).toBeNull();

  // Test existing Date object
  const existingDate = new Date("2024-01-02");
  const result = as_date(existingDate);
  expect(result).toBe(existingDate);

  // Test NaN Date
  const invalidDate = new Date("invalid");
  expect(as_date(invalidDate)).toBeNull();
});

Deno.test("as_date - fractional seconds normalization", () => {
  // Test that fractional seconds beyond milliseconds are normalized
  const sixDigits = as_date("2024-01-02T03:04:05.123456Z");
  expect(sixDigits).toBeInstanceOf(Date);
  expect(sixDigits?.getUTCMilliseconds()).toBe(123);

  const nineDigits = as_date("2024-01-02T03:04:05.123456789Z");
  expect(nineDigits).toBeInstanceOf(Date);
  expect(nineDigits?.getUTCMilliseconds()).toBe(123);

  const oneDigit = as_date("2024-01-02T03:04:05.7Z");
  expect(oneDigit).toBeInstanceOf(Date);
  expect(oneDigit?.getUTCMilliseconds()).toBe(700);
});

Deno.test("as_date - extreme epoch guards", () => {
  // Test that extreme epochs return null instead of invalid dates
  const extremePositive = as_date(1e20); // Very large positive epoch
  expect(extremePositive).toBeNull();

  const extremeNegative = as_date(-1e20); // Very large negative epoch
  expect(extremeNegative).toBeNull();

  // Test that reasonable epochs still work
  const reasonableEpoch = as_date(1700000000000); // 2023-11-17
  expect(reasonableEpoch).toBeInstanceOf(Date);
});

// 6. Test conversion with sample data (penguins test removed - outdated)
console.log("Type conversion tests completed!");

// 7. Test column-wise casting with mutate_columns()
const columnWiseConversion = testData
  .mutateColumns({
    col_type: "string",
    columns: ["age", "score", "salary"],
    new_columns: [{ suffix: "_number", fn: as_number }],
  });

const _columnWiseTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  age_number: number | null;
  score_number: number | null;
  salary_number: number | null;
}> = columnWiseConversion;

console.log("Column-wise conversion type checking passed!");

// 8. Test multiple conversions in one mutate_columns call
const multipleConversions = testData
  .mutateColumns({
    col_type: "string",
    columns: ["active", "birth_date"],
    new_columns: [
      { suffix: "_logical", fn: as_logical },
      { suffix: "_date", fn: as_date },
    ],
  });

const _multipleTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  active_logical: boolean | null;
  birth_date_logical: boolean | null;
  active_date: Date | null;
  birth_date_date: Date | null;
}> = multipleConversions;

console.log("Multiple conversions type checking passed!");

// 9. Test conversion from non-nullable numeric to character
const numericToCharacter = testData
  .mutate({
    // First convert to number (which can be null)
    age_number: (r) => as_number(r.age),
    score_number: (r) => as_number(r.score),
  })
  .mutate({
    // Then convert number to string - should be string, not string | null
    age_str: (r) => as_string(r.age_number),
    score_str: (r) => as_string(r.score_number),
  });

const _numericToCharTypeCheck: DataFrame<{
  name: string;
  age: string;
  score: string;
  active: string;
  birth_date: string;
  salary: string;
  empty: string;
  null_val: null;
  undefined_val: undefined;
  age_number: number | null;
  score_number: number | null;
  age_str: string; // Should be string, not string | null
  score_str: string; // Should be string, not string | null
}> = numericToCharacter;

console.log("Numeric to string conversion type checking passed!");

// 10. Test with a DataFrame that has guaranteed non-null numeric columns
const numericData = createDataFrame([
  { id: 1, value: 42.5, count: 100 },
  { id: 2, value: 73.8, count: 250 },
  { id: 3, value: 19.2, count: 75 },
]);

const guaranteedNumericToChar = numericData
  .mutate({
    value_str: (r) => as_string(r.value), // numeric -> string
    count_str: (r) => as_string(r.count), // numeric -> string
  });

const _guaranteedNumericTypeCheck: DataFrame<{
  id: number;
  value: number;
  count: number;
  value_str: string; // Should be string, not string | null
  count_str: string; // Should be string, not string | null
}> = guaranteedNumericToChar;

console.log("Guaranteed numeric to string conversion type checking passed!");

console.log("All convert type checking tests completed successfully!");
