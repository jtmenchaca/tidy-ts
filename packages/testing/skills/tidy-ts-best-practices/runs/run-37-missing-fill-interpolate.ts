import { createDataFrame } from "@tidy-ts/dataframe";

const sensor = createDataFrame([
  { date: new Date("2026-04-01"), reading: 12.5 as number | null },
  { date: new Date("2026-04-02"), reading: 13.0 as number | null },
  { date: new Date("2026-04-03"), reading: null as number | null },
  { date: new Date("2026-04-04"), reading: null as number | null },
  { date: new Date("2026-04-05"), reading: 14.5 as number | null },
  { date: new Date("2026-04-06"), reading: null as number | null },
  { date: new Date("2026-04-07"), reading: 16.0 as number | null },
  { date: new Date("2026-04-08"), reading: null as number | null },
  { date: new Date("2026-04-09"), reading: null as number | null },
  { date: new Date("2026-04-10"), reading: 17.5 as number | null },
]);

console.log("Original:");
sensor.print();

// 1. Forward fill — carry previous non-missing value forward.
const forward = sensor.fillForward("reading");
console.log("\n1) fillForward:");
forward.print();

// 2. Backward fill — carry next non-missing value backward.
const backward = sensor.fillBackward("reading");
console.log("\n2) fillBackward:");
backward.print();

// 3. Linear interpolation on the date axis.
const interp = sensor.interpolate("reading", "date", "linear");
console.log("\n3) interpolate (linear, date axis):");
interp.print();

// 4. Constant fill with 0.
const zero = sensor.replaceNull({ reading: 0 });
console.log("\n4) replaceNull -> 0:");
zero.print();
