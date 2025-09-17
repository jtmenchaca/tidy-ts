/*
 *  R : A Computer Language for Statistical Data Analysis
 *  Copyright (C) 2005-2025  The R Core Team
 *
 *  Link Functions Header
 */

#ifndef LINKS_H
#define LINKS_H

#include <Rinternals.h>
#include <Rconfig.h>
#include <R_ext/Constants.h>
#include <float.h>
#include <math.h>
#include "stats.h"
#include "statsR.h"

/* Link function constants */
extern const double THRESH;
extern const double MTHRESH;
extern const double INVEPS;

/* Helper functions */
static R_INLINE double x_d_omx(double x);
static R_INLINE double x_d_opx(double x);
static R_INLINE double y_log_y(double y, double mu);

/* Logit link functions */
SEXP logit_link(SEXP mu);
SEXP logit_linkinv(SEXP eta);
SEXP logit_mu_eta(SEXP eta);

/* Probit link functions */
SEXP probit_link(SEXP mu);
SEXP probit_linkinv(SEXP eta);
SEXP probit_mu_eta(SEXP eta);

/* Cauchit link functions */
SEXP cauchit_link(SEXP mu);
SEXP cauchit_linkinv(SEXP eta);
SEXP cauchit_mu_eta(SEXP eta);

/* Cloglog link functions */
SEXP cloglog_link(SEXP mu);
SEXP cloglog_linkinv(SEXP eta);
SEXP cloglog_mu_eta(SEXP eta);

/* Log link functions */
SEXP log_link(SEXP mu);
SEXP log_linkinv(SEXP eta);
SEXP log_mu_eta(SEXP eta);

/* Identity link functions */
SEXP identity_link(SEXP mu);
SEXP identity_linkinv(SEXP eta);
SEXP identity_mu_eta(SEXP eta);

/* Inverse link functions */
SEXP inverse_link(SEXP mu);
SEXP inverse_linkinv(SEXP eta);
SEXP inverse_mu_eta(SEXP eta);

/* Sqrt link functions */
SEXP sqrt_link(SEXP mu);
SEXP sqrt_linkinv(SEXP eta);
SEXP sqrt_mu_eta(SEXP eta);

#endif /* LINKS_H */
