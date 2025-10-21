import { createDataFrame, str } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "@tests/shims";

test("Pattern Detection with strDetect - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  // Sample text data with various patterns
  const df = createDataFrame([
    { text: "john.doe@email.com", user_id: 1, department: "IT" },
    { text: "jane.smith@company.org", user_id: 2, department: "HR" },
    { text: "invalid-email", user_id: 3, department: "Sales" },
    { text: "user123@test.net", user_id: 4, department: "IT" },
    { text: "no-email-here", user_id: 5, department: "Marketing" },
    { text: "admin@localhost", user_id: 6, department: "Admin" },
  ]);

  console.log("Original data:");
  df.print();

  // ============================================================================
  // 2. BASIC PATTERN DETECTION - Simple email validation
  // ============================================================================
  console.log("\n=== 2. Basic Pattern Detection - Simple Email Validation ===");

  // Start with the simplest case: detecting valid email addresses
  const hasValidEmail = df
    .mutate({
      is_valid_email: (row) =>
        str.detect(row.text, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+"),
    });

  console.log("Detecting valid email addresses:");
  hasValidEmail.print();

  // ============================================================================
  // 3. PATTERN DETECTION WITH NEGATION - Finding invalid patterns
  // ============================================================================
  console.log(
    "\n=== 3. Pattern Detection with Negation - Finding Invalid Patterns ===",
  );

  // Detect patterns with negation
  // This shows how to find what doesn't match a pattern
  const hasInvalidEmail = df
    .mutate({
      is_invalid_email: (row) =>
        !str.detect(row.text, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+"),
    });

  console.log("Detecting invalid email addresses:");
  hasInvalidEmail.print();

  // ============================================================================
  // 4. MULTIPLE PATTERN DETECTION - Various text characteristics
  // ============================================================================
  console.log(
    "\n=== 4. Multiple Pattern Detection - Various Text Characteristics ===",
  );

  // Detect specific patterns
  // This demonstrates how to check for multiple different patterns
  const withPatterns = df
    .mutate({
      has_numbers: (row) => str.detect(row.text, "\\d+"),
      has_uppercase: (row) => str.detect(row.text, "[A-Z]"),
      has_special_chars: (row) => str.detect(row.text, "[@\\.\\-]"),
      is_admin: (row) => str.detect(row.text, "Admin"),
    });

  console.log("Detecting various patterns:");
  withPatterns.print();

  // ============================================================================
  // 5. PATTERN-BASED FILTERING - Using patterns to filter data
  // ============================================================================
  console.log(
    "\n=== 5. Pattern-Based Filtering - Using Patterns to Filter Data ===",
  );

  // Boolean mask filtering
  // This shows how to use pattern detection for filtering
  const validEmails = df
    .filter(
      (row) => str.detect(row.text, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+"),
    );

  console.log("Filtered to valid emails only:");
  validEmails.print();

  // ============================================================================
  // 6. ADVANCED PATTERN DETECTION - Complex regex patterns
  // ============================================================================
  console.log(
    "\n=== 6. Advanced Pattern Detection - Complex Regex Patterns ===",
  );

  // Show more complex pattern detection
  const withAdvancedPatterns = df
    .mutate({
      is_valid_email: (row) =>
        str.detect(row.text, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+"),
      has_domain: (row) => str.detect(row.text, "@[\\w\\.-]+\\.[\\w]+"),
      is_company_email: (row) => str.detect(row.text, "@company\\."),
      has_numbers_in_text: (row) => str.detect(row.text, "\\d+"),
      starts_with_letter: (row) => str.detect(row.text, "^[a-zA-Z]"),
      ends_with_domain: (row) => str.detect(row.text, "\\.[a-z]{2,}$"),
    });

  console.log("Advanced pattern detection:");
  withAdvancedPatterns.print();

  // ============================================================================
  // 7. PUTTING IT ALL TOGETHER - Complete pattern analysis workflow
  // ============================================================================
  console.log(
    "\n=== 7. Putting It All Together - Complete Pattern Analysis Workflow ===",
  );

  // Show a complete workflow that demonstrates all the pattern detection concepts
  const finalResult = df
    .mutate({
      is_valid_email: (row) =>
        str.detect(row.text, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+"),
      has_numbers: (row) => str.detect(row.text, "\\d+"),
      has_uppercase: (row) => str.detect(row.text, "[A-Z]"),
      has_special_chars: (row) => str.detect(row.text, "[@\\.\\-]"),
      is_admin: (row) => str.detect(row.text, "Admin"),
      email_quality_score: (row) => {
        let score = 0;
        if (str.detect(row.text, "[\\w\\.-]+@[\\w\\.-]+\\.\\w+")) score += 3;
        if (str.detect(row.text, "\\d+")) score += 1;
        if (str.detect(row.text, "[A-Z]")) score += 1;
        if (str.detect(row.text, "[@\\.\\-]")) score += 1;
        return score;
      },
    }) // Add pattern detection columns
    .filter((row) => row.email_quality_score > 0) // Filter for quality
    .arrange("email_quality_score", "desc") // Sort by quality
    .select(
      "text",
      "department",
      "is_valid_email",
      "has_numbers",
      "has_uppercase",
      "has_special_chars",
      "is_admin",
      "email_quality_score",
    ); // Select relevant columns

  console.log("Complete pattern analysis workflow:");
  finalResult.print();

  // Test assertions
  expect(validEmails.nrows()).toBe(3);
  expect(hasValidEmail.filter((row) => row.is_valid_email).nrows()).toBe(
    3,
  );
  expect(hasInvalidEmail.filter((row) => row.is_invalid_email).nrows())
    .toBe(3);
  expect(withAdvancedPatterns.nrows()).toBe(6);
  expect(withAdvancedPatterns.is_valid_email).toBeDefined();
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.email_quality_score).toBeDefined();
});
