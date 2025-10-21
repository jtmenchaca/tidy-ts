/**
 * MIMICEL Full File Import Test
 *
 * Tests importing the full 1GB, ~7.5M row CSV file using streaming.
 * This file exceeds V8's 536MB string limit, so regular readCSV would fail.
 * With streaming, we should be able to import it successfully.
 */

import { expect } from "@std/expect";
import { z } from "zod";
import { readCSVStream } from "../../src/dataframe/ts/io/index.ts";

Deno.test({
  name: "MIMICEL Full · can import 7.5M rows via streaming",
  ignore: true, // Requires 1GB file and 6GB+ heap: deno test --v8-flags=--max-old-space-size=6491
  fn: async () => {
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

    console.log("Reading full MIMICEL.CSV (1GB, ~7.5M rows)...");
    console.log("This may take a few minutes...");
    const startTime = performance.now();

    const df = await readCSVStream("./tmp/mimicel.csv", MimicRow, {
      skipEmptyLines: true,
      naValues: ["", "NA"],
    });

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\nSuccessfully loaded in ${duration} seconds`);
    console.log(`Total rows: ${df.nrows().toLocaleString()}`);
    console.log(`Total columns: ${df.columns().length}`);
    console.log(
      `Average time per row: ${
        (parseFloat(duration) / df.nrows() * 1000).toFixed(3)
      } ms`,
    );

    // Verify we got data - should be ~7.5M rows
    expect(df.nrows()).toBeGreaterThan(7_500_000);
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

    console.log("\n✓ Successfully imported full 7.5M row dataset!");
  },
});
