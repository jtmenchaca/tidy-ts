#!/usr/bin/env -S deno run --allow-read --allow-run

import { callR, printResults, runComparison } from "./test-helpers.ts";
import {
  dtukey,
  ptukey,
  qtukey,
  rtukey,
  tukeyPValue,
  tukeyCritical,
} from "../../../ts/stats/distributions/studentized-range.ts";

async function main() {
  console.log("Testing R vs TypeScript studentized range functions...\n");

  const testCases = [
    // Test ptukey - cumulative distribution
    {
      testName: "ptukey(1.0, 3, 12)",
      func: "ptukey",
      distribution: "studentized-range",
      args: ["1.0", "3", "12", "true", "false"],
    },
    {
      testName: "ptukey(2.0, 3, 12)",
      func: "ptukey",
      distribution: "studentized-range",
      args: ["2.0", "3", "12", "true", "false"],
    },
    {
      testName: "ptukey(4.5, 3, 12)",
      func: "ptukey",
      distribution: "studentized-range", 
      args: ["4.5", "3", "12", "true", "false"],
    },
    // Test qtukey - quantile function
    {
      testName: "qtukey(0.95, 3, 12)",
      func: "qtukey", 
      distribution: "studentized-range",
      args: ["0.95", "3", "12", "true", "false"],
    },
    {
      testName: "qtukey(0.99, 3, 12)",
      func: "qtukey",
      distribution: "studentized-range", 
      args: ["0.99", "3", "12", "true", "false"],
    },
    // Test different parameters
    {
      testName: "qtukey(0.95, 4, 20)",
      func: "qtukey",
      distribution: "studentized-range",
      args: ["0.95", "4", "20", "true", "false"],
    },
    // Test Tukey-specific functions
    {
      testName: "tukey.critical(0.05, 3, 12)",
      func: "tukey.critical",
      distribution: "studentized-range",
      args: ["0.05", "3", "12"],
    },
    {
      testName: "tukey.pvalue(1.0, 3, 12)",
      func: "tukey.pvalue",
      distribution: "studentized-range", 
      args: ["1.0", "3", "12"],
    },
  ];

  const results = await runComparison(testCases);
  printResults(results);

  // Test our TypeScript implementation directly
  console.log("\n=== TypeScript Implementation Tests ===");
  
  console.log("\nDirect TypeScript function calls:");
  try {
    const p_val_1 = ptukey(1.0, 3, 12);
    console.log(`ptukey(1.0, 3, 12) = ${p_val_1.toFixed(6)}`);
    
    const q_95 = qtukey(0.95, 3, 12);
    console.log(`qtukey(0.95, 3, 12) = ${q_95.toFixed(6)}`);
    
    const critical = tukeyCritical(0.05, 3, 12);
    console.log(`tukeyCritical(0.05, 3, 12) = ${critical.toFixed(6)}`);
    
    const pval = tukeyPValue(1.0, 3, 12);
    console.log(`tukeyPValue(1.0, 3, 12) = ${pval.toFixed(6)}`);
    
    // Test random generation
    const random_vals = Array.from({ length: 5 }, () => rtukey(3, 12));
    console.log(`rtukey(3, 12) samples: [${random_vals.map(x => x.toFixed(3)).join(', ')}]`);
    
  } catch (error) {
    console.log(`TypeScript error: ${(error as Error).message}`);
  }

  // Test R implementation for comparison
  console.log("\n=== R Reference Values ===");
  try {
    const rScript = `
#!/usr/bin/env Rscript
# Test specific Tukey values
nmeans <- 3
df <- 12
alpha <- 0.05

cat("R Tukey Reference Values:\\n")
cat(sprintf("ptukey(1.0, %d, %d) = %.6f\\n", nmeans, df, ptukey(1.0, nmeans, df)))
cat(sprintf("qtukey(0.95, %d, %d) = %.6f\\n", nmeans, df, qtukey(0.95, nmeans, df)))
cat(sprintf("Critical value (α=%.3f) = %.6f\\n", alpha, qtukey(1-alpha, nmeans, df)))
cat(sprintf("P-value for q=1.0 = %.6f\\n", 1 - ptukey(1.0, nmeans, df)))

# Test our problematic case
cat("\\nProblematic test case (the one that was failing):\\n")
cat(sprintf("Expected p-value for Tukey q=1.0: %.6f\\n", 1 - ptukey(1.0, 3, 12)))
    `;
    
    await Deno.writeTextFile("temp_tukey_test.R", rScript);
    const command = new Deno.Command("Rscript", {
      args: ["temp_tukey_test.R"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout);
    const errorOutput = new TextDecoder().decode(stderr);
    
    if (errorOutput) {
      console.log("R stderr:", errorOutput);
    }
    console.log(output);
    
    await Deno.remove("temp_tukey_test.R").catch(() => {});
    
  } catch (error) {
    console.log(`R test error: ${(error as Error).message}`);
  }
}

if (import.meta.main) {
  main().catch(console.error);
}