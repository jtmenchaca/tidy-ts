import type { DataFrame } from "../index.ts";
import type { RowLabel } from "./row-labels.ts";
import type { ROW_LABEL } from "../../verbs/reshape/transpose.types.ts";
export type SetRowLabelsMethod<Row extends object> = <R extends object, const Labels extends readonly RowLabel[]>(this: DataFrame<R>, labels: Labels) => DataFrame<{
    [K in keyof R | typeof ROW_LABEL]: K extends typeof ROW_LABEL ? Labels[number] : K extends keyof R ? R[K] : never;
}>;
