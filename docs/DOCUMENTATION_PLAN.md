# Documentation Plan for Context7

## Overview

Reorganize `packages/mcp/docs/` into granular topic-based files. Each file exports `DocEntry` objects. The `index.ts` aggregates all docs and the `scripts/generate-markdown-docs.ts` generates one `.md` file per source `.ts` file.

---

## NEW MCP Docs Structure

```
packages/mcp/docs/
├── index.ts                           # Aggregates all docs, exports DOCS and CATEGORIES
├── mcp-types.ts                       # DocEntry interface (unchanged)
│
├── dataframe/
│   ├── index.ts                       # Re-exports all dataframe docs
│   ├── creation.ts                    # createDataFrame
│   ├── display.ts                     # print, toString
│   ├── selection.ts                   # select, drop, filter, slice*
│   ├── transformation.ts              # mutate, arrange, distinct, rename
│   ├── grouping.ts                    # groupBy, summarize, count, ungroup
│   ├── extraction.ts                  # extract, extractHead, extractTail, etc.
│   ├── joins.ts                       # innerJoin, leftJoin, rightJoin, outerJoin, asofJoin
│   ├── reshaping.ts                   # pivotLonger, pivotWider, transpose, unnest, bindRows
│   ├── time-series.ts                 # downsample, upsample
│   ├── missing-data.ts                # replaceNA, removeNA, fillForward, fillBackward, interpolate
│   ├── profiling.ts                   # profile
│   └── visualization.ts               # graph
│
├── stats/
│   ├── index.ts                       # Re-exports all stats docs
│   ├── descriptive.ts                 # mean, median, mode, sum, min, max, etc.
│   ├── spread.ts                      # variance, sd, range, iqr
│   ├── quantiles.ts                   # quantile, quartiles
│   ├── cumulative.ts                  # cumsum, cumprod, cummin, cummax, cummean
│   ├── ranking.ts                     # rank, denseRank, percentileRank
│   ├── transformation.ts              # normalize, round, floor, ceiling, percent
│   ├── window.ts                      # lag, lead, rolling, forwardFill, backwardFill, interpolate
│   ├── correlation.ts                 # covariance
│   └── counts.ts                      # unique, uniqueCount, countValue
│
├── stats-tests/
│   ├── index.ts                       # Re-exports all test docs
│   ├── t-tests.ts                     # s.test.t.oneSample, independent, paired
│   ├── z-tests.ts                     # s.test.z.oneSample, twoSample
│   ├── proportion-tests.ts            # s.test.proportion.oneSample, twoSample
│   ├── anova.ts                       # s.test.anova.oneWay, twoWay
│   ├── correlation-tests.ts           # s.test.correlation.pearson, spearman, kendall
│   ├── nonparametric.ts               # s.test.nonparametric.mannWhitney, wilcoxon, kruskalWallis
│   ├── categorical.ts                 # s.test.categorical.chiSquare, fishersExact
│   ├── normality.ts                   # s.test.normality.shapiroWilk
│   └── post-hoc.ts                    # s.compare.postHoc.dunn, gamesHowell, tukey
│
├── stats-compare/
│   ├── index.ts                       # Re-exports all compare docs
│   ├── one-group.ts                   # s.compare.oneGroup.*
│   ├── two-groups.ts                  # s.compare.twoGroups.*
│   └── multi-groups.ts                # s.compare.multiGroups.*
│
├── stats-distributions/
│   ├── index.ts                       # Re-exports all distribution docs
│   ├── normal.ts                      # s.dist.normal (density, probability, quantile, random, data)
│   ├── t-distribution.ts              # s.dist.t
│   ├── chi-square.ts                  # s.dist.chiSquare
│   ├── f-distribution.ts              # s.dist.f
│   ├── beta.ts                        # s.dist.beta
│   ├── gamma.ts                       # s.dist.gamma
│   ├── exponential.ts                 # s.dist.exponential
│   ├── poisson.ts                     # s.dist.poisson
│   ├── binomial.ts                    # s.dist.binomial
│   ├── uniform.ts                     # s.dist.uniform
│   ├── log-normal.ts                  # s.dist.logNormal
│   ├── geometric.ts                   # s.dist.geometric
│   ├── hypergeometric.ts              # s.dist.hypergeometric
│   ├── negative-binomial.ts           # s.dist.negativeBinomial
│   ├── weibull.ts                     # s.dist.weibull
│   ├── pareto.ts                      # s.dist.pareto
│   └── wilcoxon.ts                    # s.dist.wilcoxon
│
├── io/
│   ├── index.ts                       # Re-exports all io docs
│   ├── csv.ts                         # readCSV, readCSVMetadata, writeCSV
│   ├── json.ts                        # readJSON, writeJSON
│   ├── xlsx.ts                        # readXLSX, readXLSXMetadata, writeXLSX
│   ├── parquet.ts                     # readParquet, writeParquet
│   └── arrow.ts                       # readArrow, writeArrow
│
├── shims/
│   ├── index.ts                       # Re-exports all shims docs
│   ├── runtime.ts                     # currentRuntime, Runtime, getCurrentRuntime
│   ├── filesystem.ts                  # readFile, writeFile, mkdir, stat, exists, etc.
│   ├── path.ts                        # dirname, resolve, fileURLToPath, pathToFileURL
│   ├── env.ts                         # env.get, env.set, env.delete, env.load
│   ├── result.ts                      # Result, ok, err, tryAsync, defineError, AppError
│   ├── async.ts                       # batch, chunk, parallel, RetryConfig, BackoffStrategies
│   ├── fetch.ts                       # tidyfetch, HTTPError, NetworkError, TimeoutError, etc.
│   └── encryption.ts                  # encrypt, decrypt, generateKey, encryptFields, decryptFields, rotateMasterKey
│
├── string/
│   ├── index.ts                       # Re-exports all string docs
│   └── str.ts                         # str.* methods (toUpperCase, toLowerCase, trim, split, etc.)
│
└── llm/
    ├── index.ts                       # Re-exports all llm docs
    └── ai.ts                          # LLM.embed, LLM.respond, LLM.compareEmbeddings
```

