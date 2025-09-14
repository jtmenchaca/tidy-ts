import { createDataFrame } from "@tidy-ts/dataframe";
import type { DataFrame } from "@tidy-ts/dataframe";

// Helper function to create large datasets
export function createLargeDataset(size: number = 1000): DataFrame<{
  id: number;
  value: number;
  group: string;
  category: number;
}> {
  return createDataFrame(
    Array.from({ length: size }, (_, i) => ({
      id: i + 1,
      value: Math.random() * 100,
      group: String.fromCharCode(65 + (i % 26)), // A-Z
      category: i % 10,
    })),
  );
}

// Performance testing helper
export function createPerformanceTest(
  name: string,
  fn: () => void,
  maxTimeMs: number = 1000,
): () => void {
  return () => {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;

    if (duration > maxTimeMs) {
      throw new Error(
        `Performance test '${name}' took ${
          duration.toFixed(2)
        }ms, expected < ${maxTimeMs}ms`,
      );
    }

    console.log(`✅ ${name}: ${duration.toFixed(2)}ms`);
  };
}

// Error testing helper
export function assertThrowsWithMessage(
  fn: () => void,
  expectedMessage: string | RegExp,
): void {
  try {
    fn();
    throw new Error("Expected function to throw an error");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (typeof expectedMessage === "string") {
      if (!message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to contain '${expectedMessage}', got '${message}'`,
        );
      }
    } else {
      if (!expectedMessage.test(message)) {
        throw new Error(
          `Expected error message to match ${expectedMessage}, got '${message}'`,
        );
      }
    }
  }
}

// Numeric comparison helper
export function assertApproximatelyEqual(
  actual: number,
  expected: number,
  tolerance: number = 1e-10,
): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `Expected ${expected}, got ${actual} (tolerance: ${tolerance})`,
    );
  }
}

// NaN assertion helper
export function assertIsNaN(value: number): void {
  if (!Number.isNaN(value)) {
    throw new Error(`Expected NaN, got ${value}`);
  }
}

// Infinity assertion helper
export function assertIsInfinity(value: number): void {
  if (!Number.isFinite(value) && !Number.isNaN(value)) {
    // This is Infinity or -Infinity
    return;
  }
  throw new Error(`Expected Infinity or -Infinity, got ${value}`);
}

// Test suite helper
export function createTestSuite(
  name: string,
  tests: Array<{ name: string; fn: () => void }>,
): () => void {
  return () => {
    console.log(`\n🧪 Running test suite: ${name}`);

    for (const test of tests) {
      try {
        test.fn();
        console.log(`  ✅ ${test.name}`);
      } catch (error) {
        console.log(
          `  ❌ ${test.name}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        throw error;
      }
    }

    console.log(`✅ Test suite '${name}' completed successfully\n`);
  };
}
