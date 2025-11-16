import { expect } from "@std/expect";
import { createDataFrame, stats } from "@tidy-ts/dataframe";

Deno.test("lag() - basic lag with time series", () => {
  const df = createDataFrame([
    { date: "2023-01-01", sales: 100 },
    { date: "2023-01-02", sales: 150 },
    { date: "2023-01-03", sales: 200 },
    { date: "2023-01-04", sales: 120 },
  ]);

  const result = df.mutate({
    prev_sales: stats.lag("sales", 1),
  });

  expect(result[0].prev_sales).toBeUndefined();
  expect(result[1].prev_sales).toBe(100);
  expect(result[2].prev_sales).toBe(150);
  expect(result[3].prev_sales).toBe(200);
});

Deno.test("lead() - basic lead with time series", () => {
  const df = createDataFrame([
    { date: "2023-01-01", sales: 100 },
    { date: "2023-01-02", sales: 150 },
    { date: "2023-01-03", sales: 200 },
    { date: "2023-01-04", sales: 120 },
  ]);

  const result = df.mutate({
    next_sales: stats.lead("sales", 1),
  });

  expect(result[0].next_sales).toBe(150);
  expect(result[1].next_sales).toBe(200);
  expect(result[2].next_sales).toBe(120);
  expect(result[3].next_sales).toBeUndefined();
});

Deno.test("lag() - with default value", () => {
  const df = createDataFrame([
    { date: "2023-01-01", sales: 100 },
    { date: "2023-01-02", sales: 150 },
    { date: "2023-01-03", sales: 200 },
  ]);

  const result = df.mutate({
    prev_sales: stats.lag("sales", 1, 0),
  });

  expect(result[0].prev_sales).toBe(0);
  expect(result[1].prev_sales).toBe(100);
  expect(result[2].prev_sales).toBe(150);
});

Deno.test("lag() - with grouped data", () => {
  const df = createDataFrame([
    { date: "2023-01-01", symbol: "AAPL", price: 150 },
    { date: "2023-01-02", symbol: "AAPL", price: 151 },
    { date: "2023-01-01", symbol: "MSFT", price: 300 },
    { date: "2023-01-02", symbol: "MSFT", price: 301 },
  ]);

  const result = df.groupBy("symbol").mutate({
    prev_price: stats.lag("price", 1),
  });

  expect(result[0].prev_price).toBeUndefined(); // first AAPL
  expect(result[1].prev_price).toBe(150); // second AAPL
  expect(result[2].prev_price).toBeUndefined(); // first MSFT
  expect(result[3].prev_price).toBe(300); // second MSFT
});
