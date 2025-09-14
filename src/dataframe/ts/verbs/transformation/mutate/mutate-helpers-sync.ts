// deno-lint-ignore-file no-explicit-any
import {
  cowStore,
  createDataFrame,
  materializeIndex,
  preserveDataFrameMetadata,
} from "../../../dataframe/index.ts";
import type { DataFrame, GroupedDataFrame } from "../../../dataframe/index.ts";
import type { MutateAssignments } from "./mutate.types.ts";
import { RowView } from "./mutate-shared-helpers.ts";

/* =================================================================================
   Synchronous helper functions for mutate operations
   ================================================================================= */

/**
 * Create a new DataFrame with updated columns using copy-on-write
 */
export function createUpdatedDataFrame<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  updates: Record<string, unknown[]>,
  drops?: Set<string>,
): any {
  const api = df as any;
  const store = api.__store;

  const tracer = (globalThis as any).tidyTsTracer;

  // Build copy-on-write store
  const nextStore = tracer?.withSpan(df, "cow-store", () => {
    return cowStore(store, updates, drops);
  }, {
    updatedColumns: Object.keys(updates).length,
    droppedColumns: drops?.size ?? 0,
    totalColumns: store.columnNames.length,
  }) ?? cowStore(store, updates, drops);

  // Create new DataFrame sharing unmodified columns
  const out = tracer?.withSpan(df, "create-base-dataframe", () => {
    const newDf = createDataFrame([] as readonly Record<string, unknown>[]);
    (newDf as any).__store = nextStore;
    (newDf as any).__view = (df as any).__view; // preserve view
    return newDf;
  }) ?? (() => {
    const newDf = createDataFrame([] as readonly Record<string, unknown>[]);
    (newDf as any).__store = nextStore;
    (newDf as any).__view = (df as any).__view;
    return newDf;
  })();

  // Create new RowView for the updated columns
  tracer?.withSpan(df, "create-row-view", () => {
    (out as any).__rowView = new RowView(
      nextStore.columns,
      nextStore.columnNames,
    );
  }, { columnCount: nextStore.columnNames.length }) ?? (() => {
    (out as any).__rowView = new RowView(
      nextStore.columns,
      nextStore.columnNames,
    );
  })();

  // Preserve DataFrame metadata (__kind, __groups, __rowLabels)
  tracer?.withSpan(df, "preserve-metadata", () => {
    preserveDataFrameMetadata(out, df);
  }) ?? preserveDataFrameMetadata(out, df);

  return out;
}

/**
 * Process grouped data mutations
 */
export function processGroupedMutations<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
  updates: Record<string, unknown[]>,
): void {
  const api = df as any;
  const row = api.__rowView as any;
  const store = api.__store;
  const g = (df as any).__groups;
  const view = api.__view;
  const storeLength = store.length;
  const materialized = materializeIndex(storeLength, view);
  const usesRaw = !!g?.usesRawIndices;

  for (const [col, expr] of Object.entries(spec)) {
    if (expr === null) {
      continue;
    }

    if (typeof expr === "function") {
      const { head, next, size } = g;
      // Iterate through each group using adjacency list
      for (let groupIdx = 0; groupIdx < size; groupIdx++) {
        // Create group-specific DataFrame for this group
        const groupRows: Record<string, unknown>[] = [];
        let tempRowIdx = head[groupIdx];

        // First pass: collect all rows in this group
        while (tempRowIdx !== -1) {
          const groupRow: Record<string, unknown> = {};
          const physicalIndex = usesRaw ? tempRowIdx : materialized[tempRowIdx];
          for (const colName of store.columnNames) {
            groupRow[colName] = store.columns[colName][physicalIndex];
          }
          groupRows.push(groupRow);
          tempRowIdx = g.next[tempRowIdx];
        }

        const groupDF = createDataFrame(groupRows);

        // Second pass: apply the function with group DataFrame
        let k = 0; // index within group
        let rowIdx = head[groupIdx];
        while (rowIdx !== -1) {
          const physicalIndex = usesRaw ? rowIdx : materialized[rowIdx];
          row.setCursor(physicalIndex);
          updates[col][physicalIndex] = (expr as any)(row, k, groupDF);
          k++;
          rowIdx = next[rowIdx];
        }
      }
    } else if (Array.isArray(expr)) {
      const n = (df as DataFrame<Row>).nrows();
      if (expr.length !== n) {
        throw new RangeError(`Column "${col}" length ${expr.length} ≠ ${n}`);
      }
      // Map array values to physical indices respecting the view
      const idx = materialized;
      for (let i = 0; i < idx.length; i++) updates[col][idx[i]] = expr[i];
    } else {
      const _n = (df as DataFrame<Row>).nrows();
      // Apply scalar to visible rows only, respecting the view
      const idx = materialized;
      for (let i = 0; i < idx.length; i++) updates[col][idx[i]] = expr;
    }
  }
}

/**
 * Process ungrouped data mutations
 */
export function processUngroupedMutations<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: MutateAssignments<Row>,
  updates: Record<string, unknown[]>,
): void {
  const api = df as any;
  const store = api.__store;
  const row = api.__rowView as any;
  const n = (df as DataFrame<Row>).nrows();

  // For ungrouped data, need to respect the view (filtered/masked data)
  const view = api.__view;
  const storeLength = store.length;
  const materializedIndex = materializeIndex(storeLength, view);

  for (const [col, expr] of Object.entries(spec)) {
    if (expr === null) {
      continue;
    }
    if (typeof expr === "function") {
      // Only process visible rows using the materialized index
      for (let i = 0; i < materializedIndex.length; i++) {
        const physicalIndex = materializedIndex[i];
        row.setCursor(physicalIndex);
        updates[col][physicalIndex] = (expr as any)(row, i, df);
      }
    } else if (Array.isArray(expr)) {
      if (expr.length !== n) {
        throw new RangeError(`Column "${col}" length ${expr.length} ≠ ${n}`);
      }
      // For array expressions, map to the correct physical indices
      for (let i = 0; i < materializedIndex.length; i++) {
        const physicalIndex = materializedIndex[i];
        updates[col][physicalIndex] = expr[i];
      }
    } else {
      // For scalar expressions, apply to all visible rows
      for (let i = 0; i < materializedIndex.length; i++) {
        const physicalIndex = materializedIndex[i];
        updates[col][physicalIndex] = expr;
      }
    }
  }
}
