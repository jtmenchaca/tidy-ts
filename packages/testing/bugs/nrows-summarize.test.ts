import { expect } from "@std/expect";
import { createDataFrame } from "../../dataframe/ts/index.ts";

Deno.test("nrows() in summarize returns correct counts per group", () => {
  const encounters = createDataFrame([
    { pat_id: "A", encounter_type: "office" },
    { pat_id: "A", encounter_type: "lab" },
    { pat_id: "A", encounter_type: "office" },
    { pat_id: "B", encounter_type: "office" },
    { pat_id: "B", encounter_type: "er" },
    { pat_id: "C", encounter_type: "lab" },
  ]);

  const patientSummary = encounters
    .groupBy("pat_id")
    .summarize({
      total_encounters: (g) => g.nrows(),
    });

  patientSummary.print();

  expect(patientSummary.nrows()).toBe(3);

  const rows = patientSummary.arrange("pat_id").toRows();
  expect(rows[0]).toEqual({ pat_id: "A", total_encounters: 3 });
  expect(rows[1]).toEqual({ pat_id: "B", total_encounters: 2 });
  expect(rows[2]).toEqual({ pat_id: "C", total_encounters: 1 });
});
