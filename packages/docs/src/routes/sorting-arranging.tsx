import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { sortingExamples } from "./sorting-arranging.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/sorting-arranging" as any)({
  component: SortingArrangingComponent,
});

function SortingArrangingComponent() {
  return (
    <DocPageLayout
      title="Sorting / Arranging Data"
      description="Sort your data to understand patterns, find extremes, and organize information for better analysis. tidy-ts provides flexible sorting with full type safety."
      currentPath="/sorting-arranging"
    >
      <CodeBlock
        id="basic-sorting"
        title="Basic Sorting"
        description="Sort by a single column in ascending or descending order"
        explanation="The arrange() function sorts your DataFrame by one or more columns. By default, sorting is ascending, but you can specify 'desc' for descending order."
        code={sortingExamples.basicSorting}
      />

      <CodeBlock
        id="multiple-column-sorting"
        title="Multiple Column Sorting"
        description="Sort by multiple columns with different orders"
        explanation="You can sort by multiple columns by passing an array. The DataFrame will be sorted by the first column, then by the second column within groups of equal values in the first column, and so on."
        code={sortingExamples.multiColumnSorting}
      />

      <CodeBlock
        id="sorting-with-calculated-values"
        title="Sorting with Calculated Values"
        description="Sort by values calculated from existing columns"
        explanation="You can sort by any column, including calculated ones. This is particularly useful for finding the highest or lowest values after performing transformations."
        code={sortingExamples.sortingWithCalculatedValues}
      />

      <CodeBlock
        id="finding-extremes"
        title="Finding Extremes"
        description="Common sorting patterns for finding top performers"
        explanation="Use sorting to find the highest or lowest values in your data, or the best performer in each group."
        code={sortingExamples.findingTopPerformers}
      />

      <CodeBlock
        id="categorical-sorting"
        title="Categorical Sorting"
        description="Sorting string and categorical data"
        explanation="Sort text data alphabetically or by custom order. Useful for organizing names, categories, or any text-based data."
        code={sortingExamples.stringSorting}
      />
    </DocPageLayout>
  );
}
