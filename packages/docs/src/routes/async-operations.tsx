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
import { asyncOperationsExamples } from "./async-operations.examples.ts";

export const Route = createFileRoute("/async-operations" as any)({
  component: AsyncOperationsComponent,
});

function AsyncOperationsComponent() {
  return (
    <DocPageLayout
      title="Async Operations with Concurrency Control"
      description="Built-in support for asynchronous data transformations with concurrency control"
      currentPath="/async-operations"
    >
      <CodeBlock
        title="Async Mutate Operations"
        description="Add calculated columns using asynchronous functions"
        explanation="You can mix synchronous and asynchronous operations in the same mutate() call. Useful for API enrichment, data validation, and external service integration."
        code={asyncOperationsExamples.asyncMutateOperations}
      />

      <CodeBlock
        title="Concurrency Control"
        description="Control the number of concurrent async operations"
        explanation="Limit concurrent operations to prevent overwhelming external services or APIs. This example shows how to use the concurrency parameter."
        code={asyncOperationsExamples.concurrencyControl}
      />

      <CodeBlock
        title="Async Filtering"
        description="Filter rows based on asynchronous conditions"
        explanation="Async filtering is useful for scenarios where you need to validate data against external APIs, databases, or perform complex async calculations."
        code={asyncOperationsExamples.asyncFiltering}
      />

      <CodeBlock
        title="Async Aggregation"
        description="Handle asynchronous operations in group summaries"
        explanation="Group summaries can include async operations to enrich your data with external information while maintaining type safety."
        code={asyncOperationsExamples.asyncAggregation}
      />

      <CodeBlock
        title="Error Handling"
        description="Gracefully handle async operation failures"
        explanation="Async operations can fail, and tidy-ts provides error handling patterns for managing these scenarios in your data pipelines."
        code={asyncOperationsExamples.errorHandling}
      />

      <CodeBlock
        title="s.parallel() - Promise.all with Concurrency"
        description="Process multiple promises with concurrency control and retry logic"
        explanation="The s.parallel() function is an enhanced replacement for Promise.all that supports concurrency limits and retry logic. Pass functions instead of promises for full retry support."
        code={asyncOperationsExamples.parallelFunction}
      />

      <Card>
        <CardHeader>
          <CardTitle>Concurrency and Retries</CardTitle>
          <CardDescription>
            Tidy-ts includes concurrency control and retry mechanisms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <CodeBlock
              code={asyncOperationsExamples.concurrencyAndRetries}
            />
          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
