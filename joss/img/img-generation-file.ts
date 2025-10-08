import { s } from "@tidy-ts/dataframe";

// Multiple Distributions Comparison
const numPoints = 1000;

// Generate normal distribution data
const normal = s.dist.normal.data({
  mean: 0,
  standardDeviation: 1,
  type: "pdf",
  range: [-4, 4],
  points: numPoints,
}).mutate({
  distribution: "Normal (μ=0, σ=1)",
});

// Generate t-distribution data with 1 degree of freedom
const t1 = s.dist.t.data({
  degreesOfFreedom: 1,
  type: "pdf",
  range: [-4, 4],
  points: numPoints,
}).mutate({
  distribution: "t-dist (df=1)",
});

// Generate t-distribution data with 5 degrees of freedom
const t5 = s.dist.t.data({
  degreesOfFreedom: 5,
  type: "pdf",
  range: [-4, 4],
  points: numPoints,
}).mutate({
  distribution: "t-dist (df=5)",
});

// Generate t-distribution data with 30 degrees of freedom
const t30 = s.dist.t.data({
  degreesOfFreedom: 30,
  type: "pdf",
  range: [-4, 4],
  points: numPoints,
}).mutate({
  distribution: "t-dist (df=30)",
});

// Combine the distributions into a single dataframe
const distributionData = normal
  .bindRows(t1)
  .bindRows(t5)
  .bindRows(t30);

// Generate the distribution comparison plot
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

// Set the final height and width of the plot
const finalHeight = 500;
const finalWidth = 700;

// Save the plot to a file
distributionComparison.savePNG({
  filename: "./joss/img/distributionComparison.png",
  width: finalWidth,
  height: finalHeight,
  scale: 3,
});
