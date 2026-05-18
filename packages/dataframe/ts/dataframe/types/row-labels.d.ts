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
 * Generate default row labels: ["0", "1", "2", ...]
 */
export declare function generateDefaultRowLabels(count: number): RowLabel[];
/**
 * DataFrame with row labels - extends existing DataFrame
 */
export interface DataFrameWithRowLabels<Row extends object> {
    /** Row label metadata */
    __rowLabels?: RowLabelStore;
    setRowLabels(labels: RowLabel[]): DataFrameWithRowLabels<Row>;
    getRowLabels(): RowLabel[];
    loc(label: RowLabel): Row | undefined;
    loc(labels: RowLabel[]): DataFrameWithRowLabels<Row>;
}
