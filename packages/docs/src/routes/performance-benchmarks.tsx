import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.tsx";
import { Alert, AlertDescription } from "../components/ui/alert.tsx";
import { performanceBenchmarksExamples } from "./performance-benchmarks.examples.ts";
import { DocPageLayout } from "../components/layout/DocPageLayout.tsx";

export const Route = createFileRoute(
  "/performance-benchmarks" as any,
)({
  component: PerformanceBenchmarksComponent,
});

function PerformanceBenchmarksComponent() {
  return (
    <DocPageLayout
      title="Performance Benchmarks"
      description="Real-world performance comparisons between tidy-ts and other data manipulation libraries. See how tidy-ts performs across different operations and dataset sizes."
      currentPath="/performance-benchmarks"
    >
      {/* Performance Explanation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Rust + WASM:</strong> tidy-ts achieves near-native performance through Rust's zero-cost abstractions and WASM's direct memory access, often performing within 2-3x of native libraries while maintaining TypeScript's developer experience.
        </p>
      </div>

      {/* 500K Rows Benchmark Table */}
      <Card>
        <CardHeader>
          <CardTitle>500K Rows Benchmark</CardTitle>
          <CardDescription>
            Performance comparison across core operations (median of 7 runs with 5 warmups, ms)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-800">
                  <th className="text-left p-3 font-medium"></th>
                  <th className="text-center p-3 font-medium text-sm">TS / JS</th>
                  <th className="text-center p-3 font-medium text-sm">TS / JS</th>
                  <th className="text-center p-3 font-medium text-sm">Python</th>
                  <th className="text-center p-3 font-medium text-sm">Python</th>
                  <th className="text-center p-3 font-medium text-sm">R</th>
                </tr>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Operation</th>
                  <th className="text-center p-3 font-medium">tidy-ts</th>
                  <th className="text-center p-3 font-medium">Arquero</th>
                  <th className="text-center p-3 font-medium">Pandas</th>
                  <th className="text-center p-3 font-medium">Polars</th>
                  <th className="text-center p-3 font-medium">dplyr</th>
                </tr>
              </thead>
              <tbody>
                {performanceBenchmarksExamples.fiveHundredKBenchmarkData
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((row) => (
                  <tr key={row.operation} className="border-b">
                    <td className="p-3 font-medium">{row.operation} (ms)</td>
                    {row.values.map((cell) => (
                      <td
                        key={cell.library}
                        className="p-3 text-center text-gray-600 dark:text-gray-400"
                      >
                        {Math.round(cell.timeMs)}
                        <span className="text-xs text-gray-500 ml-1">
                          ({cell.ratio}×)
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      <Alert>
        <AlertDescription>
          <strong>Note:</strong>{" "}
          These benchmarks are based on real performance tests with 500,000 rows, 
          using median times from 7 iterations with 5 warmup runs. Results may vary
          based on hardware, data characteristics, and specific use cases. 
          All tests use optimized data types (categorical/factor) where applicable.
        </AlertDescription>
      </Alert>
    </DocPageLayout>
  );
}
