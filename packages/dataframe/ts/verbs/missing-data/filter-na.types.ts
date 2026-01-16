// import type { DataFrame, Prettify } from "../../dataframe/index.ts";

// export type FilterNaOptions = {
//   null?: boolean; // default true
//   undefined?: boolean; // default true
// };

// type ExcludeNull<T> = T extends null ? never : T;
// type ExcludeUndefined<T> = T extends undefined ? never : T;

// type NarrowField<Val, Opts extends FilterNaOptions | undefined> = Opts extends
//   undefined ? NonNullable<Val>
//   : Opts extends { null?: infer N; undefined?: infer U } ? (
//       // both on (default)
//       (N extends false ? never : true) extends never
//         ? (U extends false ? never : true) extends never ? Val
//         : ExcludeUndefined<Val>
//         : (U extends false ? never : true) extends never ? ExcludeNull<Val>
//         : NonNullable<Val>
//     )
//   : NonNullable<Val>;

// type NarrowNullability<
//   Row extends object,
//   Keys extends keyof Row,
//   Opts extends FilterNaOptions | undefined,
// > = Prettify<
//   {
//     [K in keyof Row]: K extends Keys ? NarrowField<Row[K], Opts> : Row[K];
//   }
// >;

// export interface FilterNaMethod<Row extends object> {
//   // Single column overload
//   <
//     ColName extends keyof Row,
//     Opts extends FilterNaOptions | undefined = undefined,
//   >(
//     columnName: ColName,
//     options?: Opts,
//   ): DataFrame<NarrowNullability<Row, ColName, Opts>>;

//   // Multiple columns overload (like select)
//   <ColName extends keyof Row>(
//     columnName: ColName,
//     ...rest: ColName[]
//   ): DataFrame<NarrowNullability<Row, ColName, undefined>>;

//   // Multiple columns with trailing options
//   <ColName extends keyof Row, Opts extends FilterNaOptions>(
//     columnName: ColName,
//     ...rest: [...cols: ColName[], options: Opts]
//   ): DataFrame<NarrowNullability<Row, ColName, Opts>>;
// }
