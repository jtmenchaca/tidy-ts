import { createDataFrame } from "@tidy-ts/dataframe";

const N = 500_000;
const ITERATIONS = 7;
const WARMUP = 5;

const rows = Array.from({ length: N }, (_, i) => ({
  quantity: Math.random() * 100,
  price: Math.random() * 50,
  tax: Math.random() * 10,
  score: Math.random() * 100,
}));

function measure(name: string, fn: () => void) {
  for (let i = 0; i < WARMUP; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t = performance.now();
    fn();
    times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  return median;
}

// JIT-eligible expressions
const jitExprs: Record<string, (r: any) => number> = {
  "r.quantity * r.price": (r: any) => r.quantity * r.price,
  "r.quantity * r.price + r.tax": (r: any) => r.quantity * r.price + r.tax,
  "r.quantity * r.quantity": (r: any) => r.quantity * r.quantity,
  "3 * r.quantity - 2 * r.price": (r: any) => 3 * r.quantity - 2 * r.price,
};

// Expressions that always fall back (non-polynomial)
const fallbackExprs: Record<string, (r: any) => number> = {
  "r.score / 100": (r: any) => r.score / 100,
  "Math.log(r.quantity + 1)": (r: any) => Math.log(r.quantity + 1),
  "r.quantity > 50 ? r.price : 0": (r: any) => r.quantity > 50 ? r.price : 0,
};

console.log(`\nMutate benchmark — ${N.toLocaleString()} rows\n`);

// For JIT expressions: compare JIT kernel vs same expression with JIT disabled
// To disable JIT: use Math.abs wrapper which makes it non-polynomial
console.log("JIT-eligible expressions:");
console.log("Expression".padEnd(40), "JIT (ms)".padStart(10), "RowView (ms)".padStart(14), "Speedup".padStart(10));
console.log("-".repeat(76));

for (const [name, expr] of Object.entries(jitExprs)) {
  const df = createDataFrame(rows);
  const jitTime = measure(name, () => df.mutate({ result: expr }));

  // To get a true RowView baseline, use Math.abs() which is non-polynomial
  // but for positive values produces identical results to a no-op
  // Actually just use a different fn ref each time to defeat cache but still go through RowView
  const baseTime = measure(name + " (rowview)", () => {
    // New function on each measure call would defeat caching but also means
    // compilation cost each time. Instead: use one fn that JIT can't handle.
    const noJit = (r: any, _i: number, _df: any) => expr(r);
    return df.mutate({ result: noJit });
  });

  const speedup = baseTime / jitTime;
  console.log(
    name.padEnd(40),
    jitTime.toFixed(2).padStart(10),
    baseTime.toFixed(2).padStart(14),
    `${speedup.toFixed(1)}x`.padStart(10),
  );
}

console.log("\nFallback expressions (always RowView):");
console.log("Expression".padEnd(40), "Time (ms)".padStart(10));
console.log("-".repeat(52));

for (const [name, expr] of Object.entries(fallbackExprs)) {
  const df = createDataFrame(rows);
  const time = measure(name, () => df.mutate({ result: expr }));
  console.log(name.padEnd(40), time.toFixed(2).padStart(10));
}
