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
import { dataVisualizationExamples } from "./data-visualization.examples.ts";

export const Route = createFileRoute("/data-visualization" as any)({
  component: DataVisualizationComponent,
});

function DataVisualizationComponent() {
  return (
    <DocPageLayout
      title="Data Visualization"
      description="Create charts with an integrated API backed by Vega"
      currentPath="/data-visualization"
    >
      <CodeBlock
        title="Interactive Scatter Plot"
        description="Create interactive charts directly from DataFrames"
        explanation="Tidy-TS provides data visualization tools directly from DataFrames backed by Vega. Configure mappings, styling, and interactivity with a simple API."
        code={dataVisualizationExamples.interactiveScatterPlot}
      />

      <CodeBlock
        title="Chart Export"
        description="Export charts as PNG or SVG files"
        explanation="Charts can be exported to common image formats for use in reports, presentations, or web applications."
        code={dataVisualizationExamples.chartExport}
      />

      <Card>
        <CardHeader>
          <CardTitle>Chart Types & Features</CardTitle>
          <CardDescription>
            Available chart types and styling options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Chart Types:</strong> scatter, line, bar, area<br />
                <strong>Aesthetics:</strong> color, size, series, tooltips, legends<br />
                <strong>Styling:</strong> 9 color schemes, custom themes, interactive features
              </p>
            </div>
            <CodeBlock
              title="Different Chart Types"
              description="Examples of line, bar, and area charts"
              code={dataVisualizationExamples.chartTypes}
            />
            <CodeBlock
              title="Color Schemes and Styling"
              description="Customize appearance with color schemes and styling options"
              code={dataVisualizationExamples.colorSchemes}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interactive Charts in Jupyter</CardTitle>
          <CardDescription>
            When using Deno and Jupyter notebooks, charts become interactive with hover tooltips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Charts display interactively in Jupyter cells with features like hover tooltips for enhanced data exploration.
          </p>
          <CodeBlock
            title="Jupyter Integration"
            description="Interactive charts with tooltips in Jupyter notebooks"
            code={dataVisualizationExamples.interactiveJupyter}
          />
        </CardContent>
      </Card>
    </DocPageLayout>
  );
}