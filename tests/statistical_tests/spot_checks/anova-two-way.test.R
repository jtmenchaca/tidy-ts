# Two-way ANOVA spot check test data
# Create a 2x2 factorial design with known effects

# Factor A: Treatment (Control vs Treatment)
# Factor B: Time (Before vs After)
# 2x2 design with 6 observations per cell

# Cell A1B1: Control, Before
groupA1B1 <- c(12.3, 15.7, 18.2, 14.8, 16.1, 13.9)

# Cell A1B2: Control, After  
groupA1B2 <- c(22.1, 25.4, 28.6, 24.3, 26.8, 23.7)

# Cell A2B1: Treatment, Before
groupA2B1 <- c(11.8, 14.2, 17.5, 13.9, 15.6, 12.4)

# Cell A2B2: Treatment, After
groupA2B2 <- c(28.5, 31.2, 34.8, 30.1, 32.7, 29.3)

# Combine all data
y <- c(groupA1B1, groupA1B2, groupA2B1, groupA2B2)

# Create factor variables
factorA <- factor(rep(c("Control", "Treatment"), each = 12))
factorB <- factor(rep(c("Before", "After", "Before", "After"), each = 6))

# Create data frame
df <- data.frame(
  y = y,
  factorA = factorA,
  factorB = factorB
)

# Perform two-way ANOVA
model <- aov(y ~ factorA * factorB, data = df)
summary_result <- summary(model)

# Extract ANOVA table components
anova_table <- summary_result[[1]]

# Extract individual test results
factorA_ss <- anova_table[1, "Sum Sq"]
factorA_df <- anova_table[1, "Df"]
factorA_ms <- anova_table[1, "Mean Sq"]
factorA_f <- anova_table[1, "F value"]
factorA_p <- anova_table[1, "Pr(>F)"]

factorB_ss <- anova_table[2, "Sum Sq"]
factorB_df <- anova_table[2, "Df"]
factorB_ms <- anova_table[2, "Mean Sq"]
factorB_f <- anova_table[2, "F value"]
factorB_p <- anova_table[2, "Pr(>F)"]

interaction_ss <- anova_table[3, "Sum Sq"]
interaction_df <- anova_table[3, "Df"]
interaction_ms <- anova_table[3, "Mean Sq"]
interaction_f <- anova_table[3, "F value"]
interaction_p <- anova_table[3, "Pr(>F)"]

residual_ss <- anova_table[4, "Sum Sq"]
residual_df <- anova_table[4, "Df"]
residual_ms <- anova_table[4, "Mean Sq"]

# Calculate total sum of squares
total_ss <- sum(anova_table[, "Sum Sq"])
total_df <- sum(anova_table[, "Df"])

# Calculate R-squared
r_squared <- 1 - (residual_ss / total_ss)
adjusted_r_squared <- 1 - (residual_ms / (total_ss / total_df))

# Calculate cell means
cell_means <- tapply(y, list(factorA, factorB), mean)
grand_mean <- mean(y)

# Calculate cell standard deviations
cell_sds <- tapply(y, list(factorA, factorB), sd)

# Calculate effect sizes (eta-squared)
eta_squared_factorA <- factorA_ss / total_ss
eta_squared_factorB <- factorB_ss / total_ss
eta_squared_interaction <- interaction_ss / total_ss

# Calculate partial eta-squared
partial_eta_squared_factorA <- factorA_ss / (factorA_ss + residual_ss)
partial_eta_squared_factorB <- factorB_ss / (factorB_ss + residual_ss)
partial_eta_squared_interaction <- interaction_ss / (interaction_ss + residual_ss)

# Calculate omega-squared (more conservative effect size)
omega_squared_factorA <- (factorA_ss - factorA_df * residual_ms) / (total_ss + residual_ms)
omega_squared_factorB <- (factorB_ss - factorB_df * residual_ms) / (total_ss + residual_ms)
omega_squared_interaction <- (interaction_ss - interaction_df * residual_ms) / (total_ss + residual_ms)

