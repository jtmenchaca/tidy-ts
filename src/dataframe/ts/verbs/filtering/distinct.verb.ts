// deno-lint-ignore-file no-explicit-any
import {
  createColumnarDataFrameFromStore,
  type DataFrame,
  type GroupedDataFrame,
  materializeIndex,
  withGroupsRebuilt,
} from "../../dataframe/index.ts";
import { convertToTypedArrays } from "../../dataframe/implementation/column-helpers.ts";
import { tracer } from "../../telemetry/tracer.ts";
import { distinct_rows_generic_typed } from "../../wasm/wasm-loader.ts";

// API: allow column subset; default = all
export function distinct<Row extends object>(
  ...cols: (keyof Row)[]
) {
  return (df: DataFrame<Row> | GroupedDataFrame<Row>) => {
    const span = tracer.startSpan(df, "distinct", { columns: cols });

    try {
      const api: any = df as any;
      const store = api.__store;
      const view = api.__view;

      // View-aware row order
      const idx = tracer.withSpan(df, "materialize-index", () => {
        return materializeIndex(store.length, view);
      });
      const n = idx.length;

      // Use provided columns or all columns
      const { selectedCols: _, keyCols } = tracer.withSpan(
        df,
        "prepare-columns",
        () => {
          const selectedCols = (cols.length
            ? cols.map(String)
            : [...store.columnNames]) as string[];
          const keyCols = [...selectedCols].sort();
          return { selectedCols, keyCols };
        },
      );

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
          return keyCols.map((colName) =>
            typedArrays[colName]
          );
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

      // Rebuild columns
      const outCols = tracer.withSpan(df, "rebuild-columns", () => {
        const outCols: Record<string, unknown[]> = {};
        for (const name of store.columnNames) {
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
          columnNames: [...store.columnNames],
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
