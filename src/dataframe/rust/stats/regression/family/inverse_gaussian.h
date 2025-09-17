/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Inverse Gaussian Family Functions Header
 */

#ifndef INVERSE_GAUSSIAN_H
#define INVERSE_GAUSSIAN_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Inverse Gaussian family functions */
SEXP inverse_gaussian_variance(SEXP mu);
SEXP inverse_gaussian_dev_resids(SEXP y, SEXP mu, SEXP wt);

#endif /* INVERSE_GAUSSIAN_H */
