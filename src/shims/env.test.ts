/**
 * Tests for cross-runtime environment variable API
 */

import { expect } from "@std/expect";
import { env } from "./env.ts";

Deno.test("env.get() - retrieves environment variable", () => {
  // Set a test variable
  env.set("TEST_VAR_GET", "test_value");

  // Get the variable
  const value = env.get("TEST_VAR_GET");
  expect(value).toBe("test_value");

  // Clean up
  env.delete("TEST_VAR_GET");
});

Deno.test("env.get() - returns undefined for non-existent variable", () => {
  const value = env.get("NON_EXISTENT_VAR_12345");
  expect(value).toBeUndefined();
});

Deno.test("env.set() - sets environment variable", () => {
  env.set("TEST_VAR_SET", "new_value");

  const value = env.get("TEST_VAR_SET");
  expect(value).toBe("new_value");

  // Clean up
  env.delete("TEST_VAR_SET");
});

Deno.test("env.set() - overwrites existing variable", () => {
  env.set("TEST_VAR_OVERWRITE", "initial");
  expect(env.get("TEST_VAR_OVERWRITE")).toBe("initial");

  env.set("TEST_VAR_OVERWRITE", "updated");
  expect(env.get("TEST_VAR_OVERWRITE")).toBe("updated");

  // Clean up
  env.delete("TEST_VAR_OVERWRITE");
});

Deno.test("env.delete() - removes environment variable", () => {
  // Set a variable
  env.set("TEST_VAR_DELETE", "to_be_deleted");
  expect(env.get("TEST_VAR_DELETE")).toBe("to_be_deleted");

  // Delete it
  env.delete("TEST_VAR_DELETE");
  expect(env.get("TEST_VAR_DELETE")).toBeUndefined();
});

Deno.test("env.delete() - safe to delete non-existent variable", () => {
  // Should not throw
  env.delete("NON_EXISTENT_VAR_TO_DELETE");
  expect(env.get("NON_EXISTENT_VAR_TO_DELETE")).toBeUndefined();
});

Deno.test("env.toObject() - returns all environment variables", () => {
  // Set some test variables
  env.set("TEST_VAR_OBJ_1", "value1");
  env.set("TEST_VAR_OBJ_2", "value2");

  const allEnv = env.toObject();

  expect(typeof allEnv).toBe("object");
  expect(allEnv.TEST_VAR_OBJ_1).toBe("value1");
  expect(allEnv.TEST_VAR_OBJ_2).toBe("value2");

  // Clean up
  env.delete("TEST_VAR_OBJ_1");
  env.delete("TEST_VAR_OBJ_2");
});

Deno.test("env - test setup/teardown pattern", () => {
  const testVarName = "TEST_VAR_SETUP_TEARDOWN";

  // Save original value (if exists)
  const original = env.get(testVarName);

  // Set test value
  env.set(testVarName, "test_value");
  expect(env.get(testVarName)).toBe("test_value");

  // Restore original or delete
  if (original !== undefined) {
    env.set(testVarName, original);
    expect(env.get(testVarName)).toBe(original);
  } else {
    env.delete(testVarName);
    expect(env.get(testVarName)).toBeUndefined();
  }
});
