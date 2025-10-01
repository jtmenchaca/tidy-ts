import { Agent, run, user } from "npm:@openai/agents";
import { createDataFrame } from "@tidy-ts/dataframe";
import "@std/dotenv/load";

Deno.test("test", async () => {
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
        ),
    });

  df1.print();
  console.log(df1.llmResponse);
});

export async function respondToChat(
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
