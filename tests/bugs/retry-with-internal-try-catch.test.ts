import { createDataFrame } from "../../src/dataframe/ts/dataframe/index.ts";
import { expect } from "@std/expect";

/**
 * Test: Retry mechanism with internal try-catch that returns number | Error
 *
 * This test demonstrates how the retry mechanism works when the async function
 * itself has a try-catch block and returns either a number or Error.
 */

// Function that has internal try-catch and returns number | Error
function createFlakeyApiCallWithTryCatch(failuresBeforeSuccess: number) {
  const attemptsPerValue = new Map<number, number>();

  return async function (value: number): Promise<number | Error> {
    await new Promise((resolve) => setTimeout(resolve, 1));
    const attempts = (attemptsPerValue.get(value) || 0) + 1;
    attemptsPerValue.set(value, attempts);

    console.log(
      `Flakey API call for value ${value}, attempt ${attempts}, should fail if <= ${failuresBeforeSuccess}`,
    );

    // Internal try-catch block
    try {
      if (attempts <= failuresBeforeSuccess) {
        console.log(`Throwing error for value ${value} on attempt ${attempts}`);
        throw new Error(`API call failed (attempt ${attempts})`);
      }

      console.log(`Success for value ${value} on attempt ${attempts}`);
      return value * 2;
    } catch (error) {
      console.log(
        `Caught error internally for value ${value} on attempt ${attempts}:`,
        error,
      );
      return error as Error;
    }
  };
}

