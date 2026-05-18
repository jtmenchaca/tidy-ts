/**
 * RPython SO#27413843 — Difficulty importing .dat file
 * Effect: Crash
 * Bug class: Data loading
 *
 * Python bug: pd.read_table(f, sep="") passes an empty string separator, which
 * crashes with "ord() expected a character, but string of length 0 found."
 * The data is whitespace-delimited but the user specified wrong sep, causing
 * the file to load as a single string column instead of multiple numeric columns.
 *
 * In tidy-ts, if the file is loaded with incorrect parsing (all data in one
 * string column), the schema reflects that. Attempting numeric operations on the
 * resulting string column is a compile-time error.
 */
import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// Simulates the SO scenario: .dat file loaded incorrectly as single string column
// because the separator was wrong. Each "row" is the entire line as one string.
const df = createDataFrame([
  { line: "17.749000   0.66007000    0.15122000   0.33150000" },
  { line: "3.9480000   0.52889000    0.11523000   0.56233000" },
  { line: "14.810000    3.7480300    0.57099000   0.12111000" },
]);

// The SO user's intent: load numeric data and perform regression/analysis.
// With wrong separator, all data ends up in one string column.
// tidy-ts: s.glm requires Record<string, number>. A string column fails.
// @ts-expect-error — Type '{ line: string }' does not satisfy 'Record<string, number>'
s.glm({ formula: "line ~ 1", family: "gaussian", link: "identity", data: df });
