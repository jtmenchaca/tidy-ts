import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame, stats } from "@tidy-ts/dataframe";

describe("Stats Module", () => {
  const sampleData = createDataFrame([
    { id: 1, value: 10, category: "A", score: 85 },
    { id: 2, value: 20, category: "B", score: 92 },
    { id: 3, value: 15, category: "A", score: 78 },
    { id: 4, value: 25, category: "B", score: 88 },
    { id: 5, value: 12, category: "A", score: 95 },
    { id: 6, value: 30, category: "C", score: 82 },
    { id: 7, value: 18, category: "B", score: 90 },
    { id: 8, value: 22, category: "A", score: 87 },
  ]);

  const values = sampleData.value;

  it("should provide basic descriptive statistics", () => {
    // Basic descriptive statistics
    const sum = stats.sum(values);
    const mean = stats.mean(values);
    const median = stats.median(values);
    const min = stats.min(values);
    const max = stats.max(values);

    console.log("Values:", values);
    console.log("Sum:", sum);
    console.log("Mean:", mean);
    console.log("Median:", median);
    console.log("Min:", min);
    console.log("Max:", max);

    // Type check: stats functions should return correct types
    const _sumTypeCheck: number = sum;
    const _meanTypeCheck: number = mean;
    const _medianTypeCheck: number = median;
    const _minTypeCheck: number = min;
    const _maxTypeCheck: number = max;
    void _sumTypeCheck; // Suppress unused variable warning
    void _meanTypeCheck;
    void _medianTypeCheck;
    void _minTypeCheck;
    void _maxTypeCheck;

    expect(sum).toBe(152);
    expect(mean).toBe(19);
    expect(median).toBe(19);
    expect(min).toBe(10);
    expect(max).toBe(30);
  });

  it("should provide quantiles and percentiles", () => {
    const quartiles = stats.quartiles(values);
    const q25 = stats.quantile(values, 0.25);
    const q75 = stats.quantile(values, 0.75);

    console.log("Quartiles [Q25, Q50, Q75]:", quartiles);
    console.log("25th percentile:", q25);
    console.log("75th percentile:", q75);

    // Type check: quantile functions should return correct types
    const _quartilesTypeCheck: number[] = quartiles;
    const _quantileTypeCheck: number = q25;
    void _quartilesTypeCheck; // Suppress unused variable warning
    void _quantileTypeCheck;

    expect(quartiles).toEqual([14.25, 19, 22.75]);
    expect(q25).toBe(14.25);
    expect(q75).toBe(22.75);
  });

  it("should use stats in mutate operations", () => {
    const withStats = sampleData
      .mutate({
        value_centered: (row, _index, df) => {
          const mean = stats.mean(df.value);
          return row.value - mean;
        },
        value_quartile: (row, _index, df) => {
          const q = stats.quartiles(df.value);
          if (row.value <= q[0]) return "Q1";
          if (row.value <= q[1]) return "Q2";
          if (row.value <= q[2]) return "Q3";
          return "Q4";
        },
      });

    // Type check: result should be a DataFrame with additional columns
    const _typeCheck: DataFrame<{
      id: number;
      value: number;
      category: string;
      score: number;
      value_centered: number;
      value_quartile: "Q1" | "Q2" | "Q3" | "Q4";
    }> = withStats;
    void _typeCheck; // Suppress unused variable warning

    withStats.print("Data with statistical measures:");

    expect(withStats.nrows()).toBe(8);
    expect(withStats.columns()).toEqual([
      "id",
      "value",
      "category",
      "score",
      "value_centered",
      "value_quartile",
    ]);
  });

  it("should provide ranking functions", () => {
    const ranks = stats.rank(values);
    const uniqueCount = stats.uniqueCount(values);

    console.log("Ranks:", ranks);
    console.log("Unique count:", uniqueCount);

    // Type check: ranking functions should return correct types
    const _rankTypeCheck: number[] = ranks;
    const _uniqueCountTypeCheck: number = uniqueCount;
    void _rankTypeCheck; // Suppress unused variable warning
    void _uniqueCountTypeCheck;

    expect(ranks).toEqual([1, 5, 3, 7, 2, 8, 4, 6]);
    expect(uniqueCount).toBe(8);
  });

  it("should use ranking in mutate operations", () => {
    const withRanking = sampleData
      .mutate({
        value_rank: (row, _index, df) => stats.rank(df.value, row.value),
      });

    // Type check: result should be a DataFrame with additional columns
    const _typeCheck: typeof withRanking = withRanking;
    void _typeCheck; // Suppress unused variable warning

    withRanking.print("Data with ranking information:");

    expect(withRanking.nrows()).toBe(8);
    expect(withRanking.columns()).toEqual([
      "id",
      "value",
      "category",
      "score",
      "value_rank",
    ]);
    expect(withRanking.value_rank).toEqual([1, 5, 3, 7, 2, 8, 4, 6]);
  });

  it("should provide cumulative functions", () => {
    const cumsum = stats.cumsum(values);
    const cummax = stats.cummax(values);

    console.log("Cumulative sum:", cumsum);
    console.log("Cumulative max:", cummax);

    // Type check: cumulative functions should return correct types
    const _cumsumTypeCheck: number[] = cumsum;
    const _cummaxTypeCheck: number[] = cummax;
    void _cumsumTypeCheck; // Suppress unused variable warning
    void _cummaxTypeCheck;

    expect(cumsum).toEqual([10, 30, 45, 70, 82, 112, 130, 152]);
    expect(cummax).toEqual([10, 20, 20, 25, 25, 30, 30, 30]);
  });
});
