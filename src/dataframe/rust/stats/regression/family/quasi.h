/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Quasi Family Functions Header
 */

#ifndef QUASI_H
#define QUASI_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Quasi family functions */
SEXP quasi_variance(SEXP mu, SEXP power);
SEXP quasi_dev_resids(SEXP y, SEXP mu, SEXP wt, SEXP power);

#endif /* QUASI_H */
