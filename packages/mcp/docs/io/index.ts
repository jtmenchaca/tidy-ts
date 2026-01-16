// Re-exports all io docs
export { csvDocs } from "./csv.ts";
export { xlsxDocs } from "./xlsx.ts";
export { jsonDocs } from "./json.ts";
export { parquetDocs } from "./parquet.ts";
export { arrowDocs } from "./arrow.ts";

// Aggregate all for easy import
import { csvDocs } from "./csv.ts";
import { xlsxDocs } from "./xlsx.ts";
import { jsonDocs } from "./json.ts";
import { parquetDocs } from "./parquet.ts";
import { arrowDocs } from "./arrow.ts";

export const ioDocs = {
  ...csvDocs,
  ...xlsxDocs,
  ...jsonDocs,
  ...parquetDocs,
  ...arrowDocs,
};
