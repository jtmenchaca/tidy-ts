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
import { groupingExamples } from "./grouping-aggregation.examples.ts";

export const Route = createFileRoute("/grouping-aggregation" as any)({
  component: GroupingAggregationComponent,
});

function GroupingAggregationComponent() {
  return (
    <DocPageLayout
      title="Grouping and Aggregation"
      description="Group your data and calculate summary statistics. Learn how to split your data into categories and get useful insights."
      currentPath="/grouping-aggregation"
    >
      <CodeBlock
        title="Basic groupBy and summarize"
        description="Group data by one or more columns and calculate summary statistics"
        explanation="groupBy lets you split your data into categories, then calculate summary statistics for each group. Great for understanding patterns and differences across categories."
        code={groupingExamples.basicGroupBy}
      />

      <CodeBlock
        title="Multiple Column Grouping"
        description="Group by multiple columns for more detailed analysis"
        explanation="You can group by multiple columns to create more detailed breakdowns and see how different factors interact in your data."
        code={groupingExamples.multipleColumnGrouping}
      />

      <CodeBlock
        title="Complex Aggregation Patterns"
        description="Complex aggregation with conditional logic and custom calculations"
        explanation="You can create complex summary statistics with conditional logic, custom calculations, and derived metrics."
        code={groupingExamples.conditionalAggregation}
      />

      <CodeBlock
        title="Count Shorthand"
        description="Quick way to count rows by grouping columns"
        explanation="The count() method is a shorthand for groupBy(...columns).summarise({ n: g => g.nrows() }). It groups by the specified columns and returns counts in a new column 'n'."
        code={groupingExamples.countShorthand}
      />

      <Card>
        <CardHeader>
          <CardTitle>Common Aggregation Functions</CardTitle>
          <CardDescription>
            Essential functions for group summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Count and Size</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>group.nrows()</code> - Number of rows in group
                </li>
                <li>
                  • <code>group.length</code> - Same as nrows()
                </li>
                <li>
                  • <code>s.countValue()</code> - Count specific values
                </li>
                <li>
                  • <code>s.uniqueCount()</code> - Count unique values
                </li>
                <li>
                  • <code>df.count("col")</code> - Count by grouping columns
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Central Tendency</h4>
              <ul className="text-sm space-y-1">
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
                  • <code>s.quantile()</code> - Specific quantiles
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Spread and Variation</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.stdev()</code> - Standard deviation
                </li>
                <li>
                  • <code>s.variance()</code> - Variance
                </li>
                <li>
                  • <code>s.range()</code> - Range (max - min)
                </li>
                <li>
                  • <code>s.iqr()</code> - Interquartile range
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Extremes</h4>
              <ul className="text-sm space-y-1">
                <li>
                  • <code>s.min()</code> - Minimum value
                </li>
                <li>
                  • <code>s.max()</code> - Maximum value
                </li>
                <li>
                  • <code>s.first()</code> - First value
                </li>
                <li>
                  • <code>s.last()</code> - Last value
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
