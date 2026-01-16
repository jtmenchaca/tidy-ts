// import { createDataFrame, LLM } from "@tidy-ts/dataframe";
// import { z } from "zod";

// Deno.test("test-1", async () => {
//   const df = createDataFrame([
//     { name: "John", age: 30 },
//     { name: "Jane", age: 25 },
//   ]);

//   const df1 = await df
//     .mutate({
//       llmResponse: async (row) =>
//         await LLM({
//           userInput: "What is the age of " + row.name + " " + row.age +
//             " multiplied by 2 then added to 10?"
//         }),
//     });

//   df1.print();

//   //   ------- output -------
//   // ┌──────┬─────┬──────────────────────┐
//   // │ name │ age │ llmResponse          │
//   // ├──────┼─────┼──────────────────────┤
//   // │ John │ 30  │ John's age is 30.... │
//   // │ Jane │ 25  │ Jane is 25 years ... │
//   // └──────┴─────┴──────────────────────┘
// });

// Deno.test("test-2", async () => {
//   const df = createDataFrame([
//     { name: "John", age: 30 },
//     { name: "Jane", age: 10 },
//   ]);

//   const df1 = await df
//     .mutate({
//       llmResponse: async (row) =>
//         await LLM({
//           userInput: "What is the age of " + row.name + " - " + row.age +
//             " multiplied by 2 then added to 10?"
//         }),
//     })

//     const df2 = await df1
//     .mutate({
//       eligibility: async (row) => {
//       const result = await LLM({
//         userInput: "Is " + row.age + " greater than 18?",
//         schema: z.object({
//           eligibility: z.boolean(),
//         }),
//       });
//       return result.eligibility;
//     }
//     })
//     .filter(row => row.eligibility);

//   df2.print();
//   //   ------- output -------
//   // ┌──────┬─────┬──────────────────────┐
//   // │ name │ age │ llmResponse          │
//   // ├──────┼─────┼──────────────────────┤
//   // │ John │ 30  │ John's age is 30.... │
//   // └──────┴─────┴──────────────────────┘
// });
