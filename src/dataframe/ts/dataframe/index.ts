export type { DataFrame, GroupedDataFrame } from "./types/dataframe.type.ts";

export type {
  PromisedDataFrame,
  PromisedGroupedDataFrame,
} from "../promised-dataframe/types/promised-dataframe.type.ts";

export { createDataFrame } from "./implementation/create-dataframe.ts";
export type { DataFrameOptions } from "./implementation/create-dataframe.ts";

export { resolveVerb } from "./implementation/resolve-verb.ts";

export {
  preserveDataFrameMetadata,
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
  UnifyUnion,
  UnionToIntersection,
} from "./types/utility-types.ts";

export { createColumnarDataFrameFromStore } from "./implementation/create-dataframe.ts";

export { withIndex, withMask, withOrder } from "./implementation/row-cursor.ts";

export { materializeIndex } from "./implementation/columnar-view.ts";
export { cowStore } from "./implementation/row-cursor.ts";

export type { ColumnarStore } from "./implementation/columnar-store.ts";
export { toColumnarStorage } from "./implementation/columnar-store.ts";
export type { RowLabel, RowLabelStore } from "./types/row-labels.ts";
