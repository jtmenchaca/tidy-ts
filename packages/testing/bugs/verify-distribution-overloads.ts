import { stats as s } from "@tidy-ts/dataframe";

// Test all distributions: does `.random({ ..., sampleSize: N })` resolve to number[]?

const _normal: number[] = s.dist.normal.random({ sampleSize: 10 });
const _binomial: number[] = s.dist.binomial.random({ trials: 20, probabilityOfSuccess: 0.3, sampleSize: 10 });
const _poisson: number[] = s.dist.poisson.random({ rateLambda: 3.2, sampleSize: 10 });
const _uniform: number[] = s.dist.uniform.random({ lowerBound: 0, upperBound: 1, sampleSize: 10 });
const _exponential: number[] = s.dist.exponential.random({ rate: 1, sampleSize: 10 });
const _gamma: number[] = s.dist.gamma.random({ shape: 2, rate: 1, sampleSize: 10 });
const _beta: number[] = s.dist.beta.random({ shape1: 2, shape2: 5, sampleSize: 10 });
const _chiSquare: number[] = s.dist.chiSquare.random({ degreesOfFreedom: 5, sampleSize: 10 });
const _t: number[] = s.dist.t.random({ degreesOfFreedom: 5, sampleSize: 10 });
const _f: number[] = s.dist.f.random({ degreesOfFreedom1: 5, degreesOfFreedom2: 10, sampleSize: 10 });
const _logNormal: number[] = s.dist.logNormal.random({ meanLog: 0, sdLog: 1, sampleSize: 10 });
const _geometric: number[] = s.dist.geometric.random({ probability: 0.3, sampleSize: 10 });
const _negativeBinomial: number[] = s.dist.negativeBinomial.random({ size: 5, prob: 0.3, sampleSize: 10 });
const _hypergeometric: number[] = s.dist.hypergeometric.random({ nn: 20, mm: 7, kk: 5, sampleSize: 10 });
const _weibull: number[] = s.dist.weibull.random({ shape: 2, scale: 1, sampleSize: 10 });
const _pareto: number[] = s.dist.pareto.random({ shape: 2, scale: 1, sampleSize: 10 });
const _ev1: number[] = s.dist.ev1.random({ location: 0, scale: 1, sampleSize: 10 });
const _zipf: number[] = s.dist.zipf.random({ exponent: 2, support: 100, sampleSize: 10 });
const _dirac: number[] = s.dist.dirac.random({ value: 1, sampleSize: 10 });
const _wilcoxon: number[] = s.dist.wilcoxon.random({ m: 5, n: 5, sampleSize: 10 });

// Scalar form
const _normal1: number = s.dist.normal.random({});
const _binomial1: number = s.dist.binomial.random({ trials: 20, probabilityOfSuccess: 0.3 });

console.log("All overloads resolved correctly.");
