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
import { transformingExamples } from "./transforming-data.examples.ts";
import { StatsModuleReference } from "../components/StatsModuleReference.tsx";

export const Route = createFileRoute("/transforming-data" as any)({
  component: TransformingDataComponent,
});

function TransformingDataComponent() {
  return (
    <DocPageLayout
      title="Transforming Data with mutate()"
      description="The mutate() function is your primary tool for adding calculated columns and transforming data. Learn everything from basic calculations to async operations."
      currentPath="/transforming-data"
    >

          <CodeBlock
            title="Basic Mutate"
            description="Let's start with the simplest case: adding one calculated column"
            explanation="The mutate() function adds new columns to your DataFrame. Each key becomes a column name, and the value is a function that uses the current row."
            code={transformingExamples.basicMutate}
          />

          <CodeBlock
            title="More than just the current row"
            description="You're not just limited to the current row. You can also use the index (i.e. row number) and the entire DataFrame to help you calculate the new column."
            explanation="row: Current row's data • index: Row position (0-based) • df: Entire DataFrame"
            code={transformingExamples.mutateWithParameters}
          />

          <CodeBlock
            title="Chaining Mutate Operations"
            description="Different approaches for handling dependent calculations"
            code={transformingExamples.chainingMutate}
          />

          <CodeBlock
            title="Using Stats Functions"
            description="Leverage the stats module for calculations"
            explanation="The stats module provides 25+ statistical functions including mean, median, standard deviation, quantiles, ranking, and more. All functions are fully typed and optimized for performance."
            code={transformingExamples.usingStatsFunctions}
          />

          <Card>
            <CardHeader>
              <CardTitle>Async Operations</CardTitle>
              <CardDescription>
                Handle asynchronous operations with full type safety
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                tidy-ts supports asynchronous operations across all functions
                including mutate(), filter(), groupBy().summarise(), and more.
                Async operations are automatically handled with proper
                concurrency control and retry mechanisms.
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                📖 <strong>Learn more:</strong> See the{" "}
                <a
                  href="async-operations"
                  className="underline hover:no-underline"
                >
                  Async Operations
                </a>{" "}
                page for examples and patterns.
              </p>
            </CardContent>
          </Card>

          <StatsModuleReference />
    </DocPageLayout>
  );
}
