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

# Helper function to create data frame with proper type handling
create_dataframe_from_json <- function(data, formula_str) {
  y <- as.numeric(data$y)
  df <- data.frame(y = y)
  
  for (var_name in names(data)) {
    if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
      # Check if the data is numeric or character/factor
      var_data <- data[[var_name]]
      if (is.character(var_data) || (is.list(var_data) && all(sapply(var_data, is.character)))) {
        # Convert to factor if it's character data
        df[[var_name]] <- as.factor(unlist(var_data))
      } else {
        # Convert to numeric if it's numeric data
        df[[var_name]] <- as.numeric(var_data)
      }
    }
  }
  
  return(df)
}

# Route to appropriate test function
result <- switch(test_type,
  # GLM Tests
  "glm.gaussian" = {
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    df <- create_dataframe_from_json(data, formula_str)
    
    # Fit GLM
    model <- glm(as.formula(formula_str), data = df, family = gaussian())
    
    list(
      coefficients = ifelse(is.na(coef(model)), 0, as.numeric(coef(model))),
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
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    df <- create_dataframe_from_json(data, formula_str)
    
    # Fit GLM
    model <- glm(as.formula(formula_str), data = df, family = binomial())
    
    list(
      coefficients = ifelse(is.na(coef(model)), 0, as.numeric(coef(model))),
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
  
  "glm.binomial.log" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with log link - use poisson family with log link for count data
    # or use logit link for binomial (since binomial doesn't support log link)
    model <- glm(as.formula(formula_str), data = df, family = binomial(link = "logit"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.binomial.log",
      family = "binomial",
      call = deparse(model$call),
      formula = formula_str
    )
  },
  
  "glm.poisson" = {
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    df <- create_dataframe_from_json(data, formula_str)
    
    # Fit GLM
    model <- glm(as.formula(formula_str), data = df, family = poisson())
    
    list(
      coefficients = ifelse(is.na(coef(model)), 0, as.numeric(coef(model))),
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

  "glm.gaussian.inverse" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with inverse link
    model <- glm(as.formula(formula_str), data = df, family = gaussian(link = "inverse"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.gaussian.inverse",
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
      coefficients = ifelse(is.na(coef(model)), 0, as.numeric(coef(model))),
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

  "glm.binomial.cauchit" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with cauchit link
    model <- glm(as.formula(formula_str), data = df, family = binomial(link = "cauchit"))
    
    list(
      coefficients = ifelse(is.na(coef(model)), 0, as.numeric(coef(model))),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.binomial.cauchit",
      family = "binomial",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.binomial.cloglog" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with cloglog link
    model <- glm(as.formula(formula_str), data = df, family = binomial(link = "cloglog"))
    
    list(
      coefficients = ifelse(is.na(coef(model)), 0, as.numeric(coef(model))),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.binomial.cloglog",
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

  "glm.poisson.sqrt" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with sqrt link
    model <- glm(as.formula(formula_str), data = df, family = poisson(link = "sqrt"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.poisson.sqrt",
      family = "poisson",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.gamma" = {
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    df <- create_dataframe_from_json(data, formula_str)
    
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

  "glm.gamma.identity" = {
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
    model <- glm(as.formula(formula_str), data = df, family = gamma(link = "identity"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.gamma.identity",
      family = "gamma",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.gamma.log" = {
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
    model <- glm(as.formula(formula_str), data = df, family = gamma(link = "log"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.gamma.log",
      family = "gamma",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.inverse.gaussian" = {
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    df <- create_dataframe_from_json(data, formula_str)
    
    # Fit GLM with inverse gaussian family
    model <- glm(as.formula(formula_str), data = df, family = inverse.gaussian(link = "1/mu^2"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.inverse.gaussian",
      family = "inverse_gaussian",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.inverse.gaussian.identity" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with inverse gaussian family and identity link
    model <- glm(as.formula(formula_str), data = df, family = inverse.gaussian(link = "identity"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.inverse.gaussian.identity",
      family = "inverse_gaussian",
      call = deparse(model$call),
      formula = formula_str
    )
  },

  "glm.inverse.gaussian.log" = {
    y <- as.numeric(data$y)
    formula_str <- if (is.null(data$formula)) "y ~ x" else data$formula
    
    # Create data frame with all predictors
    df <- data.frame(y = y)
    for (var_name in names(data)) {
      if (var_name != "y" && var_name != "formula" && var_name != "weights" && var_name != "offset") {
        df[[var_name]] <- as.numeric(data[[var_name]])
      }
    }
    
    # Fit GLM with inverse gaussian family and log link
    model <- glm(as.formula(formula_str), data = df, family = inverse.gaussian(link = "log"))
    
    list(
      coefficients = as.numeric(coef(model)),
      residuals = as.numeric(residuals(model)),
      fitted_values = as.numeric(fitted(model)),
      deviance = deviance(model),
      aic = AIC(model),
      method = "glm.inverse.gaussian.log",
      family = "inverse_gaussian",
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
