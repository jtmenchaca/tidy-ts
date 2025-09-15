// Statistical Tests Module
// Exports all statistical test functions
//
// Note: Function names follow R-style conventions (e.g., t_test_ind, z_test_ind)
// to maintain familiarity for users coming from R/tidyverse. This is intentional
// and consistent with the library's design philosophy.

export * from "./anova.ts";
export * from "./correlation-tests.ts";
export * from "./chi-square.ts";
export * from "./fishers-exact.ts";
export * from "./mann-whitney.ts";
export * from "./proportion-tests.ts";
export * from "./shapiro-wilk.ts";
export * from "./t-tests.ts";
export * from "./kruskal-wallis.ts";
export * from "./wilcoxon.ts";
export * from "./z-tests.ts";
