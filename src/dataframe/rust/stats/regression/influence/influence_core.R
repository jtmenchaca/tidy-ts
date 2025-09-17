# Core influence calculation functions
# Part of lm.influence.R modularization

## this is mainly for back-compatibility (from "lsfit" time) -- use hatvalues()!
hat <- function(x, intercept = TRUE)
{
    if(is.qr(x)) n <- nrow(x$qr)
    else {
	if(intercept) x <- cbind(1, x)
	n <- nrow(x)
	x <- qr(x)
    }
    rowSums(qr.qy(x, diag(1, nrow = n, ncol = x$rank))^2)
}

## see PR#7961, https://stat.ethz.ch/pipermail/r-devel/2011-January/059642.html
weighted.residuals <- function(obj, drop0 = TRUE)
{
    w <- weights(obj)
    r <- residuals(obj, type="deviance")
    if(drop0 && !is.null(w)) {
        if(is.matrix(r)) r[w != 0, , drop = FALSE] # e.g. mlm fit
        else r[w != 0]
    } else r
}

qr.influence <- function(qr, res, tol = 10 * .Machine$double.eps)
    .Call(C_influence, qr, res, tol)

lm.influence <- function (model, do.coef = TRUE)
{
    wt.res <- weighted.residuals(model)
    e <- na.omit(wt.res)
    is.mlm <- is.matrix(e) # n x q  matrix in the multivariate lm case
    if (model$rank == 0) {
        n <- length(wt.res) # drops 0 wt, may drop NAs
        sigma <- sqrt(deviance(model)/df.residual(model))
        res <- list(hat = rep(0, n), coefficients = matrix(0, n, 0),
                    sigma = rep(sigma, n))
    } else {
        ## if we have a point with hat = 1, the corresponding e should be
        ## exactly zero.  Protect against returning Inf by forcing this
        e[abs(e) < 100 * .Machine$double.eps * median(abs(e))] <- 0
        mqr <- qr.lm(model)
        n <- as.integer(nrow(mqr$qr))
        if (is.na(n)) stop("invalid model QR matrix")
        ## in na.exclude case, omit NAs; also drop 0-weight cases
        if(NROW(e) != n)
            stop("non-NA residual length does not match cases used in fitting")
        do.coef <- as.logical(do.coef)
        tol <- 10 * .Machine$double.eps
        res <- .Call(C_influence, mqr, e, tol)
        if (do.coef){
            ok <- seq_len(mqr$rank) # need this for rank-deficient cases
            Q <- qr.Q(mqr)[ , ok, drop=FALSE]
            R <- qr.R(mqr)[ok, ok, drop=FALSE]
            hat <- res$hat
            invRQtt <- t(backsolve(R,t(Q)))
            k <- NCOL(Q)
            q <- NCOL(e)
            ## NB: The following relies on recycling: diag(v) %*% A == A * v
            ## so we need a for loop for the mlm case
            res$coefficients <-
              if(is.mlm) {
                cf <- array(0, c(n,k,q))
                for ( j in seq_len(q) )
                    cf[,,j] <- invRQtt * ifelse(hat == 1, 0, e[,j]/(1-hat))
                cf
              } else
                invRQtt * ifelse(hat == 1, 0, e/(1-hat))
        }


        drop1d <- function(a) { # more cautious variant of drop(.)
            d <- dim(a)
            if(length(d) == 3L && d[[3L]] == 1L)
                dim(a) <- d[-3L]
            a
        }
        if(is.null(model$na.action)) {
            if(!is.mlm) { ## drop the 'q=1' array extent (from C)
                res$sigma <- drop(res$sigma)
                if(do.coef)
                    res$coefficients <- drop1d(res$coefficients)
            }
        } else {
            hat <- naresid(model$na.action, res$hat)
            hat[is.na(hat)] <- 0       # omitted cases have 0 leverage
            res$hat <- hat
            if(do.coef) {
                coefficients <- naresid(model$na.action, res$coefficients)
                coefficients[is.na(coefficients)] <- 0 # omitted cases have 0 change
                res$coefficients <- if(is.mlm) coefficients else drop1d(coefficients)
            }
            sigma <- naresid(model$na.action, res$sigma)
            sigma[is.na(sigma)] <- sqrt(deviance(model)/df.residual(model))
            res$sigma <- if(is.mlm) sigma else drop(sigma)
        }
    }
    res$wt.res <- naresid(model$na.action, e)
    res$hat[res$hat > 1 - 10*.Machine$double.eps] <- 1 # force 1
    names(res$hat) <- names(res$sigma) <- names(res$wt.res)
    if(do.coef) {
	cf <- coef(model)
	if(is.mlm) { # coef is 3d array
	    dnr <- dimnames(res$wt.res)
	    dimnames(res$coefficients) <- list(
		dnr[[1L]],
		rownames(cf)[!apply(cf, 1L, anyNA)],
		dnr[[2L]])
	} else {
	    dimnames(res$coefficients) <- list(names(res$wt.res),
					       names(cf)[!is.na(cf)])
	}
    }
    res[c("hat", "coefficients", "sigma", "wt.res")] # ensure order, for backward compatibility and regression tests
}
