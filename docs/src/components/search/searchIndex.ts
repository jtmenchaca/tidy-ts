export interface SearchResult {
  title: string;
  path: string;
  content: string;
  category: string;
  type: "page" | "section";
  keywords: string[];
}

// Comprehensive search index for all documentation content
export const searchIndex: SearchResult[] = [
  // Getting Started
  {
    title: "Getting Started",
    path: "/getting-started",
    content:
      "Installation, basic concepts, and start working with DataFrames. Learn TypeScript integration and 5-minute tutorial.",
    category: "Core",
    type: "page",
    keywords: [
      "install",
      "setup",
      "beginning",
      "tutorial",
      "npm",
      "deno",
      "typescript",
    ],
  },

  // Core Operations
  {
    title: "Creating DataFrames",
    path: "/creating-dataframes",
    content:
      "Learn to create DataFrames from arrays, objects, CSV files, and various data sources. TypeScript support included.",
    category: "Core",
    type: "page",
    keywords: [
      "create",
      "new",
      "array",
      "object",
      "csv",
      "data",
      "source",
      "from",
    ],
  },
  {
    title: "Transforming Data",
    path: "/transforming-data",
    content:
      "Add calculated columns with mutate(). Transform data, add new columns, calculations, and derived values.",
    category: "Core",
    type: "page",
    keywords: [
      "mutate",
      "transform",
      "calculate",
      "add",
      "column",
      "derive",
      "change",
    ],
  },
  {
    title: "Filtering Rows",
    path: "/filtering-rows",
    content:
      "Filter data based on conditions. Use filter() to subset rows that match specific criteria and conditions.",
    category: "Core",
    type: "page",
    keywords: [
      "filter",
      "subset",
      "condition",
      "where",
      "criteria",
      "match",
      "rows",
    ],
  },
  {
    title: "Selecting Columns",
    path: "/selecting-columns",
    content:
      "Choose specific columns to work with. Use select() to pick columns by name, pattern, or condition.",
    category: "Core",
    type: "page",
    keywords: ["select", "columns", "pick", "choose", "fields", "properties"],
  },
  {
    title: "Sorting & Arranging",
    path: "/sorting-arranging",
    content:
      "Sort and arrange your data. Use arrange() to order rows by one or more columns in ascending or descending order.",
    category: "Core",
    type: "page",
    keywords: ["sort", "arrange", "order", "ascending", "descending", "rank"],
  },
  {
    title: "Column Access & Extract",
    path: "/column-access",
    content:
      "Access and extract data from columns. Get column values, iterate over data, and extract specific values.",
    category: "Core",
    type: "page",
    keywords: [
      "access",
      "extract",
      "get",
      "column",
      "values",
      "iterate",
      "data",
    ],
  },

  // Advanced Operations
  {
    title: "Grouping & Aggregation",
    path: "/grouping-aggregation",
    content:
      "Group data and calculate summaries. Use groupBy() and summarize() for statistical analysis and aggregations.",
    category: "Advanced",
    type: "page",
    keywords: [
      "group",
      "aggregate",
      "summarize",
      "statistics",
      "sum",
      "mean",
      "count",
    ],
  },
  {
    title: "Joining DataFrames",
    path: "/joining-dataframes",
    content:
      "Combine data from multiple sources. Inner, left, right, and outer joins to merge DataFrames.",
    category: "Advanced",
    type: "page",
    keywords: [
      "join",
      "merge",
      "combine",
      "inner",
      "left",
      "right",
      "outer",
      "union",
    ],
  },
  {
    title: "Reshaping Data",
    path: "/reshaping-data",
    content:
      "Pivot and reshape your data. Convert between wide and long formats using pivot and melt operations.",
    category: "Advanced",
    type: "page",
    keywords: [
      "reshape",
      "pivot",
      "melt",
      "wide",
      "long",
      "format",
      "transpose",
    ],
  },
  {
    title: "Missing Data Handling",
    path: "/missing-data",
    content:
      "Handle missing values effectively. Deal with null, undefined, and missing data using various strategies.",
    category: "Advanced",
    type: "page",
    keywords: [
      "missing",
      "null",
      "undefined",
      "na",
      "handle",
      "clean",
      "impute",
    ],
  },
  {
    title: "Stats Module",
    path: "/stats-module",
    content:
      "Comprehensive statistical functions. Descriptive statistics, distributions, and mathematical operations.",
    category: "Advanced",
    type: "page",
    keywords: [
      "statistics",
      "stats",
      "math",
      "mean",
      "median",
      "std",
      "distribution",
    ],
  },

  // DataFrame Properties
  {
    title: "DataFrame Properties",
    path: "/dataframe-properties",
    content:
      "Basic properties and methods of DataFrames. Length, shape, columns, and basic information.",
    category: "Properties",
    type: "page",
    keywords: ["properties", "length", "shape", "columns", "info", "basic"],
  },
  {
    title: "Iterating Over Rows",
    path: "/iterating-rows",
    content:
      "Iterate through DataFrame rows. Use for...of loops and other iteration methods to process data.",
    category: "Properties",
    type: "page",
    keywords: ["iterate", "loop", "rows", "foreach", "map", "process"],
  },
  {
    title: "TypeScript Types",
    path: "/typescript-types",
    content:
      "TypeScript integration and type safety. Automatic type inference, custom types, and type-safe operations.",
    category: "Properties",
    type: "page",
    keywords: [
      "typescript",
      "types",
      "safety",
      "inference",
      "generic",
      "interface",
    ],
  },

  // Advanced Features
  {
    title: "Combining DataFrames",
    path: "/combining-dataframes",
    content:
      "Advanced techniques for combining DataFrames. Concatenation, binding, and complex merge operations.",
    category: "Advanced Features",
    type: "page",
    keywords: ["combine", "concatenate", "bind", "merge", "append", "union"],
  },
  {
    title: "Transposing Data",
    path: "/transposing-data",
    content:
      "Transpose DataFrames to swap rows and columns. Rotate data for different analysis perspectives.",
    category: "Advanced Features",
    type: "page",
    keywords: ["transpose", "rotate", "swap", "rows", "columns", "flip"],
  },
  {
    title: "Performance Benchmarks",
    path: "/performance-benchmarks",
    content:
      "Performance analysis and benchmarks. Speed comparisons, optimization tips, and best practices.",
    category: "Advanced Features",
    type: "page",
    keywords: [
      "performance",
      "benchmark",
      "speed",
      "optimization",
      "fast",
      "efficient",
    ],
  },

  // Examples
  {
    title: "Comprehensive Workflows",
    path: "/examples/comprehensive-workflows",
    content:
      "Real-world data analysis examples. Complete workflows showing end-to-end data processing examples.",
    category: "Examples",
    type: "page",
    keywords: [
      "examples",
      "workflow",
      "real-world",
      "complete",
      "tutorial",
      "demo",
    ],
  },
  {
    title: "Jupyter Notebooks",
    path: "/examples/jupyter-notebooks",
    content:
      "Interactive data analysis with Deno Jupyter. Rich visualizations, widgets, and real-time analysis in notebooks.",
    category: "Examples",
    type: "page",
    keywords: [
      "jupyter",
      "notebook",
      "interactive",
      "deno",
      "visualization",
      "widgets",
      "rich output",
      "analysis",
    ],
  },

  // Common search terms and concepts
  {
    title: "Data Analysis",
    path: "/getting-started",
    content:
      "Complete data analysis workflows using tidy-ts. Statistical analysis, data manipulation, and insights.",
    category: "Concepts",
    type: "section",
    keywords: [
      "data analysis",
      "analytics",
      "insights",
      "statistics",
      "workflow",
    ],
  },
  {
    title: "Method Chaining",
    path: "/getting-started",
    content:
      "Chain operations together for readable data processing pipelines. Fluent API design patterns.",
    category: "Concepts",
    type: "section",
    keywords: [
      "chaining",
      "pipeline",
      "fluent",
      "chain",
      "methods",
      "operations",
    ],
  },
];

