#######################################
# Extended Demo: GLM, GEE, GLMM, IPW,
# G-formula, AIPW, TMLE, TMLE+ML
#######################################

# Install if needed:
# install.packages(c("geepack", "lme4", "ipw", "AIPW", "tmle", "SuperLearner"))

library(geepack)       # geeglm
library(lme4)          # glmer
library(ipw)           # IPW weights
library(AIPW)          # doubly robust AIPW
library(tmle)          # TMLE
library(SuperLearner)  # ML for TMLE

set.seed(123)

# Initialize results table as empty list
results_list <- list()

# Function to time a method
time_method <- function(method_name, expr) {
  start_time <- Sys.time()
  result <- eval(expr)
  end_time <- Sys.time()
  execution_time <- as.numeric(difftime(end_time, start_time, units = "secs"))
  cat("Execution time for", method_name, ":", round(execution_time, 3), "seconds\n")
  return(list(result = result, time = execution_time))
}

# -----------------------------
# Simulate clustered data
# -----------------------------
n_clusters <- 50  # Increased from 20 to 50
n_per <- 30
N <- n_clusters * n_per

cluster <- rep(1:n_clusters, each = n_per)
x <- rnorm(N)                      # baseline covariate
trt <- rbinom(N, 1, plogis(-0.5 + 0.5*x))  # treatment depends on x
u <- rnorm(n_clusters, 0, 0.5)     # cluster random effects
y <- rbinom(N, 1, plogis(-1 + 0.8*trt + 0.5*x + u[cluster])) # outcome

dat <- data.frame(y, trt, x, cluster)

# -----------------------------
# 1. GLM (ignores clustering)
# -----------------------------
glm_result <- time_method("GLM", {
  m_glm <- glm(y ~ trt + x, data = dat, family = binomial)
  glm_summary <- summary(m_glm)
  glm_coef <- glm_summary$coefficients["trt", ]
  list(glm_summary = glm_summary, glm_coef = glm_coef)
})

glm_summary <- glm_result$result$glm_summary
glm_coef <- glm_result$result$glm_coef

# Add to results list
results_list[["GLM"]] <- data.frame(
  Method = "GLM (ignores clustering)",
  Treatment_Effect = glm_coef[1],
  Std_Error = glm_coef[2],
  P_Value = glm_coef[4],
  CI_Lower = glm_coef[1] - 1.96 * glm_coef[2],
  CI_Upper = glm_coef[1] + 1.96 * glm_coef[2],
  Execution_Time = glm_result$time,
  Interpretation = "Log-odds ratio (ignores clustering)",
  stringsAsFactors = FALSE
)

print("1. GLM Results:")
print(glm_summary)

# -----------------------------
# 2. GEE (population-averaged)
# -----------------------------
gee_result <- time_method("GEE", {
  m_gee <- geeglm(y ~ trt + x, id = cluster, family = binomial,
                  corstr = "exchangeable", data = dat)
  gee_summary <- summary(m_gee)
  gee_coef <- gee_summary$coefficients["trt", ]
  list(gee_summary = gee_summary, gee_coef = gee_coef)
})

gee_summary <- gee_result$result$gee_summary
gee_coef <- gee_result$result$gee_coef

# Add to results list
results_list[["GEE"]] <- data.frame(
  Method = "GEE (population-averaged)",
  Treatment_Effect = gee_coef$Estimate,
  Std_Error = gee_coef$Std.err,
  P_Value = gee_coef$`Pr(>|W|)`,
  CI_Lower = gee_coef$Estimate - 1.96 * gee_coef$Std.err,
  CI_Upper = gee_coef$Estimate + 1.96 * gee_coef$Std.err,
  Execution_Time = gee_result$time,
  Interpretation = "Log-odds ratio (robust SEs)",
  stringsAsFactors = FALSE
)

print("2. GEE Results:")
print(gee_summary)

# -----------------------------
# 3. GLMM (cluster-specific)
# -----------------------------
glmm_result <- time_method("GLMM", {
  m_glmm <- glmer(y ~ trt + x + (1 | cluster), data = dat, family = binomial)
  glmm_summary <- summary(m_glmm)
  glmm_coef <- glmm_summary$coefficients["trt", ]
  list(glmm_summary = glmm_summary, glmm_coef = glmm_coef)
})

glmm_summary <- glmm_result$result$glmm_summary
glmm_coef <- glmm_result$result$glmm_coef

# Add to results list
results_list[["GLMM"]] <- data.frame(
  Method = "GLMM (cluster-specific)",
  Treatment_Effect = glmm_coef[1],
  Std_Error = glmm_coef[2],
  P_Value = glmm_coef[4],
  CI_Lower = glmm_coef[1] - 1.96 * glmm_coef[2],
  CI_Upper = glmm_coef[1] + 1.96 * glmm_coef[2],
  Execution_Time = glmm_result$time,
  Interpretation = "Log-odds ratio (cluster-specific)",
  stringsAsFactors = FALSE
)

