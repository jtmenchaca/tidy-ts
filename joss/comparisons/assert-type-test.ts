import { assertType, type Has } from "@std/testing/types";
import { createDataFrame } from "@tidy-ts/dataframe";

const encounters = createDataFrame([
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Patel" },
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Lee" },
  { patient_id: "P2", dept: "ED", physician: "Dr. Martinez" },
]);

const unique = encounters.distinct("patient_id", "dept");
const rows = unique.toArray();
type DistinctRow = (typeof rows)[number];

// patient_id IS in the result
assertType<Has<keyof DistinctRow, "patient_id">>(true);

// physician is NOT in the result
assertType<Has<keyof DistinctRow, "physician">>(false);
