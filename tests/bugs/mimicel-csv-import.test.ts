/**
 * MIMICEL.CSV Import Test
 *
 * Tests importing a large CSV file (~7.5M lines, 1GB) from the tmp folder.
 * This file contains medical records with timestamps, vitals, medications, etc.
 *
 * Uses streaming CSV reader to avoid V8's ~536M character string limit.
 *
 * Note: The full 7.5M row file causes OOM since DataFrames hold all data in memory.
 * This test uses a 10k row sample to verify streaming works correctly.
 */

import { expect } from "@std/expect";
import { z } from "zod";
import { readCSVStream } from "../../src/dataframe/ts/io/index.ts";

Deno.test("MIMICEL.CSV · can import medical records CSV via streaming (10k sample)", async () => {
  // Define schema based on the CSV structure
  const MimicRow = z.object({
    stay_id: z.number().int(),
    subject_id: z.number().int(),
    hadm_id: z.number().int().optional(),
    timestamps: z.string(), // Could be z.coerce.date() but keeping as string for flexibility
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

  console.log("Reading MIMICEL sample file using streaming...");
  const startTime = performance.now();

  const df = await readCSVStream(
    "./tmp/mimicel-sample.csv",
    MimicRow,
    {
      skipEmptyLines: true,
      naValues: ["", "NA"],
    },
  );

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`Successfully loaded MIMICEL.CSV in ${duration} seconds`);
  console.log(`Total rows: ${df.nrows()}`);
  console.log(`Total columns: ${df.columns().length}`);

  // Verify we got data
  expect(df.nrows()).toBeGreaterThan(0);
  expect(df.columns().length).toBe(31);

  // Check first row
  console.log("\nFirst row:");
  console.log(`  stay_id: ${df[0].stay_id}`);
  console.log(`  subject_id: ${df[0].subject_id}`);
  console.log(`  activity: ${df[0].activity}`);
  console.log(`  timestamps: ${df[0].timestamps}`);

  // Verify expected columns exist
  expect(df.columns()).toContain("stay_id");
  expect(df.columns()).toContain("subject_id");
  expect(df.columns()).toContain("activity");
  expect(df.columns()).toContain("temperature");
  expect(df.columns()).toContain("heartrate");

  // Verify first row has expected stay_id from preview (note: row 0 might have optional hadm_id)
  expect(df[0].stay_id).toBe(30000012);
  expect(df[0].subject_id).toBe(11714491);
});
