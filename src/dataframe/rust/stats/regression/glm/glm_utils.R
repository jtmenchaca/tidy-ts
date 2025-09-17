#  File src/library/stats/R/glm.R
#  Part of the R package, https://www.R-project.org
#
#  Copyright (C) 1995-2020 The R Core Team
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  A copy of the GNU General Public License is available at
#  https://www.R-project.org/Licenses/

## GLM Methods for Generic Functions :

## needed to avoid deviance.lm
deviance.glm <- function(object, ...) object$deviance
effects.glm <- function(object, ...) object$effects
family.glm <- function(object, ...) object$family

## For influence.glm() ... --> ./lm.influence.R

## KH on 1998/06/22: update.default() is now used ...

model.frame.glm <- function (formula, ...)
{
    dots <- list(...)
    nargs <- dots[match(c("data", "na.action", "subset"), names(dots), 0L)]
    if (length(nargs) || is.null(formula$model)) {
	fcall <- formula$call
	fcall$method <- "model.frame"
        ## need stats:: for non-standard evaluation
	fcall[[1L]] <- quote(stats::glm)
        fcall[names(nargs)] <- nargs
	env <- environment(formula$terms) %||% parent.frame()
	eval(fcall, env)
    }
    else formula$model
}

weights.glm <- function(object, type = c("prior", "working"), ...)
{
    type <- match.arg(type)
    res <- if(type == "prior") object$prior.weights else object$weights
    if(is.null(object$na.action)) res
    else naresid(object$na.action, res)
}

formula.glm <- function(x, ...)
{
    form <- x$formula
    if( !is.null(form) ) {
        form <- formula(x$terms) # has . expanded
        environment(form) <- environment(x$formula)
        form
    } else formula(x$terms)
}