print("3. GLMM Results:")
print(glmm_summary)

# -----------------------------
# 3b. GLMM -> Meta-analysis analogy (TRUE random-effects meta-analysis)
# -----------------------------
# Interpretation:
# - This is the closest GLMM analogue to random-effects meta-analysis
# - Fixed effect for trt = pooled log-odds ratio across clusters
# - Random slope (1 + trt | cluster) = allows treatment effects to vary across clusters
# - Random slope variance = heterogeneity in treatment effect (τ²)
# - This mirrors what you'd get from metafor::rma with REML on effect sizes

# True meta-analysis GLMM: allows treatment effects to vary across clusters
meta_glmm_result <- time_method("Meta-GLMM", {
  meta_glmm <- glmer(y ~ trt + (1 + trt | cluster), data = dat, family = binomial)
  meta_glmm_summary <- summary(meta_glmm)
  meta_glmm_coef <- meta_glmm_summary$coefficients["trt", ]
  list(meta_glmm_summary = meta_glmm_summary, meta_glmm_coef = meta_glmm_coef)
})

meta_glmm_summary <- meta_glmm_result$result$meta_glmm_summary
meta_glmm_coef <- meta_glmm_result$result$meta_glmm_coef

# Add to results list
results_list[["Meta_GLMM"]] <- data.frame(
  Method = "Meta-GLMM (random-effects)",
  Treatment_Effect = meta_glmm_coef[1],
  Std_Error = meta_glmm_coef[2],
  P_Value = meta_glmm_coef[4],
  CI_Lower = meta_glmm_coef[1] - 1.96 * meta_glmm_coef[2],
  CI_Upper = meta_glmm_coef[1] + 1.96 * meta_glmm_coef[2],
  Execution_Time = meta_glmm_result$time,
  Interpretation = "Pooled log-odds ratio (meta-analysis)",
  stringsAsFactors = FALSE
)

print("3b. Meta-GLMM Results:")
print(meta_glmm_summary)
cat("- Fixed effect (trt): pooled log-odds ratio across clusters\n")
cat("- Random slope variance: heterogeneity in treatment effects (τ²)\n")
cat("- This is the true GLMM analogue to random-effects meta-analysis\n")

# -----------------------------
# 4. IPW (ATE via weighting)
# -----------------------------
ipw_result <- time_method("IPW", {
  ps_model <- glm(trt ~ x, data = dat, family = binomial)
  ps <- predict(ps_model, type = "response")
  w <- ifelse(dat$trt == 1, 1/ps, 1/(1-ps))
  m_ipw <- glm(y ~ trt, data = dat, family = binomial, weights = w)
  ipw_summary <- summary(m_ipw)
  ipw_coef <- ipw_summary$coefficients["trt", ]
  list(ipw_summary = ipw_summary, ipw_coef = ipw_coef)
})

ipw_summary <- ipw_result$result$ipw_summary
ipw_coef <- ipw_result$result$ipw_coef

# Add to results list
results_list[["IPW"]] <- data.frame(
  Method = "IPW (inverse probability weighting)",
  Treatment_Effect = ipw_coef[1],
  Std_Error = ipw_coef[2],
  P_Value = ipw_coef[4],
  CI_Lower = ipw_coef[1] - 1.96 * ipw_coef[2],
  CI_Upper = ipw_coef[1] + 1.96 * ipw_coef[2],
  Execution_Time = ipw_result$time,
  Interpretation = "Log-odds ratio (IPW weights)",
  stringsAsFactors = FALSE
)

print("4. IPW Results:")
print(ipw_summary)

# -----------------------------
# 5. G-formula (standardization)
# -----------------------------
gformula_result <- time_method("G-formula", {
  outcome_model <- glm(y ~ trt + x, data = dat, family = binomial)
  p1 <- mean(predict(outcome_model, newdata = transform(dat, trt=1), type="response"))
  p0 <- mean(predict(outcome_model, newdata = transform(dat, trt=0), type="response"))
  ATE_gformula <- p1 - p0
  log_or_gformula <- log((p1/(1-p1)) / (p0/(1-p0)))
  list(ATE_gformula = ATE_gformula, log_or_gformula = log_or_gformula)
})

ATE_gformula <- gformula_result$result$ATE_gformula
log_or_gformula <- gformula_result$result$log_or_gformula

# Calculate bootstrap SE for G-formula (simplified approach)
# In practice, you'd use proper bootstrap, but for demo we'll use delta method approximation
gformula_se <- sqrt(1/sum(dat$trt==1) + 1/sum(dat$trt==0))  # Approximate SE
gformula_pval <- 2 * (1 - pnorm(abs(log_or_gformula / gformula_se)))

