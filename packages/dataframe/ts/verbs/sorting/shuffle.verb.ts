import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";
import {
  createDataFrame,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { bitsetGet } from "../../dataframe/implementation/columnar-view.ts";
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
    const api = df as any;
    const store = api.__store;
    const groupedDf = df as GroupedDataFrame<T>;

    if (groupedDf.__groups) {
      const mask = api.__view?.mask;
      const rebuilt: T[] = [];
      const { head, next, size } = groupedDf.__groups;

      for (let g = 0; g < size; g++) {
        const groupIndices: number[] = [];
        let rowIdx = head[g];
        while (rowIdx !== -1) {
          if (!mask || bitsetGet(mask, rowIdx)) {
            groupIndices.push(rowIdx);
          }
          rowIdx = next[rowIdx];
        }

        const groupRows: T[] = [];
        for (const physIdx of groupIndices) {
          const row: any = {};
          for (const colName of store.columnNames) {
            row[colName] = store.columns[colName][physIdx];
          }
          groupRows.push(row);
        }

        rebuilt.push(...shuffleArray(groupRows, seed));
      }

      const out = rebuilt.length > 0
        ? createDataFrame(rebuilt)
        : createDataFrame({
          columns: Object.fromEntries(
            store.columnNames.map((col: string) => [col, []]),
          ),
        });
      return withGroupsRebuilt(groupedDf, rebuilt, out as any);
    } else {
      const idx = materializeIndex(store.length, api.__view);
      const rows: T[] = [];
      for (let i = 0; i < idx.length; i++) {
        const row: any = {};
        for (const colName of store.columnNames) {
          row[colName] = store.columns[colName][idx[i]];
        }
        rows.push(row);
      }
      const result = shuffleArray(rows, seed);
      return createDataFrame(result) as unknown as DataFrame<T>;
    }
  };
}
