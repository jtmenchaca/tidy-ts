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
      description="Statistical functions for data analysis. The stats module provides 25+ statistical functions with full TypeScript support and optimized performance."
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

      <Card>
        <CardHeader>
          <CardTitle>Complete Stats Function Reference</CardTitle>
          <CardDescription>
            All 25+ statistical functions available in the stats module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Descriptive Statistics</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>stats.sum()</code> - Sum of values
                </li>
                <li>
                  • <code>stats.mean()</code> - Arithmetic mean
                </li>
                <li>
                  • <code>stats.median()</code> - Median value
                </li>
                <li>
                  • <code>stats.mode()</code> - Most frequent value
                </li>
                <li>
                  • <code>stats.stdev()</code> - Standard deviation
                </li>
                <li>
                  • <code>stats.variance()</code> - Variance
                </li>
                <li>
                  • <code>stats.min()</code> - Minimum value
                </li>
                <li>
                  • <code>stats.max()</code> - Maximum value
                </li>
                <li>
                  • <code>stats.range()</code> - Range (max - min)
                </li>
                <li>
                  • <code>stats.product()</code> - Product of values
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Advanced Functions</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>stats.quantile()</code> - Quantiles and percentiles
                </li>
                <li>
                  • <code>stats.quartiles()</code> - Quartiles [Q25, Q50, Q75]
                </li>
                <li>
                  • <code>stats.iqr()</code> - Interquartile range
                </li>
                <li>
                  • <code>stats.percentileRank()</code> - Percentile rank
                </li>
                <li>
                  • <code>stats.rank()</code> - Ranking values
                </li>
                <li>
                  • <code>stats.denseRank()</code> - Dense ranking
                </li>
                <li>
                  • <code>stats.unique()</code> - Unique values
                </li>
                <li>
                  • <code>stats.uniqueCount()</code> - Count of unique values
                </li>
                <li>
                  • <code>stats.corr()</code> - Correlation coefficient
                </li>
                <li>
                  • <code>stats.covariance()</code> - Covariance
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Cumulative Functions</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>stats.cumsum()</code> - Cumulative sum
                </li>
                <li>
                  • <code>stats.cumprod()</code> - Cumulative product
                </li>
                <li>
                  • <code>stats.cummin()</code> - Cumulative minimum
                </li>
                <li>
                  • <code>stats.cummax()</code> - Cumulative maximum
                </li>
                <li>
                  • <code>stats.cummean()</code> - Cumulative mean
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Window & Utility Functions</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>stats.lag()</code> - Lag values
                </li>
                <li>
                  • <code>stats.lead()</code> - Lead values
                </li>
                <li>
                  • <code>stats.round()</code> - Round to decimal places
                </li>
                <li>
                  • <code>stats.floor()</code> - Floor values
                </li>
                <li>
                  • <code>stats.ceiling()</code> - Ceiling values
                </li>
                <li>
                  • <code>stats.countValue()</code> - Count specific values
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
