import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("Standalone graph export functions", async () => {
  /**
   * Simple Chart Export Example
   *
   * This shows the basic server-side export functionality in action.
   * No Jupyter required - just save charts like files!
   */

  // Create a real DataFrame
  const df = createDataFrame([
    { name: "Alice", score: 85 },
    { name: "Bob", score: 92 },
    { name: "Charlie", score: 78 },
    { name: "Diana", score: 96 },
  ]);

  // Create a bar chart
  const chart = df.graph({
    type: "bar",
    mappings: { x: "name", y: "score" },
    config: {
      layout: {
        title: "Student Scores",
        width: 600,
        height: 400,
      },
    },
  });

  // Export as SVG (always works, zero dependencies)
  console.log("Saving SVG...");
  await chart.saveSVG({ filename: "examples/dataframe/output/scores-2.svg" });
  console.log("Saving PNG...");
  await chart.savePNG({ filename: "examples/dataframe/output/scores-2.png" });
});
