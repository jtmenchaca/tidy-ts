# Benchmark Results - 2026-01-16

Dataset size: 500,000 rows

## Performance Comparison Table

| operation   | tidy-ts        | arquero           | pandas           | polars          | r                |
|-------------|----------------|-------------------|------------------|-----------------|------------------|
| bindRows    | 7.32ms (1x)    | 24.00ms (3.3x)    | 1.80ms (0.2x)    | 0.04ms (0x)     | 34.74ms (4.7x)   |
| creation    | 100.56ms (1x)  | 43.73ms (0.4x)    | 777.46ms (7.7x)  | 14.63ms (0.1x)  | 0.02ms (0x)      |
| distinct    | 93.17ms (1x)   | 499.07ms (5.4x)   | 58.31ms (0.6x)   | 13.65ms (0.1x)  | 14.37ms (0.2x)   |
| filter      | 8.02ms (1x)    | 8.67ms (1.1x)     | 11.20ms (1.4x)   | 1.00ms (0.1x)   | 6.05ms (0.8x)    |
| groupBy     | 36.35ms (1x)   | 45.92ms (1.3x)    | 11.61ms (0.3x)   | 3.26ms (0.1x)   | 363.44ms (10x)   |
| innerJoin   | 79.17ms (1x)   | 334.26ms (4.2x)   | 39.24ms (0.5x)   | 10.78ms (0.1x)  | 569.30ms (7.2x)  |
| leftJoin    | 55.79ms (1x)   | 441.77ms (7.9x)   | 50.42ms (0.9x)   | 12.24ms (0.2x)  | 857.89ms (15.4x) |
| mutate      | 2.51ms (1x)    | 3.61ms (1.4x)     | 2.50ms (1x)      | 0.10ms (0x)     | 0.71ms (0.3x)    |
| outerJoin   | 98.88ms (1x)   | 1221.50ms (12.4x) | 60.41ms (0.6x)   | 29.30ms (0.3x)  | 817.21ms (8.3x)  |
| pivotLonger | 186.04ms (1x)  | 226.80ms (1.2x)   | 60.66ms (0.3x)   | 9.48ms (0.1x)   | 38.12ms (0.2x)   |
| pivotWider  | 3.58ms (1x)    | 2.10ms (0.6x)     | 7.30ms (2x)      | 3.18ms (0.9x)   | 2.99ms (0.8x)    |
| select      | 0.02ms (1x)    | 0.002ms (0.1x)    | 3.19ms (160x)    | 0.08ms (4x)     | 0.39ms (19x)     |
| sort        | 129.35ms (1x)  | 403.07ms (3.1x)   | 228.50ms (1.8x)  | 57.35ms (0.4x)  | 23.44ms (0.2x)   |
| stats       | 278.76ms (1x)  | 322.01ms (1.2x)   | 23.12ms (0.1x)   | 4.87ms (0x)     | 24.22ms (0.1x)   |
| summarize   | 65.16ms (1x)   | 49.45ms (0.8x)    | 7.10ms (0.1x)    | 1.57ms (0x)     | 10.44ms (0.2x)   |

## Performance Examples

### Joins - tidy-ts excels at join operations due to WASM

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";

// Create two DataFrames to join
const orders = createDataFrame([
  { order_id: 1, customer_id: 100, amount: 50 },
  { order_id: 2, customer_id: 101, amount: 75 },
  { order_id: 3, customer_id: 100, amount: 30 },
]);

const customers = createDataFrame([
  { customer_id: 100, name: "Alice" },
  { customer_id: 101, name: "Bob" },
  { customer_id: 102, name: "Charlie" },
]);

// Inner join
const innerResult = orders.innerJoin(customers, "customer_id");

// Left join
const leftResult = orders.leftJoin(customers, "customer_id");

// Outer join
const outerResult = orders.outerJoin(customers, "customer_id");
```

### Distinct

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";

const data = createDataFrame([
  { category: "A", value: 1 },
  { category: "A", value: 1 },
  { category: "B", value: 2 },
  { category: "A", value: 1 },
]);

// Remove duplicates 
const unique = data.distinct("category", "value");
```

### Sort

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";

const sales = createDataFrame([
  { region: "North", revenue: 1000 },
  { region: "South", revenue: 1500 },
  { region: "East", revenue: 800 },
]);

// Single column sort
const sorted = sales.arrange("revenue", "desc");

// Multi-column sort
const multiSorted = sales.arrange(["region", "revenue"], ["asc", "desc"]);
```

### Filter and Mutate - competitive performance

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";

const products = createDataFrame([
  { name: "Widget", price: 10, quantity: 100 },
  { name: "Gadget", price: 25, quantity: 50 },
  { name: "Gizmo", price: 15, quantity: 75 },
]);

// Filter rows
const expensive = products.filter((row) => row.price > 12);

// Add computed columns
const withTotal = products.mutate({
  total_value: (row) => row.price * row.quantity,
  discount_price: (row) => row.price * 0.9,
});
```

### GroupBy and Summarize

```typescript
import { createDataFrame, stats } from "@tidy-ts/dataframe";

const transactions = createDataFrame([
  { store: "Downtown", category: "Electronics", amount: 500 },
  { store: "Downtown", category: "Clothing", amount: 150 },
  { store: "Mall", category: "Electronics", amount: 300 },
  { store: "Mall", category: "Clothing", amount: 200 },
]);

// Group and summarize
const summary = transactions
  .groupBy("store")
  .summarize({
    total_sales: (group) => stats.sum(group.amount),
    avg_sale: (group) => stats.mean(group.amount),
    num_transactions: (group) => group.nrows(),
  });
```

### Pivot Operations

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";

// Wide to long (pivotLonger)
const quarterly = createDataFrame([
  { product: "A", q1: 100, q2: 150, q3: 200, q4: 180 },
  { product: "B", q1: 80, q2: 90, q3: 110, q4: 95 },
]);

const long = quarterly.pivotLonger({
  cols: ["q1", "q2", "q3", "q4"],
  namesTo: "quarter",
  valuesTo: "sales",
});

// Long to wide (pivotWider)
const longData = createDataFrame([
  { product: "A", quarter: "q1", sales: 100 },
  { product: "A", quarter: "q2", sales: 150 },
  { product: "B", quarter: "q1", sales: 80 },
  { product: "B", quarter: "q2", sales: 90 },
]);

const wide = longData.pivotWider({
  namesFrom: "quarter",
  valuesFrom: "sales",
});
```

### Bind Rows 

```typescript
import { createDataFrame } from "@tidy-ts/dataframe";

const batch1 = createDataFrame([
  { id: 1, value: 100 },
  { id: 2, value: 200 },
]);

const batch2 = createDataFrame([
  { id: 3, value: 300 },
  { id: 4, value: 400 },
]);

// Concatenate DataFrames vertically
const combined = batch1.bindRows(batch2);
```
