import { createDataFrame, str } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Pattern Replacement with strReplace and strReplaceAll", () => {
  console.log("=== Pattern Replacement (strReplace & strReplaceAll) ===");

  // Sample data with sensitive information
  const sensitiveData = createDataFrame([
    { text: "Phone: 555-123-4567" },
    { text: "SSN: 123-45-6789" },
    { text: "Credit Card: 4111-1111-1111-1111" },
    { text: "Email: user@example.com" },
  ]);

  console.log("Sensitive data:");
  sensitiveData.print();

  // Mask sensitive information with strReplace
  const maskedData = sensitiveData
    .mutate({
      masked_text: (row) => {
        let result = row.text;
        // Replace phone numbers (XXX-XXX-XXXX format)
        result = str.replace(result, "\\d{3}-\\d{3}-\\d{4}", "XXX-XXX-XXXX");
        // Replace SSN (XXX-XX-XXXX format)
        result = str.replace(result, "\\d{3}-\\d{2}-\\d{4}", "XXX-XX-XXXX");
        // Replace credit cards (XXXX-XXXX-XXXX-XXXX format)
        result = str.replace(
          result,
          "\\d{4}-\\d{4}-\\d{4}-\\d{4}",
          "XXXX-XXXX-XXXX-XXXX",
        );
        return result;
      },
    });

  console.log("\nMasked sensitive data:");
  maskedData.print();

  // Replace all occurrences with strReplaceAll
  const repetitiveData = createDataFrame([
    { text: "The quick brown fox jumps over the lazy fox" },
    { text: "She sells seashells by the seashore" },
    { text: "Peter Piper picked a peck of pickled peppers" },
  ]);

  console.log("\nRepetitive text data:");
  repetitiveData.print();

  // Replace all occurrences of common words
  const simplifiedData = repetitiveData
    .mutate({
      simplified: (row) =>
        str.replaceAll(row.text, "\\b(the|a|an|and|or|but)\\b", "STOP_WORD"),
    });

  console.log("\nReplacing common stop words:");
  simplifiedData.print();

  // Replace multiple patterns
  const multiReplaceData = createDataFrame([
    { text: "Product ABC123 costs $99.99 and ships in 2-3 days" },
    { text: "Service XYZ789 is $149.50 with 1-day delivery" },
  ]);

  console.log("\nMulti-pattern replacement data:");
  multiReplaceData.print();

  const cleanedData = multiReplaceData
    .mutate({
      cleaned: (row) => {
        let result = row.text;
        // Replace product codes
        result = str.replaceAll(result, "[A-Z]{3}\\d{3}", "[PRODUCT]");
        // Replace prices
        result = str.replaceAll(result, "\\$\\d+\\.\\d{2}", "[PRICE]");
        // Replace time ranges
        result = str.replaceAll(result, "\\d+-\\d+\\s+days?", "[TIME]");
        return result;
      },
    });

  console.log("\nCleaned data with multiple replacements:");
  cleanedData.print();

  // Multiple replacement patterns
  const multiplePatterns = createDataFrame([
    { text: "Hello HELLO hello" },
    { text: "World WORLD world" },
  ]);

  const normalizedData = multiplePatterns
    .mutate({
      normalized: (row) => str.replaceAll(row.text, "hello", "hi"),
    });

  console.log("\nMultiple pattern replacement:");
  normalizedData.print();

  // Test assertions
  expect(
    maskedData.filter((row) => row.masked_text.includes("XXX")).nrows(),
  ).toBe(3);
  expect(
    simplifiedData.filter((row) => row.simplified.includes("STOP_WORD"))
      .nrows(),
  ).toBe(3);
  expect(
    cleanedData.filter((row) => row.cleaned.includes("[PRODUCT]"))
      .nrows(),
  ).toBe(2);
});
