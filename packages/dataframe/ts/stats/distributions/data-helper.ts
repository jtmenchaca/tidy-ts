// deno-lint-ignore-file no-explicit-any
import { createDataFrame } from "../../dataframe/index.ts";

export type DistributionDataConfig = {
  range?: [number, number];
  points?: number;
};

export function createDistributionData({
  distribution,
  params,
  type,
  config = {},
}: {
  distribution: {
    density: (params: any) => number;
    probability: (params: any) => number;
    quantile: (params: any) => number;
  };
  params: any;
  type: "pdf" | "cdf" | "inverse_cdf";
  config?: DistributionDataConfig;
}): any {
  const { range, points = 100 } = config;

  if (type === "inverse_cdf") {
    // For quantile functions, use probability range
    const [minProb, maxProb] = range ?? [0.01, 0.99];
    const probabilities = Array.from(
      { length: points },
      (_, i) => minProb + (i * (maxProb - minProb)) / (points - 1),
    );

    return createDataFrame(
      probabilities.map((probability) => ({
        probability,
        quantile: distribution.quantile({ ...params, probability }),
      })),
    );
  } else {
    // For PDF and CDF, use x range
    const [minX, maxX] = range ?? [-4, 4];
    const xValues = Array.from(
      { length: points },
      (_, i) => minX + (i * (maxX - minX)) / (points - 1),
    );

    if (type === "pdf") {
      return createDataFrame(
        xValues.map((x) => ({
          x,
          density: distribution.density({ ...params, at: x }),
        })),
      );
    } else {
      // type === "cdf"
      return createDataFrame(
        xValues.map((x) => ({
          x,
          probability: distribution.probability({ ...params, at: x }),
        })),
      );
    }
  }
}
