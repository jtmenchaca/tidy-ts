# Standardized and studentized residuals
# Part of lm.influence.R modularization

rstandard <- function(model, ...) UseMethod("rstandard")
rstandard.lm <- function(model, infl = lm.influence(model, do.coef=FALSE),
                         sd = sqrt(deviance(model)/df.residual(model)),
                         type = c("sd.1", "predictive"), ...)
{
    type <- match.arg(type)
    res <- infl$wt.res / switch(type,
				"sd.1" = c(outer(sqrt(1 - infl$hat), sd)),
				"predictive" = 1 - infl$hat)
    res[is.infinite(res)] <- NaN
    res
}

### New version from Brett Presnell, March 2011
### Slightly modified (dispersion bit) by pd
rstandard.glm <-
 function(model,
          infl=influence(model, do.coef=FALSE),
          type=c("deviance","pearson"), ...)
{
 type <- match.arg(type)
 res <- switch(type, pearson = infl$pear.res, infl$dev.res)
 res <- res/sqrt(summary(model)$dispersion * (1 - infl$hat))
 res[is.infinite(res)] <- NaN
 res
}


rstudent <- function(model, ...) UseMethod("rstudent")
rstudent.lm <- function(model, infl = lm.influence(model, do.coef=FALSE),
			res = infl$wt.res, ...)
{
    res <- res / (infl$sigma * sqrt(1 - infl$hat))
    res[is.infinite(res)] <- NaN
    res
}

rstudent.glm <- function(model, infl = influence(model, do.coef=FALSE), ...)
{
    r <- infl$dev.res
    r <- sign(r) * sqrt(r^2 + (infl$hat * infl$pear.res^2)/(1 - infl$hat))
    r[is.infinite(r)] <- NaN
    if (any(family(model)$family == c("binomial", "poisson")))
	r else r/infl$sigma
}
