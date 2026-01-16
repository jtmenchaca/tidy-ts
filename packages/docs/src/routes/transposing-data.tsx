import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { transposingExamples } from "./transposing-data.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/transposing-data" as any)({
  component: TransposingDataComponent,
});

function TransposingDataComponent() {
  return (
    <DocPageLayout
      title="Transposing Data"
      description="Flip rows and columns to change your data perspective. Perfect for time series analysis, visualization, and preparing data for different analysis tools."
      currentPath="/transposing-data"
    >
      <CodeBlock
        title="Basic Transpose"
        description="Flip rows and columns with a simple transpose operation"
        explanation="Transpose operations flip rows and columns, making it easy to reshape data for different analysis needs. tidy-ts provides reversible transposes with strong type preservation."
        code={transposingExamples.basicTranspose}
      />

      <CodeBlock
        title="Custom Row Labels"
        description="Use meaningful row labels instead of generic names"
        explanation="You can provide custom row labels to make transposed data more meaningful and easier to work with in subsequent operations. This is especially useful for time series data."
        code={transposingExamples.transposeWithLabels}
      />

      <CodeBlock
        title="Double Transpose (Round-trip)"
        description="Transpose operations are perfectly reversible"
        explanation="Transpose operations are reversible with perfect data integrity. You can transpose data, perform analysis, and transpose back to the original structure without any data loss."
        code={transposingExamples.doubleTranspose}
      />


      <CodeBlock
        title="Mixed Data Types"
        description="Transpose works with any data types including arrays and objects"
        explanation="Transpose operations work with any data types including strings, numbers, booleans, and even complex types like arrays and objects. All types are preserved perfectly."
        code={transposingExamples.mixedDataTypes}
      />


    </DocPageLayout>
  );
}
