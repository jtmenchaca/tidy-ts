import type { DocEntry } from "../mcp-types.ts";

export const envDocs: Record<string, DocEntry> = {
  env: {
    name: "env",
    category: "shims",
    signature:
      "env.get(key: string): string | undefined\nenv.set(key: string, value: string): void\nenv.delete(key: string): void\nenv.toObject(): Record<string, string>\nenv.loadFromFile(path: string | string[] | URL, options?: { export?: boolean }): Promise<Record<string, string>>\nenv.loadFromFileSync(path: string | string[] | URL, options?: { export?: boolean }): Record<string, string>",
    description:
      "Access and modify environment variables in a runtime-agnostic way. Provides get() to retrieve individual variables, set() to modify them, delete() to remove them, toObject() to get all environment variables as an object, and loadFromFile() to load variables from .env files.",
    imports: [
      'import { env } from "@tidy-ts/shims";',
    ],
    parameters: [
      "key: Environment variable name",
      "value: Value to set (for set() method)",
      "path: File path(s) or URL to .env file(s) (for loadFromFile)",
      "options.export: Whether to export loaded vars to process environment (default: true)",
    ],
    returns:
      "string | undefined (for get), void (for set/delete), Record<string, string> (for toObject/loadFromFile)",
    examples: [
      '// Get environment variable\nimport { env } from "@tidy-ts/shims";\n\nconst apiKey = env.get("API_KEY");\nif (!apiKey) {\n  throw new Error("API_KEY not set");\n}',
      '// Set environment variable\nenv.set("DEBUG", "true");\nenv.set("LOG_LEVEL", "verbose");',
      '// Delete environment variable\nenv.delete("TEMP_VAR");',
      "// Get all environment variables\nconst allEnv = env.toObject();\nconsole.log(allEnv);",
      "// With default value\nconst port = env.get('PORT') || '3000';",
      '// Load from .env file (exports to environment by default)\nawait env.loadFromFile(".env");',
      '// Load from multiple files (later files override earlier ones)\nconst config = await env.loadFromFile([".env", ".env.local", ".env.production"]);',
      '// Load without exporting to process environment\nconst config = await env.loadFromFile(".env", { export: false });',
      '// Synchronous loading\nconst configSync = env.loadFromFileSync(".env");',
      '// Load from URL\nconst config = await env.loadFromFile(new URL("file:///path/to/.env"));',
    ],
    related: ["args", "exit"],
    bestPractices: [
      "✓ GOOD: Use get() for reading variables",
      "✓ GOOD: Use set() for temporarily modifying variables (e.g., in tests)",
      "✓ GOOD: Always check for undefined when variable might not be set",
      "✓ GOOD: Provide sensible defaults for optional config",
      "✓ GOOD: Restore original values after temporary modifications",
      "✓ GOOD: Use loadFromFile() at app startup to load .env configuration",
      "✓ GOOD: Load multiple .env files in order of precedence (e.g., .env, .env.local)",
      "✓ GOOD: Existing environment variables are never overridden by .env files",
    ],
  },

  args: {
    name: "args",
    category: "shims",
    signature: "const args: readonly string[]",
    description:
      "Command line arguments passed to the script. Frozen for immutability. Excludes runtime executable and script path (just the arguments).",
    imports: [
      'import { args } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "readonly string[] - Array of command line arguments",
    examples: [
      '// Access command line arguments\nimport { args } from "@tidy-ts/shims";\n\nconsole.log("Arguments:", args);\nif (args.length > 0) {\n  console.log("First arg:", args[0]);\n}',
      "// Process flags\nconst verbose = args.includes('--verbose');\nconst debug = args.includes('--debug');",
    ],
    related: ["getArgs", "env"],
    bestPractices: [
      "✓ GOOD: Immutable array (readonly)",
      "✓ GOOD: Excludes runtime name and script path",
    ],
  },

  getArgs: {
    name: "getArgs",
    category: "shims",
    signature: "getArgs(): readonly string[]",
    description:
      "Get command line arguments as a function call. Returns the same data as the args constant but as a function.",
    imports: [
      'import { getArgs } from "@tidy-ts/shims";',
    ],
    parameters: [],
    returns: "readonly string[] - Array of command line arguments",
    examples: [
      '// Get arguments\nimport { getArgs } from "@tidy-ts/shims";\n\nconst arguments = getArgs();\nconsole.log(arguments);',
    ],
    related: ["args"],
    bestPractices: [
      "✓ GOOD: Use args constant for simpler access",
    ],
  },

  exit: {
    name: "exit",
    category: "shims",
    signature: "exit(code: number): never",
    description:
      "Exit the process with the given exit code. 0 indicates success, non-zero indicates failure. Never returns.",
    imports: [
      'import { exit } from "@tidy-ts/shims";',
    ],
    parameters: [
      "code: Exit code (0 = success, non-zero = failure)",
    ],
    returns: "never - Function never returns",
    examples: [
      '// Exit successfully\nimport { exit } from "@tidy-ts/shims";\n\nexit(0);',
      "// Exit with error\nif (!config.isValid) {\n  console.error('Invalid configuration');\n  exit(1);\n}",
    ],
    related: ["args", "env"],
    bestPractices: [
      "✓ GOOD: Use 0 for success",
      "✓ GOOD: Use non-zero (typically 1) for errors",
      "✓ GOOD: Log error messages before exiting",
    ],
  },

  test: {
    name: "test",
    category: "shims",
    signature:
      "test(name: string, testFn: (() => void | Promise<void>) | TestSubject, options?: WrappedTestOptions): Promise<void>",
    description:
      "Cross-runtime testing framework that works identically in Deno, Bun, and Node.js. Define and execute tests with a unified API. Supports async tests, timeouts, and skip functionality.",
    imports: [
      'import { test } from "@tidy-ts/shims";',
    ],
    parameters: [
      "name: Test name/description",
      "testFn: Test function (async or sync)",
      "options.timeout: Timeout duration in milliseconds (optional)",
      "options.skip: Whether to skip the test (optional)",
      "options.waitForCallback: Wait for done callback in async tests (optional)",
    ],
    returns: "Promise<void>",
    examples: [
      '// Simple test\nimport { test } from "@tidy-ts/shims";\n\ntest("addition works", () => {\n  const result = 1 + 1;\n  if (result !== 2) throw new Error("Math is broken!");\n});',
      '// Async test\ntest("async operation", async () => {\n  const data = await fetchData();\n  if (!data) throw new Error("No data received");\n});',
      "// Test with timeout\ntest('slow operation', async () => {\n  await slowOperation();\n}, { timeout: 5000 });",
      "// Skip test\ntest('not ready yet', () => {\n  // Test code\n}, { skip: true });",
    ],
    related: [],
    bestPractices: [
      "✓ GOOD: Use async/await for async tests",
      "✓ GOOD: Set reasonable timeouts for slow operations",
      "✓ GOOD: Use skip: true for tests that aren't ready",
      "✓ GOOD: Throw errors for test failures",
    ],
    antiPatterns: [
      "❌ BAD: Not setting timeouts on potentially slow tests",
      "❌ BAD: Leaving skipped tests in codebase long-term",
    ],
  },
};
