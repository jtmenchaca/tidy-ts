import { LLM, createEvaluateScaffold, createRefineScaffold, createDebateScaffold, createEnsembleScaffold, createPipelineScaffold } from "@tidy-ts/ai";
import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";

/*───────────────────────────────────────────────────────────────────────────┐
│  Configs                                                                   │
└───────────────────────────────────────────────────────────────────────────*/

const drugInteractionDebateConfig = createDebateScaffold({
  proposition: {
    instructions:
      "State the clinical question clearly: Is this drug combination safe for this patient?",
    schema: z.object({ question: z.string(), context: z.string() }),
  },
  advocate: {
    instructions:
      "Argue that this drug combination is acceptable. Cite potential benefits and mitigating factors.",
    schema: z.object({ position: z.string(), arguments: z.array(z.string()) }),
  },
  critic: {
    instructions:
      "Argue against this drug combination. Cite risks, contraindications, and adverse interactions.",
    schema: z.object({ position: z.string(), arguments: z.array(z.string()) }),
  },
  judge: {
    instructions:
      "Weigh both sides and provide a clinical recommendation: proceed, proceed with monitoring, or avoid.",
    schema: z.object({
      recommendation: z.enum(["proceed", "proceed with monitoring", "avoid"]),
      reasoning: z.string(),
      keyRisk: z.string(),
    }),
  },
});

const medicationSummaryEnsembleConfig = createEnsembleScaffold({
  attempts: [
    {
      instructions: "Write a brief, clinical summary of this medication suitable for a provider note.",
      schema: z.object({ summary: z.string(), tone: z.string() }),
    },
    {
      instructions: "Write a brief, patient-friendly summary of this medication suitable for a handout.",
      schema: z.object({ summary: z.string(), tone: z.string() }),
    },
    {
      instructions: "Write a brief, pharmacist-oriented summary focusing on dosing and interactions.",
      schema: z.object({ summary: z.string(), tone: z.string() }),
    },
  ],
  synthesizer: {
    instructions:
      "Review all summaries. Pick the best one for patient education or combine elements. Explain your choice.",
    schema: z.object({
      chosenSummary: z.string(),
      reasoning: z.string(),
      source: z.enum(["attempt_1", "attempt_2", "attempt_3", "combined"]),
    }),
  },
});

const labInterpretationPipelineConfig = createPipelineScaffold({
  steps: [
    {
      instructions: "Identify what this lab value measures and its normal range.",
      schema: z.object({ labName: z.string(), normalRange: z.string(), unit: z.string() }),
    },
    {
      instructions: "Given the lab identification and the patient's value, interpret whether it is normal, high, or low. Provide a one-sentence clinical interpretation.",
      schema: z.object({
        interpretation: z.enum(["normal", "high", "low"]),
        clinicalNote: z.string(),
      }),
    },
  ],
});

const dischargeInstructionConfig = createRefineScaffold({
  drafter: {
    instructions:
      "Write a 2-3 sentence discharge instruction for the patient about their medication. Include what it's for, how to take it, and one key warning.",
    schema: z.object({
      instruction: z.string(),
      readingLevel: z.string(),
    }),
  },
  critic: {
    instructions:
      "Critique the discharge instruction for: clarity for a non-medical audience, completeness (does it cover purpose, dosing, and warnings?), and brevity. Suggest improvements.",
    schema: z.object({
      clarity: z.number().min(1).max(10),
      completeness: z.number().min(1).max(10),
      suggestions: z.array(z.string()),
    }),
  },
  reviser: {
    instructions:
      "Revise the discharge instruction based on the critique. Keep it under 3 sentences, at a 6th-grade reading level. Include what it's for, how to take it, and one key warning.",
    schema: z.object({
      instruction: z.string(),
      readingLevel: z.string(),
    }),
  },
  rounds: 1,
});

const patientDescriptionConfig = createEvaluateScaffold({
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
  }
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
  }
});

/**
 * Real-world scenario: Use refine to iteratively improve discharge instructions.
 * The config is defined once with createRefineScaffold, then applied per-row.
 * The result exposes the initial draft, each critique/revision round, and the final output.
 */
