#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Updates the coverage badge in src/dataframe/README.md based on local coverage results
 */

async function updateCoverageBadge() {
  try {
    // Run coverage and capture output
    console.log("📊 Generating coverage report...");
    const coverage = new Deno.Command("deno", {
      args: ["coverage", "cov_profile", "--detailed"],
      stdout: "piped",
      stderr: "piped",
    });

    const { stdout, stderr, success } = await coverage.output();

    if (!success) {
      console.error("❌ Failed to generate coverage report:");
      console.error(new TextDecoder().decode(stderr));
      Deno.exit(1);
    }

    const coverageOutput = new TextDecoder().decode(stdout);

    // Extract coverage percentage
    const coverageMatch = coverageOutput.match(/(\d+\.\d+)%/);
    if (!coverageMatch) {
      console.error("❌ Could not extract coverage percentage from output");
      Deno.exit(1);
    }

    const coveragePercent = coverageMatch[1];
    console.log(`📈 Coverage: ${coveragePercent}%`);

    // Read the README file
    const readmePath = "src/dataframe/README.md";
    const readmeContent = await Deno.readTextFile(readmePath);

    // Update the coverage badge
    const badgeRegex =
      /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-[\d.]+%25-brightgreen\)/;
    const newBadge =
      `![Coverage](https://img.shields.io/badge/coverage-${coveragePercent}%25-brightgreen)`;

    if (badgeRegex.test(readmeContent)) {
      const updatedContent = readmeContent.replace(badgeRegex, newBadge);
      await Deno.writeTextFile(readmePath, updatedContent);
      console.log(
        `✅ Updated coverage badge to ${coveragePercent}% in ${readmePath}`,
      );
    } else {
      console.log("⚠️  Coverage badge pattern not found in README.md");
    }
  } catch (error) {
    console.error("❌ Error updating coverage badge:", error);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await updateCoverageBadge();
}
