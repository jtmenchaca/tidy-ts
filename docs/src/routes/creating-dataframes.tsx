import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";
import { creatingExamples } from "./creating-dataframes.examples.ts";

export const Route = createFileRoute("/creating-dataframes" as any)({
  component: CreatingDataFramesComponent,
});

function CreatingDataFramesComponent() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <DocPageLayout
      title="Creating DataFrames"
      description="Learn the different ways to create DataFrames in tidy-ts, from simple arrays to CSV data with validation."
      currentPath="/creating-dataframes"
    >
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Contents</h2>
        <nav className="space-y-1">
          <button 
            onClick={() => scrollToSection('basic-dataframe')} 
            className="block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer"
          >
            1. Directly from arrays
          </button>
          <button 
            onClick={() => scrollToSection('raw-sqlite')} 
            className="block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer"
          >
            2. From a SQL query with Zod
          </button>
          <button 
            onClick={() => scrollToSection('drizzle-orm')} 
            className="block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer"
          >
            3. From a Drizzle ORM query
          </button>
          <button 
            onClick={() => scrollToSection('csv-validation')} 
            className="block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer"
          >
            4. CSV file with Zod
          </button>
          <button 
            onClick={() => scrollToSection('parquet-reading')} 
            className="block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer"
          >
            5. Parquet with Zod
          </button>
          <button 
            onClick={() => scrollToSection('arrow-reading')} 
            className="block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer"
          >
            6. Arrow with Zod
          </button>
          <button 
            onClick={() => scrollToSection('writing-data')} 
            className="block text-left text-blue-600 hover:text-blue-800 hover:underline w-full cursor-pointer"
          >
            7. Writing CSV and Parquet files
          </button>
        </nav>
      </div>
      <CodeBlock
        id="basic-dataframe"
        title="1. Basic DataFrame Creation"
        description="Create DataFrames from arrays of objects - TypeScript infers types automatically"
        explanation="TypeScript automatically infers the exact types from your data structure. Each object in the array becomes a row, and the object keys become column names. No schema needed - just clean data!"
        code={creatingExamples.basicDataFrame}
      />

      <CodeBlock
        id="raw-sqlite"
        title="2. SQL"
        description="Query databases with raw SQL and create DataFrames with Zod schema validation"
        explanation="You can use any SQL database. Zod schemas provide type safety for query results, ensuring data integrity when creating DataFrames."
        code={creatingExamples.rawSqlite}
      />

      <CodeBlock
        id="drizzle-orm"
        title="3. Drizzle ORM"
        description="Use Drizzle ORM for type-safe database queries with automatic DataFrame type inference"
        explanation="Drizzle provides excellent TypeScript integration. When you create DataFrames from Drizzle results, types are automatically inferred from your schema definitions."
        code={creatingExamples.drizzleOrm}
      />

      <CodeBlock
        id="csv-validation"
        title="4. CSV Data with Zod"
        description="Define your data structure explicitly - Zod handles type conversion and validation"
        explanation="With CSV data, you get full control over your data structure. Define exactly what types you expect, and Zod will convert strings to numbers, validate the data, and catch errors at import time."
        code={creatingExamples.csvWithValidation}
      />

      <CodeBlock
        id="parquet-reading"
        title="5. Parquet Files with Zod"
        description="Load Parquet files with schema validation"
        explanation="Use Zod schemas to ensure type safety when reading Parquet files."
        code={creatingExamples.parquetReading}
      />

      <CodeBlock
        id="arrow-reading"
        title="6. Arrow Data with Zod"
        description="Read Arrow format data with schema validation"
        explanation="Arrow is a columnar data format. Use Zod schemas for type safety when reading Arrow files."
        code={creatingExamples.arrowReading}
      />

      <CodeBlock
        id="writing-data"
        title="7. Writing CSV and Parquet Files"
        description="Export DataFrames to CSV and Parquet formats"
        explanation="Save your processed data in standard formats."
        code={creatingExamples.csvWriting}
      />
    </DocPageLayout>
  );
}
