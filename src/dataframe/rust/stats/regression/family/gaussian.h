/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Gaussian Family Functions Header
 */

#ifndef GAUSSIAN_H
#define GAUSSIAN_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Gaussian family functions */
SEXP gaussian_variance(SEXP mu);
SEXP gaussian_dev_resids(SEXP y, SEXP mu, SEXP wt);

#endif /* GAUSSIAN_H */
