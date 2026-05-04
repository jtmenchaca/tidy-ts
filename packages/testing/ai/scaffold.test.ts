import { LLM, createEvaluateConfig } from "@tidy-ts/ai";
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";

/*───────────────────────────────────────────────────────────────────────────┐
│  Configs                                                                   │
└───────────────────────────────────────────────────────────────────────────*/

const patientDescriptionConfig = createEvaluateConfig({
  generator: {
    instructions:
      "Write a 1-2 sentence patient-friendly explanation of what this medication does and why they take it.",
    schema: z.object({ description: z.string() }),
  },
  evaluator: {
    instructions:
      "Rate the reading level simplicity (1-10, where 10 = very simple). Flag any medical jargon.",
    schema: z.object({
      score: z.number(),
      jargon: z.array(z.string()),
    }),
  },
  adjudicator: {
    instructions:
      "If the simplicity score is 7+, return the description as-is. Otherwise, simplify it further. Return only the final description.",
    schema: z.object({ description: z.string() }),
  },
});

/*───────────────────────────────────────────────────────────────────────────┐
│  Tests                                                                     │
└───────────────────────────────────────────────────────────────────────────*/

/**
 * Real-world scenario: Use mutateAsync to enrich a DataFrame of medications
 * with LLM-generated classifications.
 */
Deno.test({
  name: "LLM + DataFrame - classify medications via mutateAsync",
  async fn() {
    const meds = createDataFrame([
      { name: "metformin", dose: "1000mg" },
      { name: "lisinopril", dose: "20mg" },
      { name: "atorvastatin", dose: "40mg" },
    ]);

    const enriched = await meds
      .mutateAsync({
        classification: async (row) => {
          const result = await LLM.respond({
            userInput: `Classify this medication into one therapeutic category (e.g. "antihypertensive", "statin", "antidiabetic"): ${row.name} ${row.dose}`,
            schema: z.object({ category: z.string() }),
          });
          return result.category;
        },
      });

    enriched.print();

    expect(enriched.nrows()).toBe(3);
    for (const row of enriched) {
      expect(typeof row.classification).toBe("string");
      expect(row.classification.length).toBeGreaterThan(0);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

/**
 * Real-world scenario: Define a reusable EvaluateConfig, then apply it
 * per-row with mutateAsync. The config is defined once, input varies per row.
 */
Deno.test({
  name: "LLM + DataFrame - reusable EvaluateConfig with mutateAsync",
  async fn() {
    const meds = createDataFrame([
      { name: "metformin", dose: "1000mg", indication: "type 2 diabetes" },
      { name: "lisinopril", dose: "20mg", indication: "hypertension" },
    ]);

    const enriched = await meds
      .mutateAsync({
        patientDescription: async (row) => {
          const result = await LLM.evaluate({
            input: `Medication: ${row.name} ${row.dose}, prescribed for ${row.indication}`,
            config: patientDescriptionConfig,
          });
          return result;
        },
      });

    enriched.print({expand: true});

    expect(enriched.nrows()).toBe(2);
    for (const row of enriched) {
    const desc = row.patientDescription.adjudicator.description;
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(10);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
