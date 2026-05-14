#!/usr/bin/env -S npx tsx
/**
 * Get TypeScript hover/tooltip information for identifiers in a file.
 *
 * Usage:
 *   npx tsx scripts/intellisense.ts <file> <name> [name ...]
 *   npx tsx scripts/intellisense.ts <file> <line:col> [line:col ...]
 *
 * Examples:
 *   npx tsx scripts/intellisense.ts packages/testing/bugs/test-join.ts arranged dropped mutated
 *   npx tsx scripts/intellisense.ts packages/testing/bugs/test-join.ts 88:10 33:9
 *
 * Names are matched against variable declarations, type aliases, function declarations,
 * and other named identifiers. If a name appears multiple times, all occurrences are shown.
 * Line:col positions are 1-based (like your editor shows).
 *
 * ─── Setup notes (read this if hovers come back as `any`) ─────────────────────
 *
 * The script drives TypeScript's LanguageService directly — it does NOT use
 * Deno's module graph. To resolve imports it needs:
 *
 *   1. A populated `node_modules/` at the repo root containing `typescript`
 *      and `tsx` (plus tsx's deps: `esbuild`, `@esbuild/*`, `get-tsconfig`,
 *      `resolve-pkg-maps`). `pnpm install` is the normal way to get these.
 *      If `pnpm install` is unavailable, a fresh `npm install typescript tsx`
 *      in any throwaway directory and copying those package folders into the
 *      repo's `node_modules/` works too.
 *
 *   2. Workspace package symlinks for any `@tidy-ts/*` imports, since the
 *      repo is Deno/JSR-first and there's no published npm package layout
 *      inside `node_modules/` after step 1 alone. Create them by hand:
 *        mkdir -p node_modules/@tidy-ts
 *        ln -sf "$(pwd)/packages/dataframe" node_modules/@tidy-ts/dataframe
 *        ln -sf "$(pwd)/packages/shims"     node_modules/@tidy-ts/shims
 *      (Add more as needed: arrow, parquet, etc.)
 *
 *   3. Invoke via the local tsx, not `npx tsx` — `npx tsx` downloads its own
 *      copy and won't see the project's `typescript`, producing
 *      `Cannot find package 'typescript'`. The package.json script entry
 *      `pnpm intellisense` works once node_modules is populated; otherwise
 *      run `./node_modules/.bin/tsx scripts/intellisense.ts <file> <name>`
 *      directly.
 *
 *   4. The findTsConfig() lookup matches `tsconfig.json` / `deno.json` only,
 *      not `deno.jsonc`. With no matching config the script falls back to
 *      a default Bundler-resolution compilerOptions block (defined below)
 *      that is sufficient for resolving the workspace symlinks above.
 *
 * If hover output shows `DataFrame<any>` despite the setup above, the file's
 * import path probably isn't symlinked yet (step 2). If it errors with
 * `Cannot find package 'typescript'`, step 1 or 3 is the problem.
 *
 * Notes on output quirks (unrelated to setup):
 *   - DataFrames created via `createDataFrame(rows, zodSchema)` may hover as
 *     `DataFrame<z.infer<S>>` rather than the expanded row — TS doesn't
 *     auto-expand `z.infer` aliases in QuickInfo. Type identity is still
 *     correct (the JAMIA audit's IsExact assertions confirm this).
 */

import ts from "typescript";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const file = args[0];
const queries = args.slice(1);

if (!file || queries.length === 0) {
  console.error("Usage: npx tsx scripts/intellisense.ts <file> <name|line:col> [...]");
  console.error("  name: variable/type/function name to look up");
  console.error("  line:col: 1-based position");
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

function isLineCol(query: string): boolean {
  return /^\d+:\d+$/.test(query);
}

function getInfoAtOffset(offset: number) {
  return service.getQuickInfoAtPosition(filePath, offset);
}

function formatInfo(info: ts.QuickInfo): string {
  return info.displayParts?.map((p) => p.text).join("") ?? "";
}

function getLineAndCol(offset: number): { line: number; col: number } {
  const { line, character } = sourceFile!.getLineAndCharacterOfPosition(offset);
  return { line: line + 1, col: character + 1 };
}

// Find all declaration positions for a given name
function findNamePositions(name: string): number[] {
  const positions: number[] = [];

  function visit(node: ts.Node) {
    // Variable declarations: const foo = ...
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      positions.push(node.name.getStart(sourceFile));
    }
    // Function declarations: function foo() {}
    else if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      positions.push(node.name.getStart(sourceFile));
    }
    // Type alias: type Foo = ...
    else if (ts.isTypeAliasDeclaration(node) && node.name.text === name) {
      positions.push(node.name.getStart(sourceFile));
    }
    // Interface: interface Foo {}
    else if (ts.isInterfaceDeclaration(node) && node.name.text === name) {
      positions.push(node.name.getStart(sourceFile));
    }
    // Class: class Foo {}
    else if (ts.isClassDeclaration(node) && node.name?.text === name) {
      positions.push(node.name.getStart(sourceFile));
    }
    // Enum: enum Foo {}
    else if (ts.isEnumDeclaration(node) && node.name.text === name) {
      positions.push(node.name.getStart(sourceFile));
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile!);
  return positions;
}

for (const query of queries) {
  if (isLineCol(query)) {
    const [lineStr, colStr] = query.split(":");
    const line = parseInt(lineStr, 10);
    const col = parseInt(colStr, 10);
    const lineCount = sourceFile.getLineStarts().length;

    if (line < 1 || line > lineCount) {
      console.log(`\n=== ${file}:${line}:${col} ===`);
      console.log(`(line out of range, file has ${lineCount} lines)`);
      continue;
    }

    const lineStart = sourceFile.getLineStarts()[line - 1];
    const lineEnd = line < lineCount ? sourceFile.getLineStarts()[line] : content.length;
    const lineLength = lineEnd - lineStart;

    if (col < 1 || col > lineLength) {
      console.log(`\n=== ${file}:${line}:${col} ===`);
      console.log(`(column out of range, line has ${lineLength} characters)`);
      continue;
    }

    const offset = sourceFile.getPositionOfLineAndCharacter(line - 1, col - 1);
    const info = getInfoAtOffset(offset);

    console.log(`\n=== ${file}:${line}:${col} ===`);
    if (!info) {
      console.log("(no type info)");
    } else {
      console.log(formatInfo(info));
    }
  } else {
    // Name-based lookup
    const positions = findNamePositions(query);

    if (positions.length === 0) {
      console.log(`\n=== ${query} ===`);
      console.log("(not found)");
      continue;
    }

    for (const pos of positions) {
      const { line, col } = getLineAndCol(pos);
      const info = getInfoAtOffset(pos);

      console.log(`\n=== ${query} (${file}:${line}:${col}) ===`);
      if (!info) {
        console.log("(no type info)");
      } else {
        console.log(formatInfo(info));
      }
    }
  }
}
