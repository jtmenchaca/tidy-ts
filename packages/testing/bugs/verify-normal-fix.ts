import { stats as s } from "@tidy-ts/dataframe";

// The agent's documented form — should now type-check
const draws: number[] = s.dist.normal.random({ mean: 5, standardDeviation: 2, sampleSize: 100 });
console.log("typeof draws:", typeof draws, "isArray:", Array.isArray(draws), "len:", draws.length);

// Scalar form
const scalar: number = s.dist.normal.random();
console.log("scalar:", typeof scalar);

const scalar2: number = s.dist.normal.random({ mean: 5 });
console.log("scalar2:", typeof scalar2);
