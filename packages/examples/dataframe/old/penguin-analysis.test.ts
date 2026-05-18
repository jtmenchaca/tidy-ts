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

  const speciesCount = penguins.groupBy("species").summarize({
    count: (g) => g.nrows(),
  });
  speciesCount.print();

  const islandCount = penguins.groupBy("island").summarize({
    count: (g) => g.nrows(),
  });
  islandCount.print();

  const speciesIslandCount = penguins.groupBy("species", "island").summarize({
    count: (g) => g.nrows(),
  });
  speciesIslandCount.print();
});
