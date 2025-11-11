#!/usr/bin/env -S deno run --allow-net

/**
 * Check the latest published version of packages on JSR
 *
 * Usage:
 *   deno run --allow-net scripts/check-jsr-versions.ts @tidy-ts/dataframe
 *   deno run --allow-net scripts/check-jsr-versions.ts @tidy-ts/dataframe @tidy-ts/ai
 *   deno task check-versions @tidy-ts/dataframe @tidy-ts/ai
 */

import { getLatestVersion } from "./jsr-version-utils.ts";

async function main() {
  const packages = Deno.args.length > 0
    ? Deno.args
    : ["@tidy-ts/dataframe", "@tidy-ts/ai"];

  console.log("Checking JSR package versions...\n");

  for (const pkg of packages) {
    // Parse package name (format: @scope/name)
    const match = pkg.match(/^@([^/]+)\/(.+)$/);
    if (!match) {
      console.error(
        `Invalid package format: ${pkg}. Expected format: @scope/name`,
      );
      continue;
    }

    const [, scope, name] = match;

    try {
      const latest = await getLatestVersion(scope, name);

      if (latest === null) {
        console.log(`${pkg}: Not published yet`);
      } else {
        console.log(`${pkg}: ${latest}`);
      }
    } catch (error) {
      console.error(
        `${pkg}: Error - ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

if (import.meta.main) {
  await main();
}
