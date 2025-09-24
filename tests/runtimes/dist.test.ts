// Normal Distribution - PDF and CDF using new .data() method
import { createDataFrame, s } from "@tidy-ts/dataframe";

// Generate PDF data using the new .data() method
const normalPDFData = s.dist.normal.data({
  mean: 0,
  standardDeviation: 2,
  type: "pdf",
  range: [-6, 6],
  points: 100,
});

// Generate CDF data using the new .data() method
const normalCDFData = s.dist.normal.data({
  mean: 0,
  standardDeviation: 1,
  type: "cdf",
  range: [-4, 4],
  points: 100,
});

const normalData = normalPDFData.leftJoin(normalCDFData, "x");

console.log("Normal Distribution PDF Data:");
console.table(normalData.head(10));