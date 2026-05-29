import { createDataFrame } from "@tidy-ts/dataframe";

export const labs = createDataFrame([
  { patient_id: "P001", test_name: "BNP", result_value: 7.2 },
  { patient_id: "P002", test_name: "WBC", result_value: 140 },
]);

export const raw = createDataFrame([
  { lab_id: "L1", result_str: "1250" },
  { lab_id: "L2", result_str: "pending" },
]);

export const mixedLabs = createDataFrame([
  { id: "P1", value: 1250 },
  { id: "P2", value: 15 },
]);

export const rawEncounters = createDataFrame([
  { patient_id: "P001", admit_date: "2024-01-15", los_days: 3 },
  { patient_id: "P002", admit_date: "2024-02-20", los_days: 7 },
  { patient_id: "P003", admit_date: "not-a-date", los_days: 5 },
]);

export const encounters22 = createDataFrame([
  { patient_id: "P001", admit_date: Temporal.PlainDate.from("2024-01-15"), los_days: 3 },
  { patient_id: "P002", admit_date: Temporal.PlainDate.from("2024-02-20"), los_days: 7 },
]);

export const patients = createDataFrame([
  { name: "Alice", age: 30, weight: 65.5, insurance: "Medicare" },
  { name: "Bob", age: 45, weight: 80.0, insurance: "Medicaid" },
]);

export const vitals = createDataFrame([
  { metric: "systolic", P001: 120, P002: 145 },
  { metric: "diastolic", P001: 80, P002: 92 },
]);

type Status = "admitted" | "discharged" | "transferred";
export const encounters34 = createDataFrame([
  { patient_id: "P001", status: "admitted" as Status },
  { patient_id: "P002", status: "discharged" as Status },
]);
