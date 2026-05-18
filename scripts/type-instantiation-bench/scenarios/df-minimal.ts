import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([{ id: 1 }]);
export type T = typeof df;