Deno.test("Retry with internal try-catch returning number | Error", async () => {
  console.log("=== Testing Retry with Internal Try-Catch ===");

  // Create test data
  const testData = Array.from({ length: 3 }, (_, i) => ({
    id: i + 1,
    value: (i + 1) * 10,
  }));

  // Test 1: Function with internal try-catch that returns Error objects
  console.log(
    "\n--- Test 1: Internal try-catch returning Error objects (NO RETRIES) ---",
  );

  const df1 = createDataFrame(testData);
  const flakeyFn1 = createFlakeyApiCallWithTryCatch(2); // Fails twice

  try {
    const result1 = await df1.mutate({
      doubled: async (row: { id: number; value: number }) =>
        await flakeyFn1(row.value),
    }, {
      retry: {
        backoff: "exponential",
        maxRetries: 3,
        baseDelay: 50,
        onRetry: (error: unknown, attempt: number, taskIndex: number) => {
          console.log(
            `Retry attempt ${attempt} for task ${taskIndex}: ${error}`,
          );
        },
      },
    });

    console.log("Result 1:", result1.toArray());

    // Check if we got numbers (success) or Errors
    const results = result1.toArray();
    results.forEach(
      (
        row: { id: number; value: number; doubled: number | Error },
        index: number,
      ) => {
        if (row.doubled instanceof Error) {
          console.log(`Row ${index} resulted in Error:`, row.doubled.message);
        } else {
          console.log(`Row ${index} succeeded with value:`, row.doubled);
        }
      },
    );

    // Since the function returns Error objects instead of throwing, NO RETRIES occur
    // All results should be Error objects
    expect(result1.nrows()).toBe(3);
    expect(results.every((row) => row.doubled instanceof Error)).toBe(
      true,
    );
    expect((results[0].doubled as Error).message).toContain(
      "API call failed (attempt 1)",
    );
  } catch (error) {
    console.log("Caught error in outer try-catch:", error);
    throw error;
  }

  // Test 2: Function that THROWS errors (should trigger retries)
  console.log("\n--- Test 2: Function that THROWS errors (SHOULD RETRY) ---");

  function createFlakeyApiCallThatThrows(failuresBeforeSuccess: number) {
    const attemptsPerValue = new Map<number, number>();

    return async function (value: number): Promise<number> {
      await new Promise((resolve) => setTimeout(resolve, 1));
      const attempts = (attemptsPerValue.get(value) || 0) + 1;
      attemptsPerValue.set(value, attempts);

      console.log(
        `Flakey API call (THROWS) for value ${value}, attempt ${attempts}, should fail if <= ${failuresBeforeSuccess}`,
      );

      if (attempts <= failuresBeforeSuccess) {
        console.log(`THROWING error for value ${value} on attempt ${attempts}`);
        throw new Error(`API call failed (attempt ${attempts})`);
      }

      console.log(`Success for value ${value} on attempt ${attempts}`);
      return value * 2;
    };
  }

  const df2 = createDataFrame(testData.slice(0, 1)); // Just one row
  const flakeyFn2 = createFlakeyApiCallThatThrows(2); // Fails twice

  try {
    const result2 = await df2.mutate({
      doubled: async (row: { id: number; value: number }) =>
        await flakeyFn2(row.value),
    }, {
      retry: {
        backoff: "exponential",
        maxRetries: 3,
        baseDelay: 50,
        onRetry: (error: unknown, attempt: number, taskIndex: number) => {
          console.log(
            `Retry attempt ${attempt} for task ${taskIndex}: ${error}`,
          );
        },
      },
    });

    console.log("Result 2 (THROWS):", result2.toArray());

    const results = result2.toArray() as Array<
      { id: number; value: number; doubled: number | Error }
    >;
    if (results[0].doubled instanceof Error) {
      console.log(
        "Unexpected Error result:",
        results[0].doubled.message,
      );
    } else {
      console.log("Success with value:", results[0].doubled);
    }

    // Should succeed after retries because function THROWS errors
    expect(result2.nrows()).toBe(1);
    expect(typeof results[0].doubled).toBe("number");
    expect(results[0].doubled).toBe(20); // 10 * 2
  } catch (error) {
    console.log("Caught error in outer try-catch:", error);
    throw error;
  }

  // Test 3: Function fails more times than maxRetries allows
  console.log("\n--- Test 3: Internal try-catch with insufficient retries ---");

  const df3 = createDataFrame(testData.slice(0, 1)); // Just one row
  const flakeyFn3 = createFlakeyApiCallWithTryCatch(5); // Fails 5 times

  try {
    const result3 = await df3.mutate({
      doubled: async (row: { id: number; value: number }) =>
        await flakeyFn3(row.value),
    }, {
      retry: {
        backoff: "exponential",
        maxRetries: 2, // Only 2 retries, but function fails 5 times
        baseDelay: 50,
        onRetry: (error: unknown, attempt: number, taskIndex: number) => {
          console.log(
            `Retry attempt ${attempt} for task ${taskIndex}: ${error}`,
          );
        },
      },
    });

    console.log("Result 3:", result3.toArray());

    const results = result3.toArray();
    if (results[0].doubled instanceof Error) {
      console.log(
        "Function returned Error after retries exhausted:",
        results[0].doubled.message,
      );
      // This is expected - the function itself returned an Error
      expect(results[0].doubled).toBeInstanceOf(Error);
    } else {
      console.log("Unexpected success:", results[0].doubled);
      throw new Error("Expected Error but got success");
    }
  } catch (error) {
    console.log("Caught error in outer try-catch:", error);
    // This would be unexpected - the retry mechanism should handle the Error return
    throw error;
  }

  // Test 4: Custom shouldRetry function that checks for Error returns
  console.log("\n--- Test 4: Custom shouldRetry with Error handling ---");

  const df4 = createDataFrame(testData.slice(0, 1));
  const flakeyFn4 = createFlakeyApiCallWithTryCatch(3); // Fails 3 times

  try {
    const result4 = await df4.mutate({
      doubled: async (row: { id: number; value: number }) =>
        await flakeyFn4(row.value),
    }, {
      retry: {
        backoff: "exponential",
        maxRetries: 5,
        baseDelay: 50,
        shouldRetry: (error: unknown, attempt: number) => {
          // Only retry if the error is a string (thrown error)
          // Don't retry if the function returned an Error object
          const isThrownError = typeof error === "string" ||
            (error instanceof Error &&
              error.message.includes("API call failed"));
          console.log(
            `shouldRetry called for attempt ${attempt}: ${isThrownError}`,
          );
          return isThrownError;
        },
        onRetry: (error: unknown, attempt: number, taskIndex: number) => {
          console.log(
            `Retry attempt ${attempt} for task ${taskIndex}: ${error}`,
          );
        },
      },
    });

    console.log("Result 4:", result4.toArray());

    const results = result4.toArray();
    if (results[0].doubled instanceof Error) {
      console.log(
        "Function returned Error (retries stopped due to shouldRetry):",
        results[0].doubled.message,
      );
      expect(results[0].doubled).toBeInstanceOf(Error);
    } else {
      console.log("Unexpected success:", results[0].doubled);
    }
  } catch (error) {
    console.log("Caught error in outer try-catch:", error);
    throw error;
  }
});
