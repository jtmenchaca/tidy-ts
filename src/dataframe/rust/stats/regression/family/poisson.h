/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Poisson Family Functions Header
 */

#ifndef POISSON_H
#define POISSON_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Poisson family functions */
SEXP poisson_variance(SEXP mu);
SEXP poisson_dev_resids(SEXP y, SEXP mu, SEXP wt);

#endif /* POISSON_H */
