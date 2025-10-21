/**
 * MIMICEL Chunk1 Import Test
 *
 * Tests importing the full 346MB, ~2.5M row CSV file.
 * This file is under V8's 536MB string limit, but regular readCSV causes OOM
 * because it holds multiple copies in memory during parsing (file string + parsed arrays + final objects).
 *
 * Using readCSVStream should work because it only accumulates the final row objects,
 * avoiding intermediate representations.
 */

import { expect } from "@std/expect";
import { z } from "zod";
import { readCSVStream } from "../../src/dataframe/ts/io/index.ts";

Deno.test("MIMICEL Chunk1 · can import full 2.5M rows via streaming", async () => {
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

  console.log("Reading MIMICEL Chunk1 full file (346MB, 2.5M rows)...");
  const startTime = performance.now();

  const df = await readCSVStream("./tmp/mimicel_chunk1.csv", MimicRow, {
    skipEmptyLines: true,
    naValues: ["", "NA"],
  });

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`Successfully loaded in ${duration} seconds`);
  console.log(`Total rows: ${df.nrows().toLocaleString()}`);
  console.log(`Total columns: ${df.columns().length}`);

  // Verify we got data - should be ~2.5M rows
  expect(df.nrows()).toBeGreaterThan(2_500_000);
  expect(df.columns().length).toBe(31);

  // Check first row
  console.log("\nFirst row:");
  console.log(`  stay_id: ${df[0].stay_id}`);
  console.log(`  subject_id: ${df[0].subject_id}`);
  console.log(`  activity: ${df[0].activity}`);

  // Verify expected columns exist
  expect(df.columns()).toContain("stay_id");
  expect(df.columns()).toContain("subject_id");
  expect(df.columns()).toContain("activity");

  // Verify first row
  expect(df[0].stay_id).toBe(30000012);
  expect(df[0].subject_id).toBe(11714491);
});
