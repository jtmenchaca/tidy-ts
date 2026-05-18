import { createDataFrame } from "@tidy-ts/dataframe";

const longData = createDataFrame([
  { group: "A", variable: "v01", value: 1 },
  { group: "A", variable: "v02", value: 2 },
]);
const out = longData.pivotWider({
  namesFrom: "variable",
  valuesFrom: "value",
  expectedColumns: [
    "v01",
    "v02",
    "v03",
    "v04",
    "v05",
    "v06",
    "v07",
    "v08",
    "v09",
    "v10",
    "v11",
    "v12",
  ],
});
export type T = typeof out;
