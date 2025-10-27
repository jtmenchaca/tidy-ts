import { createDataFrame, LLM } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { z } from "zod";

Deno.test("LLM.respond", async () => {
  const result = await LLM.respond({
    userInput: "What is the weather in Tokyo?",
    schema: z.object({
      weather: z.string(),
    }),
  });
  console.log(result);
});

Deno.test("LLM.respond - string output", async () => {
  const result = await LLM.respond({
    userInput: "What is the date today?",
  });
  console.log(result);
});

Deno.test("LLM.respond - z.date()", async () => {
  const result = await LLM.respond({
    userInput: "What is the date today?",
    schema: z.object({
      date: z.date(),
    }),
  });
  console.log(result);
  console.log(
    `${
      result.date.getMonth() + 1
    }/${result.date.getDate()}/${result.date.getFullYear()}`,
  );

  const now = new Date();
  console.log(`${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`);
});

Deno.test("LLM.respond - z.iso.date()", async () => {
  const result = await LLM.respond({
    userInput: "What is the date today?",
    schema: z.object({
      date: z.iso.date(),
      datetime: z.iso.datetime(),
    }),
  });
  console.log(result);
});

Deno.test("test-1", async () => {
  const df = createDataFrame([
    { name: "John", age: 30 },
    { name: "Jane", age: 25 },
  ]);

  const df1 = await df
    .mutate({
      llmResponse: async (row) =>
        await LLM.respond({
          userInput: "What is the age of " + row.name + " " + row.age +
            " multiplied by 2 then added to 10?",
        }),
    });

  df1.print();

  //   ------- output -------
  // ┌──────┬─────┬──────────────────────┐
  // │ name │ age │ llmResponse          │
  // ├──────┼─────┼──────────────────────┤
  // │ John │ 30  │ John's age is 30.... │
  // │ Jane │ 25  │ Jane is 25 years ... │
  // └──────┴─────┴──────────────────────┘
});

Deno.test("test-2", async () => {
  const df = createDataFrame([
    { name: "John", age: 30 },
    { name: "Jane", age: 10 },
  ]);

  const df1 = await df
    .mutate({
      llmResponse: async (row) =>
        await LLM.respond({
          userInput: "What is the age of " + row.name + " - " + row.age +
            " multiplied by 2 then added to 10?",
        }),
    });

  const df2 = await df1
    .mutate({
      eligibility: async (row) => {
        const result = await LLM.respond({
          userInput: "Is " + row.age + " greater than 18?",
          schema: z.object({
            eligibility: z.boolean(),
          }),
        });
        return result.eligibility;
      },
    })
    .filter((row) => row.eligibility);

  df2.print();
  //   ------- output -------
  // ┌──────┬─────┬──────────────────────┐
  // │ name │ age │ llmResponse          │
  // ├──────┼─────┼──────────────────────┤
  // │ John │ 30  │ John's age is 30.... │
  // └──────┴─────┴──────────────────────┘
});

Deno.test("LLM.embed - single string", async () => {
  const embedding = await LLM.embed("Hello world");

  expect(Array.isArray(embedding)).toBe(true);
  expect(embedding.length).toBe(3072); // text-embedding-3-large default
  expect(typeof embedding[0]).toBe("number");

  console.log(`Embedding dimension: ${embedding.length}`);
  console.log(`First 5 values: ${embedding.slice(0, 5)}`);
});

Deno.test("LLM.embed - array of strings", async () => {
  const embeddings = await LLM.embed([
    "First document",
    "Second document",
    "Third document",
  ]);

  expect(Array.isArray(embeddings)).toBe(true);
  expect(embeddings.length).toBe(3);
  expect(Array.isArray(embeddings[0])).toBe(true);
  expect(embeddings[0].length).toBe(3072);
  expect(embeddings[1].length).toBe(3072);
  expect(embeddings[2].length).toBe(3072);

  console.log(`Number of embeddings: ${embeddings.length}`);
  console.log(`Each embedding dimension: ${embeddings[0].length}`);
});

Deno.test("LLM.embed - small model", async () => {
  const embedding = await LLM.embed(
    "Test with small model",
    "text-embedding-3-small",
  );

  expect(Array.isArray(embedding)).toBe(true);
  expect(embedding.length).toBe(1536); // text-embedding-3-small
  expect(typeof embedding[0]).toBe("number");

  console.log(`Small model embedding dimension: ${embedding.length}`);
});

Deno.test("LLM.embed - similarity test", async () => {
  const embeddings = await LLM.embed([
    "The cat sits on the mat",
    "A feline rests on the rug",
    "Python is a programming language",
  ]);

  // Calculate cosine similarity between embeddings
  const cosineSimilarity = (a: number[], b: number[]): number => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };

  const sim01 = cosineSimilarity(embeddings[0], embeddings[1]);
  const sim02 = cosineSimilarity(embeddings[0], embeddings[2]);

  console.log(`Similarity (cat/feline): ${sim01.toFixed(4)}`);
  console.log(`Similarity (cat/python): ${sim02.toFixed(4)}`);

  // Similar sentences should have higher similarity than unrelated ones
  expect(sim01).toBeGreaterThan(sim02);
});

Deno.test("LLM.compareEmbeddings - basic", async () => {
  const query = await LLM.embed("The cat sits on the mat");
  const candidates = await LLM.embed([
    "A feline rests on the rug",
    "Python is a programming language",
    "The dog runs in the park",
  ]);

  const results = LLM.compareEmbeddings({ query, candidates });

  expect(results.length).toBe(3);
  expect(results[0].index).toBeDefined();
  expect(results[0].distance).toBeDefined();
  expect(results[0].embedding).toBeDefined();

  // Results should be sorted by distance (ascending)
  expect(results[0].distance).toBeLessThanOrEqual(results[1].distance);
  expect(results[1].distance).toBeLessThanOrEqual(results[2].distance);

  // Most similar should be the cat/feline sentence (index 0)
  expect(results[0].index).toBe(0);

  console.log(`Most similar: index ${results[0].index}, distance ${results[0].distance.toFixed(4)}`);
  console.log(`Least similar: index ${results[2].index}, distance ${results[2].distance.toFixed(4)}`);
});

Deno.test("LLM.compareEmbeddings - with n parameter", async () => {
  const query = await LLM.embed("JavaScript programming");
  const candidates = await LLM.embed([
    "TypeScript is a typed superset of JavaScript",
    "The weather is sunny today",
    "Python is another programming language",
    "Cats are wonderful pets",
    "React is a JavaScript library",
  ]);

  const top3 = LLM.compareEmbeddings({ query, candidates, n: 3 });

  expect(top3.length).toBe(3);

  // All results should be sorted by distance
  expect(top3[0].distance).toBeLessThanOrEqual(top3[1].distance);
  expect(top3[1].distance).toBeLessThanOrEqual(top3[2].distance);

  console.log("Top 3 most similar:");
  top3.forEach((result, i) => {
    console.log(`  ${i + 1}. Index ${result.index}, distance ${result.distance.toFixed(4)}`);
  });
});
