/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Gamma Family Functions Header
 */

#ifndef GAMMA_H
#define GAMMA_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Gamma family functions */
SEXP gamma_variance(SEXP mu);
SEXP gamma_dev_resids(SEXP y, SEXP mu, SEXP wt);

#endif /* GAMMA_H */
