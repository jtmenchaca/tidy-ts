import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { selectingExamples } from "./selecting-columns.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/selecting-columns" as any)({
  component: SelectingColumnsComponent,
});

function SelectingColumnsComponent() {
  return (
    <DocPageLayout
      title="Selecting and Dropping Columns"
      description="Choose exactly which columns you need for your analysis. Essential for data preparation, performance optimization, and creating clean datasets."
      currentPath="/selecting-columns"
    >
      <CodeBlock
        title="Select Specific Columns"
        description="Choose exactly which columns you need"
        explanation="The most common operation is selecting specific columns from your DataFrame. This is essential for focusing your analysis and improving performance."
        code={selectingExamples.selectSpecificColumns}
      />

      <CodeBlock
        title="Drop Specific Columns"
        description="Remove unwanted columns from your DataFrame"
        explanation="Sometimes it's easier to specify which columns to remove rather than which to keep, especially when you have many columns."
        code={selectingExamples.dropSpecificColumns}
      />

      <CodeBlock
        title="Access Individual Columns"
        description="Get entire columns as arrays"
        explanation="You can access entire columns as typed arrays, which is useful for further analysis or passing data to other functions."
        code={selectingExamples.accessIndividualColumns}
      />

      <CodeBlock
        title="Extract Specific Values"
        description="Get specific values from columns"
        explanation="Extract methods provide flexible ways to get specific values from columns, such as the first value, last value, or random samples."
        code={selectingExamples.extractSpecificValues}
      />

    </DocPageLayout>
  );
}
