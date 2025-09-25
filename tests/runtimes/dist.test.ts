// Normal Distribution - PDF and CDF using new .data() method
import { createDataFrame, s } from "@tidy-ts/dataframe";

// Generate PDF data using the new .data() method
const normalPDFData = s.dist.normal.data({
  mean: 0,
  standardDeviation: 2,
  type: "pdf",
  range: [-4, 4],
  points: 100,
});
normalPDFData.print();

// Generate CDF data using the new .data() method
const normalCDFData = s.dist.normal.data({
  mean: 0,
  standardDeviation: 1,
  type: "cdf",
  range: [-4, 4],
  points: 100,
});

normalCDFData.print();

type NormalData = {
  x: number;
  density: number;
  probability: number;
};


const normalData = normalPDFData.leftJoin(normalCDFData, "x");

// Create a multi-series line chart showing both PDF and CDF
const normalDataForGraph = normalData
  .pivotLonger({
    cols: ["density", "probability"],
    names_to: "distribution_type",
    values_to: "value",
  });

const normalDistributionChart = normalDataForGraph
  .graph({
    type: "line",
    mappings: {
      x: "x",
      y: "value",
      series: "distribution_type",
    },
    config: {
      layout: {
        title: "📊 Normal Distribution - PDF and CDF",
        description: "Probability density function and cumulative distribution function",
        width: 700,
        height: 450,
      },
      xAxis: {
        label: "X Value",
      },
      yAxis: {
        label: "Probability",
      },
      line: {
        style: "monotone",
        dots: true,
        strokeWidth: 3,
      },
      color: {
        scheme: "oklch_vibrant",
      },
      legend: {
        show: true,
        position: "top",
      },
      grid: {
        show: true,
      },
      tooltip: {
        show: true,
      },
    },
    tooltip: {
      fields: ["x", "distribution_type", "value"],
    },
  });

console.log("📈 Normal Distribution Visualization:");
normalDistributionChart;

// Save the graph as SVG and PNG with consistent styling
await normalDistributionChart.saveSVG({
  filename: "normal-distribution.svg",
  width: 700,
  height: 450,
});

await normalDistributionChart.savePNG({
  filename: "normal-distribution.png",
  width: 700,
  height: 450,
  scale: 1, // Try lower scale first
});

console.log("💾 Graph saved as 'normal-distribution.png' and 'normal-distribution.svg'");

normalData.print();