import type { DataFrame } from "../../dataframe/index.ts";
import type { CrossTabulateResult } from "./cross_tabulate.types.ts";

/**
 * Create cross-tabulation (contingency table) between two categorical variables.
 *
 * This function generates a contingency table showing the frequency of combinations
 * between two categorical variables, similar to R's `table()` function or pandas'
 * `crosstab()`. It's useful for exploratory data analysis and understanding
 * relationships between categorical variables.
 *
 * @param rowVariable - Column name to use for rows in the contingency table
 * @param colVariable - Column name to use for columns in the contingency table
 * @returns A function that takes a DataFrame and returns contingency table results
 *
 * @example
 * ```ts
 * const data = createDataFrame([
 *   { treatment: "A", outcome: "Success" },
 *   { treatment: "A", outcome: "Failure" },
 *   { treatment: "B", outcome: "Success" },
 *   { treatment: "B", outcome: "Success" }
 * ]);
 *
 * const result = data.crossTabulate("treatment", "outcome");
 * // result.contingencyTable: [[1, 2], [1, 0]] (Success: A=1, B=2; Failure: A=1, B=0)
 * // result.rowLabels: ["Success", "Failure"]
 * // result.colLabels: ["A", "B"]
 * ```
 *
 * @remarks
 * - Missing values (null/undefined) are converted to "Missing" for analysis
 * - Returns both numeric contingency table matrix and formatted summaries
 * - Row and column order is preserved based on first appearance in data
 * - Useful for chi-square tests, association analysis, and data exploration
 */
export function cross_tabulate<
  T extends object,
  RowVar extends keyof T,
  ColVar extends keyof T,
>(
  rowVariable: RowVar,
  colVariable: ColVar,
): (df: DataFrame<T>) => CrossTabulateResult {
  return (df: DataFrame<T>) => {
    // Handle empty DataFrame case
    if (df.nrows() === 0) {
      return {
        contingencyTable: [],
        rowLabels: [],
        colLabels: [],
        summaryByColumn: {},
        rowTotals: [],
        colTotals: [],
        grandTotal: 0,
      };
    }

    // Validate columns exist
    const firstRow = df[0];
    if (!(rowVariable in firstRow)) {
      throw new Error(
        `Row variable '${String(rowVariable)}' not found in data`,
      );
    }
    if (!(colVariable in firstRow)) {
      throw new Error(
        `Column variable '${String(colVariable)}' not found in data`,
      );
    }

    // Use groupBy and summarise to get category counts
    const groupedData = df
      // @ts-expect-error - we've validated DataFrame is not empty above
      .groupBy(String(rowVariable), String(colVariable))
      // @ts-expect-error - grouped DataFrame from non-empty data is valid
      .summarise({
        count: (group: DataFrame<T>) => group.nrows(),
      });

    // Get unique row categories (rows in contingency table)
    const rowLabelsRaw = df
      .distinct(rowVariable as keyof T)
      // @ts-expect-error - we've validated DataFrame is not empty above
      .extract(rowVariable);
    const rowLabels =
      (Array.isArray(rowLabelsRaw) ? rowLabelsRaw : [rowLabelsRaw])
        .map((val) => String(val ?? "Missing"));

    // Get unique column categories (columns in contingency table)
    const colLabelsRaw = df
      .distinct(colVariable as keyof T)
      // @ts-expect-error - we've validated DataFrame is not empty above
      .extract(colVariable);
    const colLabels =
      (Array.isArray(colLabelsRaw) ? colLabelsRaw : [colLabelsRaw])
        .map((val) => String(val ?? "Missing"));

    // Build contingency table matrix
    const contingencyTable: number[][] = [];
    const rowTotals: number[] = [];

    for (let rowIndex = 0; rowIndex < rowLabels.length; rowIndex++) {
      const rowCategory = rowLabels[rowIndex];
      const row: number[] = [];
      let rowTotal = 0;

      for (let colIndex = 0; colIndex < colLabels.length; colIndex++) {
        const colCategory = colLabels[colIndex];

        // Find count for this row-col combination
        let count = 0;
        for (const d of groupedData) {
          const rowValue = String(
            d[rowVariable as keyof typeof d] ?? "Missing",
          );
          const colValue = String(
            d[colVariable as keyof typeof d] ?? "Missing",
          );
          if (rowValue === rowCategory && colValue === colCategory) {
            count = d.count ?? 0;
            break;
          }
        }

        row.push(count);
        rowTotal += count;
      }

      contingencyTable.push(row);
      rowTotals.push(rowTotal);
    }

    // Calculate column totals
    const colTotals: number[] = [];
    for (let colIndex = 0; colIndex < colLabels.length; colIndex++) {
      const colTotal = contingencyTable.reduce(
        (sum, row) => sum + row[colIndex],
        0,
      );
      colTotals.push(colTotal);
    }

    // Calculate grand total
    const grandTotal = rowTotals.reduce((sum, total) => sum + total, 0);

    // Create formatted summary strings for each column
    const summaryByColumn: Record<string, string> = {};
    for (let colIndex = 0; colIndex < colLabels.length; colIndex++) {
      const colCategory = colLabels[colIndex];
      const colTotal = colTotals[colIndex];

      const categoryStrings = rowLabels.map((rowCategory, rowIndex) => {
        const count = contingencyTable[rowIndex][colIndex];
        const percentage = colTotal > 0
          ? (count / colTotal * 100).toFixed(1)
          : "0.0";
        return `${rowCategory}: ${count} (${percentage}%)`;
      });

      summaryByColumn[colCategory] = categoryStrings.join("; ");
    }

    return {
      contingencyTable,
      rowLabels,
      colLabels,
      summaryByColumn,
      rowTotals,
      colTotals,
      grandTotal,
    };
  };
}
