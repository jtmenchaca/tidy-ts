import{j as e}from"./radix-BuIbRv-a.js";import{b as n,T as d,B as a,G as m,D as h,L as t,C as x}from"./index-jU-cbpu9.js";import{C as r,a as i,b as o,c as l,d as c}from"./card--XqZNj_C.js";import{C as g}from"./code-block-B7aOnjQg.js";import"./recharts-BW8nexKl.js";import"./shiki-wKCgTG-o.js";import"./shiki-themes-BheiPiei.js";/**
 * @license lucide-react v0.476.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],s=n("ArrowRight",p);/**
 * @license lucide-react v0.476.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],y=n("Shield",u),b=`import { createDataFrame, stats as s } from "@tidy-ts/dataframe";

// 1. Load character data
const characters = createDataFrame([
  { name: "Luke", species: "Human", mass_kg: 77, height_cm: 172, homeworld: "Tatooine" },
  { name: "Anakin", species: "Human", mass_kg: 84, height_cm: 188, homeworld: "Tatooine" },
  { name: "Shmi", species: "Human", mass_kg: 55, height_cm: 160, homeworld: "Tatooine" },
  { name: "C-3PO", species: "Droid", mass_kg: 75, height_cm: 167, homeworld: "Tatooine" },
  { name: "R2-D2", species: "Droid", mass_kg: 32, height_cm: 96, homeworld: "Naboo" },
  { name: "Leia", species: "Human", mass_kg: 49, height_cm: 150, homeworld: "Alderaan" },
  { name: "Bail Organa", species: "Human", mass_kg: 70, height_cm: 175, homeworld: "Alderaan" },
  { name: "Han", species: "Human", mass_kg: 80, height_cm: 180, homeworld: "Corellia" },
  { name: "Chewbacca", species: "Wookiee", mass_kg: 112, height_cm: 228, homeworld: "Kashyyyk" },
]);

// 2. Transform and summarize
const analysis = characters.mutate({
  mass_lbs: (r) => r.mass_kg * 2.20462,
  height_in: (r) => r.height_cm / 2.54,
  bmi: (r) => r.mass_kg / ((r.height_cm / 100) ** 2),
});

const summary = analysis
  .groupBy("homeworld")
  .summarize({
    avg_mass_lbs: (group) => s.mean(group.mass_lbs),
    avg_height_in: (group) => s.mean(group.height_in),
    character_count: (group) => group.nrows(),
  })
  .arrange("avg_mass_lbs", "desc");

summary.print("Character Analysis by Homeworld");

// 3. Hypothesis: Do Tatooine natives have lower body mass due to harsh desert conditions?
const tatooine = characters.filter((r) => r.homeworld === "Tatooine");
const others = characters.filter((r) => r.homeworld !== "Tatooine");

const weightTest = s.compare.twoGroups.centralTendency.toEachOther({
  x: tatooine.mass_kg,
  y: others.mass_kg,
  parametric: "parametric",
});

console.log(\`Desert weight effect? p-value: \${weightTest.p_value.toFixed(3)}\`);

// 4. Hypothesis: Are droid proportions statistically similar to human body types?
const humans = analysis.filter((r) => r.species === "Human");
const droids = analysis.filter((r) => r.species === "Droid");

const bmiTest = s.compare.twoGroups.centralTendency.toEachOther({
  x: humans.bmi,
  y: droids.bmi,
  parametric: "nonparametric",
});

console.log(\`Droid conspiracy? p-value: \${bmiTest.p_value.toFixed(3)}\`);

// 🏅 Galactic Awards
const tallest = characters.arrange("height_cm", "desc").slice(0, 1).extract("name")[0];
const heaviest = characters.sliceMax("mass_kg", 1).name[0];
const lightest = characters.sliceMin("mass_kg", 1).name[0];

console.log(\`🏅 Awards: Tallest=\${tallest}, Heaviest=\${heaviest}, Lightest=\${lightest}\`);

// 5. Iterate over the dataframe
console.log("🕵️ Imperial Watchlist Activity Log:");

characters.forEachRow((char) => {
  if (char.homeworld === "Tatooine" && char.species === "Human") {
    console.log(\`🔍 Subject flagged: \${char.name} (origin: Tatooine, species: \${char.species})\`);
  }
});`;function T(){return e.jsx("div",{className:"flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto",children:e.jsxs("div",{className:"container mx-auto max-w-4xl space-y-6 md:space-y-8 relative",children:[e.jsxs("section",{className:"relative text-center py-12 sm:py-20",children:[e.jsx("div",{className:"absolute -left-25 -top-30 opacity-4 dark:opacity-10 pointer-events-none",children:e.jsx("img",{src:d,alt:"",className:"w-96 h-96 sm:w-[600px] sm:h-[600px] md:w-[600px] md:h-[600px] lg:w-[600px] lg:h-[600px] xl:w-[600px] xl:h-[600px]"})}),e.jsxs("div",{className:"relative z-10",children:[e.jsx("h1",{className:"text-5xl sm:text-6xl lg:text-7xl font-bold text-orange-600 mb-6",children:"Tidy-TS"}),e.jsx("h2",{className:"text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-8 leading-tight",children:"Data analytics framework"}),e.jsxs("p",{className:"text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto",children:["Type-safe data analytics and statistics in TypeScript. Research shows static typing prevents 15-38% of production bugs",e.jsx("sup",{className:"text-blue-600 dark:text-blue-400",children:e.jsx("a",{href:"#research-evidence",className:"hover:underline",title:"View research details and sources",children:"1,2,3"})}),". Built for modern data science workflows."]}),e.jsx("div",{className:"flex flex-col sm:flex-row justify-center gap-4",children:e.jsx(a,{asChild:!0,size:"lg",variant:"outline",className:"border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 px-8 py-3 text-lg font-semibold rounded-lg",children:e.jsxs("a",{href:"https://github.com/jtmenchaca/tidy-ts",target:"_blank",rel:"noopener noreferrer",className:"flex items-center gap-2",children:[e.jsx(m,{className:"h-5 w-5"}),"View on GitHub"]})})})]})]}),e.jsxs("section",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8",children:[e.jsxs(r,{className:"border-0 shadow-lg",children:[e.jsxs(i,{children:[e.jsxs(o,{className:"flex items-center gap-3 text-xl",children:[e.jsx(h,{className:"h-6 w-6 text-orange-600"}),"Type-Safe Data Operations"]}),e.jsx(l,{className:"text-base",children:"DataFrame operations with full TypeScript support"})]}),e.jsxs(c,{children:[e.jsx("p",{className:"text-gray-600 dark:text-gray-300 mb-4",children:"Create, transform, filter, select, and sort data with chaining and automatic column typing for compile-time safety."}),e.jsx(a,{asChild:!0,variant:"ghost",size:"sm",className:"text-orange-600 hover:text-orange-700",children:e.jsxs(t,{to:"/creating-dataframes",children:["Learn More ",e.jsx(s,{className:"ml-2 h-3 w-3"})]})})]})]}),e.jsxs(r,{className:"border-0 shadow-lg",children:[e.jsxs(i,{children:[e.jsxs(o,{className:"flex items-center gap-3 text-xl",children:[e.jsx(x,{className:"h-6 w-6 text-orange-600"}),"Statistical Analysis"]}),e.jsx(l,{className:"text-base",children:"Comprehensive statistical analysis toolkit"})]}),e.jsxs(c,{children:[e.jsx("p",{className:"text-gray-600 dark:text-gray-300 mb-4",children:"80+ functions across descriptive statistics, hypothesis testing, and probability distributions. All tests rigorously vetted against results in R."}),e.jsx(a,{asChild:!0,variant:"ghost",size:"sm",className:"text-orange-600 hover:text-orange-700",children:e.jsxs(t,{to:"/stats-module",children:["Learn More ",e.jsx(s,{className:"ml-2 h-3 w-3"})]})})]})]})]}),e.jsxs("section",{className:"bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-6 md:p-8 border border-orange-100 dark:border-orange-900/30",children:[e.jsxs("div",{className:"text-center mb-6",children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2",children:"See Tidy-TS in Action"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300",children:"Data analysis workflow in just a few lines"})]}),e.jsx(g,{title:"",description:"",code:b})]}),e.jsxs("section",{id:"research-evidence",className:"bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-6 md:p-8 border border-blue-100 dark:border-blue-900/30",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2",children:"Proven Bug Prevention"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300",children:"Empirical research shows static typing prevents significant bugs in production"})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2",children:"15%"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-300 mb-2",children:"GitHub Bug Fixes Preventable"}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsx("a",{href:"https://www.microsoft.com/en-us/research/wp-content/uploads/2017/09/gao2017javascript.pdf",target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"Gao et al. (2017) - JavaScript/TypeScript study"})})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2",children:"38%"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-300 mb-2",children:"Production Bugs Preventable"}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsx("a",{href:"https://www.youtube.com/watch?v=P-J9Eg7hJwE&feature=youtu.be&t=702",target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"Airbnb TypeScript migration case study"})})]}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2",children:"15%"}),e.jsx("div",{className:"text-sm text-gray-600 dark:text-gray-300 mb-2",children:"Python Defects Preventable"}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsx("a",{href:"https://rebels.cs.uwaterloo.ca/papers/tse2021_khan.pdf",target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 dark:text-blue-400 hover:underline",children:"Khan et al. (2021) - 210 open-source projects"})})]})]}),e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx(y,{className:"h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-semibold text-gray-900 dark:text-gray-100 mb-2",children:"Research-Backed Type Safety"}),e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-300 mb-3",children:"Evidence suggests that static typing prevents 15-38% of bugs that would otherwise reach production. These are conservative estimates focusing on publicly visible, type-related defects."}),e.jsx("div",{className:"text-xs text-gray-500 dark:text-gray-400",children:e.jsxs("p",{children:[e.jsx("strong",{children:"Note:"})," ","These figures represent lower bounds, excluding pre-commit logic issues and data validation bugs."]})})]})]})})]}),e.jsxs("section",{className:"text-center py-12",children:[e.jsx("h3",{className:"text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4",children:"Ready to get started?"}),e.jsx("p",{className:"text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto",children:"Start building data analytics with type safety."}),e.jsx("div",{className:"flex justify-center",children:e.jsx(a,{asChild:!0,size:"lg",className:"bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 text-lg font-semibold rounded-lg",children:e.jsxs(t,{to:"/getting-started",onClick:()=>window.scrollTo({top:0,behavior:"smooth"}),children:["Get Started ",e.jsx(s,{className:"ml-2 h-5 w-5"})]})})})]})]})})}export{T as component};
