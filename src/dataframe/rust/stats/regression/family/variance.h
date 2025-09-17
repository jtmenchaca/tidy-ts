/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Variance Functions Header
 */

#ifndef VARIANCE_H
#define VARIANCE_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Variance function types */
typedef enum {
    GAUSSIAN_VARIANCE,
    POISSON_VARIANCE,
    GAMMA_VARIANCE,
    INVERSE_GAUSSIAN_VARIANCE,
    BINOMIAL_VARIANCE,
    QUASI_VARIANCE
} variance_type_t;

/* Variance functions */
SEXP variance_function(SEXP mu, SEXP family, SEXP power);
SEXP variance_prime_function(SEXP mu, SEXP family, SEXP power);

#endif /* VARIANCE_H */
