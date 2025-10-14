import { createDataFrame, stats } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { test } from "@tests/shims";

test("Grouping and Aggregation Operations - Progressive Examples", () => {
  // ============================================================================
  // 1. SETTING UP THE DATA - Create our working dataset
  // ============================================================================
  console.log("=== 1. Setting Up the Data ===");

  const characters = createDataFrame([
    {
      id: 1,
      name: "Luke",
      team: "Rebels",
      score: 92,
      age: 23,
      species: "Human",
    },
    {
      id: 2,
      name: "Leia",
      team: "Rebels",
      score: 88,
      age: 23,
      species: "Human",
    },
    {
      id: 3,
      name: "Han",
      team: "Rebels",
      score: 76,
      age: 32,
      species: "Human",
    },
    {
      id: 4,
      name: "Chewbacca",
      team: "Rebels",
      score: 71,
      age: 200,
      species: "Wookiee",
    },
    {
      id: 5,
      name: "Vader",
      team: "Empire",
      score: 95,
      age: 45,
      species: "Human",
    },
    {
      id: 6,
      name: "Tarkin",
      team: "Empire",
      score: 82,
      age: 65,
      species: "Human",
    },
    {
      id: 7,
      name: "Palpatine",
      team: "Empire",
      score: 97,
      age: 88,
      species: "Human",
    },
    {
      id: 8,
      name: "C-3PO",
      team: "Rebels",
      score: 65,
      age: 67,
      species: "Droid",
    },
    {
      id: 9,
      name: "R2-D2",
      team: "Rebels",
      score: 78,
      age: 33,
      species: "Droid",
    },
  ]);

  console.log("Original dataset with all characters:");
  characters.print();

  // ============================================================================
  // 2. BASIC GROUPING - Single column grouping
  // ============================================================================
  console.log("\n=== 2. Basic Grouping - Single Column Grouping ===");

  // Group by a single column
  // Start with the simplest case: grouping by one column
  const byTeam = characters
    .groupBy("team");

  console.log("Grouped by team:");
  byTeam.print();

  // ============================================================================
  // 3. MULTIPLE COLUMN GROUPING - Complex grouping logic
  // ============================================================================
  console.log("\n=== 3. Multiple Column Grouping - Complex Grouping Logic ===");

  // Group by multiple columns
  // This shows how to create more granular groups
  const byTeamAndSpecies = characters
    .groupBy("team", "species");

  console.log("Grouped by team and species:");
  byTeamAndSpecies.print();

  // ============================================================================
  // 4. BASIC AGGREGATION - Simple summary statistics
  // ============================================================================
  console.log("\n=== 4. Basic Aggregation - Simple Summary Statistics ===");

  // Basic summary statistics by team
  // Start with simple aggregations like count and averages
  const teamStats = characters
    .groupBy("team")
    .summarise({
      count: (group) => group.nrows(),
      avg_score: (group) => stats.mean(group.score),
      total_score: (group) => stats.sum(group.score),
    });

  console.log("Basic team statistics:");
  teamStats.print();

  // ============================================================================
  // 5. ADVANCED AGGREGATION - Complex calculations
  // ============================================================================
  console.log("\n=== 5. Advanced Aggregation - Complex Calculations ===");

  // More complex summary statistics by team
  // This shows how to calculate derived values within groups
  const detailedTeamStats = characters
    .groupBy("team")
    .summarise({
      count: (group) => group.nrows(),
      avg_score: (group) => stats.mean(group.score),
      total_score: (group) => stats.sum(group.score),
      min_score: (group) => stats.min(group.score),
      max_score: (group) => stats.max(group.score),
      score_range: (group) => {
        const max = stats.max(group.score, true);
        const min = stats.min(group.score, true);
        return max ? max - min : 0;
      },
    });

  console.log("Detailed team statistics with range calculations:");
  detailedTeamStats.print();

  // ============================================================================
  // 6. MULTI-LEVEL AGGREGATION - Working with nested groups
  // ============================================================================
  console.log(
    "\n=== 6. Multi-Level Aggregation - Working with Nested Groups ===",
  );

  // Summary by team and species
  // This demonstrates how to work with multiple grouping levels
  const detailedStats = characters
    .groupBy("team", "species")
    .summarise({
      count: (group) => group.nrows(),
      avg_score: (group) => stats.round(stats.mean(group.score), 1),
      avg_age: (group) => stats.round(stats.mean(group.age), 1),
    });

  console.log("Detailed statistics by team and species:");
  detailedStats.print();

  // ============================================================================
  // 7. WORKING WITH GROUPED DATA - Understanding group structure
  // ============================================================================
  console.log(
    "\n=== 7. Working with Grouped Data - Understanding Group Structure ===",
  );

  // Access group information
  // This shows how to inspect the grouping structure
  console.log("Number of teams:", byTeam.__groups?.size);
  console.log("Grouping columns:", byTeam.__groups?.groupingColumns);

  // ============================================================================
  // 8. FILTERING GROUPS - Working with group results
  // ============================================================================
  console.log("\n=== 8. Filtering Groups - Working with Group Results ===");

  // Filter groups based on aggregation results
  // This shows how to use aggregation results for further filtering
  const largeGroups = characters
    .groupBy("team")
    .summarise({
      count: (group) => group.nrows(),
    })
    .filter((row) => row.count >= 4);

  console.log("Teams with 4+ members:");
  largeGroups.print();

  // ============================================================================
  // 9. SORTING WITHIN GROUPS - Group-aware operations
  // ============================================================================
  console.log("\n=== 9. Sorting Within Groups - Group-Aware Operations ===");

  // Sort within groups
  // This demonstrates how grouping affects other operations
  const topPerTeam = characters
    .groupBy("team")
    .arrange("score", "desc")
    .head(2);

  console.log("Top 2 performers from each team:");
  topPerTeam.print();

  // ============================================================================
  // 10. CONDITIONAL GROUPING - Creating dynamic groups
  // ============================================================================
  console.log("\n=== 10. Conditional Grouping - Creating Dynamic Groups ===");

  // Conditional grouping
  // This shows how to create groups based on calculated values
  const byAgeGroup = characters
    .mutate({
      age_group: (row) => {
        if (row.age < 30) return "Young";
        if (row.age < 60) return "Middle";
        return "Senior";
      },
    })
    .groupBy("age_group")
    .summarise({
      count: (group) => group.nrows(),
      avg_score: (group) => stats.round(stats.mean(group.score), 1),
      species_list: (group) => stats.unique(group.species),
    });

  console.log("Statistics by age group:");
  byAgeGroup.print();

  // ============================================================================
  // 11. UNGROUPING - Removing grouping context
  // ============================================================================
  console.log("\n=== 11. Ungrouping - Removing Grouping Context ===");

  // Ungroup after operations
  // This shows how to remove grouping for further operations
  const ungrouped = characters
    .groupBy("team")
    .summarise({
      team: (group) => group.team[0], // First team value
      member_count: (group) => group.nrows(),
      avg_score: (group) => stats.round(stats.mean(group.score), 1),
    })
    .ungroup()
    .arrange("avg_score", "desc");

  console.log("Team summary (ungrouped and sorted):");
  ungrouped.print();

  // ============================================================================
  // 12. PUTTING IT ALL TOGETHER - Complete grouping workflow
  // ============================================================================
  console.log(
    "\n=== 12. Putting It All Together - Complete Grouping Workflow ===",
  );

  // Show a complete workflow that demonstrates all the grouping concepts
  const finalResult = characters
    .filter((row) => row.score > 0) // Data validation
    .mutate({
      age_group: (row) => {
        if (row.age < 30) return "Young";
        if (row.age < 60) return "Middle";
        return "Senior";
      },
    }) // Add age groups
    .groupBy("team", "age_group") // Group by multiple columns
    .summarise({
      team: (group) => group.team[0],
      age_group: (group) => group.age_group[0],
      count: (group) => group.nrows(),
      avg_score: (group) => stats.round(stats.mean(group.score), 1),
      min_score: (group) => stats.min(group.score),
      max_score: (group) => stats.max(group.score),
    }) // Calculate comprehensive statistics
    .ungroup() // Remove grouping
    .arrange("team", "desc") // Sort for readability
    .select(
      "team",
      "age_group",
      "count",
      "avg_score",
      "min_score",
      "max_score",
    ); // Select relevant columns

  console.log("Complete grouping workflow combining all concepts:");
  finalResult.print();

  // Test assertions
  expect(byTeam.__groups?.size).toBe(2);
  expect(teamStats.nrows()).toBe(2);
  expect(
    teamStats.filter((row) => row.team === "Rebels").nrows(),
  )
    .toBe(1);
  expect(detailedStats.nrows()).toBeGreaterThan(0);
  expect(largeGroups.nrows()).toBeGreaterThan(0);
  expect(topPerTeam.nrows()).toBeGreaterThan(0);
  expect(byAgeGroup.nrows()).toBeGreaterThan(0);
  expect(ungrouped.nrows()).toBe(2);
  expect(ungrouped.team).toBeDefined();
  expect(ungrouped.member_count).toBeDefined();
  expect(finalResult.nrows()).toBeGreaterThan(0);
  expect(finalResult.avg_score).toBeDefined();
  expect(finalResult.min_score).toBeDefined();
});
