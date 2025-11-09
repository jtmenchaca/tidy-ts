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

Deno.test({
  name: "test-2",
  async fn() {
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
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "LLM.embed - single string",
  async fn() {
    const embedding = await LLM.embed("Hello world");

    expect(Array.isArray(embedding)).toBe(true);
    expect(embedding.length).toBe(3072); // text-embedding-3-large default
    expect(typeof embedding[0]).toBe("number");

    console.log(`Embedding dimension: ${embedding.length}`);
    console.log(`First 5 values: ${embedding.slice(0, 5)}`);
  },
  sanitizeResources: false,
  sanitizeOps: false,
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
