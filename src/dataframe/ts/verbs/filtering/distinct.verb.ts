// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  createDataFrame,
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import { bitsetGet } from "../../dataframe/implementation/columnar-view.ts";
import { tracer } from "../../telemetry/tracer.ts";
import { distinct_rows_generic_typed } from "../../wasm/wasm-loader.ts";

// API: require at least one column (SQL-like DISTINCT)
export function distinct<Row extends object>(
  column1: keyof Row,
  ...moreCols: (keyof Row)[]
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const cols = [column1, ...moreCols];
    const span = tracer.startSpan(df, "distinct", { columns: cols });

    try {
      const api: any = df as any;
      const store = api.__store;
      const selectedCols = cols.map(String) as string[];
      const keyCols = [...selectedCols].sort();

      // For grouped DataFrames, include grouping columns in output
      const groups = (df as any).__groups;
      const outputCols = groups
        ? [...new Set([...groups.groupingColumns.map(String), ...selectedCols])]
        : selectedCols;

      // If grouped, apply distinct within each group
      const groupedDf = df as GroupedDataFrame<Row>;
      if (groupedDf.__groups) {
        const mask = api.__view?.mask;
        const rebuilt: Row[] = [];
        const { head, next, size } = groupedDf.__groups;

        for (let g = 0; g < size; g++) {
          // Collect physical indices for this group, filtering by mask if present
          const groupIndices: number[] = [];
          let rowIdx = head[g];
          while (rowIdx !== -1) {
            // Only include this row if it passes the mask (or if there's no mask)
            if (!mask || bitsetGet(mask, rowIdx)) {
              groupIndices.push(rowIdx);
            }
            rowIdx = next[rowIdx];
          }

          // Run distinct on this group
          const typedArrays = convertToTypedArrays(store.columns, keyCols);
          const columnData = keyCols.map((colName) => typedArrays[colName]);
          const groupIdx = new Uint32Array(groupIndices);
          const distinctIndices = Array.from(
            distinct_rows_generic_typed(columnData, groupIdx),
          );

          // Add distinct rows from this group to output
          for (const physIdx of distinctIndices) {
            const row = {} as Row;
            for (const colName of outputCols) {
              (row as any)[colName] = store.columns[colName][physIdx];
            }
            rebuilt.push(row);
          }
        }

        const out = rebuilt.length > 0
          ? createDataFrame(rebuilt)
          : createDataFrame({
            columns: Object.fromEntries(
              outputCols.map((col: string) => [col, []]),
            ),
          }) as unknown as DataFrame<Row>;

        const result = withGroupsRebuilt(groupedDf, rebuilt, out);
        tracer.copyContext(df, result);
        return result;
      }

      // Ungrouped path
      const view = api.__view;
      const idx = materializeIndex(store.length, view);
      const n = idx.length;

      // Use ultra-optimized typed array WASM - broken down for analysis
      const keepPhys = tracer.withSpan(df, "find-distinct-rows", () => {
        // Step 1: Convert JS columns to typed arrays
        const typedArrays = tracer.withSpan(
          df,
          "convert-to-typed-arrays",
          () => {
            return convertToTypedArrays(store.columns, keyCols);
          },
        );

        // Step 2: Map column names to typed arrays
        const columnData = tracer.withSpan(df, "map-column-data", () => {
          return keyCols.map((colName) => typedArrays[colName]);
        });

        // Step 3: Call WASM function
        const wasmResult = tracer.withSpan(df, "wasm-distinct-call", () => {
          return distinct_rows_generic_typed(columnData, idx);
        });

        // Step 4: Convert result to JS array
        const result = tracer.withSpan(df, "convert-wasm-result", () => {
          return Array.from(wasmResult);
        });

        return result;
      }, { totalRows: n, uniqueRows: 0 });

      // Rebuild columns - include selected columns + grouping columns if grouped
      const outCols = tracer.withSpan(df, "rebuild-columns", () => {
        const outCols: Record<string, unknown[]> = {};
        for (const name of outputCols) {
          const src = store.columns[name];
          const dst = new Array(keepPhys.length);
          for (let i = 0; i < keepPhys.length; i++) {
            dst[i] = src[keepPhys[i]];
          }
          outCols[name] = dst;
        }
        return outCols;
      }, { inputRows: n, outputRows: keepPhys.length });

      const out = tracer.withSpan(df, "create-result-dataframe", () => {
        const newStore = {
          columns: outCols,
          columnNames: outputCols,
          length: keepPhys.length,
        };
        const dataframe = createColumnarDataFrameFromStore(newStore);
        (dataframe as any).__view = {};
        return dataframe;
      });

      // Handle groups
      const result = tracer.withSpan(df, "handle-groups", () => {
        if ((df as any).__groups) {
          const src = df as GroupedDataFrame<Row>;
          const outRows = (out as unknown as DataFrame<Row>)
            .toArray() as readonly Row[];
          return withGroupsRebuilt(
            src,
            outRows,
            out as unknown as DataFrame<Row>,
          ) as unknown as typeof df;
        }
        return out as unknown as typeof df;
      });

      tracer.copyContext(df, result);
      return result;
    } finally {
      tracer.endSpan(df, span);
    }
  };
}
