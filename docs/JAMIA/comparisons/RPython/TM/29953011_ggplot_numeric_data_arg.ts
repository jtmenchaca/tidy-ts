/**
 * RPython SO#29953011 — ggplot with numeric vector as data=
 * Effect: Crash
 * Bug class: Type coercion
 *
 * geom_errorbar(data=GVW[1:64,3]) passes a numeric column, not a data.frame.
 * ggplot2: doesn't know how to deal with data of class numeric.
 *
 * In tidy-ts, concatDataFrames requires DataFrame[], not a bare number[] column.
 */
import { concatDataFrames, createDataFrame } from "@tidy-ts/dataframe";

const GVW = createDataFrame([
  { genotype: "KO", variable: "Start", value: 25 },
  { genotype: "WT", variable: "End", value: 30 },
]);

const valueCol = GVW.extract("value");

// @ts-expect-error — number[] is not assignable to DataFrame
concatDataFrames([valueCol]);
