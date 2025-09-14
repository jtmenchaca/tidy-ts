// deno-lint-ignore-file no-explicit-any
import { createDataFrame } from "@tidy-ts/dataframe";

// Data with circular references
export const circularReferenceData = (() => {
  const obj1: any = { name: "obj1", ref: null };
  const obj2: any = { name: "obj2", ref: obj1 };
  obj1.ref = obj2; // Create circular reference

  return createDataFrame([
    { id: 1, circular: obj1 },
    { id: 2, circular: obj2 },
  ]);
})();

// Deeply nested objects
export const nestedObjectData = createDataFrame([
  {
    id: 1,
    level1: {
      level2: {
        level3: {
          level4: {
            level5: "deep value",
          },
        },
      },
    },
  },
  {
    id: 2,
    level1: {
      level2: {
        level3: null,
      },
    },
  },
]);

// Data with various JavaScript types
export const mixedTypesData = createDataFrame([
  { id: 1, value: "string" },
  { id: 2, value: 42 },
  { id: 3, value: {} as any },
  { id: 4, value: [] as any },
  { id: 5, value: function () {} as any },
  { id: 6, value: new RegExp("test") as any },
  { id: 7, value: new Map() as any },
  { id: 8, value: new Set() as any },
  { id: 9, value: Symbol("test") as any },
  { id: 10, flag: "yes" as any },
]);

// Data with special numeric values
export const specialNumericData = createDataFrame([
  { id: 1, value: 0 },
  { id: 2, value: -0 },
  { id: 3, value: Infinity },
  { id: 4, value: -Infinity },
  { id: 5, value: NaN },
  { id: 6, value: Number.MAX_VALUE },
  { id: 7, value: Number.MIN_VALUE },
]);

// Data with zero values
export const zeroData = createDataFrame([
  { id: 1, value: 0 },
  { id: 2, value: -0 },
  { id: 3, value: 0.0 },
  { id: 4, value: -0.0 },
]);

// Data with special string values
export const specialStringsData = createDataFrame([
  { id: 1, text: "" },
  { id: 2, text: " " },
  { id: 3, text: "\n" },
  { id: 4, text: "\t" },
  { id: 5, text: "null" },
  { id: 6, text: "undefined" },
  { id: 7, text: "NaN" },
]);

// Data with Infinity values (alias for compatibility)
export const infinityData = createDataFrame([
  { id: 1, value: 10 },
  { id: 2, value: Infinity },
  { id: 3, value: -Infinity },
  { id: 4, value: 20 },
]);
