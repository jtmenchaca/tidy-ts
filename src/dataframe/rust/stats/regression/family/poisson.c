/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Poisson Family Functions Implementation
 *
 */

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"
#include "poisson.h"

SEXP poisson_variance(SEXP mu)
{
    int i, n = LENGTH(mu);
    if (!n || !isReal(mu))
	error(_("Argument %s must be a nonempty numeric vector"), "mu");
    SEXP ans = PROTECT(shallow_duplicate(mu));
    double *rans = REAL(ans), *rmu = REAL(mu);

    for (i = 0; i < n; i++)
	rans[i] = rmu[i]; // Poisson variance equals mean
    UNPROTECT(1);
    return ans;
}

SEXP poisson_dev_resids(SEXP y, SEXP mu, SEXP wt)
{
    int i, n = LENGTH(y), lmu = LENGTH(mu), lwt = LENGTH(wt), nprot = 1;
    SEXP ans;
    double mui, yi, *rmu, *ry, *rwt, *rans;

    if (!isReal(y)) {y = PROTECT(coerceVector(y, REALSXP)); nprot++;}
    ry = REAL(y);
    ans = PROTECT(shallow_duplicate(y));
    rans = REAL(ans);
    if (!isReal(mu)) {mu = PROTECT(coerceVector(mu, REALSXP)); nprot++;}
    if (!isReal(wt)) {wt = PROTECT(coerceVector(wt, REALSXP)); nprot++;}
    rmu = REAL(mu);
    rwt = REAL(wt);
    if (lmu != n && lmu != 1)
	error(_("argument %s must be a numeric vector of length 1 or length %d"),
	      "mu", n);
    if (lwt != n && lwt != 1)
	error(_("argument %s must be a numeric vector of length 1 or length %d"),
	      "wt", n);

    for (i = 0; i < n; i++) {
	mui = rmu[lmu > 1 ? i : 0];
	yi = ry[i];
	if (yi == 0.0) {
	    rans[i] = 2.0 * rwt[lwt > 1 ? i : 0] * mui;
	} else {
	    rans[i] = 2.0 * rwt[lwt > 1 ? i : 0] * 
		(yi * log(yi/mui) - (yi - mui));
	}
    }

    UNPROTECT(nprot);
    return ans;
}
