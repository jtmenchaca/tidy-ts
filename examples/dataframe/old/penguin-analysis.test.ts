import { readXLSX } from "@tidy-ts/dataframe";
import { z } from "zod";
import { test } from "@tidy-ts/shims";

// Get path relative to repo root (works for both Deno and Bun)
const FIXTURES_PATH = new URL("../../fixtures", import.meta.url).pathname;

test("Penguin analysis with count functionality", async () => {
  const PenguinSchema = z.object({
    species: z.string(),
    island: z.string(),
  });

  const penguins = await readXLSX(
    `${FIXTURES_PATH}/penguins.xlsx`,
    PenguinSchema,
  );

  const speciesCount = penguins.count("species");
  speciesCount.print();

  const islandCount = penguins.count("island");
  islandCount.print();

  const speciesIslandCount = penguins.count("species", "island");
  speciesIslandCount.print();
});