// Search function with fuzzy matching and scoring
export function searchContent(query: string): SearchResult[] {
  if (!query.trim()) return [];

  const searchTerms = query.toLowerCase().split(" ").filter((term) =>
    term.length > 0
  );
  const results: Array<SearchResult & { score: number }> = [];

  for (const item of searchIndex) {
    let score = 0;
    const searchableText = [
      item.title,
      item.content,
      item.category,
      ...item.keywords,
    ].join(" ").toLowerCase();

    // Exact title match gets highest score
    if (item.title.toLowerCase().includes(query.toLowerCase())) {
      score += 100;
    }

    // Check each search term
    for (const term of searchTerms) {
      // Title matches
      if (item.title.toLowerCase().includes(term)) {
        score += 50;
      }

      // Content matches
      if (item.content.toLowerCase().includes(term)) {
        score += 20;
      }

      // Category matches
      if (item.category.toLowerCase().includes(term)) {
        score += 30;
      }

      // Keywords matches
      for (const keyword of item.keywords) {
        if (keyword.includes(term)) {
          score += 40;
        }
      }

      // Partial matches in searchable text
      if (searchableText.includes(term)) {
        score += 10;
      }
    }

    // Boost score for multiple term matches
    const matchedTerms = searchTerms.filter((term) =>
      searchableText.includes(term)
    );
    score += (matchedTerms.length / searchTerms.length) * 25;

    if (score > 0) {
      results.push({ ...item, score });
    }
  }

  // Sort by score and return top results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score, ...item }) => item);
}