# Extract model information
model_info <- summary.lm(model)
coefficients <- model_info$coefficients
residual_se <- model_info$sigma
r_squared_lm <- model_info$r.squared
adj_r_squared_lm <- model_info$adj.r.squared

# Extract F-statistic for overall model
f_statistic <- model_info$fstatistic[1]
f_df1 <- model_info$fstatistic[2]
f_df2 <- model_info$fstatistic[3]
f_p_value <- pf(f_statistic, f_df1, f_df2, lower.tail = FALSE)

# Extract degrees of freedom
df_total <- length(y) - 1
df_error <- residual_df

# Calculate sample size
sample_size <- length(y)

# Output comprehensive results
cat("=== R TWO-WAY ANOVA RESULT ===\n")

# Basic ANOVA table
cat("ANOVA Table:\n")
cat(sprintf("Factor A (Treatment): F(%.0f,%.0f) = %.4f, p = %.5f\n", 
    factorA_df, residual_df, factorA_f, factorA_p))
cat(sprintf("Factor B (Time): F(%.0f,%.0f) = %.4f, p = %.5f\n", 
    factorB_df, residual_df, factorB_f, factorB_p))
cat(sprintf("Interaction (A×B): F(%.0f,%.0f) = %.4f, p = %.5f\n", 
    interaction_df, residual_df, interaction_f, interaction_p))

# Sum of squares
cat(sprintf("Sum of Squares - Factor A: %.4f, Factor B: %.4f, Interaction: %.4f, Residual: %.4f, Total: %.4f\n",
    factorA_ss, factorB_ss, interaction_ss, residual_ss, total_ss))

# Mean squares
cat(sprintf("Mean Squares - Factor A: %.4f, Factor B: %.4f, Interaction: %.4f, Residual: %.4f\n",
    factorA_ms, factorB_ms, interaction_ms, residual_ms))

# Effect sizes
cat(sprintf("Eta-squared - Factor A: %.4f, Factor B: %.4f, Interaction: %.4f\n",
    eta_squared_factorA, eta_squared_factorB, eta_squared_interaction))

cat(sprintf("Partial Eta-squared - Factor A: %.4f, Factor B: %.4f, Interaction: %.4f\n",
    partial_eta_squared_factorA, partial_eta_squared_factorB, partial_eta_squared_interaction))

cat(sprintf("Omega-squared - Factor A: %.4f, Factor B: %.4f, Interaction: %.4f\n",
    omega_squared_factorA, omega_squared_factorB, omega_squared_interaction))

# Model fit
cat(sprintf("R-squared: %.4f | Adjusted R-squared: %.4f\n", r_squared, adjusted_r_squared))
cat(sprintf("Residual Standard Error: %.4f\n", residual_se))
cat(sprintf("Overall F(%.0f,%.0f) = %.4f, p = %.5f\n", f_df1, f_df2, f_statistic, f_p_value))

# Sample information
cat(sprintf("Sample size: %d | Total df: %d | Error df: %d\n", sample_size, df_total, df_error))
cat(sprintf("Grand mean: %.4f\n", grand_mean))

# Cell means and standard deviations
cat("Cell means:\n")
cat(sprintf("  Control-Before: %.4f (SD: %.4f)\n", cell_means[1,1], cell_sds[1,1]))
cat(sprintf("  Control-After: %.4f (SD: %.4f)\n", cell_means[1,2], cell_sds[1,2]))
cat(sprintf("  Treatment-Before: %.4f (SD: %.4f)\n", cell_means[2,1], cell_sds[2,1]))
cat(sprintf("  Treatment-After: %.4f (SD: %.4f)\n", cell_means[2,2], cell_sds[2,2]))

# Degrees of freedom breakdown
cat(sprintf("Degrees of freedom - Factor A: %d, Factor B: %d, Interaction: %d, Error: %d, Total: %d\n",
    factorA_df, factorB_df, interaction_df, residual_df, df_total))

cat("=== END R TWO-WAY ANOVA ===\n")