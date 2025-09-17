/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Deviance Functions Header
 */

#ifndef DEVIANCE_H
#define DEVIANCE_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Deviance function types */
typedef enum {
    GAUSSIAN_DEVIANCE,
    POISSON_DEVIANCE,
    GAMMA_DEVIANCE,
    INVERSE_GAUSSIAN_DEVIANCE,
    BINOMIAL_DEVIANCE,
    QUASI_DEVIANCE
} deviance_type_t;

/* Deviance functions */
SEXP deviance_function(SEXP y, SEXP mu, SEXP wt, SEXP family, SEXP power);
SEXP deviance_residuals(SEXP y, SEXP mu, SEXP wt, SEXP family, SEXP power);

#endif /* DEVIANCE_H */
