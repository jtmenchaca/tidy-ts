import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { combiningExamples } from "./combining-dataframes.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/combining-dataframes" as any)({
  component: CombiningDataFramesComponent,
});

function CombiningDataFramesComponent() {
  return (
    <DocPageLayout
      title="Combining DataFrames"
      description="Combine data from multiple sources with bindRows and other combining operations. Learn how to merge datasets effectively."
      currentPath="/combining-dataframes"
    >
      <CodeBlock
        title="Basic bindRows"
        description="Combine two DataFrames by stacking rows"
        explanation="bindRows is the main way to combine DataFrames by adding rows from one DataFrame to another. It's great for combining datasets with the same structure."
        code={combiningExamples.basicBindRows}
      />

      <CodeBlock
        title="Multiple DataFrames"
        description="Combine multiple DataFrames at once"
        explanation="You can combine multiple DataFrames in a single bindRows call. This is more efficient than chaining multiple bindRows operations."
        code={combiningExamples.multipleDataFrames}
      />

      <CodeBlock
        title="Different Columns"
        description="Handle DataFrames with different column structures"
        explanation="bindRows gracefully handles DataFrames with different columns. It creates a union of all columns, filling missing values with undefined where needed."
        code={combiningExamples.differentColumns}
      />

      <CodeBlock
        title="Spread Operator"
        description="Alternative approach using spread operator"
        explanation="You can also use the traditional spread operator to combine DataFrames, though bindRows is generally preferred for its clarity and type safety."
        code={combiningExamples.spreadOperator}
      />

    </DocPageLayout>
  );
}
