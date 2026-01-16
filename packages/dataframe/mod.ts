export { s, stats } from "./ts/stats/stats.ts";
export { str } from "./ts/stats/strings/str.ts";
export {
  createDataFrame,
  type DataFrame,
  type DataFrameOptions,
  type GroupedDataFrame,
  type PromisedDataFrame,
  type PromisedGroupedDataFrame,
} from "./ts/dataframe/index.ts";
export { concatDataFrames } from "./ts/verbs/reshape/bind-rows.verb.ts";
export type {
  ConcurrencyOptions,
  RetryConfig,
} from "./ts/promised-dataframe/concurrency-utils.ts";
// I/O functions with conditional loading
export {
  readCSV,
  readCSVMetadata,
  readJSON,
  readXLSX,
  readXLSXMetadata,
  writeCSV,
  writeXLSX,
} from "./ts/io/index.ts";

// Browser setup function
export { setupTidyTS } from "./ts/wasm/wasm-init.ts";

// Note: Parquet and Arrow I/O have been moved to separate packages:
// - @tidy-ts/parquet for Parquet file support (readParquet, writeParquet)
// - @tidy-ts/arrow for Arrow IPC file support (readArrow, writeArrow)
