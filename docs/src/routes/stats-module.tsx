import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";
import { statsModuleExamples } from "./stats-module.examples.ts";

export const Route = createFileRoute("/stats-module" as any)({
  component: StatsModuleComponent,
});

function StatsModuleComponent() {
  return (
    <DocPageLayout
      title="Stats Module"
      description="Comprehensive statistical functions for data analysis. The stats module provides 80+ statistical functions including descriptive statistics, probability distributions, and statistical tests with full TypeScript support and optimized performance."
      currentPath="/stats-module"
    >
      <CodeBlock
        title="Basic Descriptive Statistics"
        description="Essential statistical measures for understanding your data"
        explanation="The stats module provides all the descriptive statistics you need for data analysis. All functions are fully typed and optimized for performance."
        code={statsModuleExamples.basicDescriptiveStats}
      />

      <CodeBlock
        title="Quantiles and Percentiles"
        description="Advanced statistical measures for data distribution analysis"
        explanation="Quantiles and percentiles help you understand the distribution of your data. They're essential for identifying outliers and understanding data spread."
        code={statsModuleExamples.quantilesAndPercentiles}
      />

      <CodeBlock
        title="Ranking and Ordering"
        description="Rank values and find unique elements"
        explanation="Ranking functions help you understand the relative position of values in your dataset. Dense ranking handles ties differently than regular ranking."
        code={statsModuleExamples.rankingFunctions}
      />

      <CodeBlock
        title="Cumulative Functions"
        description="Calculate running totals and cumulative statistics"
        explanation="Cumulative functions are essential for time series analysis and understanding how values accumulate over time or sequence."
        code={statsModuleExamples.cumulativeFunctions}
      />

      <CodeBlock
        title="Window Functions"
        description="Lag, lead, and other window operations"
        explanation="Window functions are crucial for time series analysis, allowing you to compare values with their neighbors and calculate changes over time."
        code={statsModuleExamples.mutateWithRanking}
      />

      <CodeBlock
        title="Correlation and Covariance"
        description="Measure relationships between variables"
        explanation="Correlation and covariance help you understand relationships between variables. They're essential for feature selection and understanding data dependencies."
        code={statsModuleExamples.cumulativeFunctions}
      />

      <CodeBlock
        title="Probability Distributions"
        description="Complete DPQR (Density, Probability, Quantile, Random) functions for 17 distributions"
        explanation="Access probability functions for normal, beta, gamma, chi-squared, t-distribution, F-distribution, and more. Each distribution provides density (d*), cumulative probability (p*), quantile (q*), and random generation (r*) functions."
        code={statsModuleExamples.distributionFunctions}
      />

      <CodeBlock
        title="Statistical Tests"
        description="Comprehensive hypothesis testing with t-tests, ANOVA, correlation tests, and more"
        explanation="Perform statistical hypothesis testing with full TypeScript support. All tests return detailed results including p-values, test statistics, confidence intervals, and more."
        code={statsModuleExamples.statisticalTests}
      />

      <CodeBlock
        title="Import Options"
        description="Flexible import patterns for different coding styles"
        explanation="Import as 'stats' for clarity or 's' for brevity. Both provide access to the same comprehensive statistical functionality."
        code={statsModuleExamples.importOptions}
      />

      <Card>
        <CardHeader>
          <CardTitle>Complete Stats Function Reference</CardTitle>
          <CardDescription>
            All 80+ statistical functions available in the stats module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-3">Descriptive Statistics</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.sum()</code> - Sum of values
                </li>
                <li>
                  • <code>s.mean()</code> - Arithmetic mean
                </li>
                <li>
                  • <code>s.median()</code> - Median value
                </li>
                <li>
                  • <code>s.mode()</code> - Most frequent value
                </li>
                <li>
                  • <code>s.stdev()</code> - Standard deviation
                </li>
                <li>
                  • <code>s.variance()</code> - Variance
                </li>
                <li>
                  • <code>s.min()</code> - Minimum value
                </li>
                <li>
                  • <code>s.max()</code> - Maximum value
                </li>
                <li>
                  • <code>s.range()</code> - Range (max - min)
                </li>
                <li>
                  • <code>s.product()</code> - Product of values
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Advanced Functions</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.quantile()</code> - Quantiles and percentiles
                </li>
                <li>
                  • <code>s.quartiles()</code> - Quartiles [Q25, Q50, Q75]
                </li>
                <li>
                  • <code>s.iqr()</code> - Interquartile range
                </li>
                <li>
                  • <code>s.percentileRank()</code> - Percentile rank
                </li>
                <li>
                  • <code>s.rank()</code> - Ranking values
                </li>
                <li>
                  • <code>s.denseRank()</code> - Dense ranking
                </li>
                <li>
                  • <code>s.unique()</code> - Unique values
                </li>
                <li>
                  • <code>s.uniqueCount()</code> - Count of unique values
                </li>
                <li>
                  • <code>s.corr()</code> - Correlation coefficient
                </li>
                <li>
                  • <code>s.covariance()</code> - Covariance
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Cumulative Functions</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.cumsum()</code> - Cumulative sum
                </li>
                <li>
                  • <code>s.cumprod()</code> - Cumulative product
                </li>
                <li>
                  • <code>s.cummin()</code> - Cumulative minimum
                </li>
                <li>
                  • <code>s.cummax()</code> - Cumulative maximum
                </li>
                <li>
                  • <code>s.cummean()</code> - Cumulative mean
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Window & Utility Functions</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.lag()</code> - Lag values
                </li>
                <li>
                  • <code>s.lead()</code> - Lead values
                </li>
                <li>
                  • <code>s.round()</code> - Round to decimal places
                </li>
                <li>
                  • <code>s.floor()</code> - Floor values
                </li>
                <li>
                  • <code>s.ceiling()</code> - Ceiling values
                </li>
                <li>
                  • <code>s.countValue()</code> - Count specific values
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Distribution Functions</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.dist.normal.density()</code> - Normal density
                </li>
                <li>
                  • <code>s.dist.normal.probability()</code> - Normal CDF
                </li>
                <li>
                  • <code>s.dist.normal.quantile()</code> - Normal quantiles
                </li>
                <li>
                  • <code>s.dist.normal.random()</code> - Normal random samples
                </li>
                <li>
                  • <code>s.dist.beta.density()</code> - Beta density
                </li>
                <li>
                  • <code>s.dist.beta.random()</code> - Beta random samples
                </li>
                <li>
                  • <code>s.dist.gamma.density()</code> - Gamma density
                </li>
                <li>
                  • <code>s.dist.binomial.random()</code> - Binomial random samples
                </li>
                <li>
                  • <em>...16 distributions × 4 functions each = 64 functions</em>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Statistical Tests</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.test.t.oneSample()</code> - One-sample t-test
                </li>
                <li>
                  • <code>s.test.t.independent()</code> - Two-sample t-test
                </li>
                <li>
                  • <code>s.test.anova.oneWay()</code> - One-way ANOVA
                </li>
                <li>
                  • <code>s.test.correlation.pearson()</code> - Pearson correlation test
                </li>
                <li>
                  • <code>s.test.nonparametric.mannWhitney()</code> - Mann-Whitney U test
                </li>
                <li>
                  • <code>s.test.categorical.chiSquare()</code> - Chi-square test
                </li>
                <li>
                  • <code>s.test.normality.shapiroWilk()</code> - Normality test
                </li>
                <li>
                  • <code>s.test.nonparametric.kruskalWallis()</code> - Kruskal-Wallis test
                </li>
                <li>
                  • <em>...8 categories with 20+ statistical tests</em>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
