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

anova.glm <- function(object, ..., dispersion = NULL, test = NULL)
{
    ## check for multiple objects
    dotargs <- list(...)
    named <- if (is.null(names(dotargs)))
	rep_len(FALSE, length(dotargs)) else (names(dotargs) != "")
    if(any(named))
	warning("the following arguments to 'anova.glm' are invalid and dropped: ",
		paste(deparse(dotargs[named]), collapse=", "))
    dotargs <- dotargs[!named]
    is.glm <- vapply(dotargs,function(x) inherits(x,"glm"), NA)
    dotargs <- dotargs[is.glm]

    ## do not copy this: anova.glmlist is not an exported object.
    ## use anova(structure(list(object, dotargs), class = "glmlist"))
    if (length(dotargs))
	return(anova.glmlist(c(list(object), dotargs),
			     dispersion = dispersion, test = test))

    ## score tests require a bit of extra computing
    doscore <- !is.null(test) && isTRUE(test=="Rao")
    ## extract variables from model

    varlist <- attr(object$terms, "variables")
    ## must avoid partial matching here.
    x <-
	if (n <- match("x", names(object), 0L))
	    object[[n]]
	else model.matrix(object)
    varseq <- attr(x, "assign")
    nvars <- max(0, varseq)
    resdev <- resdf <- NULL

    if (doscore){
      score <- numeric(nvars)
      # fit a null model
      method <- object$method
      y <- object$y
      fit <- eval(call(if(is.function(method)) "method" else method,
                       x=x[, varseq == 0, drop = FALSE],
                       y=y,
                       weights=object$prior.weights,
                       start  =object$start,
                       offset =object$offset,
                       family =object$family,
                       control=object$control))
      r <- fit$residuals
      w <- fit$weights
      icpt <- attr(object$terms, "intercept")
    }

    ## if there is more than one explanatory variable then
    ## recall glm.fit to fit variables sequentially

    ## for score tests, we need to do so in any case
    if(nvars > 1 || doscore) {
	method <- object$method
        ## allow for 'y = FALSE' in the call (PR#13098)
        y <- object$y
        if(is.null(y)) { ## code from residuals.glm
            mu.eta <- object$family$mu.eta
            eta <- object$linear.predictors
            y <- object$fitted.values + object$residuals * mu.eta(eta)
        }
	for(i in seq_len(max(nvars - 1L, 0))) { # nvars == 0 can happen
	    ## explanatory variables up to i are kept in the model
	    ## use method from glm to find residual deviance
	    ## and df for each sequential fit
	    fit <- eval(call(if(is.function(method)) "method" else method,
                             x=x[, varseq <= i, drop = FALSE],
                             y=y,
                             weights=object$prior.weights,
                             start  =object$start,
                             offset =object$offset,
                             family =object$family,
                             control=object$control))
            if (doscore) {
              zz <- eval(call(if(is.function(method)) "method" else method,
                             x=x[, varseq <= i, drop = FALSE],
                             y=r,
                             weights=w,
                             intercept=icpt))
              score[i] <-  zz$null.deviance - zz$deviance
              r <- fit$residuals
              w <- fit$weights
            }
	    resdev <- c(resdev, fit$deviance)
	    resdf <- c(resdf, fit$df.residual)
	}
        if (doscore) {
          zz <- eval(call(if(is.function(method)) "method" else method,
                          x=x,
                          y=r,
                          weights=w,
                          intercept=icpt))
          score[nvars] <- zz$null.deviance - zz$deviance
        }
    }

    ## add values from null and full model

    resdf <- c(object$df.null, resdf, object$df.residual)
    resdev <- c(object$null.deviance, resdev, object$deviance)

    ## construct table and title

    table <- data.frame(c(NA, -diff(resdf)),
			c(NA, pmax(0, -diff(resdev))), resdf, resdev)
    tl <- attr(object$terms, "term.labels")
    if (length(tl) == 0L) table <- table[1,,drop=FALSE] # kludge for null model
    dimnames(table) <- list(c("NULL", tl),
			    c("Df", "Deviance", "Resid. Df", "Resid. Dev"))
    if (doscore)
      table <- cbind(table, Rao=c(NA,score))
    title <- paste0("Analysis of Deviance Table", "\n\nModel: ",
                    object$family$family, ", link: ", object$family$link,
                    "\n\nResponse: ", as.character(varlist[-1L])[1L],
                    "\n\nTerms added sequentially (first to last)\n\n")

    ## calculate test statistics if needed

    fam <- object$family
    if (is.null(test)) {
        ## Attempt to determine default test statistic
        test <- if (!is.null(dispersion)) "Chisq"
                else if (!is.null(fam$dispersion))
                    if (is.na(fam$dispersion)) "F" else "Chisq"
                else FALSE
    }

    if (!isFALSE(test)) {
        if (is.null(dispersion)) {
            dispersion <- summary(object)$dispersion
        }
        df.dispersion <- if (is.null(fam$dispersion))
                             if (isTRUE(dispersion == 1)) Inf else object$df.residual
                         else if (is.na(fam$dispersion)) object$df.residual
                         else Inf
        if (isTRUE(test=="F") && df.dispersion == 0) {
            test <- FALSE
        }
    }
    
    if (!isFALSE(test)) {
        if(isTRUE(test == "F") && df.dispersion == Inf) {
            fname <- fam$family
            if(fname == "binomial" || fname == "poisson")
                warning(gettextf("using F test with a '%s' family is inappropriate",
                                 fname),
                        domain = NA)
            else
                warning("using F test with a fixed dispersion is inappropriate")
        }
	table <- stat.anova(table=table, test=test, scale=dispersion,
			    df.scale=df.dispersion, n=NROW(x))
    }
    structure(table, heading = title, class = c("anova", "data.frame"))
}


