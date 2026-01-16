import { expect } from "@std/expect";
import { str } from "@tidy-ts/dataframe";

Deno.test("String functions basic functionality", () => {
  const strings = ["hello world", "foo bar", "test123"];

  // Test str_detect
  const hasHello = str.detect(strings, "hello");
  expect(hasHello).toEqual([true, false, false]);

  // Test str_length
  const lengths = str.length(strings) as number[];
  expect(lengths).toEqual([11, 7, 7]);

  // Test str_replace
  const replaced = str.replace(strings, "hello", "hi");
  expect(replaced).toEqual(["hi world", "foo bar", "test123"]);

  // Test str_replace_all
  const replacedAll = str.replaceAll(strings, "o", "X");
  expect(replacedAll).toEqual(["hellX wXrld", "fXX bar", "test123"]);

  // Test str_extract with regex
  const numbers = str.extract(strings, "\\d+");
  expect(numbers).toEqual([null, null, "123"]);

  // Test str_extract_all with regex
  const allNumbers = str.extractAll(strings, "\\d+");
  expect(allNumbers).toEqual([[], [], ["123"]]);

  // Test str_split
  const split = str.split(strings, " ");
  expect(split).toEqual([["hello", "world"], ["foo", "bar"], ["test123"]]);

  // Test str_split_fixed
  const splitFixed = str.splitFixed(strings, " ", 3);
  expect(splitFixed).toEqual([["hello", "world"], ["foo", "bar"], [
    "test123",
  ]]);
});

Deno.test("String functions with regex patterns", () => {
  const strings = ["abc123def456", "noNumbers", "999"];

  // Test regex detection
  const hasNumbers = str.detect(strings, "\\d+");
  expect(hasNumbers).toEqual([true, false, true]);

  // Test regex extraction
  const firstNumber = str.extract(strings, "\\d+");
  expect(firstNumber).toEqual(["123", null, "999"]);

  // Test extract all numbers
  const allNumbers = str.extractAll(strings, "\\d+");
  expect(allNumbers).toEqual([["123", "456"], [], ["999"]]);

  // Test regex replace
  const replacedNumbers = str.replace(strings, "\\d+", "NUM");
  expect(replacedNumbers).toEqual(["abcNUMdef456", "noNumbers", "NUM"]);

  const replacedAllNumbers = str.replaceAll(strings, "\\d+", "NUM");
  expect(replacedAllNumbers).toEqual(["abcNUMdefNUM", "noNumbers", "NUM"]);
});

Deno.test("String functions with negate option", () => {
  const strings = ["apple", "banana", "cherry"];

  // Test negate detection
  const noA = str.detect(strings, "a");
  expect(noA).toEqual([true, true, false]);
});
