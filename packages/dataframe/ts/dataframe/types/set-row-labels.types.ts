import type { DataFrame, Prettify } from "../index.ts";
import type { RowLabel } from "./row-labels.ts";
import type { ROW_LABEL } from "../../verbs/reshape/transpose.types.ts";

export type SetRowLabelsMethod<Row extends object> = <
  R extends object,
  const Labels extends readonly RowLabel[],
>(
  this: DataFrame<R>,
  labels: Labels,
) => DataFrame<Prettify<R & { [K in typeof ROW_LABEL]: Labels[number] }>>;
