import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import { missingDataExamples } from "./missing-data.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/missing-data" as any)({
  component: MissingDataComponent,
});

function MissingDataComponent() {
  return (
    <DocPageLayout
      title="Missing Data Handling"
      description="Handle null and undefined with replaceNull/replaceUndefined (replace with defaults) or removeNull/removeUndefined (drop rows with type inference). Stats options and examples included."
      currentPath="/missing-data"
    >
      <CodeBlock
        title="Null and Undefined Support"
        description="tidy-ts naturally supports null and undefined values"
        explanation="DataFrames can contain null and undefined values in any column. These are treated as missing data (NA) and handled appropriately by all operations."
        code={missingDataExamples.nullUndefinedSupport}
      />

      <CodeBlock
        title="Stats Functions Default Behavior"
        description="Statistical functions return null when NA values are present"
        explanation="By default, statistical functions like sum, mean, max, etc. return null when any NA values are present in the data. This preserves data integrity."
        code={missingDataExamples.statsDefaultBehavior}
      />

      <CodeBlock
        title="Using removeNull / removeUndefined Options"
        description="Ignore NA values in statistical calculations"
        explanation="Pass { removeNull: true, removeUndefined: true } to calculate statistics on only the valid (non-NA) values. This is useful when you want to analyze available data despite missing values."
        code={missingDataExamples.removeNaOption}
      />

      <CodeBlock
        title="Replace Missing Values"
        description="Replace null and undefined with defaults using replaceNull and replaceUndefined"
        explanation="Chain replaceNull and replaceUndefined to replace missing values with specific defaults. Use replaceNull for null and replaceUndefined for undefined; chaining both covers all NA values."
        code={missingDataExamples.replaceWithDefaults}
      />

      <CodeBlock
        title="Drop Rows with Missing Values (Type-Safe)"
        description="Use removeNull and removeUndefined to drop rows and narrow types"
        explanation="removeNull and removeUndefined drop rows where the given fields are null or undefined and automatically narrow the TypeScript type. filter() alone cannot narrow types, so downstream code (e.g. stats) gets correct inference (e.g. number instead of number | null)."
        code={missingDataExamples.dropRowsTypeSafe}
      />
    </DocPageLayout>
  );
}
