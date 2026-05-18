/**
 * RPython SO#45769987 — dplyr spread/rename duplicate column names
 * Effect: Crash
 * Bug class: Implicit column selection
 *
 * spread() creates a column from a relhead value; rename() collides with it.
 * User then references columns that are not in the result schema.
 *
 * In tidy-ts, select() only accepts columns present on the row type.
 */
import { createDataFrame } from "@tidy-ts/dataframe";

const dt = createDataFrame([
  { hid: 1, syear: 2000, employlvl: "Full-time", relhead: "Head" },
  { hid: 2, syear: 2001, employlvl: "Part-time", relhead: "Head" },
  { hid: 2, syear: 2003, employlvl: "Part-time", relhead: "Employment Partner" },
]);

const wide = dt.pivotWider({
  namesFrom: "relhead",
  valuesFrom: "employlvl",
  expectedColumns: ["Head", "Employment Partner"],
});

// User proceeds assuming a Partner column exists after dplyr rename
// @ts-expect-error — "Partner" is not a key of the pivoted row type
const wrong = wide.select("Partner");
