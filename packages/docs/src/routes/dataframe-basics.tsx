import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";
import { dataframeBasicsExamples } from "./dataframe-basics.examples.ts";

export const Route = createFileRoute("/dataframe-basics" as any)({
  component: DataFrameBasicsComponent,
});

function DataFrameBasicsComponent() {
  return (
    <DocPageLayout
      title="DataFrame Basics"
      description="DataFrame properties, column access, and TypeScript integration. Learn the fundamentals before diving into data operations."
      currentPath="/dataframe-basics"
    >
      <CodeBlock
        title="1. DataFrame Properties"
        description="Get fundamental information about your DataFrame structure"
        explanation="You can check basic properties like row count, column names, and print the entire DataFrame to see your data in a clean table format."
        code={dataframeBasicsExamples.dataframeProperties}
      />

      <CodeBlock
        title="2. Basic Column Access"
        description="Access entire columns as typed arrays"
        explanation="The easiest way to access the raw data from any column is using dot notation.  This returns a readonly array (to prevent accidental DataFrame mutations) and can be used with any JavaScript array method."
        code={dataframeBasicsExamples.basicColumnAccess}
      />

      <CodeBlock
        title="3. Extract Methods"
        description="The extract(), extractHead(), extractTail(), extractNth(), or extractSample() methods give an easy, chainable way to get mutable data out of a DataFrame.  These values are copies and won't have any effect on the original DataFrame."
        code={dataframeBasicsExamples.extractMethods}
      />

      <CodeBlock
        title="4. toString() Method"
        description="Get a string representation of your DataFrame for logging or custom output"
        explanation="The toString() method returns the same formatted table output as print(), but as a string instead of printing directly to the console. Useful for file logging, custom formatting, or debugging."
        code={dataframeBasicsExamples.toStringMethod}
      />
    </DocPageLayout>
  );
}
