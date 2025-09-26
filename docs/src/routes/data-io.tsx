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
import { dataIoExamples } from "./data-io.examples.ts";

export const Route = createFileRoute("/data-io" as any)({
  component: DataIoComponent,
});

function DataIoComponent() {
  return (
    <DocPageLayout
      title="CSV, Parquet, and Arrow Reading with Zod Validation"
      description="Multi-format data import with schema validation and error handling"
      currentPath="/data-io"
    >

      <CodeBlock
        title="Reading CSV, Parquet, and Arrow with Schema Validation"
        description="Read data with Zod schema validation and error handling"
        explanation="Read CSV, Parquet, and Arrow files with Zod schema validation for strong typing. Zod schemas catch bad data at ingestion with configurable naValues and custom parsing."
        code={dataIoExamples.readingWithValidation}
      />

      <CodeBlock
        title="Writing CSV and Parquet"
        description="Export DataFrames to CSV and Parquet formats"
        explanation="You can also write to CSV and Parquet. Uses @std/csv for CSV operations and hyparquet/hyparquet-writer for Parquet (server-side only). No support for writing Arrow."
        code={dataIoExamples.writingData}
      />

      <Card>
        <CardHeader>
          <CardTitle>Schema Validation & Type Safety</CardTitle>
          <CardDescription>
            All data I/O operations support Zod schema validation to ensure data quality and type safety
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Schemas handle type conversion, validation rules, optional fields, and provide clear error messages when data doesn't match expectations. This catches malformed or missing data early in your pipeline.
          </p>
          <CodeBlock
            title="Schema Validation Examples"
            description="Data validation with Zod schemas"
            code={dataIoExamples.schemaValidation}
          />
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
