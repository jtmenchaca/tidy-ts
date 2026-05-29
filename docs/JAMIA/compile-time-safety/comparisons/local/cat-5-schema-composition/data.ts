import { createDataFrame, readCSV } from "@tidy-ts/dataframe";
import { z } from "zod";

export const LabSchema = z.object({
  lab_id: z.string(),
  result_value: z.coerce.number(),
});

export const labsDf = await readCSV(
  "lab_id,result_value\nL1,100\nL2,200\n",
  LabSchema,
);

export const labsA = createDataFrame([
  { id: "P1", value: 100, site: "Main" },
]);

export const labsB = createDataFrame([
  { id: "P2", value: 200, ref_range: "4-5" },
]);

export const numericDoses = createDataFrame([
  { drug: "Aspirin", dose: 325 },
  { drug: "Lisinopril", dose: 10 },
]);

export const textDoses = createDataFrame([
  { drug: "Insulin", dose: "sliding scale" },
  { drug: "Warfarin", dose: "per INR" },
]);

export const patients = createDataFrame([
  { patient_id: "P001", name: "Alice", age: 30 },
]);
