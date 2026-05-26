import { stats as s } from "@tidy-ts/dataframe";

console.log("=== Determinism: same seed → same sequence ===");
const a = s.dist.normal.random({ sampleSize: 5, seed: 42 });
const b = s.dist.normal.random({ sampleSize: 5, seed: 42 });
console.log("seed=42, run 1:", a);
console.log("seed=42, run 2:", b);
console.log("identical?", JSON.stringify(a) === JSON.stringify(b));

console.log("\n=== Different seed → different sequence ===");
const c = s.dist.normal.random({ sampleSize: 5, seed: 43 });
console.log("seed=43:        ", c);
console.log("different from 42?", JSON.stringify(a) !== JSON.stringify(c));

console.log("\n=== No seed → non-deterministic ===");
const d = s.dist.normal.random({ sampleSize: 5 });
const e = s.dist.normal.random({ sampleSize: 5 });
console.log("unseeded run 1:", d);
console.log("unseeded run 2:", e);
console.log("different?     ", JSON.stringify(d) !== JSON.stringify(e));

console.log("\n=== Single draw ===");
const single: number = s.dist.normal.random();
console.log("single, no opts:    ", single);
const single2: number = s.dist.normal.random({ mean: 100, standardDeviation: 5, seed: 7 });
const single3: number = s.dist.normal.random({ mean: 100, standardDeviation: 5, seed: 7 });
console.log("single, seeded:     ", single2, "vs", single3);
console.log("identical?", single2 === single3);

console.log("\n=== Cross-distribution ===");
const pois = s.dist.poisson.random({ rateLambda: 3.2, sampleSize: 5, seed: 100 });
const pois2 = s.dist.poisson.random({ rateLambda: 3.2, sampleSize: 5, seed: 100 });
console.log("poisson seed=100:", pois);
console.log("identical?       ", JSON.stringify(pois) === JSON.stringify(pois2));

const binom = s.dist.binomial.random({ trials: 20, probabilityOfSuccess: 0.3, sampleSize: 5, seed: 100 });
console.log("binom   seed=100:", binom);

const unif = s.dist.uniform.random({ minimum: 0, maximum: 1, sampleSize: 5, seed: 100 });
console.log("unif    seed=100:", unif);
