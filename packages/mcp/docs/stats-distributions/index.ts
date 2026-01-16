// Re-exports all stats-distributions docs
export { normalDocs } from "./normal.ts";
export { tDistributionDocs } from "./t-distribution.ts";
export { chiSquareDocs } from "./chi-square.ts";
export { fDistributionDocs } from "./f-distribution.ts";
export { betaDocs } from "./beta.ts";
export { gammaDocs } from "./gamma.ts";
export { exponentialDocs } from "./exponential.ts";
export { poissonDocs } from "./poisson.ts";
export { binomialDocs } from "./binomial.ts";
export { uniformDocs } from "./uniform.ts";
export { logNormalDocs } from "./log-normal.ts";
export { geometricDocs } from "./geometric.ts";
export { hypergeometricDocs } from "./hypergeometric.ts";
export { negativeBinomialDocs } from "./negative-binomial.ts";
export { weibullDocs } from "./weibull.ts";
export { paretoDocs } from "./pareto.ts";
export { wilcoxonDocs } from "./wilcoxon.ts";

// Aggregate all for easy import
import { normalDocs } from "./normal.ts";
import { tDistributionDocs } from "./t-distribution.ts";
import { chiSquareDocs } from "./chi-square.ts";
import { fDistributionDocs } from "./f-distribution.ts";
import { betaDocs } from "./beta.ts";
import { gammaDocs } from "./gamma.ts";
import { exponentialDocs } from "./exponential.ts";
import { poissonDocs } from "./poisson.ts";
import { binomialDocs } from "./binomial.ts";
import { uniformDocs } from "./uniform.ts";
import { logNormalDocs } from "./log-normal.ts";
import { geometricDocs } from "./geometric.ts";
import { hypergeometricDocs } from "./hypergeometric.ts";
import { negativeBinomialDocs } from "./negative-binomial.ts";
import { weibullDocs } from "./weibull.ts";
import { paretoDocs } from "./pareto.ts";
import { wilcoxonDocs } from "./wilcoxon.ts";

export const statsDistributionsDocs = {
  ...normalDocs,
  ...tDistributionDocs,
  ...chiSquareDocs,
  ...fDistributionDocs,
  ...betaDocs,
  ...gammaDocs,
  ...exponentialDocs,
  ...poissonDocs,
  ...binomialDocs,
  ...uniformDocs,
  ...logNormalDocs,
  ...geometricDocs,
  ...hypergeometricDocs,
  ...negativeBinomialDocs,
  ...weibullDocs,
  ...paretoDocs,
  ...wilcoxonDocs,
};