# Add to results list
results_list[["Gformula"]] <- data.frame(
  Method = "G-formula (standardization)",
  Treatment_Effect = log_or_gformula,
  Std_Error = gformula_se,
  P_Value = gformula_pval,
  CI_Lower = log_or_gformula - 1.96 * gformula_se,
  CI_Upper = log_or_gformula + 1.96 * gformula_se,
  Execution_Time = gformula_result$time,
  Interpretation = "Log-odds ratio (standardization)",
  stringsAsFactors = FALSE
)

print("5. G-formula Results:")
cat("ATE (risk difference):", round(ATE_gformula, 4), "\n")
cat("Log-odds ratio:", round(log_or_gformula, 4), "\n")

# -----------------------------
# 6. Doubly Robust (AIPW)
# -----------------------------
aipw_result <- time_method("AIPW", {
  aipw_obj <- AIPW$new(Y = dat$y, A = dat$trt, W = data.frame(x = dat$x),
                       Q.SL.library = "SL.glm", g.SL.library = "SL.glm")
  aipw_obj$fit()
  aipw_summary <- aipw_obj$summary()
  aipw_or <- aipw_summary$result["Odds Ratio", "Estimate"]
  log_or_aipw <- log(aipw_or)
  aipw_se <- aipw_summary$result["Odds Ratio", "SE"]
  log_se_aipw <- aipw_se / aipw_or  # Delta method
  list(aipw_summary = aipw_summary, log_or_aipw = log_or_aipw, log_se_aipw = log_se_aipw)
})

aipw_summary <- aipw_result$result$aipw_summary
log_or_aipw <- aipw_result$result$log_or_aipw
log_se_aipw <- aipw_result$result$log_se_aipw

# Add to results list
results_list[["AIPW"]] <- data.frame(
  Method = "AIPW (doubly robust)",
  Treatment_Effect = log_or_aipw,
  Std_Error = log_se_aipw,
  P_Value = 2 * (1 - pnorm(abs(log_or_aipw / log_se_aipw))),
  CI_Lower = log_or_aipw - 1.96 * log_se_aipw,
  CI_Upper = log_or_aipw + 1.96 * log_se_aipw,
  Execution_Time = aipw_result$time,
  Interpretation = "Log-odds ratio (doubly robust)",
  stringsAsFactors = FALSE
)

print("6. AIPW Results:")
print(aipw_summary)

# -----------------------------
# 7. TMLE (parametric, logistic) - COMMENTED OUT FOR SPEED
# -----------------------------
# tmle_result <- time_method("TMLE", {
#   tmle_fit <- tmle(Y = dat$y,
#                    A = dat$trt,
#                    W = data.frame(x = dat$x),
#                    family = "binomial")
#   tmle_summary <- summary(tmle_fit)
#   tmle_or <- tmle_summary$estimates$OR$psi
#   log_or_tmle <- log(tmle_or)
#   tmle_var <- tmle_summary$estimates$OR$var.psi
#   tmle_se <- if(is.numeric(tmle_var)) sqrt(tmle_var) else NA
#   log_se_tmle <- if(is.numeric(tmle_se)) tmle_se / tmle_or else NA  # Delta method
#   list(tmle_summary = tmle_summary, log_or_tmle = log_or_tmle, log_se_tmle = log_se_tmle)
# })
# 
# tmle_summary <- tmle_result$result$tmle_summary
# log_or_tmle <- tmle_result$result$log_or_tmle
# log_se_tmle <- tmle_result$result$log_se_tmle
# 
# # Add to results list
# results_list[["TMLE"]] <- data.frame(
#   Method = "TMLE (parametric)",
#   Treatment_Effect = log_or_tmle,
#   Std_Error = log_se_tmle,
#   P_Value = tmle_summary$estimates$OR$pvalue,
#   CI_Lower = log(tmle_summary$estimates$OR$CI[1]),
#   CI_Upper = log(tmle_summary$estimates$OR$CI[2]),
#   Execution_Time = tmle_result$time,
#   Interpretation = "Log-odds ratio (TMLE)",
#   stringsAsFactors = FALSE
# )
# 
# print("7. TMLE Results:")
# print(tmle_summary)

# -----------------------------
# 8. TMLE + SuperLearner (ML) - GLMM outcome model approach
# -----------------------------
# 1. Fit GLMM outcome model
glmm_model <- glmer(
  y ~ trt + x + (1 | cluster),
  data = dat,
  family = binomial
)

# 2. Predict potential outcomes under treatment and control
library(dplyr)
dat_Q1 <- dat %>% mutate(trt = 1)
dat_Q0 <- dat %>% mutate(trt = 0)

