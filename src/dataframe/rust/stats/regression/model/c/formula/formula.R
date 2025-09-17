#  File src/library/stats/R/models.R
#  Part of the R package, https://www.R-project.org
#
#  Copyright (C) 1995-2025 The R Core Team
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

formula <- function(x, ...) UseMethod("formula")
formula.default <- function (x = NULL, env = parent.frame(), ...)
{
    notAtomic <- !is.atomic(x)
    notnull <- function(z) notAtomic && !is.null(z)

    if (notnull(x$formula)) eval(x$formula)
    else if (notnull(x$terms)) {z <- x$terms; oldClass(z) <- "formula"; z}
    else if (notnull(x$call$formula))	eval(x$call$formula)
    else attr(x, "formula") %||% {
        form <- switch(mode(x),
                       NULL = structure(list(), class = "formula"),
                       character = eval(str2expression(x)), # ever used?  formula.character!
                       call = eval(x),
                       stop("invalid formula"))
        environment(form) <- env
        form
    }
}
formula.formula <- function(x, ...) x
formula.terms <- function(x, ...) {
    env <- environment(x)
    attributes(x) <- list(class = "formula") # dropping all attr. incl ".Environment"
    environment(x) <- env %||% globalenv()
    x
}

DF2formula <- function(x, env = parent.frame()) {
    nm <- lapply(names(x), as.name)
    mkRHS <- function(nms) Reduce(function(x, y) call("+", x, y), nms)
    ff <- if (length(nm) > 1L)
              call("~", nm[[1L]], mkRHS(nm[-1L]))
          else if (length(nm) == 1L)
              call("~", nm[[1L]])
          else stop("cannot create a formula from a zero-column data frame")
    class(ff) <- "formula" # was ff <- eval(ff)
    environment(ff) <- env
    ff
}

formula.data.frame <- function (x, ...)
{
    if(length(tx <- attr(x, "terms")) && length(ff <- formula.terms(tx)))
	ff
    else DF2formula(x, parent.frame())
}

## Future version {w/o .Deprecated etc}:
formula.character <- function(x, env = parent.frame(), ...)
{
    ff <- str2lang(x)
    if(!(is.call(ff) && is.symbol(c. <- ff[[1L]]) && c. == quote(`~`)))
        stop(gettextf("invalid formula: %s", deparse2(x)), domain=NA)
    class(ff) <- "formula"
    environment(ff) <- env
    ff
}

## Active version helping to move towards future version:
formula.character <- function(x, env = parent.frame(), ...)
{
    ff <- if(length(x) > 1L) {
              .Deprecated(msg=
 "Using formula(x) is deprecated when x is a character vector of length > 1.
  Consider formula(paste(x, collapse = \" \")) instead.")
              str2expression(x)[[1L]]
          } else {
              str2lang(x)
          }
    if(!is.call(ff))
        stop(gettextf("invalid formula %s: not a call", deparse2(x)), domain=NA)
    ## else
    if(is.symbol(c. <- ff[[1L]]) && c. == quote(`~`)) {
        ## perfect
    } else {
        if(is.symbol(c.)) { ## back compatibility
            ff <- if(c. == quote(`=`)) {
                      .Deprecated(msg = gettextf(
				"invalid formula %s: assignment is deprecated",
				deparse2(x)))
                      ff[[3L]] # RHS of "v = <form>" (pkgs 'GeNetIt', 'KMgene')
                  } else if(c. == quote(`(`) || c. == quote(`{`)) {
                      .Deprecated(msg = gettextf(
			"invalid formula %s: extraneous call to `%s` is deprecated",
			deparse2(x), as.character(c.)))
                      eval(ff)
                  }
        } else
            stop(gettextf("invalid formula %s", deparse2(x)), domain=NA)
    }
    class(ff) <- "formula"
    environment(ff) <- env
    ff
}

print.formula <- function(x, showEnv = !identical(e, .GlobalEnv), ...)
{
    e <- environment(.x <- x) ## return(.) original x
    attr(x, ".Environment") <- NULL
    print.default(unclass(x), ...)
    if (showEnv) print(e)
    invisible(.x)
}

`[.formula` <- function(x,i) {
    ans <- NextMethod("[")
    if(!length(ans) || is.symbol(a1 <- ans[[1L]]) && as.character(a1) == "~") {
        if(is.null(ans)) ans <- list()
        class(ans) <- "formula"
        environment(ans) <- environment(x)
    }
    ans
}

as.formula <- function(object, env = parent.frame())
{
    if(inherits(object, "formula"))
        object
    else {
        rval <- formula(object, env = baseenv())
        if (identical(environment(rval), baseenv()) || !missing(env))
            environment(rval) <- env
        rval
    }
