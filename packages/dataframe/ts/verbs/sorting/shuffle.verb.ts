import {
  createDataFrame,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { shuffleArray } from "../utility/seedable-random.ts";
import { collectGroupIndices } from "../verb-helpers.ts";

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
export function shuffle(seed?: number) {
  return (df: any): any => {
    const api = df;
    const store = api.__store;

    if (api.__groups) {
      const mask = api.__view?.mask;
      const rebuilt: any[] = [];
      const { head, next, size } = api.__groups;

      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupIndices({ head, next, groupIndex: g, mask });

        const groupRows: any[] = [];
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
      return withGroupsRebuilt(api, rebuilt, out as any);
    } else {
      const idx = materializeIndex(store.length, api.__view);
      const rows: any[] = [];
      for (let i = 0; i < idx.length; i++) {
        const row: any = {};
        for (const colName of store.columnNames) {
          row[colName] = store.columns[colName][idx[i]];
        }
        rows.push(row);
      }
      const result = shuffleArray(rows, seed);
      return createDataFrame(result);
    }
  };
}