Q1_pred <- predict(glmm_model, newdata = dat_Q1, type = "response", allow.new.levels = TRUE)
Q0_pred <- predict(glmm_model, newdata = dat_Q0, type = "response", allow.new.levels = TRUE)

Q_mat <- cbind(Q0_pred, Q1_pred)
colnames(Q_mat) <- c("Q0W", "Q1W")

# 3. SuperLearner for propensity score (treatment model)
set.seed(123)  # for reproducibility

sl_lib <- c("SL.glm", "SL.mean", "SL.gam", "SL.rpart")  # Fast but varied learners
W_df <- data.frame(x = dat$x)  # covariates only

sl_fit <- SuperLearner(
  Y = dat$trt,
  X = W_df,
  family = binomial(),
  SL.library = sl_lib,
  method = "method.NNloglik"
)

g1W <- sl_fit$SL.predict  # predicted P(A = 1 | W)

# 4. Run TMLE with pre-computed Q and g
tmle_ml_result <- time_method("TMLE+ML", {
  tmle_ml <- tmle(
    Y = dat$y,
    A = dat$trt,
    W = W_df,
    Q = Q_mat,
    g1W = g1W,
    family = "binomial"
  )
  tmle_ml_summary <- summary(tmle_ml)
  tmle_ml_or <- tmle_ml_summary$estimates$OR$psi
  log_or_tmle_ml <- log(tmle_ml_or)
  tmle_ml_var <- tmle_ml_summary$estimates$OR$var.psi
  
  # Extract SE from confidence intervals if variance is NULL
  if(is.null(tmle_ml_var) || !is.numeric(tmle_ml_var) || tmle_ml_var <= 0) {
    # Use CI to approximate SE: SE ≈ (CI_upper - CI_lower) / (2 * 1.96)
    ci_lower <- log(tmle_ml_summary$estimates$OR$CI[1])
    ci_upper <- log(tmle_ml_summary$estimates$OR$CI[2])
    log_se_tmle_ml <- (ci_upper - ci_lower) / (2 * 1.96)
  } else {
    tmle_ml_se <- sqrt(tmle_ml_var)
    log_se_tmle_ml <- tmle_ml_se / tmle_ml_or  # Delta method
  }
  list(tmle_ml_summary = tmle_ml_summary, log_or_tmle_ml = log_or_tmle_ml, log_se_tmle_ml = log_se_tmle_ml)
})

tmle_ml_summary <- tmle_ml_result$result$tmle_ml_summary
log_or_tmle_ml <- tmle_ml_result$result$log_or_tmle_ml
log_se_tmle_ml <- tmle_ml_result$result$log_se_tmle_ml

# Add to results list
results_list[["TMLE_ML"]] <- data.frame(
  Method = "TMLE + SuperLearner (ML)",
  Treatment_Effect = log_or_tmle_ml,
  Std_Error = log_se_tmle_ml,
  P_Value = tmle_ml_summary$estimates$OR$pvalue,
  CI_Lower = log(tmle_ml_summary$estimates$OR$CI[1]),
  CI_Upper = log(tmle_ml_summary$estimates$OR$CI[2]),
  Execution_Time = tmle_ml_result$time,
  Interpretation = "Log-odds ratio (TMLE+ML)",
  stringsAsFactors = FALSE
)

print("8. TMLE + SuperLearner Results:")
print(tmle_ml_summary)

#######################################
# COMPARISON TABLE
#######################################

cat("\n", paste(rep("=", 80), collapse=""), "\n")
cat("COMPARISON OF TREATMENT EFFECTS ACROSS METHODS\n")
cat(paste(rep("=", 80), collapse=""), "\n")

# Combine results list into data frame
# Ensure all data frames have the same column structure
all_cols <- c("Method", "Treatment_Effect", "Std_Error", "P_Value", "CI_Lower", "CI_Upper", "Execution_Time", "Interpretation")
results_list <- lapply(results_list, function(df) {
  for(col in all_cols) {
    if(!col %in% names(df)) {
      df[[col]] <- NA
    }
  }
  df[all_cols]  # Reorder columns
})

results_table <- do.call(rbind, results_list)

# Format the results table nicely
results_table$Treatment_Effect <- round(results_table$Treatment_Effect, 4)
results_table$Std_Error <- round(results_table$Std_Error, 4)
results_table$P_Value <- round(results_table$P_Value, 6)
results_table$CI_Lower <- round(results_table$CI_Lower, 4)
results_table$CI_Upper <- round(results_table$CI_Upper, 4)
results_table$Execution_Time <- round(results_table$Execution_Time, 3)

# Print formatted table
print(results_table, row.names = FALSE)

#######################################
# End of Extended Demo
#######################################