import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([{ id: 1, n: 0 }]);
export type T = typeof df;
