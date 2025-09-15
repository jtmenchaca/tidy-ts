import { strDetect } from "../strings/str_detect.ts";
import { strLength } from "../strings/str_length.ts";
import { strReplace, strReplaceAll } from "../strings/str_replace.ts";
import { strExtract, strExtractAll } from "../strings/str_extract.ts";
import { strSplit, strSplitFixed } from "../strings/str_split.ts";

/**
 * String manipulation functions for text processing in DataFrames.
 *
 * @example
 * ```typescript
 * import { createDataFrame, str } from "@tidy-ts/dataframe";
 *
 * const df = createDataFrame([
 *   { name: "Hello World" },
 *   { name: "Test String" }
 * ]);
 *
 * const lengths = df.name.map(name => str.length(name)); // [11, 11]
 * const detected = df.name.filter(name => str.detect(name, /Hello/)); // ["Hello World"]
 * ```
 */
export const str: {
  readonly detect: typeof strDetect;
  readonly length: typeof strLength;
  readonly replace: typeof strReplace;
  readonly replaceAll: typeof strReplaceAll;
  readonly extract: typeof strExtract;
  readonly extractAll: typeof strExtractAll;
  readonly split: typeof strSplit;
  readonly splitFixed: typeof strSplitFixed;
} = {
  // Basic statistics
  detect: strDetect,
  length: strLength,
  replace: strReplace,
  replaceAll: strReplaceAll,
  extract: strExtract,
  extractAll: strExtractAll,
  split: strSplit,
  splitFixed: strSplitFixed,
};
