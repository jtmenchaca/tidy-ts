// deno-lint-ignore-file no-explicit-any
import { createDataFrame, materializeIndex } from "../../dataframe/index.ts";
import { collectGroupIndices } from "../verb-helpers.ts";

/**
 * Summarise across multiple columns of the same type.
 *
 * Applies aggregation functions to entire columns (group-level operations)
 * across multiple columns of the same type. Creates new columns for each
 * function x input-column combination.
 */
export function summarise_columns(spec: any) {
  return (
    df: any,
  ): any => {
    const groupedDf = df;

    const getColumnData = (
      data: any,
      col: any,
    ): any => {
      const rawData = [...data[col]] as unknown[];
      return rawData;
    };

    if (groupedDf.__groups) {
      const {
        head,
        next,
        count: _count,
        keyRow,
        groupingColumns,
        size,
        usesRawIndices,
      } = groupedDf.__groups;

      const api = df as any;
      const store = api.__store;
      const mask = api.__view?.mask;
      const baseIndex = usesRawIndices
        ? null
        : materializeIndex(store.length, api.__view);

      const results: object[] = [];

      const buildKeyObj = (viewIdx: number): object => {
        const o: object = {};
        const physIdx = baseIndex ? baseIndex[viewIdx] : viewIdx;
        for (const c of groupingColumns) {
          const name = String(c);
          (o as any)[name] = store.columns[name][physIdx];
        }
        return o;
      };

      for (let g = 0; g < size; g++) {
        const groupIndices = collectGroupIndices({ head, next, groupIndex: g, mask });

        if (groupIndices.length === 0) continue;

        // Build rows from columnar store for this group
        const groupRowObjects: any[] = [];
        for (const idx of groupIndices) {
          const physIdx = baseIndex ? baseIndex[idx] : idx;
          const row: any = {};
          for (const colName of store.columnNames) {
            row[colName] = store.columns[colName][physIdx];
          }
          groupRowObjects.push(row);
        }

        const groupData = createDataFrame(groupRowObjects);

        const result: object = {
          ...buildKeyObj(keyRow[g]),
        };

        for (const col of spec.columns) {
          const columnData = getColumnData(groupData, col);
          for (const newCol of spec.newColumns) {
            const newColName = `${newCol.prefix}${String(col)}`;
            (result as any)[newColName] = newCol.fn(columnData);
          }
        }
        results.push(result);
      }

      return createDataFrame(results) as any;
    } else {
      const result: object = {};
      for (const col of spec.columns) {
        const columnData = getColumnData(df, col);
        for (const newCol of spec.newColumns) {
          const newColName = `${newCol.prefix}${String(col)}`;
          (result as any)[newColName] = newCol.fn(columnData);
        }
      }

      return createDataFrame([result]) as any;
    }
  };
}
