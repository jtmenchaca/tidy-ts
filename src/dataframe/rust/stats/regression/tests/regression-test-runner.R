#!/usr/bin/env Rscript

library(jsonlite)

# Parse the JSON parameter from command line
args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Usage: Rscript regression-test-runner.R <json_params>")
}

# Parse the structured parameters
params <- fromJSON(args[1])

# Extract common parameters with defaults
test_type <- params$testType
data <- params$data
options <- if (is.null(params$options)) list() else params$options
alpha <- if (is.null(options$alpha)) 0.05 else options$alpha

# Route to appropriate test function
result <- switch(test_type,
  # GLM Tests
  "glm.gaussian" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM
    model <- glm(as.formula(formula_str), data = df, family = gaussian())
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      r_squared = summary(model)$r.squared,
      method = "glm.gaussian",
      family = "gaussian",
      call = deparse(model$call),
      formula = formula_str
    )
  },
  
  "glm.binomial" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM
    model <- glm(as.formula(formula_str), data = df, family = binomial())
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.binomial",
      family = "binomial",
      call = deparse(model$call),
      formula = formula_str
    )
  },
  
  "glm.poisson" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM
    model <- glm(as.formula(formula_str), data = df, family = poisson())
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.poisson",
      family = "poisson",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  # Additional GLM test types with different link functions
  "glm.gaussian.log" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with log link
    model <- glm(as.formula(formula_str), data = df, family = gaussian(link = "log"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.gaussian.log",
      family = "gaussian",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.binomial.probit" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with probit link
    model <- glm(as.formula(formula_str), data = df, family = binomial(link = "probit"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.binomial.probit",
      family = "binomial",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.poisson.identity" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with identity link
    model <- glm(as.formula(formula_str), data = df, family = poisson(link = "identity"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.poisson.identity",
      family = "poisson",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.gamma" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with gamma family
    model <- glm(as.formula(formula_str), data = df, family = Gamma(link = "inverse"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.gamma",
      family = "gamma",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  # LM Tests
  "lm.simple" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit LM
    model <- lm(as.formula(formula_str), data = df)
    summary_model <- summary(model)
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      r_squared = summary_model$r.squared,
      adj_r_squared = summary_model$adj.r.squared,
      f_statistic = as.numeric(summary_model$fstatistic[1]),
      p_value = pf(summary_model$fstatistic[1], summary_model$fstatistic[2], summary_model$fstatistic[3], lower.tail = FALSE),
      df_residual = summary_model$df[2],
      method = "lm.simple",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "lm.weighted" = {
    y <- as.numeric(data$y)
    weights <- if (is.null(data$weights)) rep(1, length(y)) else as.numeric(data$weights)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y, weights = weights)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit weighted LM
    model <- lm(as.formula(formula_str), data = df, weights = weights)
    summary_model <- summary(model)
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      r_squared = summary_model$r.squared,
      adj_r_squared = summary_model$adj.r.squared,
      f_statistic = as.numeric(summary_model$fstatistic[1]),
      p_value = pf(summary_model$fstatistic[1], summary_model$fstatistic[2], summary_model$fstatistic[3], lower.tail = FALSE),
      df_residual = summary_model$df[2],
      method = "lm.weighted",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  # Default case
  {
    stop(paste("Unknown regression test type:", test_type))
  }
)

# Output the result as JSON with higher precision
cat(toJSON(result, auto_unbox = TRUE, digits = 15))
