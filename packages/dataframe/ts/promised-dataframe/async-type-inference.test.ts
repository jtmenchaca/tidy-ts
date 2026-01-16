/**
 * Async Type Inference Tests
 *
 * Best practices for error handling in DataFrame operations
 * WITHOUT requiring explicit type declarations.
 */

async function _exampleNeverFailingAsyncFunction(
  _row: { id: number; value: number },
) {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return _row.value * 2;
}

async function _exampleAlwaysFailingAsyncFunction(
  _row: { id: number; value: number },
) {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return new Error("Random failure");
}

async function _somethingMightFailAsyncFunction(
  _row: { id: number; value: number },
) {
  await new Promise((resolve) => setTimeout(resolve, 10));
  if (Math.random() > 0.5) {
    return new Error("Random failure");
  }
  return _row.value * 2;
}

async function _exampleMightThrowAsyncFunction(
  _row: { id: number; value: number },
) {
  await new Promise((resolve) => setTimeout(resolve, 10));
  if (Math.random() > 0.5) {
    throw new Error("Random failure");
  }
  return _row.value * 2;
}

// Deno.test("Async Type Inference - Best Practices", async () => {
//   const testData = Array.from({ length: 5 }, (_, i) => ({
//     id: i + 1,
//     value: (i + 1) * 10,
//   }));
//   const df = createDataFrame(testData);

//   // ============================================================================
//   // SYNC FUNCTIONS - Already Perfect
//   // ============================================================================

//   // 1. Pure sync function returns number
//   const sync1 = df.mutate({
//     doubled: (row) => row.value * 2,
//   });
//   const _sync1Check: DataFrame<{
//     id: number;
//     value: number;
//     doubled: number;
//   }> = sync1;
//   // ✅ Inferred correctly as number

//   // 2. Sync function returns Error
//   const sync2 = df.mutate({
//     error: (_row) => new Error("always fails"),
//   });
//   const _sync2Check: DataFrame<{
//     id: number;
//     value: number;
//     error: Error;
//   }> = sync2;
//   // ✅ Inferred correctly as Error

//   // 3. Sync function returns union type
//   const sync3 = df.mutate({
//     maybeDoubled: (row) => {
//       if (row.value > 15) {
//         return row.value * 2;
//       }
//       return new Error("too small");
//     },
//   });
//   const _sync3Check: DataFrame<{
//     id: number;
//     value: number;
//     maybeDoubled: number | Error;
//   }> = sync3;
//   // ✅ Inferred correctly as number | Error

//   // ============================================================================
//   // ASYNC FUNCTIONS strict mode
//   // ============================================================================

//   // 4. Async function that always succeeds
//   const async1 = await df
//     .mutate({
//       doubled: async (row) => {
//         try {
//           return await exampleNeverFailingAsyncFunction(row);
//         } catch (_e) {
//           return 10;
//         }
//       },
//     }, { inferAsyncErrors: true });
//   const _async1Check: DataFrame<{
//     id: number;
//     value: number;
//     doubled: number | Error;
//   }> = async1;

//   // 5. Async function that explicitly returns Error
//   const async2 = await df.mutate({
//     error: async (_row) => await exampleAlwaysFailingAsyncFunction(_row),
//   }, { inferAsyncErrors: true });
//   const _async2Check: DataFrame<{
//     id: number;
//     value: number;
//     error: Error; // ✅ Just Error (no union needed)
//   }> = async2;
//   // When function ALWAYS returns Error, type is just Error

//   // 6. Async function with explicit union return
//   const async3 = await df.mutate({
//     maybeDoubled: async (row) => await somethingMightFailAsyncFunction(row),
//   }, { inferAsyncErrors: true });
//   const _async3Check: DataFrame<{
//     id: number;
//     value: number;
//     maybeDoubled: number | Error; // ✅ Union preserved
//   }> = async3;

//   // 7. Async function that might throw (real-world pattern)
//   const async4 = await df.mutate({
//     apiCall: async (row) => await exampleMightThrowAsyncFunction(row),
//   }, { inferAsyncErrors: true });
//   const _async4Check: DataFrame<{
//     id: number;
//     value: number;
//     apiCall: number | Error; // ✅ Automatically includes Error
//   }> = async4;
//   // ANY async operation can throw - type system reflects this

//   // ============================================================================
//   // ERROR HANDLING PATTERNS
//   // ============================================================================

//   // 8. Pattern: Try-catch inside async (explicit error handling)
//   const pattern1 = await df.mutate({
//     safeApiCall: async (row) => {
//       try {
//         const result = await exampleMightThrowAsyncFunction(row);
//         return result;
//       } catch (_e) {
//         // Explicitly return Error object
//         return new Error("Random failure");
//       }
//     },
//   });
//   const _pattern1Check: DataFrame<{
//     id: number;
//     value: number;
//     safeApiCall: number | Error; // ✅ Explicit error handling
//   }> = pattern1;

//   // 9. Pattern: Let errors propagate (captured by DataFrame)
//   const pattern2 = await df.mutate({
//     riskyCall: async (row) => await exampleMightThrowAsyncFunction(row),
//   }, { inferAsyncErrors: true });
//   const _pattern2Check: DataFrame<{
//     id: number;
//     value: number;
//     riskyCall: number | Error; // ✅ Auto-captured errors
//   }> = pattern2;

//   // 10. Pattern: Filter out errors after mutation
//   const withErrors = await df.mutate({
//     processed: async (row) => await somethingMightFailAsyncFunction(row),
//   });
//   const _withErrorsCheck: DataFrame<{
//     id: number;
//     value: number;
//     processed: number | Error; // ✅ Union preserved
//   }> = withErrors;

//   // Filter out rows with errors
//   const successOnly = withErrors.filter(
//     (row) => !(row.processed instanceof Error),
//   );
//   const _successOnlyCheck: DataFrame<{
//     id: number;
//     value: number;
//     processed: number | Error;
//   }> = successOnly;
//   // Note: Type narrowing for instanceof checks in filters is not yet implemented

//   // 11. Pattern: Handle errors with a follow-up mutation
//   const handled = withErrors.mutate({
//     processedOrDefault: (row) => {
//       if (row.processed instanceof Error) {
//         return -1; // Default value for errors
//       }
//       return row.processed;
//     },
//   });
//   const _handledCheck: DataFrame<{
//     id: number;
//     value: number;
//     processed: number | Error;
//     processedOrDefault: number; // ✅ Errors handled
//   }> = handled;

//   // 12. Custom errors are preserved, not double-wrapped
//   class ValidationErrorClass extends Error {
//     constructor(message: string, public field: string) {
//       super(message);
//       this.name = "ValidationError";
//     }
//   }

//   const customErrors = await df.mutate({
//     validated: async (row) => {
//       if (row.value < 0) return new ValidationErrorClass("negative", "value");
//       return row.value;
//     },
//   }, { inferAsyncErrors: true });

//   const _customCheck: DataFrame<{
//     id: number;
//     value: number;
//     validated: number | Error | ValidationErrorClass; // ✅ Specific error type preserved
//   }> = customErrors;
// });
