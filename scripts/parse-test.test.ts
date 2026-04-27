/**
 * Tests for parse-test.ts — validates that the script correctly
 * parses deno test output for both passing and failing scenarios.
 */
import { expect } from "@std/expect";

const scriptPath = new URL("./parse-test.ts", import.meta.url).pathname;

async function runParseTest(
  testFile: string,
): Promise<{ code: number; output: string }> {
  const cmd = new Deno.Command("deno", {
    args: ["run", "-A", scriptPath, "-A", testFile],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await cmd.output();
  const output = new TextDecoder().decode(stdout) +
    new TextDecoder().decode(stderr);
  return { code, output };
}

Deno.test("parse-test: all passing tests show summary", async () => {
  const testFile = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeTextFile(
    testFile,
    `
    import { expect } from "jsr:@std/expect";
    Deno.test("adds numbers", () => { expect(1 + 1).toBe(2); });
    Deno.test("compares strings", () => { expect("a").toBe("a"); });
  `,
  );
  try {
    const { code, output } = await runParseTest(testFile);
    expect(code).toBe(0);
    expect(output).toContain("✓");
    expect(output).toContain("2 passed");
    expect(output).toContain("0 failed");
    // Should NOT contain FAIL or error details
    expect(output).not.toContain("FAIL:");
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("parse-test: failing tests show compact errors", async () => {
  const testFile = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeTextFile(
    testFile,
    `
    import { expect } from "jsr:@std/expect";
    Deno.test("good test", () => { expect(1).toBe(1); });
    Deno.test("bad test", () => { expect(1).toBe(2); });
  `,
  );
  try {
    const { code, output } = await runParseTest(testFile);
    expect(code).toBe(1);
    expect(output).toContain("FAIL: bad test");
    expect(output).toContain("1 passed");
    expect(output).toContain("1 failed");
    // Should show diff values
    expect(output).toContain("-   1");
    expect(output).toContain("+   2");
    // Should NOT show the passing test details
    expect(output).not.toContain("FAIL: good test");
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("parse-test: thrown errors show error message", async () => {
  const testFile = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeTextFile(
    testFile,
    `
    Deno.test("throws", () => { throw new Error("boom"); });
  `,
  );
  try {
    const { code, output } = await runParseTest(testFile);
    expect(code).toBe(1);
    expect(output).toContain("FAIL: throws");
    expect(output).toContain("Error: boom");
  } finally {
    await Deno.remove(testFile);
  }
});

Deno.test("parse-test: nested step failures are reported", async () => {
  const testFile = await Deno.makeTempFile({ suffix: ".ts" });
  await Deno.writeTextFile(
    testFile,
    `
    import { expect } from "jsr:@std/expect";
    Deno.test("parent", async (t) => {
      await t.step("child ok", () => { expect(1).toBe(1); });
      await t.step("child bad", () => { expect(1).toBe(9); });
    });
  `,
  );
  try {
    const { code, output } = await runParseTest(testFile);
    expect(code).toBe(1);
    expect(output).toContain("FAIL: parent ... child bad");
    expect(output).toContain("-   1");
    expect(output).toContain("+   9");
  } finally {
    await Deno.remove(testFile);
  }
});
