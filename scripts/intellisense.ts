#!/usr/bin/env -S npx tsx
/**
 * Get TypeScript hover/tooltip information for a specific file:line:column.
 *
 * Usage:
 *   npx tsx scripts/intellisense.ts <file> <line:col> [line:col ...]
 *   npx tsx scripts/intellisense.ts packages/testing/bugs/test-join.ts 88:10
 *   npx tsx scripts/intellisense.ts packages/testing/bugs/test-join.ts 88:10 33:9 155:9
 *
 * Line and column are 1-based (like your editor shows).
 */

import ts from "typescript";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const file = args[0];
const positions = args.slice(1);

if (!file || positions.length === 0) {
  console.error("Usage: npx tsx scripts/intellisense.ts <file> <line:col> [line:col ...]");
  console.error("  line and column are 1-based");
  process.exit(1);
}

const filePath = path.resolve(file);

// Find tsconfig
function findTsConfig(startDir: string): string | undefined {
  let dir = startDir;
  while (true) {
    const candidate = path.join(dir, "tsconfig.json");
    if (ts.sys.fileExists(candidate)) return candidate;
    const denoCandidate = path.join(dir, "deno.json");
    if (ts.sys.fileExists(denoCandidate)) return denoCandidate;
    const parent = path.dirname(dir);
    if (parent === dir) return undefined;
    dir = parent;
  }
}

const configPath = findTsConfig(path.dirname(filePath));
let compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  allowJs: true,
  esModuleInterop: true,
};

if (configPath) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (!configFile.error) {
    const parsed = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(configPath),
    );
    compilerOptions = parsed.options;
  }
}

// Create language service
const files = new Map<string, { version: number; content: string }>();

const content = ts.sys.readFile(filePath);
if (!content) {
  console.error(`Cannot read file: ${filePath}`);
  process.exit(1);
}
files.set(filePath, { version: 0, content: content ?? "" });

const serviceHost: ts.LanguageServiceHost = {
  getScriptFileNames: () => [filePath],
  getScriptVersion: (fileName) => String(files.get(fileName)?.version ?? 0),
  getScriptSnapshot: (fileName) => {
    const entry = files.get(fileName);
    if (entry) return ts.ScriptSnapshot.fromString(entry.content);
    const text = ts.sys.readFile(fileName);
    if (text !== undefined) return ts.ScriptSnapshot.fromString(text);
    return undefined;
  },
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => compilerOptions,
  getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};

const service = ts.createLanguageService(serviceHost, ts.createDocumentRegistry());

const sourceFile = service.getProgram()?.getSourceFile(filePath);
if (!sourceFile) {
  console.error(`Cannot get source file: ${filePath}`);
  process.exit(1);
}

for (const pos of positions) {
  const [lineStr, colStr] = pos.split(":");
  const line = parseInt(lineStr, 10);
  const col = parseInt(colStr, 10);

  const offset = sourceFile?.getPositionOfLineAndCharacter(line - 1, col - 1);
  const info = offset ? service.getQuickInfoAtPosition(filePath, offset) : undefined;

  console.log(`\n=== ${file}:${line}:${col} ===`);

  if (!info) {
    console.log("(no type info)");
    continue;
  }

  const displayParts = info.displayParts?.map((p) => p.text).join("") ?? "";
  console.log(displayParts);
}
