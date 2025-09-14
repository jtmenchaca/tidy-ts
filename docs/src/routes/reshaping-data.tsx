import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { reshapingExamples } from "./reshaping-data.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/reshaping-data" as any)({
  component: ReshapingDataComponent,
});

function ReshapingDataComponent() {
  return (
    <DocPageLayout
      title="Reshaping Data"
      description="Transform your data between long and wide formats with pivot operations and transpose data for different analysis needs. Learn how to reshape data effectively."
      currentPath="/reshaping-data"
    >
      <CodeBlock
        title="Pivot Wider (Long to Wide)"
        description="Convert long format data to wide format with products as columns"
        explanation="pivotWider transforms long format data to wide format, making it easier to compare values across categories and prepare data for analysis or visualization."
        code={reshapingExamples.pivotWider}
      />

      <CodeBlock
        title="Pivot Longer (Wide to Long)"
        description="Convert wide format data to long format for analysis"
        explanation="pivotLonger (also called 'melting') converts wide format data to long format, which is often required for statistical analysis and visualization libraries."
        code={reshapingExamples.pivotLonger}
      />

      <CodeBlock
        title="Basic Transpose"
        description="Flip rows and columns for different analysis perspectives"
        explanation="Transpose operations flip rows and columns, making it easy to reshape data for different analysis needs. tidy-ts provides reversible transposes with strong type preservation."
        code={reshapingExamples.pivotWider}
      />

      <CodeBlock
        title="Transpose with Custom Labels"
        description="Use meaningful row labels instead of generic names"
        explanation="You can provide custom row labels to make transposed data more meaningful and easier to work with in subsequent operations."
        code={reshapingExamples.pivotLonger}
      />

      <CodeBlock
        title="Double Transpose (Round-trip)"
        description="Transpose operations are perfectly reversible"
        explanation="Transpose operations are reversible with perfect data integrity. You can transpose data, perform analysis, and transpose back to the original structure."
        code={reshapingExamples.complexReshape}
      />
    </DocPageLayout>
  );
}
