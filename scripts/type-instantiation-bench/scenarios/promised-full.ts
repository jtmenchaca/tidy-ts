import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([{ id: 1, n: 0 }]);
const out = df.mutateAsync({
  a: async (r) => r.n + 1,
  b: async (r) => r.n + 2,
  c: async (r) => r.n + 3,
}).filter((r) => r.id === 1);
export type T = typeof out;
