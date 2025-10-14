import { readXLSX } from "@tidy-ts/dataframe";
import { z } from "zod";

Deno.test("Penguin analysis with count functionality", async () => {
  const PenguinSchema = z.object({
    species: z.string(),
    island: z.string(),
  });

  const penguins = await readXLSX(
    "./examples/fixtures/penguins.xlsx",
    PenguinSchema,
  );

  const speciesCount = penguins.count("species");
  speciesCount.print();

  const islandCount = penguins.count("island");
  islandCount.print();

  const speciesIslandCount = penguins.count("species", "island");
  speciesIslandCount.print();
});
