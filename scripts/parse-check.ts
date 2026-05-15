/**
 * Wraps `deno check` and outputs only errors concisely.
 * Usage: deno run -A scripts/parse-check.ts [deno check args...]
 *   e.g. deno run -A scripts/parse-check.ts --unstable-tsgo packages/dataframe
 *
 * On success: prints "No type errors" and exits 0.
 * On failure: prints a compact error summary and exits 1.
 */

import process from "node:process";
import { createSpinner } from "@tidy-ts/shims/spinner";

// Filter out flags that are valid for `deno run` but not `deno check`
const checkInvalidFlags = new Set(["-A", "--allow-all", "--allow-read", "--allow-write", "--allow-net", "--allow-env", "--allow-run", "--allow-ffi", "--allow-sys", "--allow-hrtime"]);
const args = Deno.args.filter((a) => !checkInvalidFlags.has(a));
const label = `deno check ${args.join(" ")}`;
const spinner = createSpinner(label);

const cmd = new Deno.Command("deno", {
  args: ["check", ...args],
  stdout: "piped",
  stderr: "piped",
});

const { code, stdout, stderr } = await cmd.output();
const raw = new TextDecoder().decode(stdout) +
  new TextDecoder().decode(stderr);

// Strip ANSI escape codes
// deno-lint-ignore no-control-regex
const text = raw.replace(/\x1b\[[0-9;]*m/g, "");

const cwd = Deno.cwd();

// Extract error blocks: lines starting with TS#### [ERROR]
const errors: string[] = [];
let currentError: string[] = [];
let inError = false;

for (const line of text.split("\n")) {
  if (/^TS\d+\s+\[ERROR\]/.test(line)) {
    if (currentError.length) errors.push(currentError.join("\n"));
    currentError = [line];
    inError = true;
  } else if (/^error:/.test(line)) {
    if (currentError.length) errors.push(currentError.join("\n"));
    currentError = [line];
    inError = true;
  } else if (inError) {
    const atMatch = line.match(/at file:\/\/\/(.*):(\d+):(\d+)/);
    if (atMatch && !currentError.some((l) => l.includes("→"))) {
      const fullPath = "/" + atMatch[1];
      const relPath = fullPath.startsWith(cwd + "/")
        ? fullPath.slice(cwd.length + 1)
        : fullPath;
      currentError.push(`  → ${relPath}:${atMatch[2]}:${atMatch[3]}`);
    }
    if (line.startsWith("TS") || line.startsWith("Found ")) {
      errors.push(currentError.join("\n"));
      currentError = /^TS\d+\s+\[ERROR\]/.test(line) ? [line] : [];
      inError = /^TS\d+\s+\[ERROR\]/.test(line);
    } else if (line.trim() === "") {
      // Empty line ends a parse-error block
      if (currentError.length && !currentError[0].startsWith("TS")) {
        errors.push(currentError.join("\n"));
        currentError = [];
        inError = false;
      }
    } else {
      currentError.push(line);
    }
  }
}
if (currentError.length) errors.push(currentError.join("\n"));

const summaryMatch = text.match(/Found (\d+) errors?\./);

if (errors.length === 0 && !summaryMatch && code === 0) {
  await spinner.stop("✓ No type errors");
  process.exit(0);
}

await spinner.stop(`✗ Type errors found`);

if (errors.length === 0) {
  // Non-zero exit but no parsed errors — show raw output as fallback
  console.log(text.trim());
} else {
  for (const err of errors) {
    console.log(err);
    console.log();
  }
  if (summaryMatch) {
    console.log(summaryMatch[0]);
  }
}

process.exit(code);
