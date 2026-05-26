import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

const races = createDataFrame([
  { runner: "Alice", finish_seconds: 125 },
  { runner: "Bob", finish_seconds: 130 },
  { runner: "Carol", finish_seconds: 125 },
  { runner: "Dan", finish_seconds: 140 },
  { runner: "Eve", finish_seconds: 125 },
  { runner: "Frank", finish_seconds: 135 },
  { runner: "Grace", finish_seconds: 130 },
  { runner: "Heidi", finish_seconds: 120 },
]);

// Task 1: unique integer rank 1..n, ties broken by encounter order.
// Skill docs (rules/stats-window.md line 90) show:
//   s.rank([3, 1, 4, 1, 5], { ties: "first" })
// but this form fails TS type-check — the overload signature only accepts
// `(arr, target: number)`. Cast to `any` so the runtime (which does accept
// the options object) can do the work. See report.
const placeArr = s.rank(
  races.finish_seconds,
  { ties: "first" } as unknown as number,
);
const withPlace = races.mutate({ place: placeArr });
console.log("Task 1: unique place (ties broken by encounter order)");
withPlace.print();

// Task 2: ties share rank, next finisher skips by tie count (competition rank).
// Same options-object type problem as Task 1.
const tiedArr = s.rank(
  races.finish_seconds,
  { ties: "min" } as unknown as number,
);
const withTied = withPlace.mutate({ tied_place: tiedArr });
console.log("\nTask 2: tied_place (ties share rank, skip after)");
withTied.print();

// Task 3: ties share rank, no gap after ties.
// `s.denseRank(arr)` (no options) type-checks cleanly.
const withDense = withTied.mutate({
  dense_place: s.denseRank(races.finish_seconds),
});
console.log("\nTask 3: dense_place (no gaps)");
withDense.print();

// Task 4: labeled position lists for 5 races of different sizes.
// Skill docs show `s.rowNumber(5)` returning [1..5] but `rowNumber` does not
// exist on the `stats` namespace at the type level (it appears to exist at
// runtime). Fall back to vanilla JS Array.from. See report.
const fieldSizes = [3, 5, 8, 12, 20];
console.log("\nTask 4: labeled position lists");
for (let i = 0; i < fieldSizes.length; i++) {
  const raceNumber = i + 1;
  const positions = Array.from(
    { length: fieldSizes[i] },
    (_, pos) => `Race ${raceNumber} - Position ${pos + 1}`,
  );
  console.log(positions);
}
