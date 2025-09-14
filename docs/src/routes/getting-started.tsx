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
      description="Get up and running with Tidy-TS in minutes. Learn installation, basic concepts, and start working with DataFrames right away."
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
        title="Complete Data Analysis Example"
        description="A real-world example showing the power of Tidy-TS"
        explanation="This example demonstrates a complete data analysis workflow from data creation through transformation, grouping, and summarization - all in just a few lines of code."
        code={gettingStartedExamples.quickTutorial}
      />

      <CodeBlock
        title="Creating DataFrames from Arrays"
        description="Simple DataFrame creation with automatic type inference"
        explanation="DataFrames are created from arrays of objects, where each object represents a row and the object keys become column names. TypeScript infers types automatically."
        code={gettingStartedExamples.creatingDataFrames}
      />

      <CodeBlock
        title="Adding Columns with mutate()"
        description="Transform data by adding calculated columns"
        explanation="Each key in the object becomes a new column name. The value can be a function that receives: (row, index, dataframe)."
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
