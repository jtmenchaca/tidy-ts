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
 *  Binomial Family Functions Header
 *
 */

#ifndef BINOMIAL_H
#define BINOMIAL_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Binomial family link functions */
SEXP logit_link(SEXP mu);
SEXP logit_linkinv(SEXP eta);
SEXP logit_mu_eta(SEXP eta);

SEXP probit_link(SEXP mu);
SEXP probit_linkinv(SEXP eta);
SEXP probit_mu_eta(SEXP eta);

SEXP cauchit_link(SEXP mu);
SEXP cauchit_linkinv(SEXP eta);
SEXP cauchit_mu_eta(SEXP eta);

SEXP cloglog_link(SEXP mu);
SEXP cloglog_linkinv(SEXP eta);
SEXP cloglog_mu_eta(SEXP eta);

/* Binomial family deviance functions */
SEXP binomial_dev_resids(SEXP y, SEXP mu, SEXP wt);

/* Binomial family variance functions */
SEXP binomial_variance(SEXP mu);
SEXP binomial_variance_prime(SEXP mu);

#endif /* BINOMIAL_H */
