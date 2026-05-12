# Benchmark Results - 2026-05-11

Dataset size: 500,000 rows

## Performance Comparison Table

| operation   | tidy-ts        | arquero           | pandas           | polars          | r                |
|-------------|----------------|-------------------|------------------|-----------------|------------------|
| bindRows    | 10.60ms (1x)   | 22.74ms (2.1x)    | 0.48ms (0x)      | 0.02ms (0x)     | 31.47ms (3x)     |
| creation    | 82.88ms (1x)   | 40.19ms (0.5x)    | 676.64ms (8.2x)  | 9.70ms (0.1x)   | 0.03ms (0x)      |
| distinct    | 134.06ms (1x)  | 524.29ms (3.9x)   | 46.58ms (0.3x)   | 12.92ms (0.1x)  | 13.92ms (0.1x)   |
| filter      | 7.58ms (1x)    | 8.43ms (1.1x)     | 1.61ms (0.2x)    | 0.33ms (0x)     | 5.71ms (0.8x)    |
| groupBy     | 35.69ms (1x)   | 37.01ms (1x)      | 9.00ms (0.3x)    | 2.41ms (0.1x)   | 332.73ms (9.3x)  |
| innerJoin   | 29.16ms (1x)   | 369.77ms (12.7x)  | 28.76ms (1x)     | 9.74ms (0.3x)   | 417.04ms (14.3x) |
| leftJoin    | 38.05ms (1x)   | 428.89ms (11.3x)  | 38.69ms (1x)     | 12.42ms (0.3x)  | 664.31ms (17.5x) |
| mutate      | 1.32ms (1x)    | 4.37ms (3.3x)     | 0.62ms (0.5x)    | 0.12ms (0.1x)   | 0.88ms (0.7x)    |
| outerJoin   | 139.21ms (1x)  | 1154.01ms (8.3x)  | 51.78ms (0.4x)   | 30.01ms (0.2x)  | 638.70ms (4.6x)  |
| pivotLonger | 194.87ms (1x)  | 215.44ms (1.1x)   | 44.56ms (0.2x)   | 8.92ms (0x)     | 38.67ms (0.2x)   |
| pivotWider  | 3.02ms (1x)    | 1.65ms (0.5x)     | 5.97ms (2x)      | 3.08ms (1x)     | 3.10ms (1x)      |
| select      | 0.01ms (1x)    | 0.002ms (0.2x)    | 0.77ms (77x)     | 0.03ms (3x)     | 0.53ms (53x)     |
| sort        | 19.39ms (1x)   | 286.00ms (14.7x)  | 183.03ms (9.4x)  | 26.36ms (1.4x)  | 22.35ms (1.2x)   |
| stats       | 8.19ms (1x)    | 256.32ms (31.3x)  | 18.24ms (2.2x)   | 4.78ms (0.6x)   | 20.62ms (2.5x)   |
| summarize   | 21.30ms (1x)   | 39.38ms (1.8x)    | 5.49ms (0.3x)    | 1.45ms (0.1x)   | 6.65ms (0.3x)    |

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
