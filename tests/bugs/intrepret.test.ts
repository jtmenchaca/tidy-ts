import { s } from "@tidy-ts/dataframe";

Deno.test("stats example - LLM interpretation", async () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const y = [1, 2, 3, 4, 5, 5, 4, 3, 2, 1];

  // Test with interpretation - this will add ai_interpretation field
  const results = await s.compare.twoGroups.centralTendency.toEachOther({
    x,
    y,
    parametric: "auto",
    comparator: "not equal to",
    alpha: 0.05,
    interpret: true,
  });

  console.log(results.ai_interpretation);
});
