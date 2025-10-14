import { createDataFrame, str } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "@tests/shims";

test("Complex Text Mining Scenarios", () => {
  console.log("=== Complex Text Mining Scenarios ===");

  // Sample customer feedback data
  const feedbackData = createDataFrame([
    {
      feedback: "Great product! Customer service was excellent. Rating: 5/5",
      customer_id: 1001,
    },
    {
      feedback: "Product quality is good but delivery was slow. Rating: 3/5",
      customer_id: 1002,
    },
    {
      feedback:
        "Amazing experience! Fast shipping and great support. Rating: 5/5",
      customer_id: 1003,
    },
    {
      feedback: "Disappointed with the product. Poor quality. Rating: 1/5",
      customer_id: 1004,
    },
    {
      feedback: "Good value for money. Would recommend. Rating: 4/5",
      customer_id: 1005,
    },
  ]);

  console.log("Customer feedback data:");
  feedbackData.print();

  // Extract ratings
  const withRatings = feedbackData
    .mutate({
      rating: (row) => str.extract(row.feedback, "Rating: (\\d)/5"),
    });

  // Detect positive/negative sentiment
  const withSentiment = withRatings
    .mutate({
      is_positive: (row) =>
        str.detect(
          row.feedback,
          "\\b(great|excellent|amazing|good|recommend)\\b",
        ),
      is_negative: (row) =>
        str.detect(row.feedback, "\\b(poor|disappointed|slow|bad)\\b"),
    });

  // Extract key topics
  const withTopics = withSentiment
    .mutate({
      mentions_service: (row) =>
        str.detect(row.feedback, "\\b(service|support|shipping|delivery)\\b"),
      mentions_quality: (row) =>
        str.detect(row.feedback, "\\b(quality|product)\\b"),
      mentions_value: (row) =>
        str.detect(row.feedback, "\\b(value|money|price)\\b"),
    });

  console.log("\nAnalyzed feedback with extracted features:");
  withTopics.print();

  // Real-world use case: Log parsing
  const logData = createDataFrame([
    {
      log_entry:
        "2024-01-15 10:30:15 [INFO] User login successful: user_id=12345, ip=192.168.1.100",
    },
    {
      log_entry:
        "2024-01-15 10:31:22 [ERROR] Database connection failed: timeout=30s, retries=3",
    },
    {
      log_entry:
        "2024-01-15 10:32:45 [WARN] High memory usage: 85%, threshold=80%",
    },
    {
      log_entry:
        "2024-01-15 10:33:12 [INFO] API request completed: endpoint=/api/users, duration=150ms",
    },
    {
      log_entry:
        "2024-01-15 10:34:08 [ERROR] Authentication failed: user_id=67890, reason=invalid_token",
    },
  ]);

  console.log("\nSample log entries:");
  logData.print();

  // Parse log entries
  const parsedLogs = logData
    .mutate({
      timestamp: (row) =>
        str.extract(
          row.log_entry,
          "(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})",
        ),
      log_level: (row) =>
        str.extract(row.log_entry, "\\[(INFO|ERROR|WARN|DEBUG)\\]"),
      user_id: (row) => str.extract(row.log_entry, "user_id=(\\d+)"),
      ip_address: (row) =>
        str.extract(row.log_entry, "ip=(\\d+\\.\\d+\\.\\d+\\.\\d+)"),
      duration: (row) => str.extract(row.log_entry, "duration=(\\d+ms)"),
      memory_usage: (row) => str.extract(row.log_entry, "(\\d+)%"),
      endpoint: (row) => str.extract(row.log_entry, "endpoint=([^,]+)"),
    });

  console.log("\nParsed log entries:");
  parsedLogs.print();

  // Email analysis scenario
  const emailData = createDataFrame([
    {
      email: "john.doe@company.com",
      subject: "Project Update - Q1 Results",
      body: "Hi team, here are the Q1 results. Revenue: $150K, Growth: 25%",
    },
    {
      email: "jane.smith@vendor.org",
      subject: "Invoice #INV-2024-001",
      body: "Please find attached invoice for $2,500. Due date: 2024-02-15",
    },
    {
      email: "admin@internal.net",
      subject: "System Maintenance",
      body: "Scheduled maintenance on 2024-01-20 from 2-4 AM EST",
    },
  ]);

  console.log("\nEmail data:");
  emailData.print();

  const analyzedEmails = emailData
    .mutate({
      domain: (row) => str.extract(row.email, "@([\\w\\.-]+)"),
      is_internal: (row) => str.detect(row.email, "internal\\.net$"),
      has_invoice: (row) => str.detect(row.subject, "Invoice"),
      has_dates: (row) => str.detect(row.body, "\\d{4}-\\d{2}-\\d{2}"),
      has_money: (row) => str.detect(row.body, "\\$\\d+"),
      has_percentage: (row) => str.detect(row.body, "\\d+%"),
    });

  console.log("\nAnalyzed emails:");
  analyzedEmails.print();

  // Test assertions
  expect(withTopics.filter((row) => row.rating !== null).nrows()).toBe(5);
  expect(parsedLogs.filter((row) => row.timestamp !== null).nrows()).toBe(
    5,
  );
  expect(analyzedEmails.filter((row) => row.domain !== null).nrows())
    .toBe(
      3,
    );
});
