/**
 * Tests for cross-runtime dotenv functionality
 */

import { expect } from "@std/expect";
import { test } from "./test.ts";
import { parse } from "./dotenv-parse.ts";
import { env } from "./env.ts";
import { remove, writeTextFile } from "./fs.ts";

test("parse() - basic parsing", () => {
  const result = parse("GREETING=hello world");
  expect(result).toEqual({ GREETING: "hello world" });
});

test("parse() - handles multiple variables", () => {
  const result = parse(`
BASIC=basic
AFTER_EMPTY=empty
EMPTY_VALUE=
  `);
  expect(result).toEqual({
    BASIC: "basic",
    AFTER_EMPTY: "empty",
    EMPTY_VALUE: "",
  });
});

test("parse() - handles comments", () => {
  const result = parse(`
BASIC=basic
#COMMENT=not-parsed
AFTER_COMMENT=value
  `);
  expect(result).toEqual({
    BASIC: "basic",
    AFTER_COMMENT: "value",
  });
});

test("parse() - handles single quotes", () => {
  const result = parse("QUOTED_SINGLE='single quoted'");
  expect(result).toEqual({ QUOTED_SINGLE: "single quoted" });
});

test("parse() - handles double quotes", () => {
  const result = parse('QUOTED_DOUBLE="double quoted"');
  expect(result).toEqual({ QUOTED_DOUBLE: "double quoted" });
});

test("parse() - handles empty quotes", () => {
  const result = parse(`
EMPTY_SINGLE=''
EMPTY_DOUBLE=""
  `);
  expect(result).toEqual({
    EMPTY_SINGLE: "",
    EMPTY_DOUBLE: "",
  });
});

test("parse() - handles newlines in double quotes", () => {
  const result = parse('MULTILINE="hello\\nworld"');
  expect(result).toEqual({ MULTILINE: "hello\nworld" });
});

test("parse() - handles JSON values", () => {
  const result = parse(`JSON='{"foo": "bar"}'`);
  expect(result).toEqual({ JSON: '{"foo": "bar"}' });
});

test("parse() - handles whitespace in quotes", () => {
  const result = parse(`WHITESPACE='    whitespace   '`);
  expect(result).toEqual({ WHITESPACE: "    whitespace   " });
});

test("parse() - trims unquoted values", () => {
  const result = parse(`TRIMMED=  trimmed value  `);
  expect(result).toEqual({ TRIMMED: "trimmed value" });
});

test("parse() - handles equals signs in values", () => {
  const result = parse(`EQUALS='equ==als'`);
  expect(result).toEqual({ EQUALS: "equ==als" });
});

test("parse() - handles export keyword", () => {
  const result = parse(`export EXPORT_VAR='exported'`);
  expect(result).toEqual({ EXPORT_VAR: "exported" });
});

test("parse() - ignores invalid keys", () => {
  const result = parse(`
VALID=value
1INVALID=should be ignored
ANOTHER_VALID=value2
  `);
  expect(result).toEqual({
    VALID: "value",
    ANOTHER_VALID: "value2",
  });
});

test("parse() - expands environment variables", () => {
  // Set a test env var
  env.set("TEST_EXPAND", "expanded_value");

  const result = parse("VAR=$TEST_EXPAND");
  expect(result).toEqual({ VAR: "expanded_value" });

  // Cleanup
  env.delete("TEST_EXPAND");
});

test("parse() - expands environment variables with braces", () => {
  env.set("TEST_EXPAND_BRACES", "braced_value");

  const result = parse("VAR=${TEST_EXPAND_BRACES}");
  expect(result).toEqual({ VAR: "braced_value" });

  env.delete("TEST_EXPAND_BRACES");
});

test("parse() - handles default values in expansion", () => {
  const result = parse("VAR=${NONEXISTENT_VAR:-default_value}");
  expect(result).toEqual({ VAR: "default_value" });
});

test("parse() - preserves whitespace in double quotes", () => {
  const result = parse('WHITESPACE_DOUBLE="    whitespace   "');
  expect(result).toEqual({ WHITESPACE_DOUBLE: "    whitespace   " });
});

test("parse() - handles multiline in single quotes (escaped)", () => {
  const result = parse("MULTILINE_SINGLE='hello\\nworld'");
  expect(result).toEqual({ MULTILINE_SINGLE: "hello\\nworld" });
});

test("parse() - handles variables with numbers", () => {
  const result = parse("V4R_W1TH_NUM8ER5=var with numbers");
  expect(result).toEqual({ V4R_W1TH_NUM8ER5: "var with numbers" });
});

test("parse() - handles indented variables", () => {
  const result = parse("  INDENTED_VAR=indented var");
  expect(result).toEqual({ INDENTED_VAR: "indented var" });
});

test("parse() - handles tab indented variables", () => {
  const result = parse("\tTAB_INDENTED_VAR=indented var");
  expect(result).toEqual({ TAB_INDENTED_VAR: "indented var" });
});

test("parse() - handles inline comments after unquoted values", () => {
  const result = parse("FOO=bar #this is a comment");
  expect(result).toEqual({ FOO: "bar" });
});

test("parse() - handles inline comments after quoted values", () => {
  const result = parse('GREETING="hello world" #comment');
  expect(result).toEqual({ GREETING: "hello world" });
});

test("parse() - handles recursive variable expansion", () => {
  const result = parse(`
FIRST=hello
SECOND=$FIRST world
THIRD=$SECOND!
  `);
  expect(result).toEqual({
    FIRST: "hello",
    SECOND: "hello world",
    THIRD: "hello world!",
  });
});

