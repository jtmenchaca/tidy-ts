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
      title="Statistical Analysis"
      description="Tidy-TS provides a statistical toolkit with 80+ functions across descriptive stats, hypothesis testing, and probability distributions."
      currentPath="/stats-module"
    >
      <Card>
        <CardHeader>
          <CardTitle>Descriptive Statistics</CardTitle>
          <CardDescription>
            Comprehensive descriptive statistics functions for data analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CodeBlock
              title="Basic Descriptive Statistics"
              description="Essential statistical measures for understanding your data"
              explanation="The stats module provides all the descriptive statistics you need: mean(), median(), mode(), stdev(), variance(), min(), max(), range()"
              code={statsModuleExamples.basicDescriptiveStats}
            />
            <CodeBlock
              title="Quantiles and Percentiles"
              description="Statistical measures for data distribution analysis"
              explanation="Quantile and ranking functions: quantile(), percentileRank(), iqr(), quartiles(), rank(), denseRank(), percentileRank()"
              code={statsModuleExamples.quantilesAndPercentiles}
            />
            <CodeBlock
              title="Cumulative Functions"
              description="Calculate running totals and cumulative statistics"
              explanation="Cumulative operations for time series: cumsum(), cummean(), cummin(), cummax(), cumprod()"
              code={statsModuleExamples.cumulativeFunctions}
            />
            <CodeBlock
              title="Window Functions"
              description="Lag, lead, and other window operations"
              explanation="Window functions for time series analysis: lag(), lead()"
              code={statsModuleExamples.mutateWithRanking}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Probability Distributions</CardTitle>
          <CardDescription>
            The library provides 16 probability distributions, each with functions for random values, density, probability, quantile, and data generation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>Continuous distributions:</strong> normal, beta, gamma, exponential, chi-square, t, F, uniform, Weibull, log-normal, and Wilcoxon<br />
              <strong>Discrete distributions:</strong> binomial, Poisson, geometric, negative binomial, and hypergeometric.
            </p>
            <CodeBlock
              title="Probability Distribution Functions"
              description="Individual distribution functions for statistical analysis"
              explanation="Each distribution provides random(), density(), probability(), and quantile() functions. You can also generate distribution data for visualization."
              code={statsModuleExamples.distributionFunctions}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hypothesis Testing</CardTitle>
          <CardDescription>
            The library provides many of the commonly needed statistical tests for routine analytics. These can at times be challenging to navigate for those who are new to statistics, so the library also provides a custom-designed comparison API designed to help you perform the analysis best suited to your needs. In either approach, you'll receive a neatly typed test result at the end.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CodeBlock
              title="Compare API - Intuitive Statistical Comparisons"
              description="Custom-designed API to help you perform the analysis best suited to your needs"
              explanation="All tests available are rigorously vetted against results in R using testing against randomly generated data. The Compare API guides you to the right statistical test with descriptive function names and helpful options."
              code={statsModuleExamples.compareAPI}
            />
            <CodeBlock
              title="Available Compare API Functions"
              description="Complete reference of comparison functions available"
              explanation="Each function has various options to help both new and experienced users feel confident in what they're getting."
              code={statsModuleExamples.compareAPIReference}
            />
            <CodeBlock
              title="Specific Test API"
              description="Direct access to specific statistical tests if you prefer"
              explanation="If you'd prefer to have the specific test instead, we provide that via the test API as well. All tests return detailed, typed results."
              code={statsModuleExamples.specificTests}
            />
          </div>
        </CardContent>
      </Card>

      <CodeBlock
        title="Import Options"
        description="Flexible import patterns for different coding styles"
        explanation="Import as 'stats' for clarity or 's' for brevity. Both provide access to the same statistical functionality."
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
              <h4 className="font-medium mb-3">Statistical Functions</h4>
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
