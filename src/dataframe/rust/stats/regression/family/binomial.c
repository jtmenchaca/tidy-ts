/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, a copy is available at
 *  https://www.R-project.org/Licenses/
 *
 *  Binomial Family Functions Implementation
 *
 */

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"
#include "binomial.h"
#include "links.h"

static R_INLINE
double y_log_y(double y, double mu)
{
    return (y != 0.) ? (y * log(y/mu)) : 0;
}

SEXP binomial_dev_resids(SEXP y, SEXP mu, SEXP wt)
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
    /* Written separately to avoid an optimization bug on Solaris cc */
    if(lmu > 1) {
	for (i = 0; i < n; i++) {
	    mui = rmu[i];
	    yi = ry[i];
	    rans[i] = 2 * rwt[lwt > 1 ? i : 0] *
		(y_log_y(yi, mui) + y_log_y(1 - yi, 1 - mui));
	}
    } else {
	mui = rmu[0];
	for (i = 0; i < n; i++) {
	    yi = ry[i];
	    rans[i] = 2 * rwt[lwt > 1 ? i : 0] *
		(y_log_y(yi, mui) + y_log_y(1 - yi, 1 - mui));
	}
    }

    UNPROTECT(nprot);
    return ans;
}