---

## File Template

Each `.ts` file follows this pattern:

```typescript
// packages/mcp/docs/stats-tests/t-tests.ts
import type { DocEntry } from "../mcp-types.ts";

export const tTestDocs: Record<string, DocEntry> = {
  "s.test.t.oneSample": {
    name: "s.test.t.oneSample",
    category: "stats-tests",
    description: "One-sample t-test to compare a sample mean to a known value.",
    signature: "s.test.t.oneSample({ data, mu, alternative?, alpha? }): TTestResult",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`data: number[]` - Array of numeric values",
      "`mu: number` - Hypothesized population mean",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis (default: 'two-sided')",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns: "TTestResult with `statistic`, `pValue`, `degreesOfFreedom`, `confidenceInterval`, `reject`",
    examples: [
      "const data = [2.3, 2.5, 2.1, 2.4, 2.2];",
      "const result = s.test.t.oneSample({ data, mu: 2.0 });",
      "console.log(result.pValue);  // p-value",
      "console.log(result.reject);  // true if reject H0",
    ],
    bestPractices: [
      "Check normality with `s.test.normality.shapiroWilk` before using",
      "Use `alternative: 'less'` or `'greater'` for one-tailed tests",
    ],
    antiPatterns: [
      "Using t-test on non-normal data with small sample sizes",
    ],
    related: ["s.test.t.independent", "s.test.t.paired", "s.test.z.oneSample"],
  },

  "s.test.t.independent": {
    name: "s.test.t.independent",
    category: "stats-tests",
    description: "Independent two-sample t-test to compare means of two unrelated groups.",
    signature: "s.test.t.independent({ group1, group2, alternative?, alpha?, equalVariance? }): TTestResult",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`group1: number[]` - First group of values",
      "`group2: number[]` - Second group of values",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis",
      "`alpha?: number` - Significance level (default: 0.05)",
      "`equalVariance?: boolean` - Assume equal variances (default: false, uses Welch's t-test)",
    ],
    returns: "TTestResult with `statistic`, `pValue`, `degreesOfFreedom`, `confidenceInterval`, `reject`",
    examples: [
      "const control = [5.2, 4.8, 5.1, 4.9, 5.0];",
      "const treatment = [6.1, 5.9, 6.3, 6.0, 6.2];",
      "const result = s.test.t.independent({ group1: control, group2: treatment });",
      "console.log(result.pValue);  // compare means",
    ],
    bestPractices: [
      "Use Welch's t-test (equalVariance: false) unless you've verified equal variances",
      "Check normality of both groups before using",
    ],
    related: ["s.test.t.oneSample", "s.test.t.paired", "s.test.nonparametric.mannWhitney"],
  },

  "s.test.t.paired": {
    name: "s.test.t.paired",
    category: "stats-tests",
    description: "Paired t-test to compare means of two related samples (before/after, matched pairs).",
    signature: "s.test.t.paired({ before, after, alternative?, alpha? }): TTestResult",
    imports: ['import { s } from "@tidy-ts/dataframe";'],
    parameters: [
      "`before: number[]` - First measurement (e.g., before treatment)",
      "`after: number[]` - Second measurement (e.g., after treatment)",
      "`alternative?: 'two-sided' | 'less' | 'greater'` - Alternative hypothesis",
      "`alpha?: number` - Significance level (default: 0.05)",
    ],
    returns: "TTestResult with `statistic`, `pValue`, `degreesOfFreedom`, `confidenceInterval`, `reject`",
    examples: [
      "const before = [120, 125, 118, 130, 122];",
      "const after = [115, 118, 112, 125, 117];",
      "const result = s.test.t.paired({ before, after });",
      "console.log(result.reject);  // true if significant change",
    ],
    bestPractices: [
      "Use for repeated measures or matched subjects",
      "Arrays must be same length and correspond element-wise",
    ],
    related: ["s.test.t.oneSample", "s.test.t.independent", "s.test.nonparametric.wilcoxon"],
  },
};
```

