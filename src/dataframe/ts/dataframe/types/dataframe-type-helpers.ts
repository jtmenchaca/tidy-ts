// src/dataframe/ts/types/helpers/dataframe-helpers.ts

import type { GroupedDataFrame } from "./dataframe.type.ts";
import type { Prettify } from "./utility-types.ts";

/**
 * Preserve grouping when returning a new row shape:
 * - Keeps original grouping keys that still exist on the new row.
 * - Trims grouping keys that were dropped/renamed away.
 */
export type PreserveGrouping<
  Row extends object,
  GroupName extends keyof Row,
  NewRow extends object,
> = GroupedDataFrame<
  Prettify<NewRow>,
  Extract<GroupName, keyof Prettify<NewRow>>
>;
