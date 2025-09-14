import type { DataFrame } from "../../dataframe/index.ts";

/**
 * prepend method type for DataFrames - adds rows to the beginning
 * Supports single object, array of objects, multiple individual objects, or another DataFrame
 */
export type PrependMethod<Row extends object> = {
  // Another DataFrame - allow any compatible DataFrame
  <T extends object>(dataframe: DataFrame<T>): DataFrame<Row | T>;
  // Single object
  (row: Row): DataFrame<Row>;
  // Array of objects
  (rows: Row[]): DataFrame<Row>;
  // Multiple individual objects
  (...rows: Row[]): DataFrame<Row>;
};
