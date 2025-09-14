import type { ColumnarStore, DataFrame } from "../../dataframe/index.ts";
import { createColumnarDataFrameFromStore } from "../../dataframe/index.ts";
import { getStoreAndIndex } from "../../verbs/join/join-helpers.ts";
import { ROW_LABEL, ROW_TYPES } from "./transpose.types.ts";

/**
 * Symbol-based transpose: uses ROW_LABEL symbol column for reversible transposes.
 *
 * Two cases:
 * 1. DataFrame has ROW_LABEL column: use its values as new column names
 * 2. DataFrame has no ROW_LABEL column: generate row_0, row_1, ... column names
 *
 * Always creates a new ROW_LABEL column containing the original column names.
 * This makes transpose truly reversible with zero column name conflicts.
 */
export function transpose<const ExpectedRows extends number>(
  { number_of_rows: _number_of_rows }: { number_of_rows: ExpectedRows },
) {
  return <Row extends Record<string, unknown>>(
    df: DataFrame<Row>,
  ) => {
    // Handle empty DataFrame
    if (df.nrows() === 0) {
      return createColumnarDataFrameFromStore({
        columns: { [ROW_LABEL]: [] },
        length: 0,
        columnNames: [ROW_LABEL],
      });
    }

    const { store, index } = getStoreAndIndex(df);
    const originalColumnNames = store.columnNames;
    const numRows = df.nrows();

    // Check if DataFrame has the ROW_LABEL column
    const hasRowLabelColumn = originalColumnNames.includes(ROW_LABEL);

    // Check if DataFrame has ROW_TYPES metadata (indicates this is a double transpose)
    const hasRowTypesColumn = originalColumnNames.includes(ROW_TYPES);

    // Extract data column names (excluding both ROW_LABEL and ROW_TYPES)
    const dataColumnNames = originalColumnNames.filter((name) =>
      name !== ROW_LABEL && name !== ROW_TYPES
    );
    const numDataCols = dataColumnNames.length;

    // Build the transposed structure
    const outColumns: Record<string, unknown[]> = {};
    const outColumnNames: string[] = [];

    if (hasRowLabelColumn) {
      // Case 1: Use ROW_LABEL column values as new column names
      const rowLabelColumn = store.columns[ROW_LABEL];

      // Create new columns using ROW_LABEL values
      for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
        const originalRowIndex = index[rowIdx];
        const colName = String(rowLabelColumn[originalRowIndex]);
        outColumnNames.push(colName);

        const dataColumn = new Array(numDataCols);
        for (let colIdx = 0; colIdx < numDataCols; colIdx++) {
          const originalColName = dataColumnNames[colIdx];
          dataColumn[colIdx] = store.columns[originalColName][originalRowIndex];
        }
        outColumns[colName] = dataColumn;
      }
    } else {
      // Case 2: Generate row_0, row_1, ... column names
      for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
        const colName = `row_${rowIdx}`;
        outColumnNames.push(colName);

        const dataColumn = new Array(numDataCols);
        for (let colIdx = 0; colIdx < numDataCols; colIdx++) {
          const originalColName = dataColumnNames[colIdx];
          const originalRowIndex = index[rowIdx];
          dataColumn[colIdx] = store.columns[originalColName][originalRowIndex];
        }
        outColumns[colName] = dataColumn;
      }
    }

    // Always create ROW_LABEL column with original data column names
    outColumns[ROW_LABEL] = dataColumnNames;
    outColumnNames.unshift(ROW_LABEL);

    // Store row types metadata for type preservation (unless this is already a double transpose)
    if (!hasRowTypesColumn) {
      // Create a dummy metadata column with original column structure
      // This exists for future runtime access and helps with type system
      const rowTypesSample: Record<string, unknown> = {};
      for (const colName of dataColumnNames) {
        // Use the first non-null value as type representative
        let sampleValue: unknown = null;
        for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
          const originalRowIndex = index[rowIdx];
          const value = store.columns[colName][originalRowIndex];
          if (value != null) {
            sampleValue = value;
            break;
          }
        }
        rowTypesSample[colName] = sampleValue;
      }
      outColumns[ROW_TYPES] = new Array(numDataCols).fill(rowTypesSample);
      outColumnNames.push(ROW_TYPES);
    }

    const outStore: ColumnarStore = {
      columns: outColumns,
      length: numDataCols,
      columnNames: outColumnNames,
    };

    return createColumnarDataFrameFromStore(outStore);
  };
}
