// deno-lint-ignore-file no-explicit-any
import type {
  DataFrame,
  GroupedDataFrame,
  Prettify,
} from "../../../dataframe/index.ts";
import {
  cowStore,
  createDataFrame,
  preserveDataFrameMetadata,
} from "../../../dataframe/index.ts";

/* =================================================================================
   Group-level mutate (value per group, recycled to rows)
   ================================================================================= */

// Overloads
export function mutate_group<
  T extends Record<string, unknown>,
  G extends keyof T,
  K extends string,
  V,
>(colName: K, expr: (df: DataFrame<T>) => V): (
  df: GroupedDataFrame<T, G>,
) => GroupedDataFrame<
  Prettify<T & Record<K, V>>,
  Extract<G, keyof Prettify<T & Record<K, V>>>
>;

export function mutate_group<
  T extends Record<string, unknown>,
  K extends string,
  V,
>(colName: K, expr: (df: DataFrame<T>) => V): (
  df: DataFrame<T>,
) => DataFrame<Prettify<T & Record<K, V>>>;

// Implementation
export function mutate_group(
  colName: string,
  expr: (df: any) => any,
): any {
  return (df: any): any => impl_grouped(df, { [colName]: expr });
}

/* =================================================================================
   Group-level mutate implementation
   ================================================================================= */

/** Group-level mutate implementation (expr sees the group DataFrame) using copy-on-write */
function impl_grouped<Row extends Record<string, unknown>>(
  df: DataFrame<Row> | GroupedDataFrame<Row>,
  spec: Record<string, (df: DataFrame<Row>) => unknown>,
) {
  const api = df as any;
  const store = api.__store;
  const n = (df as DataFrame<Row>).nrows();
  const updates: Record<string, unknown[]> = {};

  // 1) prepare arrays only for columns being added/replaced
  for (const col of Object.keys(spec)) {
    updates[col] = new Array(n);
  }

  if ((df as any).__groups) {
    const g = (df as any).__groups;
    for (const [col, expr] of Object.entries(spec)) {
      for (const groupRows of g.rows) {
        // Create group DataFrame for this specific group
        const groupData = createDataFrame(
          groupRows.map((rowIndex: number) => {
            const row = {} as Record<string, unknown>;
            for (const colName of store.columnNames) {
              (row as any)[colName] = store.columns[colName][rowIndex];
            }
            return row;
          }) as readonly Record<string, unknown>[],
        );

        const groupValue = expr(groupData as unknown as DataFrame<Row>);

        if (
          typeof groupValue === "object" &&
          groupValue !== null &&
          !Array.isArray(groupValue)
        ) {
          const across = groupValue as Record<string, unknown[]>;
          Object.entries(across).forEach(([acrossCol, values]) => {
            if (Array.isArray(values)) {
              // Validate that vector length matches group size
              if (values.length !== groupRows.length) {
                throw new Error(
                  `Column "${acrossCol}" returned ${values.length} values but group has ${groupRows.length} rows. ` +
                    `Vector outputs must match the group size.`,
                );
              }
              // Ensure we have an array for this column
              if (!updates[acrossCol]) updates[acrossCol] = new Array(n);
              groupRows.forEach((rowIndex: number, i: number) => {
                updates[acrossCol][rowIndex] = values[i];
              });
            }
          });
        } else {
          const groupValues = Array(groupRows.length).fill(groupValue);
          groupRows.forEach((rowIndex: number, i: number) => {
            updates[col][rowIndex] = groupValues[i];
          });
        }
      }
    }
  } else {
    for (const [col, expr] of Object.entries(spec)) {
      const value = expr(df as DataFrame<Row>);
      if (
        typeof value === "object" && value !== null && !Array.isArray(value)
      ) {
        const across = value as Record<string, unknown[]>;
        Object.entries(across).forEach(([acrossCol, values]) => {
          if (Array.isArray(values)) {
            // Validate that vector length matches dataframe size
            if (values.length !== n) {
              throw new Error(
                `Column "${acrossCol}" returned ${values.length} values but dataframe has ${n} rows. ` +
                  `Vector outputs must match the dataframe size.`,
              );
            }
            // Ensure we have an array for this column
            if (!updates[acrossCol]) updates[acrossCol] = new Array(n);
            for (let i = 0; i < n; i++) {
              updates[acrossCol][i] = values[i];
            }
          }
        });
      } else {
        for (let i = 0; i < n; i++) {
          updates[col][i] = value;
        }
      }
    }
  }

  // 3) build copy-on-write store
  const nextStore = cowStore(store, updates);
  // 4) return new DF sharing unmodified columns
  const out = createDataFrame([] as readonly Record<string, unknown>[]);
  (out as any).__store = nextStore;
  (out as any).__view = (df as any).__view; // preserve view

  // Create new RowView for the updated columns
  class RowView {
    private _i = 0;
    constructor(
      private cols: Record<string, unknown[]>,
      private names: string[],
    ) {
      // Create getters for each column
      for (const name of names) {
        Object.defineProperty(this, name, {
          get: () => this.cols[name][this._i],
          enumerable: true,
          configurable: true,
        });
      }
    }
    setCursor(i: number) {
      this._i = i;
    }
  }
  (out as any).__rowView = new RowView(
    nextStore.columns,
    nextStore.columnNames,
  );

  // Preserve DataFrame metadata (__kind, __groups, __rowLabels)
  preserveDataFrameMetadata(out, df);

  return out as unknown as typeof df;
}
