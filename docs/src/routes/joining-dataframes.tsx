import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "../components/ui/code-block.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import { joiningExamples } from "./joining-dataframes.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute("/joining-dataframes" as any)({
  component: JoiningDataFramesComponent,
});

function JoiningDataFramesComponent() {
  return (
    <DocPageLayout
      title="Joining DataFrames"
      description="Combine data from multiple sources with different join types, multi-key support, and strong type safety. Learn how to merge datasets effectively."
      currentPath="/joining-dataframes"
    >
      <CodeBlock
        title="Basic Join Types"
        description="Understanding the four fundamental join types"
        explanation="Joining DataFrames lets you combine data from multiple sources. tidy-ts supports all standard join types with multi-key support and strong type safety."
        code={joiningExamples.innerJoin}
      />

      <CodeBlock
        title="Single Key Joins"
        description="Join DataFrames using a single column as the key"
        explanation="Single key joins are the most common type. Each join type preserves different combinations of records from the left and right DataFrames."
        code={joiningExamples.leftJoin}
      />

      <CodeBlock
        title="Multi-Key Joins"
        description="Join using multiple columns for complex relationships"
        explanation="Multi-key joins are great for complex data relationships where you need to match on multiple criteria. tidy-ts provides strong typing for all join scenarios."
        code={joiningExamples.multiKeyJoin}
      />

      <CodeBlock
        title="Different Column Names"
        description="Join DataFrames with different column names"
        explanation="Real-world data often has different column names for the same concept. tidy-ts allows you to specify different column names for left and right DataFrames."
        code={joiningExamples.differentColumnNames}
      />

      <CodeBlock
        title="Comprehensive Joins"
        description="Complex joins with suffixes and multiple keys"
        explanation="For complex data integration scenarios, you can use suffixes to distinguish between columns with the same name and join on multiple keys simultaneously."
        code={joiningExamples.differentColumnNames}
      />

      <Card>
        <CardHeader>
          <CardTitle>Join Type Rules</CardTitle>
          <CardDescription>
            Understanding how different join types affect your data structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Join Type Rules</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-medium">
                        Join Type
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-medium">
                        Result Type Pattern
                      </th>
                      <th className="border border-gray-300 dark:border-gray-600 p-3 text-left font-medium">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        Inner Join
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        L ∪ (R \ K)
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-sm">
                        All fields required - only matching records
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        Left Join
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        L ∪ (R \ K)?
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-sm">
                        Right non-key fields: T | undefined
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        Right Join
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        (L \ K)? ∪ R
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-sm">
                        Left non-key fields: T | undefined
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        Outer Join
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        (L \ K)? ∪ (R \ K)?
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-sm">
                        Both sides: T | undefined
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        Cross Join
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 font-mono text-sm">
                        L ∪ R
                      </td>
                      <td className="border border-gray-300 dark:border-gray-600 p-3 text-sm">
                        All fields required (Cartesian product)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <strong>Where:</strong>{" "}
                  L = Left DataFrame, R = Right DataFrame, K = Join keys
                </p>
                <p>
                  <strong>Note:</strong>{" "}
                  All joins use explicit undefined unions (T | undefined), never
                  optional properties (T?)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}
