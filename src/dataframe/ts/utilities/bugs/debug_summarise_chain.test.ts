import { createDataFrame, stats } from "@tidy-ts/dataframe";

console.log("=== DEBUGGING SUMMARISE CHAIN ISSUE ===");

Deno.test("debug summarise chain", () => {
  const penguins = createDataFrame([
    {
      species: "Adelie",
      island: "Torgersen",
      bill_length: 39.1,
      bill_depth: 18.7,
      body_mass: 3750,
    },
    {
      species: "Adelie",
      island: "Torgersen",
      bill_length: 39.5,
      bill_depth: 17.4,
      body_mass: 3800,
    },
    {
      species: "Adelie",
      island: "Torgersen",
      bill_length: 40.3,
      bill_depth: 18.0,
      body_mass: 3250,
    },
    {
      species: "Chinstrap",
      island: "Dream",
      bill_length: 46.5,
      bill_depth: 17.9,
      body_mass: 3500,
    },
    {
      species: "Chinstrap",
      island: "Dream",
      bill_length: 50.0,
      bill_depth: 19.5,
      body_mass: 4050,
    },
    {
      species: "Gentoo",
      island: "Biscoe",
      bill_length: 46.1,
      bill_depth: 13.2,
      body_mass: 4375,
    },
    {
      species: "Gentoo",
      island: "Biscoe",
      bill_length: 50.0,
      bill_depth: 16.3,
      body_mass: 5700,
    },
  ]);

  console.log("1. Created DataFrame");
  console.log("penguins", penguins);

  const mutated = penguins.mutate({
    body_mass_g_filled: (row) => row.body_mass ?? 4000,
  });
  console.log("mutated", mutated);
  console.log("2. After mutate - type:", typeof mutated);
  console.log("   Has print?", typeof mutated.print);
  console.log("   Has nrows?", typeof mutated.nrows);

  const simple_summarized = penguins.summarize({
    avg_mass: (row) => stats.mean(row.body_mass),
  });
  console.log("simple_summarized", simple_summarized);
  console.log("2. After mutate - type:", typeof simple_summarized);
  console.log("   Has print?", typeof simple_summarized.print);
  console.log("   Has nrows?", typeof simple_summarized.nrows);

  const filtered = mutated.filter((row) => row.species === "Adelie");
  console.log("filtered", filtered);
  console.log("3. After filter - type:", typeof filtered);
  console.log("   Has print?", typeof filtered.print);
  console.log("   Has nrows?", typeof filtered.nrows);

  const grouped = filtered.groupBy("island");
  console.log("4. After groupBy - type:", typeof grouped);
  console.log("   Has print?", typeof grouped.print);
  console.log("   Has nrows?", typeof grouped.nrows);

  console.log("grouped", grouped);

  const mutate_after_grouped = grouped.mutate({
    avg_mass: (g) => stats.mean(g.body_mass_g_filled),
  });

  console.log("mutate_after_grouped", mutate_after_grouped);
  console.log("6. After mutate - type:", typeof mutate_after_grouped);
  console.log("   Has print?", typeof mutate_after_grouped.print);
  console.log("   Has nrows?", typeof mutate_after_grouped.nrows);
  console.log("   Has arrange?", typeof mutate_after_grouped.arrange);

  const summarized = grouped.summarize({
    avg_mass: (g) => stats.mean(g.body_mass_g_filled),
  });
  console.log("summarized", summarized);
  console.log("5. After summarize - type:", typeof summarized);
  console.log("   Has print?", typeof summarized.print);
  console.log("   Has nrows?", typeof summarized.nrows);
  console.log("   Has arrange?", typeof summarized.arrange);

  // This is the failing line from the test:
  try {
    const _arranged = summarized.arrange("avg_mass", "desc");
    console.log("6. After arrange - SUCCESS!");
  } catch (e: unknown) {
    console.log(
      "6. After arrange - FAILED:",
      e instanceof Error ? e.message : String(e),
    );
  }
});
