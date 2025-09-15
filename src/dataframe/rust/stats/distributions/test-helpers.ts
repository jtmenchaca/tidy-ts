#!/usr/bin/env -S deno run --allow-read --allow-run

import {
  wasm_dbeta,
  wasm_dbinom,
  wasm_dchisq,
  wasm_dexp,
  wasm_df,
  wasm_dgamma,
  wasm_dgeom,
  wasm_dhyper,
  wasm_dlnorm,
  wasm_dnbinom,
  wasm_dnorm,
  wasm_dpois,
  wasm_dt,
  wasm_dunif,
  wasm_dweibull,
  wasm_dwilcox,
  wasm_pbeta,
  wasm_pbinom,
  wasm_pchisq,
  wasm_pexp,
  wasm_pf,
  wasm_pgamma,
  wasm_pgeom,
  wasm_phyper,
  wasm_plnorm,
  wasm_pnbinom,
  wasm_pnorm,
  wasm_ppois,
  wasm_pt,
  wasm_punif,
  wasm_pweibull,
  wasm_pwilcox,
  wasm_qbeta,
  wasm_qbinom,
  wasm_qchisq,
  wasm_qexp,
  wasm_qf,
  wasm_qgamma,
  wasm_qgeom,
  wasm_qhyper,
  wasm_qlnorm,
  wasm_qnbinom,
  wasm_qnorm,
  wasm_qpois,
  wasm_qt,
  wasm_qunif,
  wasm_qweibull,
  wasm_qwilcox,
  wasm_rbeta,
  wasm_rbinom,
  wasm_rchisq,
  wasm_rexp,
  wasm_rf,
  wasm_rgamma,
  wasm_rgeom,
  wasm_rhyper,
  wasm_rlnorm,
  wasm_rnbinom,
  wasm_rnorm,
  wasm_rpois,
  wasm_rt,
  wasm_runif,
  wasm_rweibull,
  wasm_rwilcox,
} from "../../../ts/wasm/wasm-loader.ts";

export async function callR(
  functionName: string,
  distribution: string,
  ...args: number[]
): Promise<number> {
  const command = new Deno.Command("Rscript", {
    args: [`${distribution}.test.R`, functionName, ...args.map(String)],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`R script failed: ${errorText}`);
  }

  const output = new TextDecoder().decode(stdout).trim();
  return parseFloat(output);
}

