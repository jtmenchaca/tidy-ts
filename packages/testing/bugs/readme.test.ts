import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

Deno.test("README examples validation", () => {
  console.log("=== Testing README Examples ===\n");

  // Create DataFrame from rows
  const sales = createDataFrame([
    { region: "North", product: "Widget", quantity: 10, price: 100 },
    { region: "South", product: "Widget", quantity: 20, price: 100 },
    { region: "East", product: "Widget", quantity: 8, price: 100 },
  ]);

  // Or create DataFrame from columns
  const salesFromColumns = createDataFrame({
    columns: {
      region: ["North", "South", "East"],
      product: ["Widget", "Widget", "Widget"],
      quantity: [10, 20, 8],
      price: [100, 100, 100],
    },
  });

  console.log("Created DataFrames from both rows and columns ✓");
  console.log(`Columns DataFrame has ${salesFromColumns.nrows()} rows`);

  // Complete data analysis workflow
  // Note: When mixing functions with arrays/scalars, TypeScript may need explicit types
  const analysis = sales
    .mutate({
      revenue: (r) => r.quantity * r.price,
      status: ["Active", "Pending", "Active"], // Array values
      tax_rate: () => 0.08, // Scalar repeated for all rows (function for inference)
      category: (r) => r.quantity > 10 ? "High Volume" : "Standard",
    })
    .groupBy("region")
    .summarize({
      total_revenue: (group) => s.sum(group.revenue),
      avg_quantity: (group) => s.mean(group.quantity),
      product_count: (group) => group.nrows(),
    })
    .arrange("total_revenue", "desc");

  console.log("Data analysis workflow completed ✓");
  analysis.print();

  // Statistical Computing Examples
  console.log("\n=== Statistical Examples ===");

  // Normal distribution
  const randomValue = s.dist.normal.random({
    mean: 0,
    standardDeviation: 1,
    sampleSize: 10,
  });
  const density = s.dist.normal.density({
    at: 0,
    mean: 0,
    standardDeviation: 1,
  });
  const probability = s.dist.normal.probability({
    at: 1.96,
    mean: 0,
    standardDeviation: 1,
  });
  const quantile = s.dist.normal.quantile({
    probability: 0.975,
    mean: 0,
    standardDeviation: 1,
  });

  const _betaSample = s.dist.beta.random({ alpha: 2, beta: 5 });
  const _chiSquareCritical = s.dist.chiSquare.quantile({
    probability: 0.95,
    degreesOfFreedom: 1,
  });

  console.log(`Normal distribution examples:
    Random: ${randomValue}
    Density at 0: ${density}
    P(X ≤ 1.96): ${probability}
    95th percentile: ${quantile}`);

  // Statistical hypothesis testing
  const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const oneSampleT = s.test.t.oneSample({
    data,
    mu: 5,
    alternative: "two-sided",
    alpha: 0.05,
  });

  console.log(
    `One-sample t-test: P-value = ${oneSampleT.p_value}, Significant = ${
      oneSampleT.p_value < 0.05
    }`,
  );
});

Deno.test("README examples validation - compare API", () => {
  // Test the compare API
  console.log("\n=== Compare API Examples ===");

  const heights = [170, 165, 180, 175, 172, 168];
  const testResult = s.compare.oneGroup.centralTendency.toValue({
    data: heights,
    hypothesizedValue: 170,
    parametric: "parametric",
  });

  console.log("One-group test result:", testResult);

  const group1 = [23, 45, 67, 34, 56, 78, 29, 41, 52, 38]; // Hours spent studying per week
  const group2 = [78, 85, 92, 73, 88, 95, 69, 81, 89, 76]; // Final exam scores
  const groupComparison = s.compare.twoGroups.association.toEachOther({
    x: group1,
    y: group2,
    method: "pearson",
  });

  console.log("Two-group comparison result:", groupComparison);
});

Deno.test("README examples validation - object access pattern", () => {
  // Create DataFrame from rows
  const sales = createDataFrame([
    { region: "North", product: "Widget", quantity: 10, price: 100 },
    { region: "South", product: "Widget", quantity: 20, price: 100 },
    { region: "East", product: "Widget", quantity: 8, price: 100 },
  ]);
  // Test object access pattern (df.columnName)
  console.log("\n=== Object Access Pattern (df.columnName) ===");

  // Test readonly access to columns via object notation
  const regionColumn = sales.region;
  const quantityColumn = sales.quantity;
  const priceColumn = sales.price;

  console.log("Direct column access via df.columnName:");
  console.log(`Region column: ${regionColumn}`);
  console.log(`Quantity column: ${quantityColumn}`);
  console.log(`Price column: ${priceColumn}`);

  // Verify the columns are readonly arrays
  console.log(`Region is array: ${Array.isArray(regionColumn)}`);
  console.log(`Quantity length: ${quantityColumn.length}`);
  console.log(`First region: ${regionColumn[0]}`);
  console.log(`First quantity: ${quantityColumn[0]}`);
  console.log(`First price: ${priceColumn[0]}`);
});

Deno.test("Data Visualization examples validation", async () => {
  console.log("=== Testing Data Visualization Examples ===\n");

  // Create DataFrame for visualization
  const sales = createDataFrame([
    { region: "North", product: "Widget", quantity: 10, price: 100 },
    { region: "South", product: "Widget", quantity: 20, price: 100 },
    { region: "East", product: "Widget", quantity: 8, price: 100 },
  ]);

  // Create a chart with multiple aesthetics and comprehensive configuration
  const chart = sales
    .mutate({
      revenue: (r) => r.quantity * r.price,
      profit: (r) => r.quantity * r.price * 0.2,
    })
    .graph({
      type: "scatter",
      mappings: {
        x: "revenue",
        y: "quantity",
        color: "region",
        size: "profit",
      },
      config: {
        layout: {
          title: "Sales Analysis",
          description: "Revenue vs quantity by region, sized by profit",
          width: 700,
          height: 400,
        },
        xAxis: {
          label: "Revenue ($)",
          domain: [0, 2200],
        },
        yAxis: {
          label: "Quantity",
          domain: [0, 25],
        },
        scatter: {
          pointSize: 100,
          pointOpacity: 0.8,
        },
        color: { scheme: "professional" },
        legend: {
          show: true,
          position: "right",
        },
        grid: {
          show: true,
        },
      },
    });

  console.log("Chart created successfully ✓");
  console.log(`Chart type: ${chart.constructor.name}`);

  // Test actual export to output directory
  console.log("Testing PNG export...");
  const pngPath = new URL("output/sales-chart.png", import.meta.url).pathname;
  console.log(`PNG path: ${pngPath}`);
  await chart.savePNG({ filename: pngPath });
  console.log("✅ PNG export successful");

  console.log("Testing SVG export...");
  const svgPath = new URL("output/sales-chart.svg", import.meta.url).pathname;
  console.log(`SVG path: ${svgPath}`);
  await chart.saveSVG({ filename: svgPath });
  console.log("✅ SVG export successful");

  console.log("\n✅ Data visualization examples validated successfully!");
});
