import { expect, test } from "@playwright/test";

test.describe("Local Bundle Distribution Tests", () => {
  test("loads and runs distribution example with local bundle", async ({
    page,
  }) => {
    // Listen for console messages for debugging
    page.on("console", (msg) => {
      console.log(`Browser console [${msg.type()}]: ${msg.text()}`);
    });

    // Navigate to the local bundle test page
    await page.goto("/dist-local-bundle.html");

    // Wait for status element to appear with success or error
    await page.waitForSelector(".status.success, .status.error", {
      timeout: 30000,
    });

    // Get the status text
    const statusElement = await page.locator("#status");
    const statusText = await statusElement.textContent();
    const statusClass = await statusElement.getAttribute("class");

    console.log(`Status: ${statusText}`);
    console.log(`Status class: ${statusClass}`);

    // Get output for debugging
    const outputElement = await page.locator("#output");
    const outputText = await outputElement.textContent();
    console.log(`Output:\n${outputText}`);

    // Check for success
    expect(statusClass).toContain("success");
    expect(statusText).toContain("completed successfully");

    // Verify key outputs are present
    expect(outputText).toContain("Library imported from local bundle");
    expect(outputText).toContain("WASM initialized");
    expect(outputText).toContain("Statistical distributions API available");
    expect(outputText).toContain("PDF data generated");
    expect(outputText).toContain("CDF data generated");
    expect(outputText).toContain("Data joined successfully");
  });
});
