import type { DataFrame as _DataFrame } from "../../dataframe/index.ts";
import type {
  MissingColumnCrossTabulate,
  RestrictMethodForEmptyDataFrame,
} from "../../dataframe/types/error-types.ts";

export type CrossTabulateResult = {
  /** 2D array where contingencyTable[row][col] = count for that combination */
  contingencyTable: number[][];
  /** Labels for each row in the contingency table */
  rowLabels: string[];
  /** Labels for each column in the contingency table */
  colLabels: string[];
  /** Formatted summary strings for each column group */
  summaryByColumn: Record<string, string>;
  /** Total counts for each row */
  rowTotals: number[];
  /** Total counts for each column */
  colTotals: number[];
  /** Grand total of all observations */
  grandTotal: number;
};

export type CrossTabulateMethod<Row extends object> =
  RestrictMethodForEmptyDataFrame<
    Row,
    MissingColumnCrossTabulate,
    {
      <
        RowVar extends Extract<keyof Row, string>,
        ColVar extends Extract<keyof Row, string>,
      >(
        rowVariable: RowVar,
        colVariable: ColVar,
      ): CrossTabulateResult;
    }
  >;
