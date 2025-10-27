import { createDataFrame, LLM } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("LLM", async () => {
  const result = await LLM({
    userInput: "What is the weather in Tokyo?",
    schema: z.object({
      weather: z.string(),
    }),
  });
  console.log(result);
});

Deno.test("LLM date - string output", async () => {
  const result = await LLM({
    userInput: "What is the date today?",
  });
  console.log(result);
});

Deno.test("LLM date - z.date()", async () => {
  const result = await LLM({
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

Deno.test("LLM date - z.iso.date()", async () => {
  const result = await LLM({
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
        await LLM({
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
        await LLM({
          userInput: "What is the age of " + row.name + " - " + row.age +
            " multiplied by 2 then added to 10?",
        }),
    });

  const df2 = await df1
    .mutate({
      eligibility: async (row) => {
        const result = await LLM({
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
