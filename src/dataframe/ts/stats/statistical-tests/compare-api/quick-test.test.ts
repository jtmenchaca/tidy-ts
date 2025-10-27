import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

import { Agent, run, user } from "@openai/agents";
import "@std/dotenv/load";
import { z } from "zod";
import { expect } from "@std/expect";

Deno.test("test-1", async () => {
  const df = createDataFrame([
    { name: "John", age: 30 },
    { name: "Jane", age: 25 },
  ]);

  const df1 = await df
    .mutate({
      llmResponse: async (row) =>
        await respondToChat(
          "What is the age of " + row.name + " " + row.age +
            " multiplied by 2 then added to 10?",
          row.name,
        ),
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

export async function respondToChat(
  text: string,
  row: string,
) {
  console.log("Responding to chat for:", row);
  const agent = new Agent({
    name: "You are a helpful assistant",
    model: "gpt-4.1-mini",
    instructions: `You are a helpful assistant.`,
  });

  const result = await run(agent, [user(text)]);
  return result.finalOutput;
}

export async function respondToChatLLM(
  text: string,
) {
  const agent = new Agent({
    name: "You are a helpful assistant",
    model: "gpt-4.1-mini",
    instructions: `You are a helpful assistant.`,
  });

  const result = await run(agent, [user(text)]);
  return result.finalOutput;
}

export async function determineEligibility(
  text: string,
  row: string,
): Promise<boolean | null> {
  console.log("Determining eligibility for:", row);
  const responseSchema = z.object({
    eligibility: z.boolean(),
  });

  const agent = new Agent({
    name: "Title Assistant",
    instructions: `You are a helpful assistant.`,
    tools: [],
    outputType: {
      type: "json_schema",
      name: "eligibility_response",
      strict: true,
      schema: {
        type: "object",
        properties: {
          eligibility: { type: "boolean" },
        },
        required: ["eligibility"],
        additionalProperties: false,
      },
    },
    model: "gpt-4.1-mini",
  });

  const result = await run(agent, [user(text)]);

  const parsedResult = responseSchema.safeParse(result.finalOutput);
  if (!parsedResult.success) {
    throw new Error("Invalid response from agent");
  }

  return parsedResult.data.eligibility;
}

Deno.test("test-2", async () => {
  const df = createDataFrame([
    { name: "John", age: 30 },
    { name: "Jane", age: 10 },
  ]);

  const df1 = await df
    .mutate({
      llmResponse: async (row) =>
        await respondToChat(
          "What is the age of " + row.name + " - " + row.age +
            " multiplied by 2 then added to 10?",
          row.name,
        ),
    })
    .filter(async (row) =>
      await determineEligibility(
        "Is " + row.age + " greater than 18?",
        row.name,
      )
    );

  df1.print();
  //   ------- output -------
  // ┌──────┬─────┬──────────────────────┐
  // │ name │ age │ llmResponse          │
  // ├──────┼─────┼──────────────────────┤
  // │ John │ 30  │ John's age is 30.... │
  // └──────┴─────┴──────────────────────┘
});

// Test concurrency control with mock async function
Deno.test("test-3-concurrency-default", async () => {
  // Track concurrent API calls
  let activeCalls = 0;
  let maxConcurrentCalls = 0;
  const timers: number[] = [];

  // Mock async function that doesn't make real API calls
  async function mockAsyncOperation(text: string, name: string) {
    activeCalls++;
    maxConcurrentCalls = Math.max(maxConcurrentCalls, activeCalls);
    console.log(`Active calls: ${activeCalls}, Max: ${maxConcurrentCalls}`);

    // Simulate API delay with setTimeout wrapped in Promise
    await new Promise<void>((resolve) => {
      const timerId = setTimeout(() => {
        activeCalls--;
        resolve();
      }, 50);
      timers.push(timerId);
    });

    return `Processed: ${text} for ${name}`;
  }

  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
    { name: "Dave", age: 40 },
    { name: "Eve", age: 45 },
    { name: "Frank", age: 50 },
  ]);

  // Default concurrency for mutate is 1 based on DEFAULT_CONCURRENCY
  console.log("Testing default concurrency (should be 1)...");
  const df1 = await df.mutate({
    result: async (row) =>
      await mockAsyncOperation(
        `Calculate ${row.name}'s age (${row.age}) multiplied by 2`,
        row.name,
      ),
  });

  console.log(`Max concurrent calls with default: ${maxConcurrentCalls}`);
  expect(maxConcurrentCalls).toBeLessThanOrEqual(1);
  df1.print();

  // Clean up any remaining timers
  timers.forEach((timerId) => clearTimeout(timerId));
});

Deno.test("test-4-concurrency-limited", async () => {
  // Track concurrent API calls
  let activeCalls = 0;
  let maxConcurrentCalls = 0;
  const timers: number[] = [];

  // Mock async function that doesn't make real API calls
  async function mockAsyncOperation(text: string, name: string) {
    activeCalls++;
    maxConcurrentCalls = Math.max(maxConcurrentCalls, activeCalls);
    console.log(`Active calls: ${activeCalls}, Max: ${maxConcurrentCalls}`);

    // Simulate API delay with setTimeout wrapped in Promise
    await new Promise((resolve) => {
      const timerId = setTimeout(() => {
        activeCalls--;
        resolve(undefined);
      }, 50);
      timers.push(timerId);
    });

    return `Processed: ${text} for ${name}`;
  }

  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 30 },
    { name: "Carol", age: 35 },
    { name: "Dave", age: 40 },
    { name: "Eve", age: 45 },
    { name: "Frank", age: 50 },
  ]);

  // Test with explicit concurrency of 2 (higher than default of 1)
  console.log("Testing with concurrency limit of 2...");
  const df1 = await df.mutate({
    result: async (row) =>
      await mockAsyncOperation(
        `Calculate ${row.name}'s age (${row.age}) multiplied by 2`,
        row.name,
      ),
  }, { concurrency: 2 });

  console.log(`Max concurrent calls with limit 2: ${maxConcurrentCalls}`);
  expect(maxConcurrentCalls).toBeLessThanOrEqual(2);
  df1.print();

  // Clean up any remaining timers
  timers.forEach((timerId) => clearTimeout(timerId));
});

