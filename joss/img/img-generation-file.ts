// Normal Distribution - PDF and CDF using new .data() method
import { createDataFrame, s } from "@tidy-ts/dataframe";

// Multiple Distributions Comparison
const numPoints = 1000;
const tX = Array.from(
  { length: numPoints },
  (_, i) => -4 + (i * 8) / (numPoints - 1),
);
const distributionData = createDataFrame(
  tX.flatMap((x) => [
    {
      x: x,
      distribution: "1. Normal (df=∞)",
      density: s.dist.normal.density({ at: x, mean: 0, standardDeviation: 1 }),
    },
    {
      x: x,
      distribution: "2. t-dist (df=1)",
      density: s.dist.t.density({ at: x, degreesOfFreedom: 1 }),
    },
    {
      x: x,
      distribution: "3. t-dist (df=5)",
      density: s.dist.t.density({ at: x, degreesOfFreedom: 5 }),
    },
    {
      x: x,
      distribution: "4. t-dist (df=30)",
      density: s.dist.t.density({ at: x, degreesOfFreedom: 30 }),
    },
  ]),
);

const distributionComparison = distributionData.graph({
  type: "line",
  mappings: {
    x: "x",
    y: "density",
    series: "distribution",
  },
  config: {
    layout: {
      title: "Distribution Comparison - Normal vs t-Distributions",
      description:
        "How t-distributions approach normal as degrees of freedom increase",
    },
    xAxis: {
      label: "Value (x)",
      domain: [-4, 4],
    },
    yAxis: {
      label: "Density f(x)",
      domain: [0, 0.45],
    },
    line: {
      style: "linear",
      dots: false,
      strokeWidth: 2,
    },
    color: {
      scheme: "vibrant",
    },
    legend: {
      show: true,
      position: "top-right",
      fontSize: 12,
      titleFontSize: 13,
    },
    grid: {
      show: true,
    },
  },
});

const finalHeight = 500;
const finalWidth = 700;

console.log("📊 Distribution Comparison:");
distributionComparison.savePNG({
  filename: "./joss/img/distributionComparison.png",
  width: finalWidth,
  height: finalHeight,
  scale: 3,
});
