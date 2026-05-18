import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([{ a: 1, b: 2, c: 3, d: 4, e: 5 }]);
export type T = typeof df;
