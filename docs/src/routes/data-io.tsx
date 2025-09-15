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
      title="Data I/O Operations"
      description="Read and write data from various formats including CSV, Parquet, and Arrow files with full type safety and schema validation."
      currentPath="/data-io"
    >

      <CodeBlock
        title="1. Reading CSV Data"
        description="Load CSV data with automatic type conversion and validation"
        explanation="The read_csv function automatically converts string data to appropriate types based on your Zod schema. This ensures type safety and catches data quality issues at import time."
        code={dataIoExamples.csvReading}
      />

      <CodeBlock
        title="2. Writing CSV Data"
        description="Export DataFrames to CSV format with proper formatting"
        explanation="The writeCSV function handles proper CSV formatting including escaping special characters, handling null values, and maintaining data integrity. Works in both Node.js and browser environments."
        code={dataIoExamples.csvWriting}
      />

      <CodeBlock
        title="3. Reading Parquet Files"
        description="Load Parquet files with column selection and row filtering"
        explanation="Parquet files offer excellent compression and performance for large datasets. You can selectively read specific columns and row ranges to optimize memory usage and processing speed."
        code={dataIoExamples.parquetReading}
      />

      <CodeBlock
        title="4. Writing Parquet Files"
        description="Export DataFrames to Parquet format with automatic type detection"
        explanation="Parquet format provides excellent compression and is ideal for analytical workloads. The writeParquet function automatically detects column types and handles various data types including dates and booleans."
        code={dataIoExamples.parquetWriting}
      />

      <CodeBlock
        title="5. Reading Arrow Data"
        description="Load Arrow format data with advanced type conversion options"
        explanation="Arrow format provides high-performance columnar data interchange. It supports advanced features like automatic date conversion, BigInt handling, and efficient memory usage for large datasets."
        code={dataIoExamples.arrowReading}
      />

      <Card>
        <CardHeader>
          <CardTitle>Schema Validation & Type Safety</CardTitle>
          <CardDescription>
            Comprehensive data validation using Zod schemas for robust data pipelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            All data I/O operations support Zod schema validation to ensure data quality
            and type safety. Schemas handle type conversion, validation rules, optional
            fields, and provide clear error messages when data doesn't match expectations.
          </p>
          <CodeBlock
            code={dataIoExamples.schemaValidation}
          />
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