---

## Index File Pattern

Each subdirectory has an `index.ts`:

```typescript
// packages/mcp/docs/stats-tests/index.ts
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
```

---

## Root Index File

```typescript
// packages/mcp/docs/index.ts
import type { DocEntry } from "./mcp-types.ts";

// Import aggregated docs from each subdirectory
import { dataframeDocs } from "./dataframe/index.ts";
import { statsDocs } from "./stats/index.ts";
import { statsTestsDocs } from "./stats-tests/index.ts";
import { statsCompareDocs } from "./stats-compare/index.ts";
import { statsDistributionsDocs } from "./stats-distributions/index.ts";
import { ioDocs } from "./io/index.ts";
import { shimsDocs } from "./shims/index.ts";
import { stringDocs } from "./string/index.ts";
import { llmDocs } from "./llm/index.ts";

export const DOCS: Record<string, DocEntry> = {
  ...dataframeDocs,
  ...statsDocs,
  ...statsTestsDocs,
  ...statsCompareDocs,
  ...statsDistributionsDocs,
  ...ioDocs,
  ...shimsDocs,
  ...stringDocs,
  ...llmDocs,
};

// Category mappings (used by generate-markdown-docs.ts)
export const CATEGORIES = {
  dataframe: Object.keys(dataframeDocs),
  stats: Object.keys(statsDocs),
  "stats-tests": Object.keys(statsTestsDocs),
  "stats-compare": Object.keys(statsCompareDocs),
  "stats-distributions": Object.keys(statsDistributionsDocs),
  io: Object.keys(ioDocs),
  shims: Object.keys(shimsDocs),
  string: Object.keys(stringDocs),
  llm: Object.keys(llmDocs),
  all: Object.keys(DOCS),
};

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  dataframe: "DataFrame Operations",
  stats: "Descriptive Statistics",
  "stats-tests": "Statistical Tests",
  "stats-compare": "Group Comparison API",
  "stats-distributions": "Probability Distributions",
  io: "Data I/O",
  shims: "Cross-Runtime Utilities",
  string: "String Utilities",
  llm: "LLM/AI Utilities",
};
```

---

## Generated Markdown Structure

The script will generate:

```
docs/
├── README.md
└── api/
    ├── dataframe/
    │   ├── creation.md
    │   ├── display.md
    │   ├── selection.md
    │   ├── transformation.md
    │   ├── grouping.md
    │   ├── extraction.md
    │   ├── joins.md
    │   ├── reshaping.md
    │   ├── time-series.md
    │   ├── missing-data.md
    │   ├── profiling.md
    │   └── visualization.md
    ├── stats/
    │   ├── descriptive.md
    │   ├── spread.md
    │   ├── quantiles.md
    │   ├── cumulative.md
    │   ├── ranking.md
    │   ├── transformation.md
    │   ├── window.md
    │   ├── correlation.md
    │   └── counts.md
    ├── stats-tests/
    │   ├── t-tests.md
    │   ├── z-tests.md
    │   ├── proportion-tests.md
    │   ├── anova.md
    │   ├── correlation-tests.md
    │   ├── nonparametric.md
    │   ├── categorical.md
    │   ├── normality.md
    │   └── post-hoc.md
    ├── stats-compare/
    │   ├── one-group.md
    │   ├── two-groups.md
    │   └── multi-groups.md
    ├── stats-distributions/
    │   ├── normal.md
    │   ├── t-distribution.md
    │   ├── chi-square.md
    │   ├── f-distribution.md
    │   ├── beta.md
    │   ├── gamma.md
    │   ├── exponential.md
    │   ├── poisson.md
    │   ├── binomial.md
    │   ├── uniform.md
    │   ├── log-normal.md
    │   ├── geometric.md
    │   ├── hypergeometric.md
    │   ├── negative-binomial.md
    │   ├── weibull.md
    │   ├── pareto.md
    │   └── wilcoxon.md
    ├── io/
    │   ├── csv.md
    │   ├── json.md
    │   ├── xlsx.md
    │   ├── parquet.md
    │   └── arrow.md
    ├── shims/
    │   ├── runtime.md
    │   ├── filesystem.md
    │   ├── path.md
    │   ├── env.md
    │   ├── result.md
    │   ├── async.md
    │   ├── fetch.md
    │   └── encryption.md
    ├── string/
    │   └── str.md
    └── llm/
        └── ai.md
```

