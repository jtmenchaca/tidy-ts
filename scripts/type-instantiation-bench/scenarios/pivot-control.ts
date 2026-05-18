import { createDataFrame } from "@tidy-ts/dataframe";

const longData = createDataFrame([
  { group: "A", variable: "v01", value: 1 },
  { group: "A", variable: "v02", value: 2 },
]);
export type T = typeof longData;
