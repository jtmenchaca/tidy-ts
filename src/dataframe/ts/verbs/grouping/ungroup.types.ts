// src/dataframe/ts/types/verbs/ungroup.ts
import type { DataFrame, GroupedDataFrame } from "../../dataframe/index.ts";

export type UngroupMethod<Row extends object> = {
  // Ungroup a GroupedDataFrame, returning a regular DataFrame
  <GroupName extends keyof Row>(
    this: GroupedDataFrame<Row, GroupName>,
  ): DataFrame<Row>;

  // Regular DataFrame ungroup is a no-op, returns itself
  (): DataFrame<Row>;
};