test("parse() - handles mixed expansion styles", () => {
  env.set("TEST_VAR1", "value1");
  env.set("TEST_VAR2", "value2");

  const result = parse("MIXED=$TEST_VAR1 and ${TEST_VAR2}");
  expect(result).toEqual({ MIXED: "value1 and value2" });

  env.delete("TEST_VAR1");
  env.delete("TEST_VAR2");
});

test("parse() - handles default with special characters", () => {
  const result = parse("PATH_VAR=${NONEXISTENT:-/default/path}");
  expect(result).toEqual({ PATH_VAR: "/default/path" });
});

test("parse() - handles multiline private keys", () => {
  const result = parse(`PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...
HkVN9...
...
-----END DSA PRIVATE KEY-----"`);
  expect(result.PRIVATE_KEY).toContain("BEGIN RSA PRIVATE KEY");
  expect(result.PRIVATE_KEY).toContain("END DSA PRIVATE KEY");
});

test("parse() - result not affected by Object.prototype pollution", () => {
  // deno-lint-ignore no-explicit-any
  (Object.prototype as any).polluted = "bad";

  const result = parse("GOOD=value");
  expect(result.polluted).toBeUndefined();
  expect(result.GOOD).toBe("value");

  // Cleanup
  // deno-lint-ignore no-explicit-any
  delete (Object.prototype as any).polluted;
});

test("env.loadFromFileSync() - loads from file", async () => {
  // Create a test .env file
  const testEnvPath = "./test_dotenv_sync.env";
  await writeTextFile(
    testEnvPath,
    "TEST_SYNC_VAR=sync_value\nTEST_SYNC_VAR2=sync_value2",
  );

  const result = env.loadFromFileSync(testEnvPath, { export: false });
  expect(result).toEqual({
    TEST_SYNC_VAR: "sync_value",
    TEST_SYNC_VAR2: "sync_value2",
  });

  // Cleanup
  await remove(testEnvPath);
});

test("env.loadFromFileSync() - returns empty object if file not found", () => {
  const result = env.loadFromFileSync("./nonexistent.env", { export: false });
  expect(result).toEqual({});
});

test("env.loadFromFileSync() - exports to environment by default", async () => {
  const testEnvPath = "./test_dotenv_export_sync.env";
  await writeTextFile(testEnvPath, "TEST_EXPORT_SYNC=exported_sync");

  // Ensure it's not already set
  env.delete("TEST_EXPORT_SYNC");

  env.loadFromFileSync(testEnvPath);
  expect(env.get("TEST_EXPORT_SYNC")).toBe("exported_sync");

  // Cleanup
  env.delete("TEST_EXPORT_SYNC");
  await remove(testEnvPath);
});

test("env.loadFromFileSync() - does not override existing env vars", async () => {
  const testEnvPath = "./test_dotenv_no_override.env";
  await writeTextFile(testEnvPath, "TEST_NO_OVERRIDE=from_file");

  // Set it first
  env.set("TEST_NO_OVERRIDE", "from_env");

  env.loadFromFileSync(testEnvPath);

  // Should still be the original value
  expect(env.get("TEST_NO_OVERRIDE")).toBe("from_env");

  // Cleanup
  env.delete("TEST_NO_OVERRIDE");
  await remove(testEnvPath);
});

test("env.loadFromFile() - loads from file asynchronously", async () => {
  const testEnvPath = "./test_dotenv_async.env";
  await writeTextFile(
    testEnvPath,
    "TEST_ASYNC_VAR=async_value\nTEST_ASYNC_VAR2=async_value2",
  );

  const result = await env.loadFromFile(testEnvPath, { export: false });
  expect(result).toEqual({
    TEST_ASYNC_VAR: "async_value",
    TEST_ASYNC_VAR2: "async_value2",
  });

  // Cleanup
  await remove(testEnvPath);
});

test("env.loadFromFile() - returns empty object if file not found", async () => {
  const result = await env.loadFromFile("./nonexistent_async.env", {
    export: false,
  });
  expect(result).toEqual({});
});

test("env.loadFromFile() - exports to environment by default", async () => {
  const testEnvPath = "./test_dotenv_export_async.env";
  await writeTextFile(testEnvPath, "TEST_EXPORT_ASYNC=exported_async");

  // Ensure it's not already set
  env.delete("TEST_EXPORT_ASYNC");

  await env.loadFromFile(testEnvPath);
  expect(env.get("TEST_EXPORT_ASYNC")).toBe("exported_async");

  // Cleanup
  env.delete("TEST_EXPORT_ASYNC");
  await remove(testEnvPath);
});

test("env.loadFromFile() - handles URL paths", async () => {
  const testEnvPath = "./test_dotenv_url.env";
  await writeTextFile(testEnvPath, "TEST_URL_VAR=url_value");

  const url = new URL(`file://${Deno.cwd()}/${testEnvPath}`);
  const result = await env.loadFromFile(url, { export: false });
  expect(result).toEqual({ TEST_URL_VAR: "url_value" });

  // Cleanup
  await remove(testEnvPath);
});

test("env.loadFromFile() - loads multiple files with precedence", async () => {
  const envPath1 = "./test_multi1.env";
  const envPath2 = "./test_multi2.env";

  await writeTextFile(envPath1, "VAR1=from_file1\nSHARED=file1");
  await writeTextFile(envPath2, "VAR2=from_file2\nSHARED=file2");

  const result = await env.loadFromFile([envPath1, envPath2], {
    export: false,
  });

  expect(result).toEqual({
    VAR1: "from_file1",
    VAR2: "from_file2",
    SHARED: "file2", // Later file takes precedence
  });

  // Cleanup
  await remove(envPath1);
  await remove(envPath2);
});
