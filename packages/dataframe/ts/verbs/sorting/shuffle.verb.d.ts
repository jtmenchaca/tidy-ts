/**
 * Randomize the order of rows in a DataFrame.
 *
 * @param seed - Optional seed for reproducible shuffling
 * @returns A function that takes a DataFrame and returns it with rows shuffled
 *
 * @example
 * ```ts
 * const df = createDataFrame([
 *   { name: "Alice", age: 25 },
 *   { name: "Bob", age: 30 },
 *   { name: "Carol", age: 28 },
 *   { name: "David", age: 32 }
 * ]);
 *
 * // Shuffle the rows randomly
 * const shuffled = df.shuffle();
 *
 * // Shuffle with seed for reproducible results
 * const shuffled1 = df.shuffle(42);
 * const shuffled2 = df.shuffle(42); // Same order as shuffled1
 * ```
 *
 * @remarks
 * - Randomly reorders all rows in the DataFrame
 * - Creates a new DataFrame without modifying the original
 * - Uses Fisher-Yates shuffle algorithm for uniform distribution
 * - Useful for randomizing data for sampling, testing, or analysis
 * - With no seed: each call produces a different random order
 * - With seed: reproducible shuffling for testing and consistent results
 * - For grouped DataFrames: shuffles rows within each group
 */
export declare function shuffle(seed?: number): (df: any) => any;
