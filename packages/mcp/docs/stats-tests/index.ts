// Re-exports all stats-tests docs
export { tTestDocs } from "./t-tests.ts";
export { zTestDocs } from "./z-tests.ts";
export { proportionTestDocs } from "./proportion-tests.ts";
export { anovaDocs } from "./anova.ts";
export { correlationTestDocs } from "./correlation-tests.ts";
export { nonparametricDocs } from "./nonparametric.ts";
export { categoricalDocs } from "./categorical.ts";
export { normalityDocs } from "./normality.ts";
export { postHocDocs } from "./post-hoc.ts";

// Aggregate all for easy import
import { tTestDocs } from "./t-tests.ts";
import { zTestDocs } from "./z-tests.ts";
import { proportionTestDocs } from "./proportion-tests.ts";
import { anovaDocs } from "./anova.ts";
import { correlationTestDocs } from "./correlation-tests.ts";
import { nonparametricDocs } from "./nonparametric.ts";
import { categoricalDocs } from "./categorical.ts";
import { normalityDocs } from "./normality.ts";
import { postHocDocs } from "./post-hoc.ts";

export const statsTestsDocs = {
  ...tTestDocs,
  ...zTestDocs,
  ...proportionTestDocs,
  ...anovaDocs,
  ...correlationTestDocs,
  ...nonparametricDocs,
  ...categoricalDocs,
  ...normalityDocs,
  ...postHocDocs,
};
