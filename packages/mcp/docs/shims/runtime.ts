import type { DocEntry } from "../mcp-types.ts";

export const runtimeDocs: Record<string, DocEntry> = {
  getCurrentRuntime: {
    name: "getCurrentRuntime",
    category: "shims",
    signature: "getCurrentRuntime(): Runtime",
    description:
      "Detects the current JavaScript runtime environment. Returns an enum value identifying whether code is running in Deno, Bun, Node.js, Browser, or other environments. Useful for conditional logic based on runtime capabilities.",
    imports: [
      'import { getCurrentRuntime, Runtime } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns:
      "Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)",
    examples: [
      '// Detect current runtime\nimport { getCurrentRuntime, Runtime } from "@tidy-ts/shims";\n\nconst runtime = getCurrentRuntime();\nif (runtime === Runtime.Deno) {\n  console.log("Running in Deno");\n} else if (runtime === Runtime.Node) {\n  console.log("Running in Node.js");\n}',
      "// Use for conditional imports or logic\nif (getCurrentRuntime() === Runtime.Browser) {\n  // Browser-specific code\n} else {\n  // Server-side code\n}",
    ],
    related: ["currentRuntime", "Runtime"],
    bestPractices: [
      "✓ GOOD: Use for conditional logic based on runtime capabilities",
      "✓ GOOD: Check runtime before using platform-specific APIs",
      "✓ GOOD: Prefer runtime-agnostic shims over direct runtime checks when possible",
    ],
  },

  currentRuntime: {
    name: "currentRuntime",
    category: "shims",
    signature: "const currentRuntime: Runtime",
    description:
      "Cached runtime detection result. Determined once when module loads, providing fast access to runtime information without repeated detection.",
    imports: [
      'import { currentRuntime, Runtime } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns:
      "Runtime enum value (Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, or Unsupported)",
    examples: [
      '// Quick runtime check\nimport { currentRuntime, Runtime } from "@tidy-ts/shims";\n\nif (currentRuntime === Runtime.Deno) {\n  console.log("Running in Deno");\n}',
      "// Conditional configuration\nconst config = {\n  timeout: currentRuntime === Runtime.Browser ? 5000 : 30000,\n};",
    ],
    related: ["getCurrentRuntime", "Runtime"],
    bestPractices: [
      "✓ GOOD: Use this constant for performance (cached value)",
      "✓ GOOD: Prefer over repeated getCurrentRuntime() calls",
    ],
  },

  Runtime: {
    name: "Runtime",
    category: "shims",
    signature:
      "enum Runtime { Deno, Bun, Node, Browser, Tauri, Workerd, Netlify, EdgeLight, Fastly, Unsupported }",
    description:
      "Enum of supported JavaScript runtime environments. Used with getCurrentRuntime() and currentRuntime for type-safe runtime detection.",
    imports: [
      'import { Runtime } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Enum type",
    examples: [
      '// Use enum values for comparison\nimport { currentRuntime, Runtime } from "@tidy-ts/shims";\n\nswitch (currentRuntime) {\n  case Runtime.Deno:\n    console.log("Deno runtime");\n    break;\n  case Runtime.Node:\n    console.log("Node.js runtime");\n    break;\n  case Runtime.Bun:\n    console.log("Bun runtime");\n    break;\n  case Runtime.Browser:\n    console.log("Browser runtime");\n    break;\n}',
    ],
    related: ["getCurrentRuntime", "currentRuntime"],
    bestPractices: [
      "✓ GOOD: Use enum values for type-safe comparisons",
      "✓ GOOD: Handle Runtime.Unsupported case for unknown environments",
    ],
  },

  UnavailableAPIError: {
    name: "UnavailableAPIError",
    category: "shims",
    signature: "class UnavailableAPIError extends Error",
    description:
      "Error thrown when an API is not available in the current runtime. Contains information about which API was called and which runtime it was called in.",
    imports: [
      'import { UnavailableAPIError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error instance",
    examples: [
      '// Catch unavailable API\nimport { readFile, UnavailableAPIError } from "@tidy-ts/shims";\n\ntry {\n  await readFile("./file.txt");\n} catch (error) {\n  if (error instanceof UnavailableAPIError) {\n    console.error("File system not available in this runtime");\n  }\n}',
    ],
    related: ["UnsupportedRuntimeError"],
    bestPractices: [
      "✓ GOOD: Check for this error when using file system APIs in browsers",
    ],
  },

  UnsupportedRuntimeError: {
    name: "UnsupportedRuntimeError",
    category: "shims",
    signature: "class UnsupportedRuntimeError extends Error",
    description:
      "Error thrown when code is running in an unsupported runtime. Contains information about detected runtime and list of supported runtimes.",
    imports: [
      'import { UnsupportedRuntimeError } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "Error instance",
    examples: [
      '// Catch unsupported runtime\nimport { getCurrentRuntime, UnsupportedRuntimeError } from "@tidy-ts/shims";\n\ntry {\n  const runtime = getCurrentRuntime();\n  // Some runtime-specific logic\n} catch (error) {\n  if (error instanceof UnsupportedRuntimeError) {\n    console.error("This runtime is not supported");\n  }\n}',
    ],
    related: ["UnavailableAPIError", "getCurrentRuntime"],
    bestPractices: [
      "✓ GOOD: Use to gracefully handle unsupported environments",
    ],
  },
};
