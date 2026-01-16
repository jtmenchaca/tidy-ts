# Distribution Testing Suite

This directory contains comprehensive test suites for all statistical distributions implemented in tidy-ts, comparing Rust/WASM implementations against R's reference implementations.

## Structure

### R Test Scripts
- `*.test.R` - Individual R scripts for each distribution that can be called from command line
- `test-helpers.R` - Shared utilities for argument parsing and function calling
- Each script supports density (d), cumulative (p), quantile (q), and random (r) functions
- Usage: `Rscript <distribution>.test.R <function> <args...>`

### TypeScript Test Files  
- `*.test.ts` - Individual test files for each distribution
- `test-helpers.ts` - Shared utilities for R/Rust comparison
- `run_all_tests.ts` - Comprehensive test runner

## Available Distributions

| Distribution | R Script | TypeScript Test | Functions |
|-------------|----------|-----------------|-----------|
| Beta | `beta.test.R` | `beta.test.ts` | dbeta, pbeta, qbeta, rbeta |
| Normal | `normal.test.R` | `normal.test.ts` | dnorm, pnorm, qnorm, rnorm |
| Gamma | `gamma.test.R` | `gamma.test.ts` | dgamma, pgamma, qgamma, rgamma |
| Exponential | `exponential.test.R` | `exponential.test.ts` | dexp, pexp, qexp, rexp |
| Chi-squared | `chi_squared.test.R` | `chi_squared.test.ts` | dchisq, pchisq, qchisq, rchisq |
| F Distribution | `f_distribution.test.R` | `f_distribution.test.ts` | df, pf, qf, rf |
| Poisson | `poisson.test.R` | `poisson.test.ts` | dpois, ppois, qpois, rpois |
| Binomial | `binomial.test.R` | `binomial.test.ts` | dbinom, pbinom, qbinom, rbinom |
| t Distribution | `t_distribution.test.R` | `t_distribution.test.ts` | dt, pt, qt, rt |
| Uniform | `uniform.test.R` | - | dunif, punif, qunif, runif |
| Weibull | `weibull.test.R` | - | dweibull, pweibull, qweibull, rweibull |

## Usage

### Run Individual Tests
```bash
# Run a specific distribution test
deno run --allow-read --allow-run beta.test.ts

# Run R script directly
Rscript beta.test.R dbeta 0.5 2 3 0
```

### Run All Tests
```bash
# Run comprehensive test suite
deno run --allow-read --allow-run run_all_tests.ts
```

### Test Specific Functions
```bash
# Test density function
Rscript beta.test.R dbeta 0.5 2 3 0

# Test cumulative function  
Rscript beta.test.R pbeta 0.5 2 3 1 0

# Test quantile function
Rscript beta.test.R qbeta 0.6875 2 3 1 0

# Test random generation
Rscript beta.test.R rbeta 0 2 3
```

## Test Output

Each test displays:
- Function name
- R result
- Rust/WASM result  
- Absolute difference
- R-only tests for random generation functions

## Requirements

- R (with base statistical functions)
- Deno (for TypeScript tests)
- tidy-ts WASM module (built and available)

## Notes

- Random generation functions (r*) are only available in R and not exposed in the TypeScript interface
- All tests use fixed seeds for reproducible results
- Differences are calculated as absolute values for easy comparison
- Tests cover typical parameter ranges and edge cases
