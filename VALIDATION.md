# Statistical Test Validation

Tidy-TS validates its statistical procedures by comparing outputs against [R](https://www.r-project.org/) results to ensure correctness.

## How It Works

Each statistical test runs in both **Rust** and **R** with identical inputs. We compare:
- **Test statistic** 
- **P-value**

Results must match within `0.0001` (1e-4) tolerance to pass. This accounts for differences in floating point precision and implementation details across runtimes.

## Running Tests

```bash
deno task test-stats-tests
```

## Test Coverage

**Correlation Tests:**
- Pearson correlation
- Spearman correlation  
- Kendall correlation

**T-Tests:**
- One-sample t-test
- Two-sample t-test (independent)
- Paired t-test

**Z-Tests:**
- One-sample z-test
- Two-sample z-test

**Proportion Tests:**
- One-sample proportion test
- Two-sample proportion test

**Distribution Tests:**
- Kolmogorov-Smirnov (one-sample and two-sample)
- Shapiro-Wilk normality test
- Anderson-Darling normality test
- D'Agostino-Pearson normality test

**Non-parametric Tests:**
- Wilcoxon signed-rank test
- Mann-Whitney U test
- Kruskal-Wallis test

**ANOVA Tests:**
- One-way ANOVA
- Welch ANOVA

**Categorical Tests:**
- Chi-square test
- Fisher's exact test

## Example Output

```
🔬 Pearson Correlation Tests: 2/2 passed
  ✅ cor.test.pearson (less, α=0.1): PASS
    Test Statistic: R=-0.201800, Rust=-0.201773 (diff: 0.000027)
    P-Value: R=0.421500, Rust=0.421498 (diff: 0.000002)
```

## Implementation

- TypeScript test harness calls both R and Rust implementations
- Same randomized inputs ensure fair comparison
- Automated tolerance checking with detailed output
- Runs as part of CI pipeline