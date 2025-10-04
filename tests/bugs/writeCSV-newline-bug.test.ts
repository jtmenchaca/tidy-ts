import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";
import { writeCSV } from "../../src/dataframe/ts/verbs/utility/writeCSV.verb.ts";

Deno.test("writeCSV() minimal example", () => {
  const df = createDataFrame([
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ]);

  const tempFile = "./test-minimal.csv";
  writeCSV(df, tempFile);

  const content = Deno.readTextFileSync(tempFile);
  console.log("Minimal CSV output:");
  console.log(JSON.stringify(content));

  expect(content).toBe("id,name\r\n1,Alice\r\n2,Bob\r\n");

  // Keep file for review
  // Deno.removeSync(tempFile);
});

Deno.test("writeCSV() with newline in string field", () => {
  const df = createDataFrame([
    { id: 1, description: "Line1\nLine2" },
    { id: 2, description: "Normal text" },
  ]);

  const tempFile = "./test-newline.csv";
  writeCSV(df, tempFile);

  const content = Deno.readTextFileSync(tempFile);
  console.log("\nCSV with newline character:");
  console.log(JSON.stringify(content));
  console.log("\nRaw output:");
  console.log(content);

  // The newline should be properly quoted
  expect(content).toContain('"Line1\nLine2"');

  // Keep file for review
  // Deno.removeSync(tempFile);
});
