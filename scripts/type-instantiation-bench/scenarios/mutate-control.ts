import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([{ id: 1, base: 0 }]);
export type T = typeof df;
