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

summary.glm <- function(object, dispersion = NULL,
			correlation = FALSE, symbolic.cor = FALSE, ...)
{
    est.disp <- FALSE
    df.r <- object$df.residual
    if(is.null(dispersion)) {	# calculate dispersion if needed
        fam <- object$family
	dispersion <-
            if (!is.null(fam$dispersion) && !is.na(fam$dispersion)) fam$dispersion
            else if(fam$family %in% c("poisson", "binomial"))  1
	    else if(df.r > 0) {
                est.disp <- TRUE
		if(any(object$weights==0))
		    warning("observations with zero weight not used for calculating dispersion")
		sum((object$weights*object$residuals^2)[object$weights > 0])/ df.r
	    } else {
                est.disp <- TRUE
                NaN
            }
    }
    ## calculate scaled and unscaled covariance matrix

    aliased <- is.na(coef(object))  # used in print method
    p <- object$rank
    if (p > 0) {
        p1 <- 1L:p
	Qr <- qr.lm(object)
        ## WATCHIT! doesn't this rely on pivoting not permuting 1L:p? -- that's quaranteed
        coef.p <- object$coefficients[Qr$pivot[p1]]
        covmat.unscaled <- chol2inv(Qr$qr[p1,p1,drop=FALSE])
        dimnames(covmat.unscaled) <- list(names(coef.p),names(coef.p))
        covmat <- dispersion*covmat.unscaled
        var.cf <- diag(covmat)

        ## calculate coef table

        s.err <- sqrt(var.cf)
        tvalue <- coef.p/s.err

        dn <- c("Estimate", "Std. Error")
        if(!est.disp) { # known dispersion
            pvalue <- 2*pnorm(-abs(tvalue))
            coef.table <- cbind(coef.p, s.err, tvalue, pvalue)
            dimnames(coef.table) <- list(names(coef.p),
                                         c(dn, "z value","Pr(>|z|)"))
        } else if(df.r > 0) {
            pvalue <- 2*pt(-abs(tvalue), df.r)
            coef.table <- cbind(coef.p, s.err, tvalue, pvalue)
            dimnames(coef.table) <- list(names(coef.p),
                                         c(dn, "t value","Pr(>|t|)"))
        } else { # df.r == 0
            coef.table <- cbind(coef.p, NaN, NaN, NaN)
            dimnames(coef.table) <- list(names(coef.p),
                                         c(dn, "t value","Pr(>|t|)"))
        }
        df.f <- NCOL(Qr$qr)
    } else {
        coef.table <- matrix(, 0L, 4L)
        dimnames(coef.table) <-
            list(NULL, c("Estimate", "Std. Error", "t value", "Pr(>|t|)"))
        covmat.unscaled <- covmat <- matrix(, 0L, 0L)
        df.f <- length(aliased)
    }
    ## return answer

    ## these need not all exist, e.g. na.action.
    keep <- match(c("call","terms","family","deviance", "aic",
		      "contrasts", "df.residual","null.deviance","df.null",
                      "iter", "na.action"), names(object), 0L)
    ans <- c(object[keep],
	     list(deviance.resid = residuals(object, type = "deviance"),
		  coefficients = coef.table,
                  aliased = aliased,
		  dispersion = dispersion,
		  df = c(object$rank, df.r, df.f),
		  cov.unscaled = covmat.unscaled,
		  cov.scaled = covmat))

    if(correlation && p > 0) {
	dd <- sqrt(diag(covmat.unscaled))
	ans$correlation <-
	    covmat.unscaled/outer(dd,dd)
	ans$symbolic.cor <- symbolic.cor
    }
    class(ans) <- "summary.glm"
    return(ans)
}

print.summary.glm <-
    function (x, digits = max(3L, getOption("digits") - 3L),
	      symbolic.cor = x$symbolic.cor,
	      signif.stars = getOption("show.signif.stars"),
              show.residuals = FALSE, ...)
{
    cat("\nCall:\n",
	paste(deparse(x$call), sep = "\n", collapse = "\n"), "\n", sep = "")
    if (show.residuals) {
        cat("\nDeviance Residuals: \n")
        if(x$df.residual > 5) {
            x$deviance.resid <- setNames(quantile(x$deviance.resid, na.rm = TRUE),
                                         c("Min", "1Q", "Median", "3Q", "Max"))
        }
        xx <- zapsmall(x$deviance.resid, digits + 1L)
        print.default(xx, digits = digits, na.print = "", print.gap = 2L)
    }
    if(length(x$aliased) == 0L) {
        cat("\nNo Coefficients\n")
    } else {
        ## df component added in 1.8.0
        ## partial matching problem here.
        df <- if ("df" %in% names(x)) x[["df"]] else NULL
        if (!is.null(df) && (nsingular <- df[3L] - df[1L]))
            cat("\nCoefficients: (", nsingular,
                " not defined because of singularities)\n", sep = "")
        else cat("\nCoefficients:\n")
        coefs <- x$coefficients
        if(!is.null(aliased <- x$aliased) && any(aliased)) {
            cn <- names(aliased)
            coefs <- matrix(NA, length(aliased), 4L,
                            dimnames=list(cn, colnames(coefs)))
            coefs[!aliased, ] <- x$coefficients
        }
        printCoefmat(coefs, digits = digits, signif.stars = signif.stars,
                     na.print = "NA", ...)
    }
    ##
    cat("\n(Dispersion parameter for ", x$family$family,
	" family taken to be ", format(x$dispersion), ")\n\n",
	apply(cbind(paste(format(c("Null","Residual"), justify="right"),
                          "deviance:"),
		    format(unlist(x[c("null.deviance","deviance")]),
			   digits = max(5L, digits + 1L)), " on",
		    format(unlist(x[c("df.null","df.residual")])),
		    " degrees of freedom\n"),
	      1L, paste, collapse = " "), sep = "")
    if(nzchar(mess <- naprint(x$na.action))) cat("  (", mess, ")\n", sep = "")
    cat("AIC: ", format(x$aic, digits = max(4L, digits + 1L)),"\n\n",
	"Number of Fisher Scoring iterations: ", x$iter,
	"\n", sep = "")

    correl <- x$correlation
    if(!is.null(correl)) {
# looks most sensible not to give NAs for undefined coefficients
#         if(!is.null(aliased) && any(aliased)) {
#             nc <- length(aliased)
#             correl <- matrix(NA, nc, nc, dimnames = list(cn, cn))
#             correl[!aliased, !aliased] <- x$correl
#         }
	p <- NCOL(correl)
	if(p > 1) {
	    cat("\nCorrelation of Coefficients:\n")
	    if(is.logical(symbolic.cor) && symbolic.cor) {# NULL < 1.7.0 objects
		print(symnum(correl, abbr.colnames = NULL))
	    } else {
		correl <- format(round(correl, 2L), nsmall = 2L,
                                 digits = digits)
		correl[!lower.tri(correl)] <- ""
		print(correl[-1, -p, drop=FALSE], quote = FALSE)
	    }
	}
    }
    cat("\n")
    invisible(x)
}
