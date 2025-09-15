// deno-lint-ignore-file no-explicit-any
// Wires DataFrame verbs to the current instance through functional modules.

import { mutate } from "../../verbs/transformation/mutate/mutate.verb.ts";
import { mutate_columns } from "../../verbs/transformation/mutate-columns.verb.ts";
import { filter } from "../../verbs/filtering/filter.verb.ts";
import { select } from "../../verbs/selection/select.verb.ts";
import { arrange } from "../../verbs/sorting/arrange.verb.ts";
import { dummy_col } from "../../verbs/utility/dummy-col.verb.ts";
import {
  slice,
  slice_head,
  slice_indices,
  slice_max,
  slice_min,
  slice_sample,
  slice_tail,
} from "../../verbs/filtering/slice.verb.ts";
import { distinct } from "../../verbs/filtering/distinct.verb.ts";
import { rename } from "../../verbs/transformation/rename.verb.ts";
import { drop } from "../../verbs/selection/drop.verb.ts";
import { reorder } from "../../verbs/transformation/reorder.verb.ts";
import { ungroup } from "../../verbs/grouping/ungroup.verb.ts";
import { replaceNA } from "../../verbs/missing-data/replace-na.verb.ts";
// import { filterNA } from "../../verbs/missing-data/filter-na.verb.ts";
import { append } from "../../verbs/reshape/append.verb.ts";
import { prepend } from "../../verbs/reshape/prepend.verb.ts";
import { shuffle } from "../../verbs/sorting/shuffle.verb.ts";
import {
  extract,
  extract_head,
  extract_nth,
  extract_sample,
  extract_tail,
} from "../../verbs/selection/extract.verb.ts";

// Joins
import { inner_join } from "../../verbs/join/inner-join.verb.ts";
import { left_join } from "../../verbs/join/left-join.verb.ts";
import { left_join_parallel } from "../../verbs/join/left-join-parallel.verb.ts";
import { right_join } from "../../verbs/join/right-join.verb.ts";
import { outer_join } from "../../verbs/join/outer-join.verb.ts";
import { cross_join } from "../../verbs/join/cross-join.verb.ts";
import { asof_join } from "../../verbs/join/asof-join.verb.ts";
// Aggregation
import { groupBy } from "../../verbs/grouping/group-by.verb.ts";
import { summarise } from "../../verbs/aggregate/summarise.verb.ts";
import { summarise_columns } from "../../verbs/aggregate/summarise-columns.verb.ts";
import { cross_tabulate } from "../../verbs/aggregate/cross_tabulate.verb.ts";

// Pivot
import { pivot_longer, pivot_wider } from "../../verbs/reshape/pivot.verb.ts";
import { transpose } from "../../verbs/reshape/transpose.verb.ts";

// Row labels
import {
  generateDefaultRowLabels,
  type RowLabel,
} from "../types/row-labels.ts";
import { ROW_LABEL } from "../../verbs/reshape/transpose.types.ts";

// DataFrame creation utilities
import { createColumnarDataFrameFromStore } from "./create-dataframe.ts";

// Graph
import { graph } from "../../graph/graph.ts";

// Side effects
import {
  for_each_col,
  for_each_row,
} from "../../verbs/utility/for-each.verb.ts";
import { print } from "../../verbs/utility/print.verb.ts";

// Row binding
import { bind_rows } from "../../verbs/reshape/bind-rows.verb.ts";

// Chain wrappers for seamless async thenableDataFrameing
import { thenableDataFrame } from "../../promised-dataframe/index.ts";
import { thenableGroupedDataFrame } from "../../promised-dataframe/index.ts";

