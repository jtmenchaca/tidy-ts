import { stats as s } from "@tidy-ts/dataframe";

// === Finding 1: poisson lambda vs rateLambda ===
console.log("=== Finding 1: poisson parameter ===");
// Skill says: s.dist.poisson.density({ at: 3, lambda: 3.2 })
const _p1 = s.dist.poisson.density({ at: 3, lambda: 3.2 });

// === Finding 2: random with sampleSize returns number, not number[] ===
console.log("\n=== Finding 2: normal.random return type ===");
const draws: number[] = s.dist.normal.random({ mean: 5, standardDeviation: 2, sampleSize: 100 });

// === Finding 3: seed parameter ===
console.log("\n=== Finding 3: seeded sampling ===");
const _r = s.dist.normal.random({ mean: 0, standardDeviation: 1, sampleSize: 10, seed: 42 });
