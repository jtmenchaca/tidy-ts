// // deno-lint-ignore-file no-explicit-any
// import type { DataFrame } from "../../dataframe/index.ts";
// import type { FilterNaOptions } from "./filter-na.types.ts";

// /**
//  * Filter rows by requiring specified columns to be present (not null/undefined).
//  * Supports one or more column names. Options allow toggling null/undefined checks.
//  * Defaults: { null: true, undefined: true }.
//  */
// export function filterNA<
//   Row extends Record<string, unknown>,
//   ColName extends keyof Row,
// >(
//   columnName: ColName,
//   ...rest: ColName[] | [...cols: ColName[], options: FilterNaOptions]
// ): (df: DataFrame<Row>) => DataFrame<any> {
//   // Normalize args to { columns: ColName[], options }
//   let columns: ColName[];
//   let options: FilterNaOptions | undefined;

//   if (rest.length > 0) {
//     const maybeOpts = rest[rest.length - 1] as unknown;
//     if (
//       typeof maybeOpts === "object" && maybeOpts !== null &&
//       !Array.isArray(maybeOpts)
//     ) {
//       // options passed; slice off options from rest
//       columns = [columnName, ...rest.slice(0, -1) as ColName[]];
//       options = maybeOpts as FilterNaOptions;
//     } else {
//       columns = [columnName, ...rest as ColName[]];
//     }
//   } else {
//     columns = [columnName];
//   }

//   const checkNull = options?.null !== false; // default true
//   const checkUndef = options?.undefined !== false; // default true

//   return (df: DataFrame<Row>) => {
//     const api = df as any;
//     const store = api.__store;
//     const view = api.__view;

//     // Fast path: no filtering condition means return original
//     if (!checkNull && !checkUndef) return df as unknown as DataFrame<any>;

//     // Validate columns (for non-empty dataframes)
//     if (store.length > 0) {
//       for (const col of columns) {
//         if (!(col as string in store.columns)) {
//           throw new ReferenceError(`Column "${String(col)}" not found.`);
//         }
//       }
//     }

//     // Build mask
//     const mask = new Set<number>();
//     outer: for (let i = 0; i < store.length; i++) {
//       // honor existing mask if present
//       if (view?.mask && !view.mask.has(i)) continue;
//       for (const col of columns) {
//         const value = store.columns[col as string][i];
//         if (checkNull && value === null) continue outer;
//         if (checkUndef && value === undefined) continue outer;
//       }
//       mask.add(i);
//     }

//     // Create new view sharing same store
//     const nextView = view ? { ...view, mask } : { mask };
//     const out = (df as any).slice(0, 0); // cheap instance of same kind
//     (out as any).__view = nextView;
//     return out as unknown as DataFrame<any>;
//   };
// }
