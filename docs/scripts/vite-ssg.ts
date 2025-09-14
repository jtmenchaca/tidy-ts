#!/usr/bin/env node

import { build } from "vite";
import { resolve } from "path";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Routes to pre-render
const routesToPrerender = [
  "/",
  "/getting-started",
  "/creating-dataframes",
  "/dataframe-basics",
  "/selecting-columns",
  "/filtering-rows",
  "/transforming-data",
  "/grouping-aggregation",
  "/reshaping-data",
  "/joining-dataframes",
  "/sorting-arranging",
  "/transposing-data",
  "/missing-data",
  "/async-operations",
  "/combining-dataframes",
  "/stats-module",
  "/performance-benchmarks",
  "/examples/jupyter-notebooks",
  "/examples/comprehensive-workflows",
];

async function generateStaticSite() {
  console.log("🚀 Starting Vite SSG build...");
  
  try {
    // Build the project first
    console.log("📦 Building Vite project...");
    await build({
      configFile: resolve(__dirname, "../vite.config.ts"),
    });
    
    const outputDir = resolve(__dirname, "../dist");
    const baseHTMLPath = resolve(outputDir, "index.html");
    
    if (!existsSync(baseHTMLPath)) {
      console.error("❌ Built index.html not found. Build failed.");
      process.exit(1);
    }
    
    // Read the base HTML
    const baseHTML = readFileSync(baseHTMLPath, "utf8");
    
    console.log("📄 Generating static pages...");
    
    for (const route of routesToPrerender) {
      try {
        console.log(`  📄 Generating: ${route}`);
        
        // Generate route-specific HTML
        const html = generateRouteHTML(route, baseHTML);
        
        // Determine the output path
        const outputPath = route === "/" 
          ? resolve(outputDir, "index.html")
          : resolve(outputDir, route.substring(1), "index.html");
        
        // Ensure directory exists
        const dir = resolve(outputPath, "..");
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
        
        // Write the file
        writeFileSync(outputPath, html, "utf8");
        
        console.log(`  ✅ Generated: ${outputPath}`);
      } catch (error) {
        console.error(`  ❌ Error generating ${route}:`, error);
      }
    }
    
    console.log("🎉 Static site generation complete!");
    console.log(`📁 Output directory: ${outputDir}`);
    console.log(`📊 Generated ${routesToPrerender.length} static pages`);
    
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

function generateRouteHTML(route: string, baseHTML: string): string {
  // Update the title based on the route
  const routeTitle = route === "/" 
    ? "Tidy-TS Documentation"
    : `Tidy-TS Documentation - ${route.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`;
  
  // Update the title in the HTML
  let html = baseHTML.replace(
    /<title>.*?<\/title>/,
    `<title>${routeTitle}</title>`
  );
  
  // Add route-specific meta description
  const descriptions: Record<string, string> = {
    "/": "TypeScript data manipulation and statistics library documentation",
    "/getting-started": "Get up and running with Tidy-TS in minutes. Learn installation, basic concepts, and start working with DataFrames right away.",
    "/creating-dataframes": "Learn how to create DataFrames from various data sources with Tidy-TS",
    "/dataframe-basics": "Essential DataFrame operations and concepts in Tidy-TS",
    "/selecting-columns": "Select and manipulate columns in your DataFrames",
    "/filtering-rows": "Filter and subset your data with powerful row selection methods",
    "/transforming-data": "Transform and reshape your data with Tidy-TS operations",
    "/grouping-aggregation": "Group data and perform aggregations for statistical analysis",
    "/reshaping-data": "Reshape and pivot your data for different analysis needs",
    "/joining-dataframes": "Join and merge multiple DataFrames together",
    "/sorting-arranging": "Sort and arrange your data in various ways",
    "/transposing-data": "Transpose and pivot your data structures",
    "/missing-data": "Handle missing data and null values effectively",
    "/async-operations": "Perform asynchronous data operations and streaming",
    "/combining-dataframes": "Combine multiple DataFrames using various methods",
    "/stats-module": "Statistical functions and comprehensive data analysis",
    "/performance-benchmarks": "Performance comparisons and optimization tips",
    "/examples/jupyter-notebooks": "Jupyter notebook examples and tutorials",
    "/examples/comprehensive-workflows": "Complete data analysis workflow examples",
  };
  
  const description = descriptions[route] || "Tidy-TS documentation page";
  
  // Add or update meta description
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta name="description" content=".*?" \/>/,
      `<meta name="description" content="${description}" />`
    );
  } else {
    // Insert after viewport meta tag
    html = html.replace(
      /<meta name="viewport" content="[^"]*" \/>/,
      `$&\n    <meta name="description" content="${description}" />`
    );
  }
  
  return html;
}

// Run the generation
generateStaticSite().catch(console.error);
