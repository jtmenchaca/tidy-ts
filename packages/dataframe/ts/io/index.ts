// Data I/O Module
// Exports all data input/output functions

// Data I/O functions for reading and writing different formats
export * from "./read_csv.ts";
export * from "./read_csv_stream.ts";
export { parseXLSXRaw, readXLSX, readXLSXMetadata } from "./read_xlsx.ts";
export * from "./write_xlsx.ts";
export { readJSON } from "./read_json.ts";
export * from "./write_json.ts";

// CSV parsing utilities (exported for advanced usage)
export * from "./csv-parser.ts";

// Write functions
export * from "./write_csv.ts";

// Peek functions for inspecting file structure
export { peek, peekCSV, peekXLSX } from "./peek.ts";

// Note: Parquet and Arrow I/O have been moved to separate packages:
// - @tidy-ts/parquet for Parquet file support
// - @tidy-ts/arrow for Arrow IPC file support