---

## Migration Tasks

### Phase 1: Create Directory Structure
1. Create all subdirectories under `packages/mcp/docs/`
2. Create empty `index.ts` files in each subdirectory

### Phase 2: Split Existing Files
Split these large files into granular topic files:

| Current File | Split Into |
|-------------|-----------|
| `dataframe.ts` (61KB) | 12 files in `dataframe/` |
| `stats.ts` (49KB) | 9 files in `stats/` |
| `shims.ts` (112KB) | 8 files in `shims/` |
| `io.ts` (21KB) | 5 files in `io/` |
| `llm.ts` (6KB) | 1 file in `llm/` |

### Phase 3: Add Missing Documentation
Create new files with docs that don't exist yet:

| New Directory | Files to Create | Source Location |
|--------------|-----------------|-----------------|
| `stats-tests/` | 9 files | `packages/dataframe/ts/stats/statistical-tests/*.ts` |
| `stats-compare/` | 3 files | `packages/dataframe/ts/stats/stats.ts:476-541` |
| `stats-distributions/` | 17 files | `packages/dataframe/ts/stats/distributions/*.ts` |
| `string/` | 1 file | `packages/dataframe/ts/stats/strings/str.ts` |

### Phase 4: Update Index and Script
1. Update `packages/mcp/docs/index.ts` to import from new structure
2. Update `scripts/generate-markdown-docs.ts` to generate nested markdown structure

---

## Source Reference Table

| MCP Doc File | Source Implementation |
|-------------|----------------------|
| `dataframe/creation.ts` | `packages/dataframe/ts/dataframe/index.ts` |
| `dataframe/selection.ts` | `packages/dataframe/ts/verbs/select/*.ts` |
| `dataframe/joins.ts` | `packages/dataframe/ts/verbs/join/*.ts` |
| `stats/descriptive.ts` | `packages/dataframe/ts/stats/descriptive/**/*.ts` |
| `stats-tests/t-tests.ts` | `packages/dataframe/ts/stats/statistical-tests/t-test.ts` |
| `stats-tests/anova.ts` | `packages/dataframe/ts/stats/statistical-tests/anova.ts` |
| `stats-distributions/normal.ts` | `packages/dataframe/ts/stats/distributions/normal.ts` |
| `io/csv.ts` | `packages/dataframe/ts/io/read_csv.ts`, `write_csv.ts` |
| `io/arrow.ts` | `packages/arrow/read_arrow.ts`, `write_arrow.ts` |
| `io/parquet.ts` | `packages/parquet/read_parquet.ts`, `write_parquet.ts` |
| `shims/async.ts` | `packages/shims/async.ts` |
| `shims/fetch.ts` | `packages/shims/fetch.ts` |
| `shims/encryption.ts` | `packages/shims/encryption/*.ts` |
| `string/str.ts` | `packages/dataframe/ts/stats/strings/str.ts` |
| `llm/ai.ts` | `packages/ai/mod.ts` |

---

## Verification Checklist

After completing all tasks:

- [ ] All `.ts` files in `packages/mcp/docs/` compile without errors
- [ ] `packages/mcp/docs/index.ts` exports all docs correctly
- [ ] Running `deno run -A scripts/generate-markdown-docs.ts` generates all expected `.md` files
- [ ] Each generated `.md` file has content (not empty)
- [ ] `pnpm check` passes
- [ ] Commit with message: `docs: reorganize MCP docs into granular topic-based structure`
