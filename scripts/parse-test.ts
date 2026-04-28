/**
 * Wraps `deno test` and outputs only failures concisely.
 * Usage: deno run -A scripts/parse-test.ts [deno test args...]
 *   e.g. deno run -A scripts/parse-test.ts -A --parallel packages/dataframe
 *
 * On success: prints summary line and exits 0.
 * On failure: prints compact failure details and exits 1.
 */

import process from "node:process";
import { createSpinner } from "@tidy-ts/shims/spinner";

const args = Deno.args;
const label = `deno test ${args.join(" ")}`;
const spinner = createSpinner(label);

const cmd = new Deno.Command("deno", {
  args: ["test", ...args],
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

// Find the ERRORS section and FAILURES section
const errorsIdx = text.indexOf(" ERRORS ");
const failuresIdx = text.indexOf(" FAILURES ");

// Extract the summary line: "ok | N passed | 0 failed (Xms)" or "FAILED | N passed | N failed (Xms)"
const summaryMatch = text.match(/(ok|FAILED) \| (\d+ passed(?:\s*\(\d+ steps?\))?) \| (\d+ failed(?:\s*\(\d+ steps?\))?)\s*\([\d.]+[ms]+\)/);

if (code === 0 && !summaryMatch) {
  await spinner.stop("✓ All tests passed");
  process.exit(0);
}

if (code === 0 && summaryMatch) {
  await spinner.stop(`✓ ${summaryMatch[0]}`);
  process.exit(0);
}

// --- Failure path ---

// Parse the ERRORS section to extract per-failure details
interface Failure {
  name: string;
  location: string;
  errorType: string;
  diff: string[];
}

const failures: Failure[] = [];

if (errorsIdx !== -1) {
  const endIdx = failuresIdx !== -1 ? failuresIdx : text.length;
  const errorsBlock = text.slice(errorsIdx, endIdx);
  const lines = errorsBlock.split("\n");

  let current: Failure | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Test name line: "test name => path/to/file.ts:line:col"
    const nameMatch = line.match(/^(.+?)\s+=>\s+(.+:\d+:\d+)\s*$/);
    if (nameMatch) {
      if (current) failures.push(current);
      const rawPath = nameMatch[2];
      // Convert relative path like ../../../tmp/file.ts or absolute to relative
      let location = rawPath;
      if (rawPath.startsWith("file:///")) {
        const fullPath = rawPath.replace("file:///", "/");
        location = fullPath.startsWith(cwd + "/")
          ? fullPath.slice(cwd.length + 1)
          : fullPath;
      }
      current = {
        name: nameMatch[1].trim(),
        location,
        errorType: "",
        diff: [],
      };
      continue;
    }

    if (!current) continue;

    // Error type line: "error: AssertionError: ..." or "error: Error: ..."
    const errorMatch = line.match(/^error:\s+(.+)$/);
    if (errorMatch && !current.errorType) {
      current.errorType = errorMatch[1];
      continue;
    }

    // Diff lines (actual/expected values): lines starting with -/+ (after stripping ANSI)
    if (/^[-+]\s+/.test(line) && current) {
      current.diff.push(line);
      continue;
    }
  }
  if (current) failures.push(current);
}

await spinner.stop(`✗ Tests failed`);

// Print compact output
if (failures.length > 0) {
  for (const f of failures) {
    console.log(`FAIL: ${f.name}`);
    console.log(`  → ${f.location}`);
    if (f.errorType) {
      console.log(`  ${f.errorType}`);
    }
    for (const d of f.diff) {
      console.log(`  ${d}`);
    }
    console.log();
  }
}

// Print summary
if (summaryMatch) {
  console.log(summaryMatch[0]);
} else if (failures.length === 0) {
  // No ERRORS section found — maybe type check failed or other issue
  // Print the raw output since we can't parse it
  console.log(text);
}

process.exit(code);
