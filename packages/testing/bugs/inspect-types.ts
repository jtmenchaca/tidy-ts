/**
 * Uses the TypeScript compiler API to extract inferred types
 * from testing-types.test.ts variables.
 */

// @ts-types="../../../node_modules/typescript/lib/typescript.d.ts"
import ts from "../../../node_modules/typescript/lib/typescript.js";

const targetFile = "packages/testing/bugs/testing-types.test.ts";
const sourceText = Deno.readTextFileSync(targetFile);

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
};

const host = ts.createCompilerHost(compilerOptions);
const originalGetSourceFile = host.getSourceFile;
host.getSourceFile = (fileName, languageVersion, onError) => {
  if (fileName.endsWith("testing-types.test.ts")) {
    return ts.createSourceFile(fileName, sourceText, languageVersion, true);
  }
  return originalGetSourceFile(fileName, languageVersion, onError);
};

const program = ts.createProgram([targetFile], compilerOptions, host);
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile(targetFile);

if (!sourceFile) {
  console.error("Could not find source file");
  Deno.exit(1);
}

function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
    const name = node.name.text;
    const symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
      const type = checker.getTypeOfSymbolAtLocation(symbol, node);
      const typeString = checker.typeToString(type, node, ts.TypeFormatFlags.NoTruncation);
      console.log(`${name}: ${typeString}`);
    }
  }

  ts.forEachChild(node, visit);
}

visit(sourceFile);
