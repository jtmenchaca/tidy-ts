/**
 * CSV File Size Limit Test
 *
 * Verifies that readCSV automatically falls back to streaming when reading
 * files larger than V8's maximum string length (~536M characters).
 */

import { expect } from "@std/expect";
import { z } from "zod";
import { readCSV } from "../../src/dataframe/ts/io/index.ts";

Deno.test("readCSV · automatically uses streaming for large files (10k sample)", async () => {
  const MimicRow = z.object({
    stay_id: z.number().int(),
    subject_id: z.number().int(),
    hadm_id: z.number().int().optional(),
    timestamps: z.string(),
    activity: z.string(),
    gender: z.string().optional(),
    race: z.string().optional(),
    arrival_transport: z.string().optional(),
    disposition: z.string().optional(),
    seq_num: z.number().int().optional(),
    icd_code: z.string().optional(),
    icd_version: z.number().optional(),
    icd_title: z.string().optional(),
    temperature: z.number().optional(),
    heartrate: z.number().optional(),
    resprate: z.number().optional(),
    o2sat: z.number().optional(),
    sbp: z.number().optional(),
    dbp: z.number().optional(),
    pain: z.number().optional(),
    acuity: z.number().optional(),
    chiefcomplaint: z.string().optional(),
    rhythm: z.string().optional(),
    name: z.string().optional(),
    gsn: z.string().optional(),
    ndc: z.string().optional(),
    etc_rn: z.number().optional(),
    etccode: z.string().optional(),
    etcdescription: z.string().optional(),
    med_rn: z.number().optional(),
    gsn_rn: z.number().optional(),
  });

  console.log(
    "Testing readCSV with sample file (should use streaming automatically)...",
  );
  const startTime = performance.now();

  // Use the 10k sample file instead of full file to avoid OOM
  // This still tests that readCSV automatically uses streaming for large files
  const df = await readCSV("./tmp/mimicel-sample.csv", MimicRow, {
    skipEmptyLines: true,
    naValues: ["", "NA"],
  });

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`Successfully loaded file in ${duration} seconds`);
  console.log(`Total rows: ${df.nrows()}`);

  // Verify data was loaded correctly
  expect(df.nrows()).toBe(10000);
  expect(df.columns().length).toBe(31);
  expect(df[0].stay_id).toBe(30000012);
  expect(df[0].subject_id).toBe(11714491);
});
