# GitHub Actions Workflows

This document explains the CI/CD logic for the tidy-ts project.

## Overview

We have 3 GitHub Actions workflows that handle different aspects of testing, validation, and documentation:

1. **CI Workflow** (`ci.yml`) - Main testing and validation
2. **Coverage Badge** (`coverage-badge.yml`) - Updates README coverage badge
3. **Deploy** (`deploy.yml`) - Documentation deployment

## 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual workflow dispatch

**Strategy:** Cross-platform testing on Ubuntu, macOS, and Windows with Deno 2.4.2

### Jobs

#### Main Test Job (`test`)
**Purpose:** Primary validation across all platforms

**Environment Setup:**
1. **R Installation:** Installs R with required packages (`jsonlite`, `nortest`, `moments`, `fBasics`)
   - *Why:* Statistical tests compare TypeScript/WASM results against R reference implementations
2. **Output Directories:** Creates `examples/dataframe/output/` for graph export tests
3. **Deno Setup:** Installs Deno 2.4.2 with caching

**Test Sequence:**
1. **Format Check:** `deno fmt --check` - Ensures consistent code formatting
2. **Lint:** `deno lint` - Code quality and style validation
3. **Tests with Coverage:** Runs comprehensive test suite:
   - `src/dataframe` - Core DataFrame functionality
   - `examples/dataframe` - Usage examples validation
   - `tests/glm` - Generalized Linear Models (requires R)
   - `tests/statistical_tests` - Statistical hypothesis tests (requires R)
4. **Coverage Reporting (Ubuntu only):** Generates and uploads coverage to Codecov

#### Canary Test Job (`test-canary`)
**Purpose:** Early detection of Deno compatibility issues

**Characteristics:**
- Uses bleeding-edge Deno canary builds
- `continue-on-error: true` - Failures don't block CI
- Same R setup as main tests
- Runs full test suite to catch regressions

#### JSR Package Validation (`build-jsr`)
**Purpose:** Validates package for JavaScript Registry publication

**Steps:**
1. **Type Check:** `deno check src/dataframe/mod.ts` - TypeScript validation
2. **Package Tests:** Full test suite to ensure JSR compatibility

## 2. Coverage Badge Workflow (`coverage-badge.yml`)

**Triggers:**
- Push to `main` branch only
- Manual workflow dispatch

**Purpose:** Automatically updates the coverage badge in README.md

**Process:**
1. Runs same test environment as CI (R + Deno setup)
2. Executes tests with coverage collection
3. Extracts coverage percentage from detailed report
4. Updates README.md badge URL with new percentage
5. Commits and pushes changes if coverage changed

## 3. Deploy Workflow (`deploy.yml`)

**Purpose:** Deploys documentation site (details depend on implementation)

## Dependencies Explained

### Why R is Required

The project includes a **statistical validation system** that compares results between:
- **TypeScript/WASM implementations** (your code)
- **R reference implementations** (gold standard)

**R Packages Used:**
- `jsonlite` - JSON parsing for test data exchange
- `nortest` - Normality tests (Anderson-Darling, etc.)
- `moments` - Statistical moments and skewness/kurtosis
- `fBasics` - Additional statistical functions

**Test Types Requiring R:**
- GLM (Generalized Linear Models) - All families (gaussian, binomial, poisson, gamma, inverse gaussian)
- Statistical hypothesis tests - t-tests, z-tests, ANOVA, chi-square, etc.
- Distribution tests - Kolmogorov-Smirnov, Shapiro-Wilk, etc.
- Correlation tests - Pearson, Spearman, Kendall

### Cross-Platform Considerations

**Windows-Specific Setup:**
- Git line ending configuration to prevent CRLF issues
- R installation may have different paths/behavior

**Platform-Specific Conditionals:**
- Coverage reporting only on Ubuntu (most stable)
- Git configuration only on Windows

## Performance Optimizations

1. **Parallel Testing:** `--parallel` flag for faster test execution
2. **Caching:** Deno dependencies cached between runs
3. **Concurrency Control:** `cancel-in-progress: true` stops outdated runs
4. **Matrix Strategy:** Tests run in parallel across all OS platforms

## Failure Scenarios

**Common Failure Points:**
1. **R Package Installation:** Network issues or package dependencies
2. **Statistical Test Validation:** Precision differences between implementations
3. **Graph Export Tests:** Missing output directories or rendering issues
4. **Format/Lint Issues:** Code style violations
5. **Cross-Platform Compatibility:** Path or environment differences

**Error Handling:**
- Canary tests are allowed to fail without blocking CI
- Coverage badge updates are separate from main validation
- Detailed error reporting for debugging statistical test failures