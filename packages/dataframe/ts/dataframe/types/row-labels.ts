// deno-lint-ignore-file no-explicit-any

/**
 * Row labels architecture for reversible transpose operations
 *
 * Adds row label metadata to DataFrames without disrupting columnar performance
 */

export type RowLabel = string | number;

/**
 * Row label storage - maps labels to indices and vice versa
 */
export interface RowLabelStore {
  /** Map from row label to row index */
  labelToIndex: Map<RowLabel, number>;
  /** Array of row labels (index -> label mapping) */
  indexToLabel: RowLabel[];
  /** Number of labeled rows */
  length: number;
}

/**
 * Create row label store from array of labels
 */
export function createRowLabelStore(labels: RowLabel[]): RowLabelStore {
  const labelToIndex = new Map<RowLabel, number>();

  for (let i = 0; i < labels.length; i++) {
    labelToIndex.set(labels[i], i);
  }

  return {
    labelToIndex,
    indexToLabel: [...labels],
    length: labels.length,
  };
}

/**
 * Generate default row labels: ["0", "1", "2", ...]
 */
export function generateDefaultRowLabels(count: number): RowLabel[] {
  return Array.from({ length: count }, (_, i) => String(i));
}

/**
 * DataFrame with row labels - extends existing DataFrame
 */
export interface DataFrameWithRowLabels<Row extends object> {
  /** Row label metadata */
  __rowLabels?: RowLabelStore;

  // New row label methods
  setRowLabels(labels: RowLabel[]): DataFrameWithRowLabels<Row>;
  getRowLabels(): RowLabel[];
  loc(label: RowLabel): Row | undefined;
  loc(labels: RowLabel[]): DataFrameWithRowLabels<Row>;
}

/**
 * Type guard to check if DataFrame has row labels
 */
export function hasRowLabels<T extends object>(
  df: any,
): df is DataFrameWithRowLabels<T> {
  return df.__rowLabels !== undefined;
}
