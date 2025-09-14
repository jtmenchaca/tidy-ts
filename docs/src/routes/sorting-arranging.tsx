import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import { sortingExamples } from "./sorting-arranging.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/sorting-arranging" as any)({
  component: SortingArrangingComponent,
});

function SortingArrangingComponent() {
  return (
    <DocPageLayout
      title="Sorting and Arranging Data"
      description="Sort your data to understand patterns, find extremes, and organize information for better analysis. tidy-ts provides flexible sorting with full type safety."
      currentPath="/sorting-arranging"
    >
      <CodeBlock
        title="Basic Sorting"
        description="Sort by a single column in ascending or descending order"
        explanation="The arrange() function sorts your DataFrame by one or more columns. By default, sorting is ascending, but you can specify 'desc' for descending order."
        code={sortingExamples.basicSorting}
      />

      <CodeBlock
        title="Multiple Column Sorting"
        description="Sort by multiple columns with different orders"
        explanation="You can sort by multiple columns by passing an array. The DataFrame will be sorted by the first column, then by the second column within groups of equal values in the first column, and so on."
        code={sortingExamples.multiColumnSorting}
      />

      <CodeBlock
        title="Sorting with Calculated Values"
        description="Sort by values calculated from existing columns"
        explanation="You can sort by any column, including calculated ones. This is particularly useful for finding the highest or lowest values after performing transformations."
        code={sortingExamples.sortingWithCalculatedValues}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sorting Patterns</CardTitle>
          <CardDescription>
            Common sorting patterns and use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Finding Extremes</h4>
              <CodeBlock code={sortingExamples.findingTopPerformers} />
            </div>

            <div>
              <h4 className="font-medium mb-2">Categorical Sorting</h4>
              <CodeBlock code={sortingExamples.stringSorting} />
            </div>
          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
