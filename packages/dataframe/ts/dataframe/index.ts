export type {
  DataFrame,
  DataFrameBase,
  DataFrameColumns,
  GroupedDataFrame,
} from "./types/dataframe.type.ts";

export type {
  PromisedDataFrame,
  PromisedGroupedDataFrame,
} from "../promised-dataframe/types/promised-dataframe.type.ts";

export { createDataFrame } from "./implementation/create-dataframe.ts";
export type { DataFrameOptions } from "./implementation/create-dataframe.ts";

export { zDataFrame } from "./implementation/z-dataframe.ts";
export type { ZodDataFrame } from "./implementation/z-dataframe.ts";

export { resolveVerb } from "./implementation/resolve-verb.ts";

export {
  preserveDataFrameMetadata,
  rebuildGroupsColumnar,
  withGroups,
  withGroupsRebuilt,
} from "./implementation/with-groups.ts";

export type { PreserveGrouping } from "./types/dataframe-type-helpers.ts";

export type {
  ColumnsFromUnion,
  DataKeys,
  DataOnly,
  ExcludeKeysAndMakeUndefined,
  KeyUnion,
  MakeUndefined,
  Prettify,
  PrettifyDeep,
  UnionToIntersection,
} from "./types/utility-types.ts";

export { createColumnarDataFrameFromStore } from "./implementation/create-dataframe.ts";

export { withIndex } from "./implementation/row-cursor.ts";

export { materializeIndex } from "./implementation/columnar-view.ts";
export { cowStore } from "./implementation/row-cursor.ts";

export type { ColumnarStore, ColumnData } from "./implementation/columnar-store.ts";
export {
  toColumnarStorage,
  isTypedColumn,
  gatherColumn,
  tryPromoteToTyped,
} from "./implementation/columnar-store.ts";
export type { RowLabel, RowLabelStore } from "./types/row-labels.ts";