Deno.test({
  name: "LLM + DataFrame - refine discharge instructions with mutateAsync",
  async fn() {
    const meds = createDataFrame([
      { name: "metformin", dose: "500mg twice daily", indication: "type 2 diabetes" },
      { name: "warfarin", dose: "5mg daily", indication: "atrial fibrillation" },
    ]);

    const enriched = await meds
      .mutateAsync({
        dischargeInstruction: async (row) => {
          const result = await LLM.refine({
            input: `Medication: ${row.name} ${row.dose}, prescribed for ${row.indication}`,
            config: dischargeInstructionConfig,
          });
          return result;
        },
      });

    enriched.print({ expand: true });

    expect(enriched.nrows()).toBe(2);
    for (const row of enriched) {
      const result = row.dischargeInstruction;

      // Initial draft is accessible
      expect(typeof result.draft.instruction).toBe("string");
      expect(typeof result.draft.readingLevel).toBe("string");

      // Critique/revision rounds are accessible
      expect(result.rounds.length).toBe(1);
      expect(typeof result.rounds[0].critique.clarity).toBe("number");
      expect(typeof result.rounds[0].critique.completeness).toBe("number");
      expect(typeof result.rounds[0].revision.instruction).toBe("string");

      // Final output is the last revision
      expect(typeof result.final.instruction).toBe("string");
      expect(result.final.instruction.length).toBeGreaterThan(10);
    }
  }
});

/**
 * Real-world scenario: Use debate to weigh drug interaction risks.
 * The config is defined once with createDebateScaffold, then applied per-row.
 * The result exposes proposition, advocate, critic, and judge outputs.
 */
Deno.test({
  name: "LLM + DataFrame - debate drug interactions with mutateAsync",
  async fn() {
    const combos = createDataFrame([
      { drug1: "warfarin", drug2: "aspirin", patient: "72yo male with AFib and knee pain" },
      { drug1: "metformin", drug2: "lisinopril", patient: "55yo female with diabetes and hypertension" },
    ]);

    const enriched = await combos
      .mutateAsync({
        interactionAnalysis: async (row) => {
          const result = await LLM.debate({
            input: `Patient: ${row.patient}. Drug combination: ${row.drug1} + ${row.drug2}`,
            config: drugInteractionDebateConfig,
          });
          return result;
        },
      });

    enriched.print({ expand: true });

    expect(enriched.nrows()).toBe(2);
    for (const row of enriched) {
      const result = row.interactionAnalysis;

      expect(typeof result.proposition.question).toBe("string");
      expect(result.advocate.arguments.length).toBeGreaterThan(0);
      expect(result.critic.arguments.length).toBeGreaterThan(0);
      expect(["proceed", "proceed with monitoring", "avoid"]).toContain(result.judge.recommendation);
      expect(typeof result.judge.reasoning).toBe("string");
      expect(typeof result.judge.keyRisk).toBe("string");
    }
  }
});

/**
 * Real-world scenario: Use ensemble to generate multiple medication summaries
 * from different perspectives, then synthesize the best one for patient education.
 */
Deno.test({
  name: "LLM + DataFrame - ensemble medication summaries with mutateAsync",
  async fn() {
    const meds = createDataFrame([
      { name: "metoprolol", dose: "50mg twice daily", indication: "heart failure" },
      { name: "amlodipine", dose: "10mg daily", indication: "hypertension" },
    ]);

    const enriched = await meds
      .mutateAsync({
        bestSummary: async (row) => {
          const result = await LLM.ensemble({
            input: `Medication: ${row.name} ${row.dose}, prescribed for ${row.indication}`,
            config: medicationSummaryEnsembleConfig,
          });
          return result;
        },
      });

    enriched.print({ expand: true });

    expect(enriched.nrows()).toBe(2);
    for (const row of enriched) {
      const result = row.bestSummary;

      expect(result.attempts.length).toBe(3);
      expect(typeof result.synthesizer.chosenSummary).toBe("string");
      expect(typeof result.synthesizer.reasoning).toBe("string");
      expect(["attempt_1", "attempt_2", "attempt_3", "combined"]).toContain(result.synthesizer.source);
    }
  }
});

/**
 * Real-world scenario: Use pipeline to interpret lab values in two steps:
 * first identify the lab, then interpret the patient's result.
 */
Deno.test({
  name: "LLM + DataFrame - pipeline lab interpretation with mutateAsync",
  async fn() {
    const labs = createDataFrame([
      { test: "HbA1c", value: "8.2%", patient: "type 2 diabetes" },
      { test: "TSH", value: "0.3 mIU/L", patient: "fatigue and weight loss" },
    ]);

    const enriched = await labs
      .mutateAsync({
        labInterpretation: async (row) => {
          const result = await LLM.pipeline({
            input: `Lab test: ${row.test}, Value: ${row.value}, Patient context: ${row.patient}`,
            config: labInterpretationPipelineConfig,
          });
          return result;
        },
      });

    enriched.print({ expand: true });

    expect(enriched.nrows()).toBe(2);
    for (const row of enriched) {
      const result = row.labInterpretation;

      expect(result.steps.length).toBe(2);
      expect(["normal", "high", "low"]).toContain(result.final.interpretation);
      expect(typeof result.final.clinicalNote).toBe("string");
      expect(result.final.clinicalNote.length).toBeGreaterThan(5);
    }
  }
});
