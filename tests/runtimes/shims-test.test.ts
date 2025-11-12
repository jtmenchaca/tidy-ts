/**
 * Test @tidy-ts/shims across different runtimes
 * This test verifies that the shims package works correctly in Deno, Bun, and Node.js
 * 
 * This is a standalone script that can be run directly without a test framework
 */

import {
  Runtime,
  getCurrentRuntime,
  currentRuntime,
  readTextFile,
  writeTextFile,
  env,
  getArgs,
  args,
  importMeta,
  remove,
  exit,
} from "@tidy-ts/shims";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ ${message}`);
    testsFailed++;
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
  testsPassed++;
}

async function runTests() {
  console.log("🧪 Testing @tidy-ts/shims");
  console.log(`Current runtime: ${currentRuntime}`);
  console.log("");

  // Test runtime detection
  try {
    console.log("Test 1: Runtime detection");
    const runtime = getCurrentRuntime();
    assert(
      runtime === currentRuntime,
      `getCurrentRuntime() matches cached value`,
    );

    // Verify runtime is one of the supported ones
    const supportedRuntimes = [
      Runtime.Deno,
      Runtime.Bun,
      Runtime.Node,
      Runtime.Browser,
    ];

    assert(
      supportedRuntimes.includes(runtime),
      `Runtime ${runtime} is supported`,
    );
    console.log("");
  } catch (error) {
    console.error(`  ❌ Runtime detection failed: ${error}`);
    testsFailed++;
  }

  // Test environment variables
  try {
    console.log("Test 2: Environment variables API");
    const testKey = "TEST_SHIMS_ENV_VAR";
    const testValue = "test_value_123";

    // Set environment variable (if possible)
    if (currentRuntime === Runtime.Deno) {
      // @ts-ignore - Deno.env.set may not be typed
      Deno.env.set(testKey, testValue);
    } else if (currentRuntime === Runtime.Node || currentRuntime === Runtime.Bun) {
      process.env[testKey] = testValue;
    }

    const value = env.get(testKey);
    assert(value === testValue, `env.get() returns correct value`);

    const allEnv = env.toObject();
    assert(testKey in allEnv, `env.toObject() includes test key`);
    console.log("");
  } catch (error) {
    console.error(`  ❌ Environment variables test failed: ${error}`);
    testsFailed++;
  }

  // Test command line arguments
  try {
    console.log("Test 3: Command line arguments API");
    const cliArgs = getArgs();
    assert(
      Array.isArray(cliArgs),
      `getArgs() returns array with ${cliArgs.length} arguments`,
    );

    const frozenArgs = args;
    assert(
      frozenArgs.length === cliArgs.length,
      `args frozen array matches getArgs() length`,
    );
    console.log("");
  } catch (error) {
    console.error(`  ❌ Command line arguments test failed: ${error}`);
    testsFailed++;
  }

  // Test import meta utilities
  try {
    console.log("Test 4: Import meta utilities");
    const url = importMeta.url;
    assert(
      typeof url === "string" && url.length > 0,
      `importMeta.url returns valid URL`,
    );

    const filename = importMeta.getFilename();
    assert(
      typeof filename === "string" && filename.length > 0,
      `importMeta.getFilename() works`,
    );

    if (currentRuntime !== Runtime.Browser) {
      const dirname = importMeta.getDirname();
      assert(
        typeof dirname === "string" && dirname.length > 0,
        `importMeta.getDirname() works`,
      );
    }
    console.log("");
  } catch (error) {
    console.error(`  ❌ Import meta utilities test failed: ${error}`);
    testsFailed++;
  }

  // Test file system operations (if not in browser)
  if (currentRuntime !== Runtime.Browser) {
    try {
      console.log("Test 5: File system operations");
      const testFile = "./shims-test-temp.txt";
      const testContent = `Test content from @tidy-ts/shims
Runtime: ${currentRuntime}
Timestamp: ${new Date().toISOString()}`;

      // Write file
      await writeTextFile(testFile, testContent);
      assert(true, `writeTextFile() works`);

      // Read file
      const readContent = await readTextFile(testFile);
      assert(
        readContent === testContent,
        `readTextFile() returns correct content`,
      );

      // Clean up
      await remove(testFile);
      assert(true, `remove() works`);
      console.log("");
    } catch (error) {
      console.error(`  ❌ File system operations test failed: ${error}`);
      testsFailed++;
      // Try to clean up on error
      try {
        await remove("./shims-test-temp.txt");
      } catch {
        // Ignore cleanup errors
      }
    }
  } else {
    console.log("Test 5: File system operations");
    console.log(`  ⏭️  Skipping file system tests in browser`);
    console.log("");
  }

  // Summary
  console.log("📊 Test Summary:");
  console.log(`  ✅ Passed: ${testsPassed}`);
  if (testsFailed > 0) {
    console.log(`  ❌ Failed: ${testsFailed}`);
    exit(1);
  } else {
    console.log("\n✅ All shims tests passed!");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test execution failed:", error);
  exit(1);
});

