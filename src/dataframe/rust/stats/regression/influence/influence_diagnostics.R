# Influence diagnostic measures
# Part of lm.influence.R modularization

### FIXME for glm (see above) ?!?
dffits <- function(model, infl = lm.influence(model, do.coef=FALSE),
		   res = weighted.residuals(model))
{
    res <- res * sqrt(infl$hat)/(infl$sigma*(1-infl$hat))
    res[is.infinite(res)] <- NaN
    res
}


dfbeta <- function(model, ...) UseMethod("dfbeta")

dfbeta.lm <- function(model, infl = lm.influence(model, do.coef=TRUE), ...)
{
    ## for lm & glm
    b <- infl$coefficients
    mlm <- is.matrix(wr <- infl$wt.res)
    ## is this needed -- check!?
    if(!mlm) dimnames(b) <- list(names(wr), variable.names(model))
    b
}

dfbetas <- function(model, ...) UseMethod("dfbetas")

dfbetas.lm <- function (model, infl = lm.influence(model, do.coef=TRUE), ...)
{
    ## for lm & glm
    qrm <- qr(model)
    xxi <- chol2inv(qrm$qr, qrm$rank)
    db <- dfbeta(model, infl)
    if(length(dim(db)) == 3L) db <- aperm(db, c(1L,3:2))
    db / outer(infl$sigma, sqrt(diag(xxi)))
}

covratio <- function(model, infl = lm.influence(model, do.coef=FALSE),
		     res = weighted.residuals(model))
{
    n <- nrow(qr.lm(model)$qr)
    p <- model$rank
    omh <- 1-infl$hat
    e.star <- res/(infl$sigma*sqrt(omh))
    e.star[is.infinite(e.star)] <- NaN
    1/(omh*(((n - p - 1)+e.star^2)/(n - p))^p)
}

cooks.distance <- function(model, ...) UseMethod("cooks.distance")

## Used in plot.lm(); allow passing of known parts; `infl' used only via `hat'
cooks.distance.lm <-
function(model, infl = lm.influence(model, do.coef=FALSE),
	 res = weighted.residuals(model),
	 sd = sqrt(deviance(model)/df.residual(model)),
	 hat = infl$hat, ...)
{
    p <- model$rank
    res <- ((res/c(outer(1 - hat, sd)))^2 * hat)/p
    res[is.infinite(res)] <- NaN
    res
}

cooks.distance.glm <-
function(model, infl = influence(model, do.coef=FALSE),
	 res = infl$pear.res,
	 dispersion = summary(model)$dispersion, hat = infl$hat, ...)
{
    p <- model$rank
    res <- (res/(1-hat))^2 * hat/(dispersion* p)
    res[is.infinite(res)] <- NaN
    res
}
