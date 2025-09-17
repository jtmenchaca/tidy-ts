#  File src/library/stats/R/glm.R
#  Part of the R package, https://www.R-project.org
#
#  Copyright (C) 1995-2020 The R Core Team
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  A copy of the GNU General Public License is available at
#  https://www.R-project.org/Licenses/

### This function fits a generalized linear model via
### iteratively reweighted least squares for any family.
### Written by Simon Davies, Dec 1995
### glm.fit modified by Thomas Lumley, Apr 1997, and then others..

glm <- function(formula, family = gaussian, data, weights,
		subset, na.action, start = NULL,
		etastart, mustart, offset,
		control = list(...),
                model = TRUE, method = "glm.fit",
                x = FALSE, y = TRUE,
		singular.ok = TRUE, contrasts = NULL, ...)
{
    cal <- match.call()
    ## family
    if(is.character(family))
        family <- get(family, mode = "function", envir = parent.frame())
    if(is.function(family)) family <- family()
    if(is.null(family$family)) {
	print(family)
	stop("'family' not recognized")
    }

    ## extract x, y, etc from the model formula and frame
    if(missing(data)) data <- environment(formula)
    mf <- match.call(expand.dots = FALSE)
    m <- match(c("formula", "data", "subset", "weights", "na.action",
                 "etastart", "mustart", "offset"), names(mf), 0L)
    mf <- mf[c(1L, m)]
    mf$drop.unused.levels <- TRUE
    ## need stats:: for non-standard evaluation
    mf[[1L]] <- quote(stats::model.frame)
    mf <- eval(mf, parent.frame())
    if(identical(method, "model.frame")) return(mf)

    if (!is.character(method) && !is.function(method))
        stop("invalid 'method' argument")
    ## for back-compatibility in return result
    if (identical(method, "glm.fit"))
        control <- do.call("glm.control", control)

    mt <- attr(mf, "terms") # allow model.frame to have updated it

    Y <- model.response(mf, "any") # e.g. factors are allowed
    ## avoid problems with 1D arrays, but keep names
    if(length(dim(Y)) == 1L) {
        nm <- rownames(Y)
        dim(Y) <- NULL
        if(!is.null(nm)) names(Y) <- nm
    }
    ## null model support
    X <- if (!is.empty.model(mt)) model.matrix(mt, mf, contrasts) else matrix(,NROW(Y), 0L)
    ## avoid any problems with 1D or nx1 arrays by as.vector.
    weights <- as.vector(model.weights(mf))
    if(!is.null(weights) && !is.numeric(weights))
        stop("'weights' must be a numeric vector")
    ## check weights and offset
    if( !is.null(weights) && any(weights < 0) )
	stop("negative weights not allowed")

    offset <- as.vector(model.offset(mf))
    if(!is.null(offset)) {
        if(length(offset) != NROW(Y))
	    stop(gettextf("number of offsets is %d should equal %d (number of observations)",
			  length(offset), NROW(Y)), domain = NA)
    }
    ## these allow starting values to be expressed in terms of other vars.
    mustart <- model.extract(mf, "mustart")
    etastart <- model.extract(mf, "etastart")

    ## We want to set the name on this call and the one below for the
    ## sake of messages from the fitter function
    fit <- eval(call(if(is.function(method)) "method" else method,
                     x = X, y = Y, weights = weights, start = start,
                     etastart = etastart, mustart = mustart,
                     offset = offset, family = family, control = control,
                     intercept = attr(mt, "intercept") > 0L, singular.ok = singular.ok))

    ## This calculated the null deviance from the intercept-only model
    ## if there is one, otherwise from the offset-only model.
    ## We need to recalculate by a proper fit if there is intercept and
    ## offset.
    ##
    ## The glm.fit calculation could be wrong if the link depends on the
    ## observations, so we allow the null deviance to be forced to be
    ## re-calculated by setting an offset (provided there is an intercept).
    ## Prior to 2.4.0 this was only done for non-zero offsets.
    if(length(offset) && attr(mt, "intercept") > 0L) {
        fit2 <-
            eval(call(if(is.function(method)) "method" else method,
                      x = X[, "(Intercept)", drop=FALSE], y = Y,
                      ## starting values potentially required (PR#16877):
                      mustart = fit$fitted.values,
                      weights = weights, offset = offset, family = family,
                      control = control, intercept = TRUE))
        ## That fit might not have converged ....
        if(!fit2$converged)
            warning("fitting to calculate the null deviance did not converge -- increase 'maxit'?")
        fit$null.deviance <- fit2$deviance
    }
    if(model) fit$model <- mf
    fit$na.action <- attr(mf, "na.action")
    if(x) fit$x <- X
    if(!y) fit$y <- NULL
    structure(c(fit,
		list(call = cal, formula = formula,
		     terms = mt, data = data,
		     offset = offset, control = control, method = method,
		     contrasts = attr(X, "contrasts"),
		     xlevels = .getXlevels(mt, mf))),
	      class = c(fit$class, c("glm", "lm")))
}
