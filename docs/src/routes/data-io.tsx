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
      description="Read and write data from various formats including CSV and Parquet files with full type safety and schema validation."
      currentPath="/data-io"
    >
      <CodeBlock
        title="Reading CSV Data"
        description="Load CSV data with automatic type conversion and validation using Zod schemas"
        explanation="The read_csv function automatically converts string data to appropriate types based on your Zod schema. This ensures type safety and catches data quality issues at import time."
        code={dataIoExamples.csvReading}
      />

      <CodeBlock
        title="Writing CSV Data"
        description="Export DataFrames to CSV format with proper formatting and chaining support"
        explanation="The writeCSV method handles proper CSV formatting including escaping special characters, handling null values, and maintaining data integrity. It returns the original DataFrame for chaining."
        code={dataIoExamples.csvWriting}
      />

      <CodeBlock
        title="Reading Parquet Files"
        description="Load Parquet files with column selection, row filtering, and type validation"
        explanation="Parquet files offer excellent compression and performance for large datasets. You can selectively read specific columns and row ranges to optimize memory usage and processing speed."
        code={dataIoExamples.parquetReading}
      />

      <CodeBlock
        title="Writing Parquet Files"
        description="Export DataFrames to Parquet format with automatic type detection and compression"
        explanation="Parquet format provides excellent compression and is ideal for analytical workloads. The writeParquet method automatically detects column types and handles various data types including dates and booleans."
        code={dataIoExamples.parquetWriting}
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

      <Card>
        <CardHeader>
          <CardTitle>Error Handling</CardTitle>
          <CardDescription>
            Robust error handling for data loading and validation failures
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Data I/O operations provide detailed error messages for schema validation
            failures, file access issues, and data format problems. This helps you
            quickly identify and fix data quality issues.
          </p>
          <CodeBlock
            code={dataIoExamples.errorHandling}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Optimization</CardTitle>
          <CardDescription>
            Tips and techniques for efficient data loading and processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Large Dataset Handling</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                For large datasets, use column selection and row filtering to minimize
                memory usage and processing time.
              </p>
              <CodeBlock
                code={dataIoExamples.performanceOptimization}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Transformation Pipeline</CardTitle>
          <CardDescription>
            Complete data processing workflows from loading to export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Combine data loading, transformation, and export operations into efficient
            pipelines. This example shows a complete workflow from raw data to
            processed analytics-ready datasets.
          </p>
          <CodeBlock
            code={dataIoExamples.dataTransformation}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Source Data Integration</CardTitle>
          <CardDescription>
            Combining data from multiple sources and formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Real-world data analysis often involves combining data from multiple sources.
            This example demonstrates loading data from different formats, joining
            datasets, and creating comprehensive analytics.
          </p>
          <CodeBlock
            code={dataIoExamples.integrationExample}
          />
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
