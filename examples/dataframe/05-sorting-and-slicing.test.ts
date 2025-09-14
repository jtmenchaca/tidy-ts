import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("Sorting and Slicing Data - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  const characters = createDataFrame([
    { id: 1, name: "Luke", team: "Rebels", score: 92, age: 23 },
    { id: 2, name: "Leia", team: "Rebels", score: 88, age: 23 },
    { id: 3, name: "Han", team: "Rebels", score: 76, age: 32 },
    { id: 4, name: "Chewbacca", team: "Rebels", score: 71, age: 200 },
    { id: 5, name: "Vader", team: "Empire", score: 95, age: 45 },
    { id: 6, name: "Tarkin", team: "Empire", score: 82, age: 65 },
    { id: 7, name: "Palpatine", team: "Empire", score: 97, age: 88 },
  ]);

  console.log("Original dataset with all characters:");
  characters.print();

  // ============================================================================
  // 2. BASIC SORTING - Simple single column sorting
  // ============================================================================
  console.log("\n=== 2. Basic Sorting - Simple Single Column Sorting ===");

  // Sort by score (ascending by default)
  // Start with the simplest case: sorting by one column
  const byScore = characters
    .arrange("score");

  console.log("Sorted by score (ascending by default):");
  byScore.print();

  // ============================================================================
  // 3. DESCENDING SORT - Changing sort direction
  // ============================================================================
  console.log("\n=== 3. Descending Sort - Changing Sort Direction ===");

  // Sort by score descending
  // This shows how to reverse the sort order
  const byScoreDesc = characters
    .arrange("score", "desc");

  console.log("Sorted by score (descending):");
  byScoreDesc.print();

  // ============================================================================
  // 4. MULTIPLE COLUMN SORTING - Complex sorting logic
  // ============================================================================
  console.log("\n=== 4. Multiple Column Sorting - Complex Sorting Logic ===");

  // Sort by multiple columns
  // This demonstrates hierarchical sorting (team first, then score within each team)
  const byTeamThenScore = characters
    .arrange(["team", "score"], ["asc", "desc"]);

  console.log("Sorted by team, then score (descending within each team):");
  byTeamThenScore.print();

  // ============================================================================
  // 5. BASIC SLICING - Getting specific rows
  // ============================================================================
  console.log("\n=== 5. Basic Slicing - Getting Specific Rows ===");

  // Get first N rows
  // Start with the most basic slicing operation
  console.log("First 3 characters (head):");
  characters.head(3).print();

  // Get last N rows
  // This shows how to get rows from the end
  console.log("Last 2 characters (tail):");
  characters.tail(2).print();

  // ============================================================================
  // 6. VALUE-BASED SLICING - Getting rows by criteria
  // ============================================================================
  console.log("\n=== 6. Value-Based Slicing - Getting Rows by Criteria ===");

  // Get N rows with minimum values
  // This shows how to get the "worst" performers
  console.log("2 characters with lowest scores (slice_min):");
  characters.sliceMin("score", 2).print();

  // Get N rows with maximum values
  // This shows how to get the "best" performers
  console.log("2 characters with highest scores (slice_max):");
  characters.sliceMax("score", 2).print();

  // ============================================================================
  // 7. RANDOM SAMPLING - Getting random rows
  // ============================================================================
  console.log("\n=== 7. Random Sampling - Getting Random Rows ===");

  // Random sample
  // This is useful for creating training/test splits or exploratory analysis
  console.log("3 random characters (sample):");
  characters.sample(3).print();

  // ============================================================================
  // 8. GROUP-AWARE OPERATIONS - Understanding grouping context
  // ============================================================================
  console.log(
    "\n=== 8. Group-Aware Operations - Understanding Grouping Context ===",
  );

  const grouped = characters
    .groupBy("team");

  console.log("=== Ungrouped vs Grouped Comparison ===");

  // Ungrouped: operates on entire dataset
  // This shows the default behavior without grouping
  console.log("Ungrouped head(2) - First 2 from entire dataset:");
  characters.head(2).print();

  // Grouped: operates within each group
  // This shows how grouping changes the behavior
  console.log("Grouped head(2) - First 2 from EACH team:");
  grouped.head(2).print();

  // ============================================================================
  // 9. GROUP-AWARE SLICING EXAMPLES - Working within groups
  // ============================================================================
  console.log(
    "\n=== 9. Group-Aware Slicing Examples - Working Within Groups ===",
  );

  console.log("Ungrouped slice_max('score', 1) - 1 highest score overall:");
  characters.sliceMax("score", 1).print();

  console.log("Grouped slice_max('score', 1) - Highest score from EACH team:");
  grouped.sliceMax("score", 1).print();

  console.log("Top performer from each team:");
  grouped.sliceMax("score", 1).print();

  console.log("Youngest member from each team:");
  grouped.sliceMin("age", 1).print();

  console.log("Last 2 members from each team (by original order):");
  grouped.tail(2).print();

  // ============================================================================
  // 10. COMBINING SORTING AND SLICING - Building complex workflows
  // ============================================================================
  console.log(
    "\n=== 10. Combining Sorting and Slicing - Building Complex Workflows ===",
  );

  // Sort first, then slice
  // This shows a common pattern: sort to get the "best" rows, then take the top N
  const topPerformers = characters
    .arrange("score", "desc")
    .head(3);

  console.log("Top 3 performers overall (sort then slice):");
  topPerformers.print();

  // ============================================================================
  // 11. ADVANCED GROUPED OPERATIONS - Complex grouped workflows
  // ============================================================================
  console.log(
    "\n=== 11. Advanced Grouped Operations - Complex Grouped Workflows ===",
  );

  // Group, sort within groups, then slice
  // This demonstrates a sophisticated workflow for getting top performers per group
  const topPerTeam = characters
    .groupBy("team")
    .arrange("score", "desc")
    .head(2);

  console.log("Top 2 performers from each team (group → sort → slice):");
  topPerTeam.print();

  // ============================================================================
  // 12. PUTTING IT ALL TOGETHER - Complete workflow
  // ============================================================================
  console.log("\n=== 12. Putting It All Together - Complete Workflow ===");

  // Show a complete workflow that demonstrates all the concepts
  const finalResult = characters
    .filter((row) => row.score > 0) // Data validation
    .groupBy("team") // Group by team
    .arrange("score", "desc") // Sort by score within each team
    .head(2) // Take top 2 from each team
    .ungroup() // Remove grouping for final output
    .arrange("score", "desc") // Sort overall by score
    .select("name", "team", "score", "age"); // Select relevant columns

  console.log("Complete workflow combining all concepts:");
  finalResult.print();

  // Test assertions
  expect(byScore.nrows()).toBe(7);
  expect(byScore[0].score).toBeLessThan(byScore[6].score);
  expect(byScoreDesc[0].score).toBeGreaterThan(byScoreDesc[6].score);
  expect(byTeamThenScore.nrows()).toBe(7);
  expect(characters.head(3).nrows()).toBe(3);
  expect(characters.tail(2).nrows()).toBe(2);
  expect(characters.sliceMin("score", 2).nrows()).toBe(2);
  expect(characters.sliceMax("score", 2).nrows()).toBe(2);
  expect(characters.sample(3).nrows()).toBe(3);
  expect(topPerformers.nrows()).toBe(3);
  expect(topPerTeam.nrows()).toBe(4); // 2 from each of 2 teams
  expect(finalResult.nrows()).toBe(4);
  expect(finalResult[0].score).toBeGreaterThan(finalResult[3].score);
});