export function callRust(functionName: string, ...args: number[]): number {
  switch (functionName) {
    // Beta distribution
    case "dbeta":
      return wasm_dbeta(args[0], args[1], args[2], args[3] === 1);
    case "pbeta":
      return wasm_pbeta(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qbeta":
      return wasm_qbeta(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Normal distribution
    case "dnorm":
      return wasm_dnorm(args[0], args[1], args[2], args[3] === 1);
    case "pnorm":
      return wasm_pnorm(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qnorm":
      return wasm_qnorm(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Gamma distribution
    case "dgamma":
      return wasm_dgamma(args[0], args[1], args[2], args[3] === 1);
    case "pgamma":
      return wasm_pgamma(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qgamma":
      return wasm_qgamma(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Exponential distribution
    case "dexp":
      return wasm_dexp(args[0], args[1], args[2] === 1);
    case "pexp":
      return wasm_pexp(args[0], args[1], args[2] === 1, args[3] === 1);
    case "qexp":
      return wasm_qexp(args[0], args[1], args[2] === 1, args[3] === 1);

    // Chi-squared distribution
    case "dchisq":
      return wasm_dchisq(args[0], args[1], args[2] === 1);
    case "pchisq":
      return wasm_pchisq(args[0], args[1], args[2] === 1, args[3] === 1);
    case "qchisq":
      return wasm_qchisq(args[0], args[1], args[2] === 1, args[3] === 1);

    // F distribution
    case "df":
      return wasm_df(args[0], args[1], args[2], args[3] === 1);
    case "pf":
      return wasm_pf(args[0], args[1], args[2], args[3] === 1, args[4] === 1);
    case "qf":
      return wasm_qf(args[0], args[1], args[2], args[3] === 1, args[4] === 1);

    // t distribution
    case "dt":
      return wasm_dt(args[0], args[1], args[2] === 1);
    case "pt":
      return wasm_pt(args[0], args[1], args[2] === 1, args[3] === 1);
    case "qt":
      return wasm_qt(args[0], args[1], args[2] === 1, args[3] === 1);

    // Poisson distribution
    case "dpois":
      return wasm_dpois(args[0], args[1], args[2] === 1);
    case "ppois":
      return wasm_ppois(args[0], args[1], args[2] === 1, args[3] === 1);
    case "qpois":
      return wasm_qpois(args[0], args[1], args[2] === 1, args[3] === 1);

    // Binomial distribution
    case "dbinom":
      return wasm_dbinom(args[0], args[1], args[2], args[3] === 1);
    case "pbinom":
      return wasm_pbinom(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qbinom":
      return wasm_qbinom(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Uniform distribution
    case "dunif":
      return wasm_dunif(args[0], args[1], args[2], args[3] === 1);
    case "punif":
      return wasm_punif(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qunif":
      return wasm_qunif(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Weibull distribution
    case "dweibull":
      return wasm_dweibull(args[0], args[1], args[2], args[3] === 1);
    case "pweibull":
      return wasm_pweibull(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qweibull":
      return wasm_qweibull(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Geometric distribution
    case "dgeom":
      return wasm_dgeom(args[0], args[1], args[2] === 1);
    case "pgeom":
      return wasm_pgeom(args[0], args[1], args[2] === 1, args[3] === 1);
    case "qgeom":
      return wasm_qgeom(args[0], args[1], args[2] === 1, args[3] === 1);

    // Hypergeometric distribution
    case "dhyper":
      return wasm_dhyper(args[0], args[1], args[2], args[3], args[4] === 1);
    case "phyper":
      return wasm_phyper(
        args[0],
        args[1],
        args[2],
        args[3],
        args[4] === 1,
        args[5] === 1,
      );
    case "qhyper":
      return wasm_qhyper(
        args[0],
        args[1],
        args[2],
        args[3],
        args[4] === 1,
        args[5] === 1,
      );

    // Log-normal distribution
    case "dlnorm":
      return wasm_dlnorm(args[0], args[1], args[2], args[3] === 1);
    case "plnorm":
      return wasm_plnorm(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qlnorm":
      return wasm_qlnorm(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Negative binomial distribution
    case "dnbinom":
      return wasm_dnbinom(args[0], args[1], args[2], args[3] === 1);
    case "pnbinom":
      return wasm_pnbinom(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qnbinom":
      return wasm_qnbinom(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Wilcoxon distribution
    case "dwilcox":
      return wasm_dwilcox(args[0], args[1], args[2], args[3] === 1);
    case "pwilcox":
      return wasm_pwilcox(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );
    case "qwilcox":
      return wasm_qwilcox(
        args[0],
        args[1],
        args[2],
        args[3] === 1,
        args[4] === 1,
      );

    // Random functions
    case "rbeta":
      return wasm_rbeta(args[0], args[1]);
    case "rnorm":
      return wasm_rnorm(args[0], args[1]);
    case "rgamma":
      return wasm_rgamma(args[0], args[1]);
    case "rexp":
      return wasm_rexp(args[0]);
    case "rchisq":
      return wasm_rchisq(args[0]);
    case "rf":
      return wasm_rf(args[0], args[1]);
    case "rt":
      return wasm_rt(args[0]);
    case "rpois":
      return wasm_rpois(args[0]);
    case "rbinom":
      return wasm_rbinom(args[0], args[1]);
    case "runif":
      return wasm_runif(args[0], args[1]);
    case "rweibull":
      return wasm_rweibull(args[0], args[1]);
    case "rgeom":
      return wasm_rgeom(args[0]);
    case "rhyper":
      return wasm_rhyper(args[0], args[1], args[2]);
    case "rlnorm":
      return wasm_rlnorm(args[0], args[1]);
    case "rnbinom":
      return wasm_rnbinom(args[0], args[1]);
    case "rwilcox":
      return wasm_rwilcox(args[0], args[1]);

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

export interface TestResult {
  function: string;
  rResult: number;
  rustResult: number;
  difference: number;
}

export async function runComparison(
  testCases: Array<{ func: string; distribution: string; args: number[] }>,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  for (const testCase of testCases) {
    try {
      const rResult = await callR(
        testCase.func,
        testCase.distribution,
        ...testCase.args,
      );
      const rustResult = callRust(testCase.func, ...testCase.args);
      const difference = Math.abs(rResult - rustResult);

      results.push({
        function: testCase.func,
        rResult,
        rustResult,
        difference,
      });
    } catch (error) {
      console.log(`${testCase.func}: Error - ${(error as Error).message}`);
    }
  }

  return results;
}

export function printResults(results: TestResult[]): void {
  if (results.length === 0) {
    console.log("No results to display.");
    return;
  }

  console.log(
    "Function".padEnd(8),
    "R Result".padEnd(12),
    "Rust Result".padEnd(12),
    "Difference".padEnd(12),
  );
  console.log("-".repeat(50));

  for (const result of results) {
    console.log(
      result.function.padEnd(8),
      result.rResult.toFixed(6).padEnd(12),
      result.rustResult.toFixed(6).padEnd(12),
      result.difference.toExponential(2).padEnd(12),
    );
  }
}
