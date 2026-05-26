import { createDataFrame } from "@tidy-ts/dataframe";

export const patients03 = createDataFrame([
  { patient_id: "P001", name: "Alice" },
]);
export const encounters03 = createDataFrame([
  { encounter_id: "E001", patient_id: "P001", department: "ED" },
]);
export const labs03 = createDataFrame([
  { lab_id: "L001", encounter_id: "E001", patient_id: "P001", result_value: 7.2 },
]);

export const patients17 = createDataFrame([
  { patient_id: "P1", name: "Alice" },
  { patient_id: "P2", name: "Bob" },
]);
export const encounters17 = createDataFrame([
  { patient_id: "P1", department: "ED", los_days: 3 },
]);

export const admissions = createDataFrame([
  { patient_id: "P1", date: "2024-01-15", department: "ED" },
]);
export const discharges = createDataFrame([
  { patient_id: "P1", date: "2024-01-18", disposition: "Home" },
]);
