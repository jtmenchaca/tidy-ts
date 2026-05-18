import { createDataFrame } from "@tidy-ts/dataframe";

const df = createDataFrame([{ id: 1, base: 0 }]);
const out = df.mutate({
  c01: (r) => r.base + 1,
  c02: (r) => r.base + 2,
  c03: (r) => r.base + 3,
  c04: (r) => r.base + 4,
  c05: (r) => r.base + 5,
  c06: (r) => r.base + 6,
  c07: (r) => r.base + 7,
  c08: (r) => r.base + 8,
  c09: (r) => r.base + 9,
  c10: (r) => r.base + 10,
  c11: (r) => r.base + 11,
  c12: (r) => r.base + 12,
  c13: (r) => r.base + 13,
  c14: (r) => r.base + 14,
  c15: (r) => r.base + 15,
  c16: (r) => r.base + 16,
  c17: (r) => r.base + 17,
  c18: (r) => r.base + 18,
  c19: (r) => r.base + 19,
  c20: (r) => r.base + 20,
});
export type T = typeof out;
