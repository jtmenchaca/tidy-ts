import { createDataFrame } from "@tidy-ts/dataframe";

export const patients = createDataFrame([
  { patient_id: "P001", first_name: "Alice", last_name: "Smith" },
]);
export const labs = createDataFrame([
  { lab_id: "L001", patient_id: "P001", result_value: 7.2 },
]);
export const encounters = createDataFrame([
  {
    encounter_id: "E001",
    patient_id: "P001",
    department: "ED",
    attending_physician: "Dr. Smith",
    encounter_type: "Inpatient",
  },
]);
export const vitals = createDataFrame([
  { patient_id: "P001", metric: "systolic", value: 130 },
  { patient_id: "P001", metric: "diastolic", value: 85 },
  { patient_id: "P002", metric: "systolic", value: 145 },
  { patient_id: "P002", metric: "diastolic", value: 92 },
]);
export const wide = vitals.pivotWider({
  namesFrom: "metric",
  valuesFrom: "value",
  expectedColumns: ["systolic", "diastolic"] as const,
});
export const encountersDistinct = createDataFrame([
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Patel" },
  { patient_id: "P1", dept: "Cardio", physician: "Dr. Lee" },
  { patient_id: "P2", dept: "ED", physician: "Dr. Martinez" },
]);
export const patientsReorder = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30, insurance: "Medicare" },
]);
export const patientsMsg = createDataFrame([
  { patient_id: "P001", first_name: "Alice", last_name: "Smith" },
]);
export const labsGrouped = createDataFrame([
  { patient_id: "P001", test_name: "BNP", result_value: 1250 },
  { patient_id: "P001", test_name: "WBC", result_value: 15 },
  { patient_id: "P002", test_name: "BNP", result_value: 450 },
  { patient_id: "P002", test_name: "WBC", result_value: 8 },
]);
