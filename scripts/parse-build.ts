/**
 * Wraps a shell command with a spinner and outputs only on failure.
 * Usage: deno run -A scripts/parse-build.ts <label> -- <command...>
 *   e.g. deno run -A scripts/parse-build.ts "Building WASM" -- deno run -A jsr:@deno/wasmbuild@0.21.1 --features wasm --out packages/dataframe/lib
 *
 * On success: prints checkmark with label and exits 0.
 * On failure: prints X with label, dumps output, and exits 1.
 */

import process from "node:process";
import { createSpinner } from "@tidy-ts/shims/spinner";

const args = Deno.args;
const sepIdx = args.indexOf("--");
if (sepIdx === -1 || sepIdx === 0) {
  console.error(
    "Usage: parse-build.ts <label> -- <command...>",
  );
  process.exit(1);
}

const label = args.slice(0, sepIdx).join(" ");
const cmdArgs = args.slice(sepIdx + 1);

const spinner = createSpinner(label);

const cmd = new Deno.Command(cmdArgs[0], {
  args: cmdArgs.slice(1),
  stdout: "piped",
  stderr: "piped",
});

const { code, stdout, stderr } = await cmd.output();

if (code === 0) {
  await spinner.stop(`✓ ${label}`);
  process.exit(0);
}

await spinner.stop(`✗ ${label}`);

const out = new TextDecoder().decode(stdout);
const err = new TextDecoder().decode(stderr);
if (err.length) console.error(err);
else if (out.length) console.error(out);

process.exit(code);
