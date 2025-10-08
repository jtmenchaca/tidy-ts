import { createDataFrame, str } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "../../tests/shims/test.ts";

test("Pattern Extraction with strExtract and strExtractAll - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Sample data with various patterns to extract
  const df = createDataFrame([
    { text: "john.doe@email.com", user_id: 1, department: "IT" },
    { text: "jane.smith@company.org", user_id: 2, department: "HR" },
    { text: "user123@test.net", user_id: 4, department: "IT" },
    { text: "admin@localhost", user_id: 6, department: "Admin" },
  ]);

  console.log("Original data:");
  df.print();

  // ============================================================================
  // 2. BASIC PATTERN EXTRACTION - Single pattern extraction
  // ============================================================================
  console.log(
    "\n=== 2. Basic Pattern Extraction - Single Pattern Extraction ===",
  );

  // Start with the simplest case: extracting domain names from emails
  const withDomains = df
    .mutate({
      domain: (row) => str.extract(row.text, "@([\\w\\.-]+)"),
    });

  console.log("Extracting domain names:");
  withDomains.print();

  // ============================================================================
  // 3. MULTIPLE EXTRACTIONS - Building up extracted data
  // ============================================================================
  console.log("\n=== 3. Multiple Extractions - Building Up Extracted Data ===");

  // Extract usernames (before @)
  // This shows how to build up multiple extracted fields
  const withUsernames = withDomains
    .mutate({
      username: (row) => str.extract(row.text, "^([\\w\\.-]+)@"),
    });

  console.log("Extracting usernames:");
  withUsernames.print();

  // ============================================================================
  // 4. NESTED EXTRACTION - Extracting from extracted data
  // ============================================================================
  console.log(
    "\n=== 4. Nested Extraction - Extracting from Extracted Data ===",
  );

  // Extract user ID numbers
  // This demonstrates how to extract from previously extracted data
  const withUserIds = withUsernames
    .mutate({
      numeric_id: (row) => str.extract(row.username ?? "", "(\\d+)"),
    });

  console.log("Extracting numeric IDs from usernames:");
  withUserIds.print();

  // ============================================================================
  // 5. MULTI-PATTERN DATA SETUP - Preparing for multiple extractions
  // ============================================================================
  console.log(
    "\n=== 5. Multi-Pattern Data Setup - Preparing for Multiple Extractions ===",
  );

  // Multi-pattern data for strExtractAll
  const multiPatternData = createDataFrame([
    { text: "Product IDs: ABC123, DEF456, GHI789" },
    { text: "Order numbers: 001, 002, 003, 004" },
    { text: "No patterns here" },
    { text: "Mixed: ABC123 and XYZ789 with 456" },
  ]);

  console.log("Multi-pattern data for extraction:");
  multiPatternData.print();

  // ============================================================================
  // 6. BASIC MULTIPLE EXTRACTION - Using strExtractAll
  // ============================================================================
  console.log("\n=== 6. Basic Multiple Extraction - Using strExtractAll ===");

  // Extract all product IDs (ABC123 format)
  // Start with simple multiple extraction
  const withProductIds = multiPatternData
    .mutate({
      product_ids: (row) => str.extractAll(row.text, "[A-Z]{3}\\d{3}"),
    });

  console.log("Extracting all product IDs:");
  withProductIds.print();

  // ============================================================================
  // 7. ADVANCED MULTIPLE EXTRACTION - Different pattern types
  // ============================================================================
  console.log(
    "\n=== 7. Advanced Multiple Extraction - Different Pattern Types ===",
  );

  // Extract all numbers
  // This shows how to extract different types of patterns
  const withAllNumbers = multiPatternData
    .mutate({
      all_numbers: (row) => str.extractAll(row.text, "\\d+"),
    });

  console.log("Extracting all numbers:");
  withAllNumbers.print();

  // Extract all words starting with capital letters
  const withCapitalWords = multiPatternData
    .mutate({
      capital_words: (row) => str.extractAll(row.text, "\\b[A-Z][a-z]+\\b"),
    });

  console.log("Extracting all capital words:");
  withCapitalWords.print();

  // ============================================================================
  // 8. COMBINING EXTRACTION METHODS - Single and multiple together
  // ============================================================================
  console.log(
    "\n=== 8. Combining Extraction Methods - Single and Multiple Together ===",
  );

  // Combine single and multiple extraction
  // This demonstrates how to use both methods in the same workflow
  const combined = multiPatternData
    .mutate({
      first_product: (row) => str.extract(row.text, "[A-Z]{3}\\d{3}"),
      all_products: (row) => str.extractAll(row.text, "[A-Z]{3}\\d{3}"),
      first_number: (row) => str.extract(row.text, "\\d+"),
      all_numbers: (row) => str.extractAll(row.text, "\\d+"),
    });

  console.log("Combined single and multiple extraction:");
  combined.print();

  // ============================================================================
  // 9. ADVANCED EXTRACTION PATTERNS - Complex regex examples
  // ============================================================================
  console.log(
    "\n=== 9. Advanced Extraction Patterns - Complex Regex Examples ===",
  );

  // Show more complex extraction patterns
  const withAdvancedExtraction = multiPatternData
    .mutate({
      // Extract first product ID
      first_product: (row) => str.extract(row.text, "[A-Z]{3}\\d{3}"),
      // Extract all product IDs
      all_products: (row) => str.extractAll(row.text, "[A-Z]{3}\\d{3}"),
      // Extract first number
      first_number: (row) => str.extract(row.text, "\\d+"),
      // Extract all numbers
      all_numbers: (row) => str.extractAll(row.text, "\\d+"),
      // Extract words that start with capital letters
      capital_words: (row) => str.extractAll(row.text, "\\b[A-Z][a-z]+\\b"),
      // Extract text between colons and commas
      labeled_values: (row) =>
        str.extractAll(row.text, "([A-Za-z]+):\\s*([^,]+)"),
      // Extract sequences of 3+ digits
      long_numbers: (row) => str.extractAll(row.text, "\\d{3,}"),
    });

  console.log("Advanced extraction patterns:");
  withAdvancedExtraction.print();

  // ============================================================================
  // 10. PUTTING IT ALL TOGETHER - Complete extraction workflow
  // ============================================================================
  console.log(
    "\n=== 10. Putting It All Together - Complete Extraction Workflow ===",
  );

  // Show a complete workflow that demonstrates all the extraction concepts
  const finalResult = multiPatternData
    .mutate({
      // Basic extractions
      first_product: (row) => str.extract(row.text, "[A-Z]{3}\\d{3}"),
      all_products: (row) => str.extractAll(row.text, "[A-Z]{3}\\d{3}"),
      first_number: (row) => str.extract(row.text, "\\d+"),
      all_numbers: (row) => str.extractAll(row.text, "\\d+"),
      capital_words: (row) => str.extractAll(row.text, "\\b[A-Z][a-z]+\\b"),
    }) // Add extraction columns
    .mutate({
      // Derived columns based on extractions
      product_count: (row) => row.all_products?.length || 0,
      number_count: (row) => row.all_numbers?.length || 0,
      word_count: (row) => row.capital_words?.length || 0,
      extraction_score: (row) => {
        let score = 0;
        if (row.first_product) score += 2;
        if (row.first_number) score += 1;
        if (row.capital_words && row.capital_words.length > 0) score += 1;
        return score;
      },
    }) // Add calculated columns
    .filter((row) => row.extraction_score > 0) // Filter for quality
    .arrange("extraction_score", "desc") // Sort by score
    .select(
      "text",
      "first_product",
      "all_products",
      "first_number",
      "all_numbers",
      "capital_words",
      "product_count",
      "number_count",
      "word_count",
      "extraction_score",
    ); // Select relevant columns

  console.log("Complete extraction workflow:");
  finalResult.print();

  // Test assertions
  expect(withDomains.filter((row) => row.domain !== null).nrows()).toBe(
    4,
  );
  expect(
    withProductIds.filter((row) => row.product_ids.length > 0).nrows(),
  )
    .toBe(2);
  expect(
    withAllNumbers.filter((row) => row.all_numbers.length > 0).nrows(),
  )
    .toBe(3);
  expect(withAdvancedExtraction.nrows()).toBe(4);
  expect(withAdvancedExtraction.first_product).toBeDefined();
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.extraction_score).toBeDefined();
});
