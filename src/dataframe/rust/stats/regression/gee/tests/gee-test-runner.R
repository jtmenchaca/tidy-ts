#!/usr/bin/env Rscript

library(jsonlite)
library(geepack)

# Parse the JSON parameter from command line
args <- commandArgs(trailingOnly = TRUE)

if (length(args) < 1) {
  stop("Usage: Rscript gee-test-runner.R <json_params>")
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
  id <- as.numeric(data$id)
  df <- data.frame(y = y, id = id)
  
  for (var_name in names(data)) {
    if (var_name != "y" && var_name != "id" && var_name != "waves" && 
        var_name != "formula" && var_name != "weights" && var_name != "offset") {
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

# Generic GEE function that handles all test types
run_gee_test <- function(data, options) {
  formula_str <- if (is.null(data$formula)) "y ~ x1" else data$formula
  df <- create_dataframe_from_json(data, formula_str)
  
  # Extract options
  family <- if (is.null(options$family)) "gaussian" else options$family
  link <- if (is.null(options$link)) "identity" else options$link
  corstr <- if (is.null(options$corstr)) "independence" else options$corstr
  std_err <- if (is.null(options$std_err)) "san.se" else options$std_err
  scale_fix <- if (is.null(options$scale_fix)) FALSE else options$scale_fix
  scale_value <- if (is.null(options$scale_value)) 1.0 else options$scale_value
  
  # Create family object
  if (family == "gaussian") {
    if (link == "identity") {
      family_obj <- gaussian(link = identity)
    } else if (link == "log") {
      family_obj <- gaussian(link = log)
    } else {
      family_obj <- gaussian(link = identity)
    }
  } else if (family == "binomial") {
    if (link == "logit") {
      family_obj <- binomial(link = logit)
    } else if (link == "probit") {
      family_obj <- binomial(link = probit)
    } else {
      family_obj <- binomial(link = logit)
    }
  } else if (family == "poisson") {
    if (link == "log") {
      family_obj <- poisson(link = log)
    } else if (link == "identity") {
      family_obj <- poisson(link = identity)
    } else {
      family_obj <- poisson(link = log)
    }
  } else {
    family_obj <- gaussian(link = identity)
  }
  
  # Fit the GEE model
  model <- geeglm(as.formula(formula_str), 
                 data = df, 
                 family = family_obj,
                 id = df$id,
                 corstr = corstr,
                 scale.fix = scale_fix)
  
  # Extract results
  list(
    coefficients = as.numeric(coef(model)),
    residuals = as.numeric(residuals(model)),
    fitted_values = as.numeric(fitted(model)),
    deviance = as.numeric(deviance(model)),
    aic = as.numeric(AIC(model)),
    r_squared = NA_real_, # Not directly available for GEE
    df_residual = model$df.residual,
    df_null = model$df.null,
    rank = model$rank,
    method = "geeglm",
    family = family,
    call = deparse(model$call),
    formula = formula_str
  )
}

# Route to appropriate test function
result <- run_gee_test(data, options)

# Output the result as JSON with higher precision
cat(toJSON(result, auto_unbox = TRUE, digits = 15))