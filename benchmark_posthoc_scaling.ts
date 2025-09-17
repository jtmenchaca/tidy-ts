#!/usr/bin/env -S deno run --allow-read --allow-ffi

import { tukeyHSD, gamesHowellTest, dunnTest } from "./src/dataframe/ts/stats/statistical-tests/post-hoc.ts";

function generateTestData(nGroups: number, groupSize: number) {
  const groups: number[][] = [];
  for (let i = 0; i < nGroups; i++) {
    const group: number[] = [];
    const baseValue = 10 + i * 3; // Different means for each group
    for (let j = 0; j < groupSize; j++) {
      group.push(baseValue + Math.random() * 2 - 1); // ±1 random variation
    }
    groups.push(group);
  }
  return groups;
}

const scenarios = [
  { groups: 3, size: 10, name: "Small (3 groups, 10 per group)" },
  { groups: 4, size: 25, name: "Medium (4 groups, 25 per group)" },
  { groups: 5, size: 50, name: "Large (5 groups, 50 per group)" },
  { groups: 6, size: 100, name: "Very Large (6 groups, 100 per group)" },
];

console.log("=== Post-hoc Test Scaling Analysis ===\n");

for (const scenario of scenarios) {
  const groups = generateTestData(scenario.groups, scenario.size);
  const nComparisons = scenario.groups * (scenario.groups - 1) / 2;
  
  console.log(`${scenario.name} - ${nComparisons} pairwise comparisons:`);
  
  // Warm up
  tukeyHSD(groups, 0.05);
  gamesHowellTest(groups, 0.05);
  dunnTest(groups, 0.05);
  
  // Time each test
  const iterations = 100;
  
  const tukeyStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    tukeyHSD(groups, 0.05);
  }
  const tukeyTime = (performance.now() - tukeyStart) / iterations;
  
  const ghStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    gamesHowellTest(groups, 0.05);
  }
  const ghTime = (performance.now() - ghStart) / iterations;
  
  const dunnStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    dunnTest(groups, 0.05);
  }
  const dunnTime = (performance.now() - dunnStart) / iterations;
  
  console.log(`  Tukey HSD:     ${tukeyTime.toFixed(3)}ms`);
  console.log(`  Games-Howell:  ${ghTime.toFixed(3)}ms`);
  console.log(`  Dunn's test:   ${dunnTime.toFixed(3)}ms`);
  console.log();
}