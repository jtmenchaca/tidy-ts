import type { GroupedDataFrame } from "./dataframe.type.ts";
/**
 * Preserve grouping when returning a new row shape:
 * - Keeps original grouping keys that still exist on the new row.
 * - Trims grouping keys that were dropped/renamed away.
 */
export type PreserveGrouping<Row extends object, GroupName extends keyof Row, NewRow extends object> = GroupedDataFrame<NewRow, Extract<GroupName, keyof NewRow>>;
