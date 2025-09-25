// Normal Distribution - PDF and CDF using new .data() method
import { s } from "@tidy-ts/dataframe";

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

normalData.print();
