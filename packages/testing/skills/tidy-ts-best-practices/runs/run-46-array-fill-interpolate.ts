// Test of array-level fill / interpolate helpers from the
// tidy-ts-best-practices skill (stats-window rules).
//
// Skill says:
//   s.forwardFill([10, null, null, 20, null]) // [10, 10, 10, 20, 20]
//   s.backwardFill([null, null, 10, null, 20]) // [10, 10, 10, 20, 20]
//   s.interpolate([100, null, null, 200], [1, 2, 3, 4], "linear")
//     // [100, 133.33, 166.67, 200]

import { stats as s } from "@tidy-ts/dataframe";

const sensorReadings: (number | null)[] = [
  10,
  null,
  null,
  13,
  15,
  null,
  18,
  null,
  null,
  22,
];
const pricePerMinute: (number | null)[] = [
  null,
  5.2,
  5.5,
  null,
  null,
  5.8,
  null,
  6.1,
];
const sparseSeries: (number | null)[] = [
  null,
  100,
  null,
  null,
  null,
  null,
  160,
  null,
];

// ---------------------------------------------------------------
// Task 1: forward-fill sensorReadings
// Per the skill, s.forwardFill carries the last non-null value
// forward. Leading nulls have no prior value, so they should
// remain null.
// ---------------------------------------------------------------
const task1 = s.forwardFill(sensorReadings);
console.log("Task 1 — forwardFill(sensorReadings):");
console.log(task1);
console.log(
  "  Leading-null check: index 0 =",
  task1[0],
  ", index 1 =",
  task1[1],
  ", index 2 =",
  task1[2],
);

// ---------------------------------------------------------------
// Task 2: backward-fill pricePerMinute
// Skill: nulls take the next non-null value that comes after.
// Trailing nulls have no value after, so they should remain null.
// ---------------------------------------------------------------
const task2 = s.backwardFill(pricePerMinute);
console.log("\nTask 2 — backwardFill(pricePerMinute):");
console.log(task2);
console.log(
  "  Trailing-null check (last index =",
  task2.length - 1,
  "):",
  task2[task2.length - 1],
);

// ---------------------------------------------------------------
// Task 3: linearly interpolate sparseSeries
// Skill form: s.interpolate(values, xValues, "linear")
// Use positional x values 0..length-1.
// Between 100 (index 1) and 160 (index 6), the 5 gaps of width 1
// should land at 100, 112, 124, 136, 148, 160 (step = 12).
// ---------------------------------------------------------------
const xValues = sparseSeries.map((_, i) => i);
const task3 = s.interpolate(sparseSeries, xValues, "linear");
console.log("\nTask 3 — interpolate(sparseSeries, xValues, 'linear'):");
console.log(task3);
console.log(
  "  Between index 1 (100) and index 6 (160), expected step = 12:",
  "[",
  task3[1],
  task3[2],
  task3[3],
  task3[4],
  task3[5],
  task3[6],
  "]",
);

// ---------------------------------------------------------------
// Task 4: forward-fill THEN backward-fill sensorReadings.
// Forward-fill carries 10 through indices 1,2 (so no leading nulls
// in this case), but to be defensive we follow up with a backward
// fill to handle any leading nulls that remain.
// ---------------------------------------------------------------
const task4 = s.backwardFill(s.forwardFill(sensorReadings));
console.log("\nTask 4 — backwardFill(forwardFill(sensorReadings)):");
console.log(task4);
const hasNulls = task4.some((v) => v === null || v === undefined);
console.log("  Any nulls remaining?", hasNulls);
