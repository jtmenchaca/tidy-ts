import { createDataFrame } from "@tidy-ts/dataframe";

const patients = createDataFrame({
  columns: {
    patient_id: ["P001", "P002", "P003"],
    name: ["Alice", "Bob", "Carol"],
  },
});

const encounters = createDataFrame({
  columns: {
    patient_id: ["P001", "P001", "P002"],
    los_days: [3, 7, null],
  },
});

const joined = patients
  .leftJoin(encounters, "patient_id");

// los_days: number | undefined
joined.mutate({
  // @ts-expect-error: los_days is number | undefined
  weeks: (r) => r.los_days / 7
});
// Error: 'r.los_days' is possibly 'null' or 'undefined'.
