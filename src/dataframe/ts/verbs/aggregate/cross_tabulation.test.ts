// import { pipe } from "effect";
// import { expect } from "@std/expect";
// import { createDataFrame, cross_tabulate } from "@tidy-ts/dataframe";

// // Sample dataset for cross-tabulation examples
// const surveyData = createDataFrame([
//   {
//     age: 25,
//     income: 50000,
//     education: "Bachelor",
//     satisfied: "Yes",
//     region: "North",
//   },
//   {
//     age: 32,
//     income: 75000,
//     education: "Master",
//     satisfied: "Yes",
//     region: "South",
//   },
//   {
//     age: 28,
//     income: null,
//     education: "Bachelor",
//     satisfied: "No",
//     region: "North",
//   },
//   {
//     age: 45,
//     income: 95000,
//     education: "PhD",
//     satisfied: "Yes",
//     region: "East",
//   },
//   {
//     age: 22,
//     income: 35000,
//     education: "High School",
//     satisfied: "No",
//     region: "West",
//   },
//   {
//     age: 38,
//     income: 82000,
//     education: "Master",
//     satisfied: "Yes",
//     region: "South",
//   },
//   {
//     age: 29,
//     income: 48000,
//     education: "Bachelor",
//     satisfied: "No",
//     region: "North",
//   },
//   {
//     age: 51,
//     income: 110000,
//     education: "PhD",
//     satisfied: "Yes",
//     region: "East",
//   },
//   {
//     age: 26,
//     income: 42000,
//     education: "Bachelor",
//     satisfied: "Yes",
//     region: "West",
//   },
//   {
//     age: null,
//     income: 65000,
//     education: "Master",
//     satisfied: "No",
//     region: "South",
//   },
// ]);

// Deno.test("Cross-tabulation - Education by Satisfaction", () => {
//   const educationBySatisfaction = pipe(
//     surveyData,
//     cross_tabulate("education", "satisfied"),
//   );

//   console.log(educationBySatisfaction);
//   console.log("Education by Satisfaction Cross-tabulation:");
//   console.log("Contingency Table:", educationBySatisfaction.contingencyTable);
//   console.log("Education levels:", educationBySatisfaction.rowLabels);
//   console.log("Satisfaction levels:", educationBySatisfaction.colLabels);

//   expect(educationBySatisfaction.grandTotal).toBe(10);
//   expect(educationBySatisfaction.rowLabels).toContain("Bachelor");
//   expect(educationBySatisfaction.colLabels).toContain("Yes");
//   expect(educationBySatisfaction.rowLabels.length).toBe(4); // Bachelor, Master, PhD, High School
//   expect(educationBySatisfaction.colLabels.length).toBe(2); // Yes, No
// });

// Deno.test("Cross-tabulation - Region by Education", () => {
//   const regionByEducation = pipe(
//     surveyData,
//     cross_tabulate("region", "education"),
//   );

//   console.log("Region by Education Cross-tabulation:");
//   console.log("Grand Total:", regionByEducation.grandTotal);
//   console.log("Row totals:", regionByEducation.rowTotals);
//   console.log("Column totals:", regionByEducation.colTotals);

//   expect(regionByEducation.grandTotal).toBe(10);
//   expect(regionByEducation.rowTotals.reduce((sum, total) => sum + total, 0))
//     .toBe(10);
//   expect(regionByEducation.colTotals.reduce((sum, total) => sum + total, 0))
//     .toBe(10);
// });

// Deno.test("Cross-tabulation - Customer Segmentation Analysis", () => {
//   const customerData = createDataFrame([
//     { segment: "Premium", product: "A", purchased: "Yes" },
//     { segment: "Premium", product: "B", purchased: "Yes" },
//     { segment: "Standard", product: "A", purchased: "No" },
//     { segment: "Standard", product: "B", purchased: "Yes" },
//     { segment: "Basic", product: "A", purchased: "No" },
//     { segment: "Basic", product: "B", purchased: "No" },
//   ]);

//   const segmentPurchase = pipe(
//     customerData,
//     cross_tabulate("segment", "purchased"),
//   );

//   console.log("Customer Segment Purchase Analysis:");
//   console.log("Segments:", segmentPurchase.rowLabels);
//   console.log("Purchase outcomes:", segmentPurchase.colLabels);

//   expect(segmentPurchase.rowLabels).toEqual(["Premium", "Standard", "Basic"]);
//   expect(segmentPurchase.colLabels).toEqual(["Yes", "No"]);

//   // Validate purchase rates by segment
//   const premiumYes = segmentPurchase.contingencyTable[0][0]; // Premium, Yes
//   const premiumTotal = segmentPurchase.rowTotals[0];
//   expect(premiumYes / premiumTotal).toBe(1.0); // 100% purchase rate for Premium
// });

// Deno.test("Cross-tabulation - A/B Testing Statistical Insights", () => {
//   const abTestData = createDataFrame([
//     { group: "A", outcome: "Convert", age_group: "Young" },
//     { group: "A", outcome: "Convert", age_group: "Old" },
//     { group: "A", outcome: "No Convert", age_group: "Young" },
//     { group: "B", outcome: "Convert", age_group: "Young" },
//     { group: "B", outcome: "Convert", age_group: "Young" },
//     { group: "B", outcome: "No Convert", age_group: "Old" },
//   ]);

//   const abResults = pipe(
//     abTestData,
//     cross_tabulate("outcome", "group"),
//   );

//   console.log("A/B Test Results:");
//   console.log("Conversion by group:", abResults.summaryByColumn);

//   // Validate we can extract conversion rates
//   const groupAConversions = abResults.contingencyTable[0][0]; // Convert, A
//   const groupATotalExposure = abResults.colTotals[0]; // Total A
//   const conversionRateA = groupAConversions / groupATotalExposure;

//   expect(conversionRateA).toBeCloseTo(0.67, 2); // ~67% conversion rate
//   console.log(
//     `Group A conversion rate: ${(conversionRateA * 100).toFixed(1)}%`,
//   );
// });

// Deno.test("Cross-tabulation - Type Checking and Inference", () => {
//   const typedData = createDataFrame([
//     { category: "X", status: 1 },
//     { category: "Y", status: 2 },
//   ]);

//   const typedResult = pipe(typedData, cross_tabulate("category", "status"));

//   // Type checks - these should compile without issues
//   const _contingencyMatrix: number[][] = typedResult.contingencyTable;
//   const _rowLabels: string[] = typedResult.rowLabels;
//   const _colLabels: string[] = typedResult.colLabels;
//   const _grandTotal: number = typedResult.grandTotal;

//   expect(typedResult.colLabels).toEqual(["1", "2"]); // Numbers converted to strings
// });
