/**
 * Example usage of cross-runtime dotenv
 *
 * This demonstrates how to use the dotenv functionality
 * in a way that works across Deno, Bun, and Node.js
 */

import { expect } from "@std/expect";
import { test } from "../test.ts";
import { load, loadSync, parse } from "../dotenv.ts";
import { env } from "../env.ts";
import { remove, writeTextFile } from "../fs.ts";

test("Example: Parse dotenv string", () => {
  // You can parse a dotenv string directly
  const config = parse(`
DATABASE_URL=postgresql://localhost/mydb
API_KEY=secret123
DEBUG=true
  `);

  expect(config.DATABASE_URL).toBe("postgresql://localhost/mydb");
  expect(config.API_KEY).toBe("secret123");
  expect(config.DEBUG).toBe("true");
});

test("Example: Load from file", async () => {
  // Create a .env file
  await writeTextFile(
    ".env.example",
    `
APP_NAME=MyApp
PORT=3000
LOG_LEVEL=debug
  `,
  );

  // Load without exporting to environment
  const config = await load({ envPath: ".env.example" });

  expect(config.APP_NAME).toBe("MyApp");
  expect(config.PORT).toBe("3000");
  expect(config.LOG_LEVEL).toBe("debug");

  // Clean up
  await remove(".env.example");
});

test("Example: Load and export to environment", async () => {
  // Create a .env file
  await writeTextFile(
    ".env.export-example",
    `
MY_API_KEY=xyz789
MY_API_URL=https://api.example.com
  `,
  );

  // Load AND export to process environment
  await load({ envPath: ".env.export-example", export: true });

  // Now you can access via env.get()
  expect(env.get("MY_API_KEY")).toBe("xyz789");
  expect(env.get("MY_API_URL")).toBe("https://api.example.com");

  // Clean up
  env.delete("MY_API_KEY");
  env.delete("MY_API_URL");
  await remove(".env.export-example");
});

test("Example: Variable expansion", async () => {
  // Set a base path in the environment
  env.set("BASE_PATH", "/var/app");

  // Create .env with expansion
  await writeTextFile(
    ".env.expand-example",
    `
DATA_DIR=\${BASE_PATH}/data
LOG_DIR=\${BASE_PATH}/logs
CACHE_DIR=\${BASE_PATH}/cache
FALLBACK=\${MISSING_VAR:-/tmp/fallback}
  `,
  );

  const config = await load({ envPath: ".env.expand-example" });

  // Variables are expanded
  expect(config.DATA_DIR).toBe("/var/app/data");
  expect(config.LOG_DIR).toBe("/var/app/logs");
  expect(config.CACHE_DIR).toBe("/var/app/cache");
  expect(config.FALLBACK).toBe("/tmp/fallback");

  // Clean up
  env.delete("BASE_PATH");
  await remove(".env.expand-example");
});

test("Example: Synchronous loading", async () => {
  await writeTextFile(".env.sync-example", "SYNC_VAR=sync_loaded");

  // Use loadSync() for synchronous loading
  const config = loadSync({ envPath: ".env.sync-example" });

  expect(config.SYNC_VAR).toBe("sync_loaded");

  await remove(".env.sync-example");
});
