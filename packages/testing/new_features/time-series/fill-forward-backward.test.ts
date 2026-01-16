import { expect } from "@std/expect";
import { createDataFrame } from "@tidy-ts/dataframe";

Deno.test("fillForward() - time series with missing values", () => {
  const df = createDataFrame([
    { timestamp: 1, price: 150.0 },
    { timestamp: 2, price: null },
    { timestamp: 3, price: null },
    { timestamp: 4, price: 152.0 },
    { timestamp: 5, price: null },
  ]);

  const filled = df.fillForward("price");

  expect(filled[0].price).toBe(150.0);
  expect(filled[1].price).toBe(150.0); // filled from previous
  expect(filled[2].price).toBe(150.0); // filled from previous
  expect(filled[3].price).toBe(152.0);
  expect(filled[4].price).toBe(152.0); // filled from previous
});

Deno.test("fillBackward() - time series with missing values", () => {
  const df = createDataFrame([
    { timestamp: 1, price: null },
    { timestamp: 2, price: null },
    { timestamp: 3, price: 150.0 },
    { timestamp: 4, price: null },
    { timestamp: 5, price: 152.0 },
  ]);

  const filled = df.fillBackward("price");

  expect(filled[0].price).toBe(150.0); // filled from next
  expect(filled[1].price).toBe(150.0); // filled from next
  expect(filled[2].price).toBe(150.0);
  expect(filled[3].price).toBe(152.0); // filled from next
  expect(filled[4].price).toBe(152.0);
});

Deno.test("fillForward() - with grouped time series", () => {
  const df = createDataFrame([
    { timestamp: 1, symbol: "AAPL", price: 150.0 },
    { timestamp: 2, symbol: "AAPL", price: null },
    { timestamp: 1, symbol: "MSFT", price: 300.0 },
    { timestamp: 2, symbol: "MSFT", price: null },
  ]);

  const filled = df.groupBy("symbol").fillForward("price");

  expect(filled[0].price).toBe(150.0);
  expect(filled[1].price).toBe(150.0); // filled within AAPL group
  expect(filled[2].price).toBe(300.0);
  expect(filled[3].price).toBe(300.0); // filled within MSFT group
});
