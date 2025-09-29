import{j as e}from"./radix-BuIbRv-a.js";import{b as c,T as m,B as s,G as x,D as h,L as a,C as g}from"./index-Big9d2YN.js";import{C as r,a as l,b as i,c as o,d as n}from"./card-LwGePdVj.js";import{C as d}from"./code-block-CnK5ecpm.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";/**
 * @license lucide-react v0.476.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],t=c("ArrowRight",p);/**
 * @license lucide-react v0.476.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],b=c("Shield",u),y=`import { createDataFrame } from "@tidy-ts/dataframe";

// 🚀 Load character data from the galaxy
const characters = createDataFrame([
  { name: "Luke", species: "Human", mass_kg: 77, height_cm: 172 },
  { name: "Leia", species: "Human", mass_kg: 49, height_cm: 150 },
  { name: "C-3PO", species: "Droid", mass_kg: 75, height_cm: 167 },
  { name: "R2-D2", species: "Droid", mass_kg: 32, height_cm: 96 },
]);

characters.print();

// Output:
// ┌───────┬────────┬─────────┬───────────┐
// │ name  │ species│ mass_kg │ height_cm │
// ├───────┼────────┼─────────┼───────────┤
// │ Luke  │ Human  │ 77      │ 172       │
// │ Leia  │ Human  │ 49      │ 150       │
// │ C-3PO │ Droid  │ 75      │ 167       │
// │ R2-D2 │ Droid  │ 32      │ 96        │
// └───────┴────────┴─────────┴───────────┘`,j=`// 🔧 Transform data with calculated columns
const analysis = characters
  .mutate({
    mass_lbs: (row) => row.mass_kg * 2.20462,  // Convert to pounds
    height_in: (row) => row.height_cm / 2.54,  // Convert to inches
    bmi: (row) => row.mass_kg / ((row.height_cm / 100) ** 2),  // Body Mass Index
  })
  .select("name", "mass_lbs", "height_in", "bmi");

analysis.print("Character Analysis with Calculations");

// Output:
// Character Analysis with Calculations
// ┌───────┬──────────┬───────────┬─────────┐
// │ name  │ mass_lbs │ height_in │ bmi     │
// ├───────┼──────────┼───────────┼─────────┤
// │ Luke  │ 169.76   │ 67.72     │ 26.03   │
// │ Leia  │ 108.03   │ 59.06     │ 21.78   │
// │ C-3PO │ 165.35   │ 65.75     │ 26.89   │
// │ R2-D2 │ 70.55    │ 37.80     │ 34.72   │
// └───────┴──────────┴───────────┴─────────┘`,f=`import { stats as s } from "@tidy-ts/dataframe";

// 📊 Group by species and calculate statistics
const summary = analysis
  .groupBy("species")
  .summarize({
    avg_mass_lbs: (group) => s.mean(group.mass_lbs),
    avg_height_in: (group) => s.mean(group.height_in),
    count: (group) => group.nrows(),
  })
  .arrange("avg_mass_lbs", "desc");

summary.print("Species Comparison Report");

// Output:
// Species Comparison Report
// ┌────────┬───────────────┬───────────────┬───────┐
// │ species│ avg_mass_lbs  │ avg_height_in │ count │
// ├────────┼───────────────┼───────────────┼───────┤
// │ Human  │ 138.90        │ 63.39         │ 2     │
// │ Droid  │ 117.95        │ 51.78         │ 2     │
// └────────┴───────────────┴───────────────┴───────┘`,N=`// Test 1: Are droid proportions (suspiciously?) similar to human proportions?
const humans = analysis.filter((r) => r.species === "Human");
const droids = analysis.filter((r) => r.species === "Droid");

const bmiTest = s.compare.twoGroups.centralTendency.toEachOther({
  x: humans.bmi,
  y: droids.bmi,
  parametric: "auto", // Auto-detects appropriate test
});

console.log(\`Droid conspiracy? Test: \${bmiTest.test_name}, p-value: \${s.round(bmiTest.p_value, 3)}\`);

// Output:
// Droid conspiracy? Test: Independent T-Test, p-value: 0.261

// Test 2: Are height and mass correlated among all characters?
const heightMassTest = s.compare.twoGroups.association.toEachOther({
  x: analysis.height_cm,
  y: analysis.mass_kg,
  method: "auto", // Selects best choice between Pearson, Spearman, or Kendall
});

console.log(\`Height and mass correlation? 
Test: \${heightMassTest.test_name}
\${heightMassTest.effect_size.name}: \${s.round(heightMassTest.effect_size.value, 3)}
p-value: \${s.round(heightMassTest.p_value, 3)}\`);


// Output:
// Height and mass correlation? 
// Test: Kendall's rank correlation tau
// Kendall's Tau: 1
// p-value: 0.083`;function S(){return e.jsx("div",{className:"flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto",children:e.jsxs("div",{className:"container mx-auto max-w-4xl space-y-6 md:space-y-8 relative",children:[e.jsxs("section",{className:"relative text-center py-12 sm:py-20",children:[e.jsx("div",{className:"absolute -left-25 -top-30 opacity-4 dark:opacity-10 pointer-events-none",children:e.jsx("img",{src:m,alt:"",className:"w-96 h-96 sm:w-[600px] sm:h-[600px] md:w-[600px] md:h-[600px] lg:w-[600px] lg:h-[600px] xl:w-[600px] xl:h-[600px]"})}),e.jsxs("div",{className:"relative z-10",children:[e.jsx("h1",{className:"text-5xl sm:text-6xl lg:text-7xl font-bold text-orange-600 mb-6",children:"Tidy-TS"}),e.jsx("h2",{className:"text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8 leading-tight",children:"Data analytics framework"}),e.jsxs("p",{className:"text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto",children:["Type-safe data analytics and statistics in TypeScript. Research shows that static typing can prevent 15–38% of production bugs",e.jsx("sup",{className:"text-blue-600 dark:text-blue-400",children:e.jsx("a",{href:"#research-evidence",className:"hover:underline",title:"Supporting research sources",children:"1,2,3"})}),". Designed for modern data science workflows."]}),e.jsx("div",{className:"flex flex-col sm:flex-row justify-center gap-4",children:e.jsx(s,{asChild:!0,size:"lg",variant:"outline",className:"border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 px-8 py-3 text-lg font-semibold rounded-lg",children:e.jsxs("a",{href:"https://github.com/jtmenchaca/tidy-ts",target:"_blank",rel:"noopener noreferrer",className:"flex items-center gap-2",children:[e.jsx(x,{className:"h-5 w-5"}),"Explore on GitHub"]})})})]})]}),e.jsxs("section",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8",children:[e.jsxs(r,{className:"border-0 shadow-lg",children:[e.jsxs(l,{children:[e.jsxs(i,{className:"flex items-center gap-3 text-xl",children:[e.jsx(h,{className:"h-6 w-6 text-orange-600"}),"Type-Safe Data Operations"]}),e.jsx(o,{className:"text-base",children:"Perform DataFrame operations with full TypeScript support"})]}),e.jsxs(n,{children:[e.jsx("p",{className:"text-gray-600 dark:text-gray-300 mb-4",children:"Create, transform, filter, select, and sort data with chaining and automatic column typing for compile-time safety."}),e.jsx(s,{asChild:!0,variant:"ghost",size:"sm",className:"text-orange-600 hover:text-orange-700",children:e.jsxs(a,{to:"/creating-dataframes",children:["Learn More ",e.jsx(t,{className:"ml-2 h-3 w-3"})]})})]})]}),e.jsxs(r,{className:"border-0 shadow-lg",children:[e.jsxs(l,{children:[e.jsxs(i,{className:"flex items-center gap-3 text-xl",children:[e.jsx(g,{className:"h-6 w-6 text-orange-600"}),"Statistical Analysis"]}),e.jsx(o,{className:"text-base",children:"A comprehensive toolkit for statistical analysis"})]}),e.jsxs(n,{children:[e.jsx("p",{className:"text-gray-600 dark:text-gray-300 mb-4",children:"80+ functions across descriptive statistics, hypothesis testing, and probability distributions. All tests are rigorously validated against results from R."}),e.jsx(s,{asChild:!0,variant:"ghost",size:"sm",className:"text-orange-600 hover:text-orange-700",children:e.jsxs(a,{to:"/stats-module",children:["Learn More ",e.jsx(t,{className:"ml-2 h-3 w-3"})]})})]})]})]}),e.jsx("section",{className:"bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl p-6 md:p-8 border border-emerald-100 dark:border-emerald-900/30",children:e.jsxs("div",{className:"text-center",children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2",children:"See Tidy-TS in Action"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300",children:"A complete data analysis workflow, broken into focused examples"})]})}),e.jsxs("div",{className:"space-y-4 -mx-4 md:mx-0",children:[e.jsxs(r,{className:"border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl",children:[e.jsxs(l,{className:"pb-3 px-4 pt-4",children:[e.jsxs("div",{className:"flex items-center justify-between w-full",children:[e.jsx(i,{className:"text-lg font-semibold text-gray-900 dark:text-gray-100",children:"Create DataFrames"}),e.jsx(s,{asChild:!0,variant:"outline",size:"sm",className:"text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300",children:e.jsxs(a,{to:"/creating-dataframes",onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),children:["Learn More ",e.jsx(t,{className:"ml-2 h-3 w-3"})]})})]}),e.jsx(o,{className:"text-sm text-gray-600 dark:text-gray-400 mt-2",children:"Create DataFrames from arrays of objects with automatic type inference"})]}),e.jsx(n,{className:"px-0",children:e.jsx("div",{className:"[&_pre]:!rounded-none md:[&_pre]:!rounded-md",children:e.jsx(d,{title:"",description:"",code:y})})})]}),e.jsxs(r,{className:"border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl",children:[e.jsxs(l,{className:"pb-3 px-4 pt-4",children:[e.jsxs("div",{className:"flex items-center justify-between w-full",children:[e.jsx(i,{className:"text-lg font-semibold text-gray-900 dark:text-gray-100",children:"Transform Data"}),e.jsx(s,{asChild:!0,variant:"outline",size:"sm",className:"text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300",children:e.jsxs(a,{to:"/transforming-data",onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),children:["Learn More ",e.jsx(t,{className:"ml-2 h-3 w-3"})]})})]}),e.jsx(o,{className:"text-sm text-gray-600 dark:text-gray-400 mt-2",children:"Add calculated columns using `mutate()` with access to row values, index, and full DataFrame context"})]}),e.jsx(n,{className:"px-0",children:e.jsx("div",{className:"[&_pre]:!rounded-none md:[&_pre]:!rounded-md",children:e.jsx(d,{title:"",description:"",code:j})})})]}),e.jsxs(r,{className:"border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl",children:[e.jsxs(l,{className:"pb-3 px-4 pt-4",children:[e.jsxs("div",{className:"flex items-center justify-between w-full",children:[e.jsx(i,{className:"text-lg font-semibold text-gray-900 dark:text-gray-100",children:"Group and Summarize"}),e.jsx(s,{asChild:!0,variant:"outline",size:"sm",className:"text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300",children:e.jsxs(a,{to:"/grouping-aggregation",onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),children:["Learn More ",e.jsx(t,{className:"ml-2 h-3 w-3"})]})})]}),e.jsx(o,{className:"text-sm text-gray-600 dark:text-gray-400 mt-2",children:"Group data by categories and calculate summary statistics with groupBy() and summarize()"})]}),e.jsx(n,{className:"px-0",children:e.jsx("div",{className:"[&_pre]:!rounded-none md:[&_pre]:!rounded-md",children:e.jsx(d,{title:"",description:"",code:f})})})]}),e.jsxs(r,{className:"border-0 shadow-sm gap-2 sm:gap-2 rounded-none md:rounded-xl",children:[e.jsxs(l,{className:"pb-3 px-4 pt-4",children:[e.jsxs("div",{className:"flex items-center justify-between w-full",children:[e.jsx(i,{className:"text-lg font-semibold text-gray-900 dark:text-gray-100",children:"Statistical Tests"}),e.jsx(s,{asChild:!0,variant:"outline",size:"sm",className:"text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:border-emerald-300",children:e.jsxs(a,{to:"/stats-module",onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),children:["Learn More ",e.jsx(t,{className:"ml-2 h-3 w-3"})]})})]}),e.jsx(o,{className:"text-sm text-gray-600 dark:text-gray-400 mt-2",children:"Perform hypothesis testing and correlation analysis using the `stats` module"})]}),e.jsx(n,{className:"px-0",children:e.jsx("div",{className:"[&_pre]:!rounded-none md:[&_pre]:!rounded-md",children:e.jsx(d,{title:"",description:"",code:N})})})]})]}),e.jsxs("section",{id:"research-evidence",className:"bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 md:p-8 border border-blue-100 dark:border-blue-900/30",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2",children:"Proven Bug Prevention"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300",children:"Empirical research shows that static typing significantly reduces production bugs"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2",children:"15%"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-300 mb-2",children:"GitHub Bug Fixes Preventable"}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsx("a",{href:"https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/gao2017javascript.pdf",target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"Gao et al. (2017) - JavaScript/TypeScript study"})})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2",children:"38%"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-300 mb-2",children:"Production Bugs Preventable"}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsx("a",{href:"https://www.youtube.com/watch?v=P-J9Eg7hJwE&feature=youtu.be&t=702",target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"Airbnb TypeScript migration case study"})})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2",children:"15%"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-300 mb-2",children:"Python Defects Preventable"}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsx("a",{href:"https://rebels.cs.uwaterloo.ca/papers/tse2021_khan.pdf",target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"Khan et al. (2021) - 210 open-source projects"})})]})]}),e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(b,{className:"h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-semibold text-gray-900 dark:text-gray-100 mb-2",children:"Research-Backed Type Safety"}),e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-300 mb-3",children:"Evidence suggests that static typing prevents 15-38% of bugs that would otherwise reach production. These are conservative estimates focusing on publicly visible, type-related defects."}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Note:"})," ","These figures represent lower bounds, excluding pre-commit logic issues and data validation bugs."]})})]})]})})]}),e.jsxs("section",{className:"text-center py-12",children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4",children:"Ready to get started?"}),e.jsx("p",{className:"text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto",children:"Start building data analytics workflows with type safety."}),e.jsx("div",{className:"flex justify-center",children:e.jsx(s,{asChild:!0,size:"lg",className:"bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-semibold rounded-lg",children:e.jsxs(a,{to:"/getting-started",onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),children:["Start Building ",e.jsx(t,{className:"ml-2 h-5 w-5"})]})})})]})]})})}export{S as component};
