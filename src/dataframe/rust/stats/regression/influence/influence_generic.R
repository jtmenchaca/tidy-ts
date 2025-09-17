# Generic influence functions and method dispatch
# Part of lm.influence.R modularization

## The following is adapted from John Fox's  "car" :
influence <- function(model, ...) UseMethod("influence")
influence.lm  <- function(model, do.coef = TRUE, ...)
    lm.influence(model, do.coef = do.coef, ...)
influence.glm <- function(model, do.coef = TRUE, ...) {
    res <- lm.influence(model, do.coef = do.coef, ...)
    pRes <- na.omit(residuals(model, type = "pearson"))[model$prior.weights != 0]
    pRes <- naresid(model$na.action, pRes)
    names(res)[names(res) == "wt.res"] <- "dev.res"
    c(res, list(pear.res = pRes))
}

hatvalues <- function(model, ...) UseMethod("hatvalues")
hatvalues.lm <- function(model, infl = lm.influence(model, do.coef=FALSE), ...) infl$hat
