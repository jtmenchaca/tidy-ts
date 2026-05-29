import { createDataFrame } from "@tidy-ts/dataframe";

export const labs05 = createDataFrame([
  { patient_id: "P001", result_value: 100, reference_high: 120 as number | null },
  { patient_id: "P002", result_value: 200, reference_high: null },
]);

export const labs11 = createDataFrame([
  { lab_id: "L1", result_value: 100, reference_high: 120 as number | null },
  { lab_id: "L2", result_value: 200, reference_high: null },
]);

export const labs12 = createDataFrame([
  { test: "BNP", value: 100, ref_high: 120 as number | null },
  { test: "WBC", value: 200, ref_high: null },
]);

export const labs21 = createDataFrame([
  { patient_id: "P001", result_value: 1250 as number | null },
  { patient_id: "P001", result_value: null },
  { patient_id: "P002", result_value: 450 },
]);

export const labs26 = createDataFrame([
  { patient_id: "P001", result_value: 100 as number | null },
  { patient_id: "P002", result_value: null },
  { patient_id: "P003", result_value: 50 },
]);

export const vitals35 = createDataFrame([
  { patient_id: "P001", metric: "systolic", value: 130 },
  { patient_id: "P001", metric: "diastolic", value: 85 },
  { patient_id: "P002", metric: "systolic", value: 145 },
]);

export const labsNullA = createDataFrame([
  { id: "P1", value: 100, note: null as string | null },
]);

export const labsNullB = createDataFrame([
  { id: "P2", value: 200, source: "lab" },
]);
