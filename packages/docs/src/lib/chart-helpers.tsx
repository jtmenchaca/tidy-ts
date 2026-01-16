// import { createDataFrame, graphReact } from "../../../src/dataframe/mod.ts";
// import type { DataFrame } from "../../../src/dataframe/mod.ts";

// // Real data using actual tidy-ts library
// export const experimentData = createDataFrame([
//   {
//     experiment_id: 1,
//     temperature: 25,
//     pressure: 1.2,
//     yield: 0.85,
//     catalyst: "A",
//     batch_size: 50,
//   },
//   {
//     experiment_id: 2,
//     temperature: 30,
//     pressure: 1.5,
//     yield: 0.92,
//     catalyst: "A",
//     batch_size: 75,
//   },
//   {
//     experiment_id: 3,
//     temperature: 35,
//     pressure: 1.8,
//     yield: 0.88,
//     catalyst: "B",
//     batch_size: 60,
//   },
//   {
//     experiment_id: 4,
//     temperature: 40,
//     pressure: 2.1,
//     yield: 0.95,
//     catalyst: "B",
//     batch_size: 80,
//   },
//   {
//     experiment_id: 5,
//     temperature: 45,
//     pressure: 2.4,
//     yield: 0.78,
//     catalyst: "C",
//     batch_size: 45,
//   },
//   {
//     experiment_id: 6,
//     temperature: 50,
//     pressure: 2.7,
//     yield: 0.82,
//     catalyst: "C",
//     batch_size: 65,
//   },
//   {
//     experiment_id: 7,
//     temperature: 55,
//     pressure: 3.0,
//     yield: 0.75,
//     catalyst: "A",
//     batch_size: 90,
//   },
//   {
//     experiment_id: 8,
//     temperature: 28,
//     pressure: 1.3,
//     yield: 0.89,
//     catalyst: "B",
//     batch_size: 55,
//   },
//   {
//     experiment_id: 9,
//     temperature: 42,
//     pressure: 2.2,
//     yield: 0.93,
//     catalyst: "A",
//     batch_size: 70,
//   },
//   {
//     experiment_id: 10,
//     temperature: 38,
//     pressure: 1.9,
//     yield: 0.91,
//     catalyst: "C",
//     batch_size: 85,
//   },
// ]);

// export const salesData = createDataFrame([
//   { month: "Jan", desktop: 186, mobile: 80, quarter: "Q1", region: "North" },
//   { month: "Feb", desktop: 305, mobile: 200, quarter: "Q1", region: "North" },
//   { month: "Mar", desktop: 237, mobile: 120, quarter: "Q1", region: "North" },
//   { month: "Apr", desktop: 173, mobile: 190, quarter: "Q2", region: "North" },
//   { month: "May", desktop: 209, mobile: 130, quarter: "Q2", region: "North" },
//   { month: "Jun", desktop: 214, mobile: 140, quarter: "Q2", region: "North" },
//   { month: "Jul", desktop: 156, mobile: 160, quarter: "Q3", region: "South" },
//   { month: "Aug", desktop: 267, mobile: 180, quarter: "Q3", region: "South" },
//   { month: "Sep", desktop: 289, mobile: 220, quarter: "Q3", region: "South" },
//   { month: "Oct", desktop: 198, mobile: 250, quarter: "Q4", region: "South" },
//   { month: "Nov", desktop: 245, mobile: 280, quarter: "Q4", region: "South" },
//   { month: "Dec", desktop: 321, mobile: 310, quarter: "Q4", region: "South" },
// ]);

// export const trafficData = createDataFrame([
//   { month: "Jan", organic: 120, paid: 80, social: 45, direct: 30 },
//   { month: "Feb", organic: 150, paid: 95, social: 52, direct: 35 },
//   { month: "Mar", organic: 180, paid: 110, social: 48, direct: 40 },
//   { month: "Apr", organic: 210, paid: 125, social: 61, direct: 45 },
//   { month: "May", organic: 240, paid: 140, social: 55, direct: 50 },
//   { month: "Jun", organic: 280, paid: 160, social: 67, direct: 55 },
// ]);

// export const engagementData = createDataFrame([
//   { session_duration: 5.2, page_views: 8, user_type: "new", bounce_rate: 0.65 },
//   {
//     session_duration: 12.1,
//     page_views: 15,
//     user_type: "returning",
//     bounce_rate: 0.23,
//   },
//   { session_duration: 3.8, page_views: 4, user_type: "new", bounce_rate: 0.78 },
//   {
//     session_duration: 18.5,
//     page_views: 22,
//     user_type: "premium",
//     bounce_rate: 0.12,
//   },
//   {
//     session_duration: 7.3,
//     page_views: 11,
//     user_type: "returning",
//     bounce_rate: 0.34,
//   },
//   {
//     session_duration: 25.2,
//     page_views: 35,
//     user_type: "premium",
//     bounce_rate: 0.08,
//   },
//   { session_duration: 4.1, page_views: 6, user_type: "new", bounce_rate: 0.72 },
//   {
//     session_duration: 15.8,
//     page_views: 19,
//     user_type: "returning",
//     bounce_rate: 0.19,
//   },
//   {
//     session_duration: 30.1,
//     page_views: 42,
//     user_type: "premium",
//     bounce_rate: 0.05,
//   },
//   { session_duration: 2.9, page_views: 3, user_type: "new", bounce_rate: 0.85 },
// ]);

// // Helper component to render charts using the real graphReact method
// export function TidyChart({
//   dataFrame,
//   spec,
//   className = "",
// }: {
//   // deno-lint-ignore no-explicit-any
//   dataFrame: DataFrame<any>;
//   spec: Parameters<typeof graphReact>[0];
//   className?: string;
// }): React.ReactElement {
//   const chartFunction = graphReact(spec);
//   const { spec: vegaSpec, data } = chartFunction(dataFrame);
//   return <VegaChart spec={vegaSpec} data={data} className={className} />;
// }
