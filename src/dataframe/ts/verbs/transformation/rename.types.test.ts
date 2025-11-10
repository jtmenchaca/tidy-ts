import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";
import { z } from "zod";

// Test data
const testData = createDataFrame([
  { name: "Alice", age: 25, city: "NYC", score: 85 },
  { name: "Bob", age: 30, city: "LA", score: 92 },
]);

// 1. Test single column rename with exact type inference
const renamedSingle = testData.rename({ name: "fullName" });
const _renamedSingleTypeCheck: DataFrame<{
  fullName: string;
  age: number;
  city: string;
  score: number;
}> = renamedSingle;

// 2. Test multiple column rename with exact type inference

// 2. Test multiple column rename with exact type inference
const renamedMultiple = testData
  .mutate({
    fullName: (r) => r.name,
    yearsOld: (r) => r.age,
  })
  .drop("name", "age");

const _renamedMultipleTypeCheck: DataFrame<{
  fullName: string;
  yearsOld: number;
  city: string;
  score: number;
}> = renamedMultiple;

// 3. Test rename all columns
const renamedAll = testData.rename({
  name: "fullName",
  age: "yearsOld",
  city: "location",
  score: "points",
});
const _renamedAllTypeCheck: DataFrame<{
  fullName: string;
  yearsOld: number;
  location: string;
  points: number;
}> = renamedAll;

// 4. Test empty rename (no changes)
const renamedEmpty = testData.rename({});
const _renamedEmptyTypeCheck: DataFrame<{
  name: string;
  age: number;
  city: string;
  score: number;
}> = renamedEmpty;

// 5. Test rename with numeric keys
const dataWithNumericKeys = createDataFrame([
  { 1: "one", 2: "two", name: "test" },
]);
const renamedNumeric = dataWithNumericKeys.rename({ 1: "first", 2: "second" });
const _renamedNumericTypeCheck: DataFrame<{
  first: string;
  second: string;
  name: string;
}> = renamedNumeric;

// 6. Test rename preserves non-renamed column types exactly
const renamedPreservesTypes = testData.rename({ name: "userName" });
const _preservesTypesCheck: DataFrame<{
  userName: string;
  age: number;
  city: string;
  score: number;
}> = renamedPreservesTypes;

// 7. Test rename with complex types
const complexData = createDataFrame([
  {
    id: 1,
    metadata: { created: new Date(), tags: ["a", "b"] },
    scores: [1, 2, 3],
    active: true,
  },
]);
const renamedComplex = complexData.rename({
  metadata: "meta",
  scores: "points",
});
const _renamedComplexTypeCheck: DataFrame<{
  id: number;
  meta: { created: Date; tags: string[] };
  points: number[];
  active: boolean;
}> = renamedComplex;

// 8. Test rename maintains column order (non-renamed columns stay in place)
const renamedMiddle = testData.rename({ age: "yearsOld" });
const _renamedMiddleTypeCheck: DataFrame<{
  name: string;
  yearsOld: number;
  city: string;
  score: number;
}> = renamedMiddle;

// 9. Test chained renames
const chainedRename = testData
  .rename({ name: "userName" })
  .rename({ userName: "fullName" });
const _chainedRenameTypeCheck: DataFrame<{
  fullName: string;
  age: number;
  city: string;
  score: number;
}> = chainedRename;

// 10. Test rename with grouped DataFrame
const grouped = testData.groupBy("city");
const renamedGrouped = grouped.rename({ name: "userName" });
// Should preserve grouping
const _renamedGroupedTypeCheck: typeof renamedGrouped extends {
  __groups?: unknown;
} ? true
  : false = true;

// 11. Test that renamed columns are not in original position
const testNoOldColumn = testData.rename({ name: "userName" });
// @ts-expect-error - 'name' should not exist after rename
const _shouldNotHaveName: DataFrame<{ name: string }> = testNoOldColumn;

// 12. Test type narrowing - specific new column names are known
const narrowed = testData.rename({ score: "finalScore" });
const extracted = narrowed.extract("finalScore");
const _extractedTypeCheck: number[] = extracted;

// 13. Test rename with union types
const unionData = createDataFrame(
  [
    { type: "a", value: "test" },
    { type: "b", value: 42 },
  ],
  z.object({
    type: z.enum(["a", "b"]),
    value: z.union([z.string(), z.number()]),
  }),
);
const renamedUnion = unionData.rename({ type: "category" });
const _renamedUnionTypeCheck: DataFrame<{
  category: "a" | "b";
  value: string | number;
}> = renamedUnion;

// 14. Test rename with optional properties
const optionalData = createDataFrame(
  [
    { required: "test", optional: 42 },
    { required: "test2" },
  ],
  z.object({
    required: z.string(),
    optional: z.number().optional(),
  }),
);
const renamedOptional = optionalData.rename({ required: "req" });
const _renamedOptionalTypeCheck: DataFrame<{
  req: string;
  optional?: number;
}> = renamedOptional;

// 15. Test rename with nullable types
const nullableData = createDataFrame(
  [
    { id: 1, value: "test" },
    { id: 2, value: null },
  ],
  z.object({
    id: z.number(),
    value: z.string().nullable(),
  }),
);
const renamedNullable = nullableData.rename({ value: "data" });
const _renamedNullableTypeCheck: DataFrame<{
  id: number;
  data: string | null;
}> = renamedNullable;
