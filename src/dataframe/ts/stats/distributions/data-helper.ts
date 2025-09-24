import { createDataFrame, type DataFrame } from "../../dataframe/index.ts";

export type DistributionDataConfig = {
  range?: [number, number];
  points?: number;
};

// deno-lint-ignore no-explicit-any
export function createDistributionData<T extends Record<string, any>>({
  distribution,
  params,
  type,
  config,
}: {
  distribution: {
    density: (params: T & { at: number }) => number;
    probability: (params: T & { at: number }) => number;
    quantile: (params: T & { probability: number }) => number;
  };
  params: T;
  type: "pdf";
  config?: DistributionDataConfig;
}): DataFrame<{ x: number; density: number }>;
// deno-lint-ignore no-explicit-any
export function createDistributionData<T extends Record<string, any>>({
  distribution,
  params,
  type,
  config,
}: {
  distribution: {
    density: (params: T & { at: number }) => number;
    probability: (params: T & { at: number }) => number;
    quantile: (params: T & { probability: number }) => number;
  };
  params: T;
  type: "cdf";
  config?: DistributionDataConfig;
}): DataFrame<{ x: number; probability: number }>;
// deno-lint-ignore no-explicit-any
export function createDistributionData<T extends Record<string, any>>({
  distribution,
  params,
  type,
  config,
}: {
  distribution: {
    density: (params: T & { at: number }) => number;
    probability: (params: T & { at: number }) => number;
    quantile: (params: T & { probability: number }) => number;
  };
  params: T;
  type: "inverse_cdf";
  config?: DistributionDataConfig;
}): DataFrame<{ probability: number; quantile: number }>;
// deno-lint-ignore no-explicit-any
export function createDistributionData<T extends Record<string, any>>({
  distribution,
  params,
  type,
  config = {},
}: {
  distribution: {
    density: (params: T & { at: number }) => number;
    probability: (params: T & { at: number }) => number;
    quantile: (params: T & { probability: number }) => number;
  };
  params: T;
  type: "pdf" | "cdf" | "inverse_cdf";
  config?: DistributionDataConfig;
}) {
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
