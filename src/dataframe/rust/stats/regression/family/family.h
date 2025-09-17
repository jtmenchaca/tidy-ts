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
 *  GLM Family Functions Header
 *
 */

#ifndef FAMILY_H
#define FAMILY_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Constants for numerical stability */
#define THRESH 30.
#define MTHRESH -30.
#define INVEPS (1/DBL_EPSILON)

/* Helper functions */
static R_INLINE double x_d_omx(double x);
static R_INLINE double x_d_opx(double x);
static R_INLINE double y_log_y(double y, double mu);

/* Binomial family functions */
SEXP logit_link(SEXP mu);
SEXP logit_linkinv(SEXP eta);
SEXP logit_mu_eta(SEXP eta);
SEXP binomial_dev_resids(SEXP y, SEXP mu, SEXP wt);

/* Include other family modules */
#include "binomial.h"
#include "gaussian.h"
#include "poisson.h"
#include "gamma.h"
#include "inverse_gaussian.h"
#include "quasi.h"
#include "links.h"
#include "variance.h"
#include "deviance.h"

#endif /* FAMILY_H */
