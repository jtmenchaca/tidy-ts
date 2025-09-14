import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import { createDataFrame } from "../../dataframe/index.ts";
import { shuffleArray } from "../utility/seedable-random.ts";

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
export function shuffle<T extends Record<string, unknown>>(seed?: number) {
  return (df: DataFrame<T> | GroupedDataFrame<T>): DataFrame<T> => {
    const groupedDf = df as GroupedDataFrame<T>;

    if (groupedDf.__groups) {
      // Handle grouped DataFrames - shuffle within each group
      const rows = [...df];
      const rebuilt: T[] = [];

      const { head, next, size } = groupedDf.__groups;

      // Iterate through each group using adjacency list
      for (let g = 0; g < size; g++) {
        // Collect all rows in this group
        const groupRows: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          groupRows.push(rowIdx);
          rowIdx = next[rowIdx];
        }

        const groupData = groupRows.map((i: number) => rows[i]);
        const shuffled = shuffleArray(groupData, seed);
        rebuilt.push(...shuffled);
      }

      return createDataFrame(rebuilt) as unknown as DataFrame<T>;
    } else {
      // Handle ungrouped DataFrames
      const result = shuffleArray([...df], seed);
      return createDataFrame(result) as unknown as DataFrame<T>;
    }
  };
}
