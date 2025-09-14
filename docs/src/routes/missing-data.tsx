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
      description="How tidy-ts handles null and undefined values, including stats functions with remove_na option and data replacement strategies."
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
        title="Using remove_na Option"
        description="Ignore NA values in statistical calculations"
        explanation="Set remove_na: true to calculate statistics on only the valid (non-NA) values. This is useful when you want to analyze available data despite missing values."
        code={missingDataExamples.removeNaOption}
      />

      <CodeBlock
        title="Replace Missing Values"
        description="Replace NA values with defaults using replaceNA"
        explanation="Use replaceNA to replace missing values with specific defaults. This is useful for data cleaning and preparation before analysis."
        code={missingDataExamples.replaceNAWithDefaults}
      />
    </DocPageLayout>
  );
}
