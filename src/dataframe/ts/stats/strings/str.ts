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
  /** Detect if strings match a pattern (regex or literal) */
  readonly detect: typeof strDetect;
  /** Calculate the length of strings */
  readonly length: typeof strLength;
  /** Replace first occurrence of a pattern in strings */
  readonly replace: typeof strReplace;
  /** Replace all occurrences of a pattern in strings */
  readonly replaceAll: typeof strReplaceAll;
  /** Extract first match of a pattern from strings */
  readonly extract: typeof strExtract;
  /** Extract all matches of a pattern from strings */
  readonly extractAll: typeof strExtractAll;
  /** Split strings by a delimiter or pattern */
  readonly split: typeof strSplit;
  /** Split strings by a delimiter into a fixed number of pieces */
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
