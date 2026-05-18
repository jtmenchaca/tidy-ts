import { createDataFrame } from "@tidy-ts/dataframe";

const left = createDataFrame([{
  id: 1,
  k1: "a",
  k2: "b",
  k3: "c",
  k4: "d",
  k5: "e",
  k6: "f",
  k7: "g",
  k8: "h",
  k9: "i",
  k10: "j",
  x: 1,
}]);
const right = createDataFrame([{
  id: 1,
  k1: "a",
  k2: "b",
  k3: "c",
  k4: "d",
  k5: "e",
  k6: "f",
  k7: "g",
  k8: "h",
  k9: "i",
  k10: "j",
  y: 2,
}]);
export type T = typeof left;
export type R = typeof right;