/** Resolve a property name to a fluent method that applies to the current df instance. */
export function resolveVerb(prop: PropertyKey, df: unknown) {
  if (prop === "mutate") {
    return (spec: object, options?: any) => {
      const result = (mutate as any)(spec, options)(df);
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "mutateColumns") {
    return (spec: object) => {
      const result = (mutate_columns as any)(spec)(df);
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "filter") {
    return (...a: unknown[]) => {
      const result = (filter as any)(...a)(df);

      // Only wrap if result is a Promise, otherwise return directly for chaining
      const wrapped = result instanceof Promise
        ? thenableDataFrame(result)
        : result;
      return wrapped;
    };
  }
  if (prop === "select") {
    return (...a: unknown[]) => {
      const result = (select as any)(...a)(df);
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "arrange" || prop === "sort") {
    return (...a: unknown[]) => {
      const result = (arrange as any)(...a)(df);

      // Only wrap if result is a Promise, otherwise return directly for chaining
      const wrapped = result instanceof Promise
        ? thenableDataFrame(result)
        : result;
      return wrapped;
    };
  }
  if (prop === "distinct") {
    return (...a: unknown[]) => (distinct as any)(...a)(df);
  }
  if (prop === "extract") {
    return (...a: unknown[]) => (extract as any)(...a)(df);
  }
  if (prop === "extractHead") {
    return (...a: unknown[]) => (extract_head as any)(...a)(df);
  }
  if (prop === "extractTail") {
    return (...a: unknown[]) => (extract_tail as any)(...a)(df);
  }
  if (prop === "extractNth") {
    return (...a: unknown[]) => (extract_nth as any)(...a)(df);
  }
  if (prop === "extractSample") {
    return (...a: unknown[]) => (extract_sample as any)(...a)(df);
  }
  if (prop === "rename") {
    return (...a: unknown[]) => {
      const result = (rename as any)(...a)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "drop") {
    return (...a: unknown[]) => {
      const result = (drop as any)(...a)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "reorder") {
    return (...a: unknown[]) => (reorder as any)(...a)(df);
  }
  if (prop === "innerJoin") {
    return (o: unknown, onOrOptions: unknown, options?: unknown) => {
      let result;
      // Check if second argument is an object with 'keys' property (advanced API)
      if (
        onOrOptions && typeof onOrOptions === "object" &&
        !Array.isArray(onOrOptions) && "keys" in onOrOptions
      ) {
        // Advanced API: innerJoin(other, { keys: ..., suffixes: ... })
        result = (inner_join as any)(o, onOrOptions)(df);
      } else {
        // Simple API: innerJoin(other, keys, options?)
        result = (inner_join as any)(o, onOrOptions, options)(df);
      }
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "leftJoin") {
    return (o: unknown, onOrOptions: unknown, options?: unknown) => {
      let result;
      // Check if second argument is an object with 'keys' property (advanced API)
      if (
        onOrOptions && typeof onOrOptions === "object" &&
        !Array.isArray(onOrOptions) && "keys" in onOrOptions
      ) {
        // Advanced API: leftJoin(other, { keys: ..., suffixes: ... })
        result = (left_join as any)(o, onOrOptions)(df);
      } else {
        // Simple API: leftJoin(other, keys, options?)
        result = (left_join as any)(o, onOrOptions, options)(df);
      }
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "leftJoinParallel") {
    return (o: unknown, onOrOptions: unknown, options?: unknown) => {
      let result;
      // Check if second argument is an object with 'keys' property (advanced API)
      if (
        onOrOptions && typeof onOrOptions === "object" &&
        !Array.isArray(onOrOptions) && "keys" in onOrOptions
      ) {
        // Advanced API: leftJoin(other, { keys: ..., suffixes: ... })
        result = (left_join_parallel as any)(o, onOrOptions)(df);
      } else {
        // Simple API: leftJoin(other, keys, options?)
        result = (left_join_parallel as any)(o, onOrOptions, options)(df);
      }
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "rightJoin") {
    return (o: unknown, on: unknown, options?: unknown) => {
      const result = (right_join as any)(o, on, options)(df);
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "outerJoin") {
    return (o: unknown, on: unknown) => {
      const result = (outer_join as any)(o, on)(df);
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "crossJoin") {
    return (o: unknown, maxRows?: unknown, suffixes?: unknown) => {
      const result = (cross_join as any)(o, maxRows, suffixes)(df);
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "asofJoin") {
    return (o: unknown, on: unknown, options?: unknown) => {
      const result = (asof_join as any)(o, on, options)(df);
      // Only wrap if result is a Promise, otherwise return directly for chaining
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "groupBy") {
    return (...a: unknown[]) => {
      const result = (groupBy as any)(...a)(df);
      // If no columns provided, groupBy returns an ungrouped DataFrame
      if (a.length === 0) {
        return thenableDataFrame(result);
      }
      return thenableGroupedDataFrame(result);
    };
  }
  if (prop === "summarise" || prop === "summarize") {
    return (...a: unknown[]) => {
      const result = (summarise as any)(...a)(df);
      // Only wrap Promises in thenableDataFrame proxy, return sync results directly
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "summariseColumns" || prop === "summarizeColumns") {
    return (...a: unknown[]) => (summarise_columns as any)(...a)(df);
  }

  if (prop === "crossTabulate") {
    return (...a: unknown[]) => (cross_tabulate as any)(...a)(df);
  }

  if (prop === "slice") {
    return (...a: unknown[]) => {
      const result = (slice as any)(...a)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "slice_indices") {
    return (...a: unknown[]) => {
      const result = (slice_indices as any)(...a)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "head") {
    return (n: unknown) => {
      const result = (slice_head as any)(n)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "tail") {
    return (n: unknown) => {
      const result = (slice_tail as any)(n)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "sliceMin") {
    return (c: unknown, n: unknown) => {
      const result = (slice_min as any)(c, n)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "sliceMax") {
    return (c: unknown, n: unknown) => {
      const result = (slice_max as any)(c, n)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "sample") {
    return (n: unknown, seed?: number) => {
      const result = (slice_sample as any)(n, seed)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "pivotWider") {
    return (opts: unknown) => {
      const result = pivot_wider(opts as any)(df as any);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  if (prop === "pivotLonger") {
    return (opts: unknown) => {
      const result = pivot_longer(opts as any)(df as any);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "transpose") {
    return (expectedRows: number) => {
      return transpose({ number_of_rows: expectedRows })(df as any);
    };
  }

  if (prop === "setRowLabels") {
    return (labels: RowLabel[]) => {
      const currentDf = df as any;
      const store = currentDf.__store;

      if (labels.length !== store.length) {
        throw new Error(
          `Row labels length (${labels.length}) must match DataFrame rows (${store.length})`,
        );
      }

      // Use imported ROW_LABEL symbol

      // Create new store with ROW_LABEL column added
      const newColumns = {
        ...store.columns,
        [ROW_LABEL]: [...labels], // Add symbol column with row labels
      };

      const newColumnNames = [
        ...store.columnNames.filter((name: string | symbol) =>
          name !== ROW_LABEL
        ),
        ROW_LABEL,
      ];

      const newStore = {
        ...store,
        columns: newColumns,
        columnNames: newColumnNames,
      };

      return createColumnarDataFrameFromStore(newStore);
    };
  }

  if (prop === "getRowLabels") {
    return () => {
      const currentDf = df as any;
      const store = currentDf.__store;

      return store.rowLabels?.indexToLabel ??
        generateDefaultRowLabels(store.length);
    };
  }

  if (prop === "loc") {
    return (labelOrLabels: RowLabel | RowLabel[]) => {
      const currentDf = df as any;
      const store = currentDf.__store;
      const view = currentDf.__view;

      if (!store.rowLabels) {
        throw new Error(
          "DataFrame has no row labels. Use setRowLabels() first.",
        );
      }

      if (Array.isArray(labelOrLabels)) {
        // Multiple labels - return DataFrame
        const indices = labelOrLabels.map((label) => {
          const idx = store.rowLabels!.labelToIndex.get(label);
          if (idx === undefined) {
            throw new Error(`Row label "${label}" not found`);
          }
          return idx;
        });

        // Create new view with selected indices
        const newView = view
          ? {
            ...view,
            mask: new Set(indices),
          }
          : {
            mask: new Set(indices),
          };

        return createColumnarDataFrameFromStore({ ...store, __view: newView });
      } else {
        // Single label - return row object
        const idx = store.rowLabels.labelToIndex.get(labelOrLabels);
        if (idx === undefined) {
          return undefined;
        }

        // Reconstruct row object
        const row: any = {};
        for (const colName of store.columnNames) {
          row[colName] = store.columns[colName][idx];
        }
        return row;
      }
    };
  }

  if (prop === "iloc") {
    return (labels: RowLabel[]) => {
      return (df as any).loc(labels);
    };
  }

  if (prop === "dummyCol") {
    return (col: unknown, options?: unknown) => {
      const result = (dummy_col as any)(col as any, options as any)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "graph") {
    return (...args: Parameters<typeof graph>) => graph(...args)(df as any);
  }

  if (prop === "forEachRow") {
    return (...a: unknown[]) => {
      // for_each_row always returns the same df for reference equality
      // Even for async, we want to preserve the original df reference
      return (for_each_row as any)(...a)(df);
    };
  }
  if (prop === "forEachCol") {
    return (...a: unknown[]) => {
      // for_each_col always returns the same df for reference equality
      // Even for async, we want to preserve the original df reference
      return (for_each_col as any)(...a)(df);
    };
  }
  if (prop === "print") {
    return (...a: unknown[]) => {
      // print always returns the same df for reference equality
      return (print as any)(...a)(df);
    };
  }
  if (prop === "ungroup") {
    return () => {
      const result = ungroup(df as any);
      // ungroup returns a regular DataFrame, not a thenable
      return result;
    };
  }

  if (prop === "replaceNA") {
    return (mapping: unknown) => {
      const result = (replaceNA as any)(mapping)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }
  // if (prop === "filterNA") {
  //   return (col: unknown, ...rest: unknown[]) => {
  //     const result = (filterNA as any)(col as any, ...rest as any)(df);
  //     return result instanceof Promise ? thenableDataFrame(result) : result;
  //   };
  // }
  if (prop === "append") {
    return (...rows: unknown[]) => {
      const result = (append as any)(...rows)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "prepend") {
    return (...rows: unknown[]) => {
      const result = (prepend as any)(...rows)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "shuffle") {
    return (seed?: number) => {
      const result = (shuffle as any)(seed)(df);
      return result instanceof Promise ? thenableDataFrame(result) : result;
    };
  }

  if (prop === "bindRows") {
    return (...a: unknown[]) => (bind_rows as any)(...a)(df);
  }

  // Note: Essential DataFrame properties like print, nrows, etc.
  // are handled directly by the DataFrame object, not through resolveFluent.
  // The thenable wrapper will access these through the resolved DataFrame.

  return undefined;
}
