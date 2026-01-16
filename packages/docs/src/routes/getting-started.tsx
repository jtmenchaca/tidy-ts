import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { TabbedCodeBlock } from "../components/ui/tabbed-code-block.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";
import { gettingStartedExamples } from "./getting-started.examples.ts";

export const Route = createFileRoute("/getting-started" as any)({
  component: TidyDataGettingStartedComponent,
});

function TidyDataGettingStartedComponent() {
  return (
    <DocPageLayout
      title="Getting Started"
      description="Type-safe data analytics and statistics framework for TypeScript. Built for modern data science workflows with compile-time safety."
      currentPath="/getting-started"
    >
      <Card>
        <CardHeader>
          <CardTitle>Installation</CardTitle>
          <CardDescription>
            Choose your package manager to get started with Tidy-TS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabbedCodeBlock
            tabs={[
              {
                label: "deno",
                code: gettingStartedExamples.installationJSR.deno,
              },
              {
                label: "npm",
                code: gettingStartedExamples.installationLegacy.npm,
              },
              {
                label: "yarn", 
                code: gettingStartedExamples.installationJSR.yarn,
              },
              {
                label: "pnpm",
                code: gettingStartedExamples.installationJSR.pnpm,
              },
              {
                label: "bun",
                code: gettingStartedExamples.installationLegacy.bun,
              },
            ]}
            defaultTab="deno"
          />
        </CardContent>
      </Card>

      <CodeBlock
        title="Import and Use"
        description="Import the library and start working with DataFrames"
        code={gettingStartedExamples.importStatement}
      />

      <CodeBlock
        title="Complete Data Analysis Workflow"
        description="A complete example showing type-safe data transformations with Tidy-TS"
        explanation="This example demonstrates creating DataFrames, adding calculated columns with full type safety, grouping data, and performing aggregations. Notice how the 'row' parameter provides typed access to columns without casting, and how you can access the entire DataFrame for calculations."
        code={gettingStartedExamples.quickTutorial}
      />

      <CodeBlock
        title="DataFrame Creation"
        description="Create DataFrames from rows or columns with automatic type inference"
        explanation="DataFrames can be created from arrays of objects (rows) or from column objects. TypeScript automatically infers column types and provides full type safety throughout your data pipeline."
        code={gettingStartedExamples.creatingDataFrames}
      />

      <CodeBlock
        title="Adding Columns with mutate()"
        description="Transform data by adding calculated columns with full type safety"
        explanation="Each key becomes a new column name. Functions receive (row, index, dataframe) parameters with full typing - no casting needed. Access typed row properties, current index, or the entire DataFrame for calculations."
        code={gettingStartedExamples.addingColumnsWithMutate}
      />

      <Card>
        <CardHeader>
          <CardTitle>DataFrame Properties</CardTitle>
          <CardDescription>
            DataFrames have array-like properties and methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <CodeBlock
              title="Length and Indexing"
              description="Access DataFrame properties like arrays"
              code={gettingStartedExamples.dataframeProperties}
            />
            <CodeBlock
              title="Column Access"
              description="Access entire columns as typed arrays"
              code={gettingStartedExamples.columnAccess}
            />
          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
