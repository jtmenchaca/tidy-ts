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
import { filteringExamples } from "./filtering-rows.examples.ts";
import FilterVideo from "../assets/filter.webm";
export const Route = createFileRoute("/filtering-rows" as any)({
  component: FilteringRowsComponent,
});

function FilteringRowsComponent() {
  return (
    <DocPageLayout
      title="Filtering Rows"
      description="Filtering lets you work with subsets of your data based on specific conditions. Learn both synchronous and asynchronous filtering patterns."
      currentPath="/filtering-rows"
    >
      <CodeBlock
        title="Basic Filtering"
        description="Filter rows based on simple conditions"
        explanation="The filter() function creates a new DataFrame containing only rows that match your condition. You can use any combination of column values and logical operators."
        code={filteringExamples.basicFiltering}
      />

      <div className="my-8">
        <video
          src={FilterVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full max-w-xl mx-auto h-auto"
          style={{ 
            // mixBlendMode: 'multiply', // Commented out for Safari compatibility
          }}
          onLoadedData={(e) => {
            e.currentTarget.playbackRate = 0.5;
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      <CodeBlock
        title="Using (row, index, df) Parameters in Filter"
        description="Learn how to use all three parameters available in filter functions"
        explanation="row: Current row's data • index: Row position (0-based) • df: Entire DataFrame"
        code={filteringExamples.filterWithParameters}
      />

      <CodeBlock
        title="Complex Filtering Conditions"
        description="Use complex logic for filtering scenarios"
        explanation="You can combine multiple conditions using logical operators (&&, ||, !) and even filter based on calculated values from previous transformations."
        code={filteringExamples.filterWithCalculations}
      />

      <Card>
        <CardHeader>
          <CardTitle>Async Filtering</CardTitle>
          <CardDescription>
            Handle asynchronous operations in your filter conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Filter functions support async operations for validating data
            against external APIs, databases, or performing complex async
            calculations. All async operations are automatically handled with
            proper concurrency control.
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            📖 <strong>Learn more:</strong> See the{" "}
            <a
              href="/async-operations"
              className="underline hover:no-underline"
            >
              Async Operations
            </a>{" "}
            page for async filtering examples and patterns.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filtering Patterns</CardTitle>
          <CardDescription>
            Common filtering patterns and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Range Filtering</h4>
              <CodeBlock
                code={filteringExamples.chainedFiltering}
              />
            </div>

            <div>
              <h4 className="font-medium mb-2">
                Null and Missing Value Filtering
              </h4>
              <CodeBlock
                code={filteringExamples.basicFiltering}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Considerations</CardTitle>
          <CardDescription>
            Tips for efficient filtering operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Chaining Filters</h4>
              <CodeBlock
                code={filteringExamples.chainedFiltering}
              />
            </div>

          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
