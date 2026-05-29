import { createDataFrame } from "@tidy-ts/dataframe";

const labs = createDataFrame([
  { patient_id: "A", result: 5.2 },
  { patient_id: "B", result: "MISSING" },
  { patient_id: "C", result: 7.1 },
]);

const analyzed = labs
.mutate({
  // @ts-expect-error: string * number is not valid
  doubled: (r) => r.result * 2
});
// Error: Operator '*' cannot be applied to
// types 'string | number' and 'number'.
