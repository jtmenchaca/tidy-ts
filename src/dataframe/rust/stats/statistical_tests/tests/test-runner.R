#!/usr/bin/env Rscript

library(jsonlite)

# Load packages for normality tests (install if not available)
if (!require(nortest, quietly = TRUE)) {
  install.packages("nortest", repos = "https://cran.r-project.org/")
  library(nortest)
}

if (!require(moments, quietly = TRUE)) {
  install.packages("moments", repos = "https://cran.r-project.org/")
  library(moments)
}

if (!require(fBasics, quietly = TRUE)) {
  install.packages("fBasics", repos = "https://cran.r-project.org/")
  library(fBasics)
}

# Parse the JSON parameter from command line
args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Usage: Rscript test-runner.R <json_params>")
}

# Parse the structured parameters
params <- fromJSON(args[1])

# Extract common parameters with defaults
test_type <- params$testType
data <- params$data
options <- if (is.null(params$options)) list() else params$options
alternative <- if (is.null(options$alternative)) "two.sided" else options$alternative
alpha <- if (is.null(options$alpha)) 0.05 else options$alpha

# Route to appropriate test function
result <- switch(test_type,
  # Correlation tests
  "cor.test.pearson" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    test_result <- cor.test(x, y, method = "pearson", alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      correlation = as.numeric(test_result$estimate),
      method = "pearson",
      alternative = alternative,
      alpha = alpha
    )
  },
  
  "cor.test.spearman" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    test_result <- cor.test(x, y, method = "spearman", alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      correlation = as.numeric(test_result$estimate),
      method = "spearman",
      alternative = alternative,
      alpha = alpha
    )
  },
  
  "cor.test.kendall" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    test_result <- cor.test(x, y, method = "kendall", alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      correlation = as.numeric(test_result$estimate),
      method = "kendall",
      alternative = alternative,
      alpha = alpha
    )
  },

  # T-tests
  "t.test.one" = {
    x <- as.numeric(data$x)
    mu <- if (is.null(options$mu)) 0 else options$mu
    test_result <- t.test(x, mu = mu, alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "t.test.one",
      alternative = alternative,
      alpha = alpha
    )
  },

  "t.test.two" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    var_equal <- if (is.null(options$assumeEqualVariances)) TRUE else options$assumeEqualVariances
    test_result <- t.test(x, y, alternative = alternative, var.equal = var_equal)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "t.test.two",
      alternative = alternative,
      alpha = alpha
    )
  },

  "t.test.paired" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    test_result <- t.test(x, y, alternative = alternative, paired = TRUE)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "t.test.paired",
      alternative = alternative,
      alpha = alpha
    )
  },

  # Z-tests (using normal approximation)
  "z.test.one" = {
    x <- as.numeric(data$x)
    mu <- if (is.null(options$mu)) 0 else options$mu
    sigma <- if (is.null(options$sigma)) 1 else options$sigma
    n <- length(x)
    z_stat <- (mean(x) - mu) / (sigma / sqrt(n))
    
    p_val <- switch(alternative,
      "two.sided" = 2 * (1 - pnorm(abs(z_stat))),
      "less" = pnorm(z_stat),
      "greater" = 1 - pnorm(z_stat)
    )
    
    list(
      test_statistic = z_stat,
      p_value = p_val,
      method = "z.test.one",
      alternative = alternative,
      alpha = alpha
    )
  },

  "z.test.two" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    sigma <- if (is.null(options$sigma)) 1 else options$sigma
    
    # Two-sample z-test assuming known variance
    n1 <- length(x)
    n2 <- length(y)
    se <- sigma * sqrt(1/n1 + 1/n2)
    z_stat <- (mean(x) - mean(y)) / se
    
    p_val <- switch(alternative,
      "two.sided" = 2 * (1 - pnorm(abs(z_stat))),
      "less" = pnorm(z_stat),
      "greater" = 1 - pnorm(z_stat)
    )
    
    list(
      test_statistic = z_stat,
      p_value = p_val,
      method = "z.test.two",
      alternative = alternative,
      alpha = alpha
    )
  },

  # Proportion tests
  "prop.test.one" = {
    x <- data$proportions$x
    n <- data$proportions$n
    p0 <- if (is.null(data$proportions$p0)) 0.5 else data$proportions$p0
    test_result <- prop.test(x, n, p = p0, alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "prop.test.one",
      alternative = alternative,
      alpha = alpha
    )
  },

  "prop.test.two" = {
    x1 <- data$proportions$x1
    n1 <- data$proportions$n1
    x2 <- data$proportions$x2
    n2 <- data$proportions$n2
    test_result <- prop.test(c(x1, x2), c(n1, n2), alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "prop.test.two",
      alternative = alternative,
      alpha = alpha
    )
  },

  # ANOVA tests
  "aov.one" = {
    groups <- data$groups
    # Convert matrix/array to list of vectors if needed
    if (is.matrix(groups) || is.array(groups)) {
      groups <- lapply(1:nrow(groups), function(i) as.numeric(groups[i, ]))
    } else if (!is.list(groups)) {
      stop("Groups must be a list of numeric vectors or a matrix")
    }
    
    # Convert groups to proper format
    group_lengths <- sapply(groups, length)
    group_labels <- rep(seq_along(groups), group_lengths)
    all_values <- unlist(groups)
    
    # Check that lengths match
    if (length(all_values) != length(group_labels)) {
      stop(paste("Length mismatch: values =", length(all_values), "labels =", length(group_labels)))
    }
    
    # Create data frame for ANOVA
    df <- data.frame(
      value = all_values,
      group = as.factor(group_labels)
    )
    
    # Perform ANOVA
    model <- lm(value ~ group, data = df)
    test_result <- anova(model)
    f_stat <- test_result$`F value`[1]
    p_val <- test_result$`Pr(>F)`[1]
    
    list(
      test_statistic = f_stat,
      p_value = p_val,
      method = "aov.one",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  "aov.welch" = {
    groups <- data$groups
    # Convert matrix/array to list of vectors if needed
    if (is.matrix(groups) || is.array(groups)) {
      groups <- lapply(1:nrow(groups), function(i) as.numeric(groups[i, ]))
    } else if (!is.list(groups)) {
      stop("Groups must be a list of numeric vectors or a matrix")
    }
    
    # Convert groups to proper format
    group_lengths <- sapply(groups, length)
    group_labels <- rep(seq_along(groups), group_lengths)
    all_values <- unlist(groups)
    
    if (length(all_values) != length(group_labels)) {
      stop(paste("Length mismatch: values =", length(all_values), "labels =", length(group_labels)))
    }
    
    # Create data frame for Welch ANOVA
    df <- data.frame(
      value = all_values,
      group = as.factor(group_labels)
    )
    
    test_result <- oneway.test(value ~ group, data = df, var.equal = FALSE)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "aov.welch",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  "kruskal.test" = {
    groups <- data$groups
    # Convert matrix/array to list of vectors if needed
    if (is.matrix(groups) || is.array(groups)) {
      groups <- lapply(1:nrow(groups), function(i) as.numeric(groups[i, ]))
    } else if (!is.list(groups)) {
      stop("Groups must be a list of numeric vectors or a matrix")
    }
    
    # Convert groups to proper format
    group_lengths <- sapply(groups, length)
    group_labels <- rep(seq_along(groups), group_lengths)
    all_values <- unlist(groups)
    
    if (length(all_values) != length(group_labels)) {
      stop(paste("Length mismatch: values =", length(all_values), "labels =", length(group_labels)))
    }
    
    # Create data frame for Kruskal-Wallis test
    df <- data.frame(
      value = all_values,
      group = as.factor(group_labels)
    )
    
    test_result <- kruskal.test(value ~ group, data = df)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "kruskal.test",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  # Chi-square tests
  "chisq.test" = {
    table_data <- data$contingencyTable
    test_result <- chisq.test(table_data)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "chisq.test",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  "fisher.test" = {
    table_data <- data$contingencyTable
    test_result <- fisher.test(table_data, alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$estimate),
      p_value = test_result$p.value,
      method = "fisher.test",
      alternative = alternative,
      alpha = alpha
    )
  },

  # Distribution tests
  "ks.test.uniform" = {
    x <- as.numeric(data$x)
    min_val <- if (is.null(options$min)) 0 else options$min
    max_val <- if (is.null(options$max)) 1 else options$max
    test_result <- ks.test(x, "punif", min = min_val, max = max_val, alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "ks.uniform",
      alternative = alternative,
      alpha = alpha
    )
  },

  "ks.test.two.sample" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    test_result <- ks.test(x, y, alternative = alternative)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "ks.two.sample",
      alternative = alternative,
      alpha = alpha
    )
  },

  "shapiro.test" = {
    x <- as.numeric(data$x)
    test_result <- shapiro.test(x)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "shapiro.test",
      alternative = "two.sided",
      alpha = alpha
    )
  },
  
  "ad.test" = {
    x <- as.numeric(data$x)
    test_result <- nortest::ad.test(x)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "ad.test",
      alternative = "two.sided",
      alpha = alpha
    )
  },
  
  "dagostino.test" = {
    x <- as.numeric(data$x)
    # D'Agostino-Pearson test using fBasics::dagoTest
    test_result <- fBasics::dagoTest(x)
    # Extract the omnibus (first) statistic and p-value
    list(
      test_statistic = as.numeric(test_result@test$statistic[1]),
      p_value = test_result@test$p.value[1],
      method = "dagostino.test",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  # Non-parametric tests
  "wilcox.test.signedrank" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    test_result <- wilcox.test(x, y, alternative = alternative, paired = TRUE)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "wilcox.signedrank",
      alternative = alternative,
      alpha = alpha
    )
  },

  "wilcox.test.mannwhitney" = {
    x <- as.numeric(data$x)
    y <- as.numeric(data$y)
    test_result <- wilcox.test(x, y, alternative = alternative, paired = FALSE)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "wilcox.mannwhitney",
      alternative = alternative,
      alpha = alpha
    )
  },
  
  # Two-way ANOVA tests
  "aov.two.factorA" = {
    two_way_data <- data$twoWayData
    a_levels <- two_way_data$aLevels
    b_levels <- two_way_data$bLevels
    cell_sizes <- two_way_data$cellSizes
    data_values <- two_way_data$data
    
    # Convert flat data to 3D structure
    data_3d <- array(NA, dim = c(a_levels, b_levels, max(cell_sizes)))
    data_index <- 1
    
    for (a in 1:a_levels) {
      for (b in 1:b_levels) {
        cell_size <- cell_sizes[(a-1) * b_levels + b]
        if (cell_size > 0) {
          data_3d[a, b, 1:cell_size] <- data_values[data_index:(data_index + cell_size - 1)]
          data_index <- data_index + cell_size
        }
      }
    }
    
    # Create data frame for two-way ANOVA
    df_data <- data.frame()
    for (a in 1:a_levels) {
      for (b in 1:b_levels) {
        cell_size <- cell_sizes[(a-1) * b_levels + b]
        if (cell_size > 0) {
          values <- data_3d[a, b, 1:cell_size]
          df_data <- rbind(df_data, data.frame(
            value = values,
            factor_a = rep(a, cell_size),
            factor_b = rep(b, cell_size)
          ))
        }
      }
    }
    
    # Two-way ANOVA
    model <- aov(value ~ factor(factor_a) * factor(factor_b), data = df_data)
    summary_result <- summary(model)
    
    # Extract factor A results
    f_stat <- summary_result[[1]][1, "F value"]
    p_val <- summary_result[[1]][1, "Pr(>F)"]
    
    list(
      test_statistic = f_stat,
      p_value = p_val,
      method = "aov.two.factorA",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  "aov.two.factorB" = {
    two_way_data <- data$twoWayData
    a_levels <- two_way_data$aLevels
    b_levels <- two_way_data$bLevels
    cell_sizes <- two_way_data$cellSizes
    data_values <- two_way_data$data
    
    # Convert flat data to 3D structure
    data_3d <- array(NA, dim = c(a_levels, b_levels, max(cell_sizes)))
    data_index <- 1
    
    for (a in 1:a_levels) {
      for (b in 1:b_levels) {
        cell_size <- cell_sizes[(a-1) * b_levels + b]
        if (cell_size > 0) {
          data_3d[a, b, 1:cell_size] <- data_values[data_index:(data_index + cell_size - 1)]
          data_index <- data_index + cell_size
        }
      }
    }
    
    # Create data frame for two-way ANOVA
    df_data <- data.frame()
    for (a in 1:a_levels) {
      for (b in 1:b_levels) {
        cell_size <- cell_sizes[(a-1) * b_levels + b]
        if (cell_size > 0) {
          values <- data_3d[a, b, 1:cell_size]
          df_data <- rbind(df_data, data.frame(
            value = values,
            factor_a = rep(a, cell_size),
            factor_b = rep(b, cell_size)
          ))
        }
      }
    }
    
    # Two-way ANOVA
    model <- aov(value ~ factor(factor_a) * factor(factor_b), data = df_data)
    summary_result <- summary(model)
    
    # Extract factor B results
    f_stat <- summary_result[[1]][2, "F value"]
    p_val <- summary_result[[1]][2, "Pr(>F)"]
    
    list(
      test_statistic = f_stat,
      p_value = p_val,
      method = "aov.two.factorB",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  "aov.two.interaction" = {
    two_way_data <- data$twoWayData
    a_levels <- two_way_data$aLevels
    b_levels <- two_way_data$bLevels
    cell_sizes <- two_way_data$cellSizes
    data_values <- two_way_data$data
    
    # Convert flat data to 3D structure
    data_3d <- array(NA, dim = c(a_levels, b_levels, max(cell_sizes)))
    data_index <- 1
    
    for (a in 1:a_levels) {
      for (b in 1:b_levels) {
        cell_size <- cell_sizes[(a-1) * b_levels + b]
        if (cell_size > 0) {
          data_3d[a, b, 1:cell_size] <- data_values[data_index:(data_index + cell_size - 1)]
          data_index <- data_index + cell_size
        }
      }
    }
    
    # Create data frame for two-way ANOVA
    df_data <- data.frame()
    for (a in 1:a_levels) {
      for (b in 1:b_levels) {
        cell_size <- cell_sizes[(a-1) * b_levels + b]
        if (cell_size > 0) {
          values <- data_3d[a, b, 1:cell_size]
          df_data <- rbind(df_data, data.frame(
            value = values,
            factor_a = rep(a, cell_size),
            factor_b = rep(b, cell_size)
          ))
        }
      }
    }
    
    # Two-way ANOVA
    model <- aov(value ~ factor(factor_a) * factor(factor_b), data = df_data)
    summary_result <- summary(model)
    
    # Extract interaction results
    f_stat <- summary_result[[1]][3, "F value"]
    p_val <- summary_result[[1]][3, "Pr(>F)"]
    
    list(
      test_statistic = f_stat,
      p_value = p_val,
      method = "aov.two.interaction",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  # Levene's test (simplified implementation)
  "levene.test" = {
    groups <- data$groups
    # Convert matrix/array to list of vectors if needed
    if (is.matrix(groups) || is.array(groups)) {
      groups <- lapply(1:nrow(groups), function(i) as.numeric(groups[i, ]))
    } else if (!is.list(groups)) {
      stop("Groups must be a list of numeric vectors or a matrix")
    }
    
    # Calculate group means
    group_means <- sapply(groups, mean)
    
    # Calculate absolute deviations from group means
    abs_deviations <- list()
    for (i in seq_along(groups)) {
      abs_deviations[[i]] <- abs(groups[[i]] - group_means[i])
    }
    
    # Perform one-way ANOVA on absolute deviations
    group_lengths <- sapply(abs_deviations, length)
    group_labels <- rep(seq_along(abs_deviations), group_lengths)
    all_deviations <- unlist(abs_deviations)
    
    test_result <- oneway.test(all_deviations ~ factor(group_labels), var.equal = FALSE)
    list(
      test_statistic = as.numeric(test_result$statistic),
      p_value = test_result$p.value,
      method = "levene.test",
      alternative = "two.sided",
      alpha = alpha
    )
  },

  # Default case
  {
    stop(paste("Unknown test type:", test_type))
  }
)

# Output the result as JSON
cat(toJSON(result, auto_unbox = TRUE))