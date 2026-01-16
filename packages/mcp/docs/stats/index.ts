// Re-exports all stats docs
export { descriptiveDocs } from "./descriptive.ts";
export { spreadDocs } from "./spread.ts";
export { quantilesDocs } from "./quantiles.ts";
export { cumulativeDocs } from "./cumulative.ts";
export { rankingDocs } from "./ranking.ts";
export { transformationDocs } from "./transformation.ts";
export { windowDocs } from "./window.ts";
export { correlationDocs } from "./correlation.ts";
export { countsDocs } from "./counts.ts";

// Aggregate all for easy import
import { descriptiveDocs } from "./descriptive.ts";
import { spreadDocs } from "./spread.ts";
import { quantilesDocs } from "./quantiles.ts";
import { cumulativeDocs } from "./cumulative.ts";
import { rankingDocs } from "./ranking.ts";
import { transformationDocs } from "./transformation.ts";
import { windowDocs } from "./window.ts";
import { correlationDocs } from "./correlation.ts";
import { countsDocs } from "./counts.ts";

export const statsDocs = {
  ...descriptiveDocs,
  ...spreadDocs,
  ...quantilesDocs,
  ...cumulativeDocs,
  ...rankingDocs,
  ...transformationDocs,
  ...windowDocs,
  ...correlationDocs,
  ...countsDocs,
};
