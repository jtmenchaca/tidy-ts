import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";
import { creatingExamples } from "./creating-dataframes.examples.ts";

export const Route = createFileRoute("/creating-dataframes" as any)({
  component: CreatingDataFramesComponent,
});

function CreatingDataFramesComponent() {
  return (
    <DocPageLayout
      title="Creating DataFrames"
      description="Learn the different ways to create DataFrames in tidy-ts, from simple arrays to CSV data with validation."
      currentPath="/creating-dataframes"
    >
      <CodeBlock
        title="1. Basic DataFrame Creation"
        description="Create DataFrames from arrays of objects - TypeScript infers types automatically"
        explanation="TypeScript automatically infers the exact types from your data structure. Each object in the array becomes a row, and the object keys become column names. No schema needed - just clean data!"
        code={creatingExamples.basicDataFrame}
      />

      <CodeBlock
        title="2. Basic DataFrame with Typed Array"
        description="Use explicit TypeScript types for better IntelliSense and type safety"
        explanation="Explicit types provide better IntelliSense, catch errors at compile time, and make your code more maintainable. TypeScript handles optional properties correctly and preserves the exact structure."
        code={creatingExamples.typedArrayDataFrame}
      />

      <CodeBlock
        title="3. Reading CSV Data with Zod Validation"
        description="Define your data structure explicitly - Zod handles type conversion and validation"
        explanation="With CSV data, you get full control over your data structure. Define exactly what types you expect, and Zod will convert strings to numbers, validate the data, and catch errors at import time."
        code={creatingExamples.csvWithValidation}
      />
    </DocPageLayout>
  );
}
