import { LLM } from "@tidy-ts/ai";
import { expect } from "@std/expect";
import { z } from "zod";

/**
 * Test: Simple 2-step linear scaffold
 * Step 1: Translate English to pig latin
 * Step 2: Compare character counts and return structured result
 */
Deno.test({
  name: "LLM.runScaffold - piglatin translation + comparison",
  async fn() {
    const sentence = "The quick brown fox jumps over the lazy dog";

    const result = await LLM.runScaffold({
      input: sentence,
      steps: [
        // Step 1: translate
        () => ({
          instructions:
            "You are a pig latin translator. Translate the input text to pig latin. Follow standard pig latin rules: move the first consonant cluster to the end and add 'ay'.",
          schema: z.object({
            pigLatin: z.string(),
          }),
        }),
        // Step 2: compute differences using step 1's output
        (prev) => ({
          instructions:
            "You are given an original English sentence and its pig latin translation. Return the original sentence, the pig latin version, and the difference in character count (pigLatin length minus original length).",
          userInput:
            `Original: "${sentence}"\nPig Latin: "${prev[0].pigLatin}"`,
          schema: z.object({
            original: z.string(),
            pigLatin: z.string(),
            difference: z.number(),
          }),
        }),
      ],
    });

    expect(result.original).toBe(sentence);
    expect(typeof result.pigLatin).toBe("string");
    expect(result.pigLatin.length).toBeGreaterThan(0);
    expect(typeof result.difference).toBe("number");
    // The LLM may not compute exact arithmetic, but the structure is correct
    // and the pigLatin should be different from the original
    expect(result.pigLatin).not.toBe(sentence);

    console.log(result);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

/**
 * Test: Parallel evaluators + adjudicator pattern
 * Step 1: Generate a haiku
 * Step 2: Two evaluators rate it in parallel (creativity, adherence to form)
 * Step 3: Adjudicator synthesizes the evaluations
 */
Deno.test({
  name: "LLM.runScaffold - evaluator/adjudicator pattern",
  async fn() {
    const ratingSchema = z.object({
      score: z.number().min(1).max(10),
      reasoning: z.string(),
    });

    const result = await LLM.runScaffold({
      input: "Write a haiku about programming",
      steps: [
        // Step 1: Generate
        () => ({
          instructions:
            "You are a poet. Write a haiku about the given topic. A haiku has 3 lines with 5-7-5 syllable structure.",
          schema: z.object({ haiku: z.string() }),
        }),
        // Step 2: Parallel evaluators
        (prev) => [
          {
            instructions:
              "You are a creativity judge. Rate the following haiku for creativity on a scale of 1-10. Provide your reasoning.",
            userInput: `Haiku: "${prev[0].haiku}"`,
            schema: ratingSchema,
          },
          {
            instructions:
              "You are a poetry form expert. Rate the following haiku for adherence to the 5-7-5 syllable structure on a scale of 1-10. Provide your reasoning.",
            userInput: `Haiku: "${prev[0].haiku}"`,
            schema: ratingSchema,
          },
        ],
        // Step 3: Adjudicator
        (prev) => {
          const [creativity, form] = prev[1] as z.infer<typeof ratingSchema>[];
          return {
            instructions:
              "You are a final judge. Given the creativity and form evaluations, provide a final assessment with an overall score (average of the two scores, rounded) and a brief summary.",
            userInput:
              `Creativity score: ${creativity.score}/10 - ${creativity.reasoning}\nForm score: ${form.score}/10 - ${form.reasoning}`,
            schema: z.object({
              overallScore: z.number(),
              summary: z.string(),
              recommendation: z.enum(["publish", "revise", "discard"]),
            }),
          };
        },
      ],
    });

    expect(typeof result.overallScore).toBe("number");
    expect(result.overallScore).toBeGreaterThanOrEqual(1);
    expect(result.overallScore).toBeLessThanOrEqual(10);
    expect(typeof result.summary).toBe("string");
    expect(["publish", "revise", "discard"]).toContain(result.recommendation);

    console.log(result);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

/**
 * Test: Scaffold result used as a DataFrame column via mutateAsync
 */
Deno.test({
  name: "LLM.runScaffold - as DataFrame column",
  async fn() {
    const { createDataFrame } = await import("@tidy-ts/dataframe");

    const df = createDataFrame([
      { word: "hello" },
      { word: "world" },
    ]);

    const result = await df.mutateAsync({
      analysis: async (row) =>
        await LLM.runScaffold({
          input: row.word,
          steps: [
            () => ({
              instructions:
                "Translate the word to pig latin using standard rules.",
              schema: z.object({ pigLatin: z.string() }),
            }),
            (prev) => ({
              instructions:
                "Return the original word, the pig latin version, and the character count difference.",
              userInput:
                `Original: "${row.word}", Pig Latin: "${prev[0].pigLatin}"`,
              schema: z.object({
                original: z.string(),
                pigLatin: z.string(),
                difference: z.number(),
              }),
            }),
          ],
        }),
    });

    result.print();

    const rows = result.toArray();
    for (const row of rows) {
      expect(typeof row.analysis.original).toBe("string");
      expect(typeof row.analysis.pigLatin).toBe("string");
      expect(typeof row.analysis.difference).toBe("number");
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