Deno.test("test-5-dataframe-level-concurrency", async () => {
  // Track concurrent API calls
  let activeCalls = 0;
  let maxConcurrentCalls = 0;
  const timers: number[] = [];

  // Mock async function for eligibility check
  async function mockEligibilityCheck(text: string, _name: string) {
    activeCalls++;
    maxConcurrentCalls = Math.max(maxConcurrentCalls, activeCalls);
    console.log(`Active calls: ${activeCalls}, Max: ${maxConcurrentCalls}`);

    // Simulate API delay with setTimeout wrapped in Promise
    await new Promise<void>((resolve) => {
      const timerId = setTimeout(() => {
        activeCalls--;
        resolve();
      }, 50);
      timers.push(timerId);
    });

    // Parse age from text and return eligibility
    const ageMatch = text.match(/\d+/);
    const age = ageMatch ? parseInt(ageMatch[0]) : 0;
    return age > 18;
  }

  // Create DataFrame with explicit concurrency setting of 3 (higher than default of 1)
  const df = createDataFrame([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 15 },
    { name: "Carol", age: 35 },
    { name: "Dave", age: 12 },
    { name: "Eve", age: 45 },
    { name: "Frank", age: 8 },
  ], { concurrency: 3 });

  console.log(
    "Testing DataFrame-level concurrency setting (3, higher than default 1)...",
  );
  const df1 = await df.filter(async (row) =>
    await mockEligibilityCheck(
      `Is ${row.age} greater than 18?`,
      row.name,
    )
  );

  console.log(
    `Max concurrent calls with DataFrame concurrency 3: ${maxConcurrentCalls}`,
  );
  expect(maxConcurrentCalls).toBeLessThanOrEqual(3);
  df1.print();

  // Clean up any remaining timers
  timers.forEach((timerId) => clearTimeout(timerId));
});

Deno.test("stats example", () => {
  const df = createDataFrame({
    columns: {
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [1, 2, 3, 4, 5, 5, 4, 3, 2, 1],
    },
  });

  const results = s.compare.twoGroups.centralTendency.toEachOther({
    x: df.x,
    y: df.y,
    parametric: "parametric",
    assumeEqualVariances: true,
    comparator: "not equal to",
    alpha: 0.05,
  });

  console.log("results:", results);
});

Deno.test("stats example - LLM", async () => {
  const df = createDataFrame({
    columns: {
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [1, 2, 3, 4, 5, 5, 4, 3, 2, 1],
    },
  });

  const results = s.compare.twoGroups.centralTendency.toEachOther({
    x: df.x,
    y: df.y,
    parametric: "parametric",
    assumeEqualVariances: true,
    comparator: "not equal to",
    alpha: 0.05,
  });

  const llm_input = await respondToChatLLM(
    `
    The data is ${df.toJSON()}
    The results of the statistical test are: ${JSON.stringify(results)}.
    Please analyze the results and provide a detailed explanation of the test.
  `,
  );

  df.print();

  console.log("results:", results);

  console.log("llm_input:", llm_input);
});

import type { DataFrame } from "@tidy-ts/dataframe";

export async function interpret(
  // deno-lint-ignore no-explicit-any
  originalData: DataFrame<any>,
  statsResults: any,
) {
  const agent = new Agent({
    name: "You are a helpful assistant that interprets statistical results",
    model: "gpt-4.1-mini",
    instructions:
      `You are a helpful assistant that interprets statistical results.`,
  });

  const result = await run(agent, [user(statsResults)]);
  return result.finalOutput;
}

Deno.test("stats example - interpret", async () => {
  const df = createDataFrame({
    columns: {
      x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      y: [1, 2, 3, 4, 5, 5, 4, 3, 2, 1],
    },
  });

  const results = s.compare.twoGroups.centralTendency.toEachOther({
    x: df.x,
    y: df.y,
    parametric: "parametric",
    assumeEqualVariances: true,
    comparator: "not equal to",
    alpha: 0.05,
  });

  const llm_input = await respondToChatLLM();

  df.print();

  console.log("results:", results);

  console.log("llm_input:", llm_input);
});