anova.glmlist <- function(object, ..., dispersion=NULL, test=NULL)
{

    doscore <- !is.null(test) && isTRUE(test=="Rao")

    ## find responses for all models and remove
    ## any models with a different response or a different family

    responses <- as.character(lapply(object, function(x) {
	deparse(formula(x)[[2L]])} ))
    sameresp <- responses==responses[1L]
    if(!all(sameresp)) {
	object <- object[sameresp]
        warning(gettextf("models with response %s removed because response differs from model 1",
                         sQuote(deparse(responses[!sameresp]))),
                domain = NA)
    }

    ns <- sapply(object, function(x) length(x$residuals))
    if(any(ns != ns[1L]))
	stop("models were not all fitted to the same size of dataset")

    ## calculate the number of models

    nmodels <- length(object)
    if(nmodels==1)
	return(anova.glm(object[[1L]], dispersion=dispersion, test=test))

    ## extract statistics

    resdf  <- as.numeric(lapply(object, function(x) x$df.residual))
    resdev <- as.numeric(lapply(object, function(x) x$deviance))

    if (doscore){
      score <- numeric(nmodels)
      score[1] <- NA
      df <- -diff(resdf)

      for (i in seq_len(nmodels-1)) {
        m1 <- if (df[i] > 0) object[[i]] else object[[i+1]]
        m2 <- if (df[i] > 0) object[[i+1]] else object[[i]]
        r <- m1$residuals
        w <- m1$weights
        method <- m2$method
        icpt <- attr(m1$terms, "intercept")
        zz <- eval(call(if(is.function(method)) "method" else method,
                        x=model.matrix(m2),
                        y=r,
                        weights=w,
                        intercept=icpt))
        score[i+1] <-  zz$null.deviance - zz$deviance
        if (df[i] < 0) score[i+1] <- - score[i+1]
      }
    }

    ## construct table and title

    table <- data.frame(resdf, resdev, c(NA, -diff(resdf)),
			c(NA, -diff(resdev)) )
    variables <- lapply(object, function(x)
			paste(deparse(formula(x)), collapse="\n") )
    dimnames(table) <- list(1L:nmodels, c("Resid. Df", "Resid. Dev", "Df",
					 "Deviance"))
    if (doscore)
      table <- cbind(table, Rao=score)

    title <- "Analysis of Deviance Table\n"
    topnote <- paste0("Model ", format(1L:nmodels), ": ", variables,
                      collapse = "\n")

    ## calculate test statistic if needed

    bigmodel <- object[[order(resdf)[1L]]]
    bigdispersion <- bigmodel$family$dispersion
    if (is.null(test)) {
        ## Try to determine default test statistic
        test <- if (!is.null(dispersion)) "Chisq"
                else if (!is.null(bigdispersion))
                    if (is.na(bigdispersion)) "F" else "Chisq"
                else FALSE
    }

    if (!isFALSE(test)) {
        if (is.null(dispersion)) {
            dispersion <- summary(bigmodel)$dispersion
        }
        df.dispersion <- if (!is.null(bigdispersion))
                             if (is.na(bigdispersion)) bigmodel$df.residual else Inf
                         else
                             if (isTRUE(dispersion==1)) Inf else min(resdf)
        if (isTRUE(test == "F") && df.dispersion == 0) {
            test <- FALSE
        }
    }

    if (!isFALSE(test)) {
        if(isTRUE(test == "F") && df.dispersion == Inf) {
            fam <- bigmodel$family$family
            if(fam == "binomial" || fam == "poisson")
                warning(gettextf("using F test with a '%s' family is inappropriate",
                                 fam),
                        domain = NA, call. = FALSE)
            else
                warning("using F test with a fixed dispersion is inappropriate")
        }
	table <- stat.anova(table = table, test = test,
			    scale = dispersion, df.scale = df.dispersion,
			    n = length(bigmodel$residuals))
    }
    structure(table, heading = c(title, topnote),
	      class = c("anova", "data.frame"))
}
