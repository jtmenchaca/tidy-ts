terms <- function(x, ...) UseMethod("terms")
terms.default <- function(x, ...) {
    x$terms %||% attr(x, "terms") %||% stop("no terms component nor attribute")
}

terms.terms <- function(x, ...) x
print.terms <- function(x, ...) {
    print.default(unclass(x), ...)
    invisible(x)
}

## moved from base/R/labels.R
labels.terms <- function(object, ...) attr(object, "term.labels")

### do this `by hand' as previous approach was vulnerable to re-ordering.
delete.response <- function (termobj)
{
    a <- attributes(termobj)
    y <- a$response
    if(!is.null(y) && y) {
        termobj[[2L]] <- NULL
        a$response <- 0
        a$variables <- a$variables[-(1+y)]
        a$predvars <- a$predvars[-(1+y)]
        if(length(a$factors))
            a$factors <- a$factors[-y, , drop = FALSE]
        if(length(a$offset))
            a$offset <- ifelse(a$offset > y, a$offset-1, a$offset)
        if(length(a$specials))
            for(i in seq_along(a$specials)) {
                b <- a$specials[[i]]
                a$specials[[i]] <- ifelse(b > y, b-1, b)
            }
        attributes(termobj) <- a
    }
    termobj
}

reformulate <- function (termlabels, response=NULL, intercept = TRUE, env = parent.frame())
{
    ## an extension of formula.character()
    if(!is.character(termlabels))
        stop("'termlabels' must be a character vector")
    if(intercept && !length(termlabels)) termlabels <- "1"
    termtext <- paste(termlabels, collapse = "+")
    if(!intercept) termtext <- paste(termtext, "- 1")
    terms <- str2lang(termtext)
    fexpr <-
	if(is.null(response))
	    call("~", terms)
	else
	    call("~",
		 ## response can be a symbol or call as  Surv(ftime, case)
		 if(is.character(response)) {
		     if(length(response) != 1)
			 stop(gettextf("'%s' must be a character string", "response"), domain=NA)
                     tryCatch(str2lang(response),
                              error = function(e) {
                                  sc <- sys.calls()
                                  sc1 <- lapply(sc, `[[`, 1L)
                                  isF <- function(cl) is.symbol(cl) && cl == quote(reformulate)
                                  reformCall <- sc[[match(TRUE, vapply(sc1, isF, NA))]]
                                  warning(warningCondition(message = paste(sprintf(
		"Unparseable 'response' \"%s\"; use is deprecated.  Use as.name(.) or `..`!",
									response),
						conditionMessage(e), sep="\n"),
                                      class = c("reformulate", "deprecatedWarning"),
                                      call = reformCall)) # , domain=NA
                                  as.symbol(response)
                              })
		 }
                 else response,
		 terms)
    formula(fexpr, env)
}

drop.terms <- function(termobj, dropx = NULL, keep.response = FALSE)
{
    if (!length(dropx))
	if(keep.response) termobj else delete.response(termobj)
    else {
        if(!inherits(termobj, "terms"))
            stop(gettextf("'termobj' must be a object of class %s",
                          dQuote("terms")),
                 domain = NA)
	response <- attr(termobj, "response")
	newformula <- attr(termobj, "term.labels")[-dropx]
	if (!is.null(off <- attr(termobj, "offset")))
	    newformula <- c(newformula,
			    as.character(attr(termobj, "variables")[off + 1L]))
	newformula <-
	    reformulate(newformula,
			response = if(response && keep.response) termobj[[2L]],
			intercept = attr(termobj, "intercept"),
			env = environment(termobj))
	result <- terms(newformula, specials=names(attr(termobj, "specials")))

	# Edit the optional attributes
	dropOpt <- if(response && !keep.response) # we have a response in termobj, but not in the result
		       c(response, dropx + length(response))
		   else
		       dropx + max(response)

	if (!is.null(predvars <- attr(termobj, "predvars"))) {
	    # predvars is a language expression giving a list of
	    # values corresponding to terms in the model
            # so add 1 for the name "list"
	    attr(result, "predvars") <- predvars[-(dropOpt+1)]
	}
	if (!is.null(dataClasses <- attr(termobj, "dataClasses"))) {
	    # dataClasses is a character vector of
	    # values corresponding to terms in the model
	    attr(result, "dataClasses") <- dataClasses[-dropOpt]
	}
	result
    }
}


`[.terms` <- function (termobj, i)
{
    resp <- if (attr(termobj, "response")) termobj[[2L]]
    newformula <- attr(termobj, "term.labels")[i]
    if (!is.null(off <- attr(termobj, "offset")))
	newformula <- c(newformula,
			as.character(attr(termobj, "variables")[off + 1L]))
    if (length(newformula) == 0L) newformula <- "1"
    newformula <- reformulate(newformula, resp, attr(termobj, "intercept"), environment(termobj))
    result <- terms(newformula, specials = names(attr(termobj, "specials")))

    # Edit the optional attributes

    addindex <- function(index, offset)
        # add a non-negative offset to a possibly negative index
    	ifelse(index < 0, index - offset,
    	       ifelse(index == 0, 0, index + offset))

    if (is.logical(i))
    	i <- which(rep_len(i, length.out = length(attr(termobj, "term.labels"))))

    response <- attr(termobj, "response")
    if (response)
	iOpt <- c(if (max(i) > 0) response, # inclusive indexing
	          addindex(i, max(response)))
    else
	iOpt <- i

    if (!is.null(predvars <- attr(termobj, "predvars")))
	attr(result, "predvars") <- predvars[c(if (max(iOpt) > 0) 1,
	                                     addindex(iOpt, 1))]

    if (!is.null(dataClasses <- attr(termobj, "dataClasses")))
	attr(result, "dataClasses") <- dataClasses[iOpt]

    result
}


## Arguments abb and neg.out are a legacy from S
## simplify=TRUE was the default in R < 1.7.0
terms.formula <- function(x, specials = NULL, abb = NULL, data = NULL,
			  neg.out = TRUE, keep.order = FALSE,
                          simplify = FALSE, ..., allowDotAsName = FALSE)
{
    if(!missing(abb))    .Deprecated(msg=gettextf("setting '%s' in terms.formula() is deprecated", "abb"))
    if(!missing(neg.out)).Deprecated(msg=gettextf("setting '%s' in terms.formula() is deprecated", "neg.out"))
    if(simplify)
    fixFormulaObject <- function(object) {
        Terms <- terms(object)
	tmp <- attr(Terms, "term.labels")
        ## fix up terms involving | : PR#8462
        ind <- grep("|", tmp, fixed = TRUE)
        if(length(ind)) tmp[ind] <- paste("(", tmp[ind], ")")
        ## need to add back any offsets
        if(length(ind <- attr(Terms, "offset"))) {
            ## can't look at rownames of factors, as not there for y ~ offset(x)
            tmp2 <- as.character(attr(Terms, "variables"))[-1L]
            tmp <- c(tmp, tmp2[ind])
        }
	rhs <- if(length(tmp)) paste(tmp, collapse = " + ") else "1"
	if(!attr(Terms, "intercept")) rhs <- paste(rhs, "- 1")
        if(length(form <- formula(object)) > 2L) {
            res <- formula(paste("lhs ~", rhs))
            res[[2L]] <- form[[2L]]
            res
        } else formula(paste("~", rhs))
    }

    if (!is.null(data) && !is.environment(data) && !is.data.frame(data))
	data <- as.data.frame(data, optional = TRUE)
    terms <-
        .External(C_termsform, x, specials, data, keep.order, allowDotAsName)
    if (simplify) {
        a <- attributes(terms)
        terms <- fixFormulaObject(terms)
        attributes(terms) <- a
    }
    environment(terms) <- environment(x)
    if(!inherits(terms, "formula"))
        class(terms) <- c(oldClass(terms), "formula")
    terms
}

coef <- function(object, ...) UseMethod("coef")
## 'complete': be compatible with vcov()
coef.default <- function(object, complete=TRUE, ...) {
    cf <- object$coefficients
    if(complete) cf else cf[!is.na(cf)]
}
coef.aov <- coef.default; formals(coef.aov)[["complete"]] <- FALSE
coefficients <- coef

residuals <- function(object, ...) UseMethod("residuals")
residuals.default <- function(object, ...)
    naresid(object$na.action, object$residuals)
resid <- residuals

deviance <- function(object, ...) UseMethod("deviance")
deviance.default <- function(object, ...) object$deviance

fitted <- function(object, ...) UseMethod("fitted")
## we really do need partial matching here
fitted.default <- function(object, ...)
{
    xx <- if("fitted.values" %in% names(object))
        object$fitted.values else object$fitted
    napredict(object$na.action, xx)
}
fitted.values <- fitted

anova <- function(object, ...)UseMethod("anova")

effects <- function(object, ...)UseMethod("effects")

weights <- function(object, ...)UseMethod("weights")
## used for class "lm", e.g. in drop1.
weights.default <- function(object, ...)
{
    wts <-  object$weights
    if (is.null(wts)) wts else napredict(object$na.action, wts)
}

df.residual <- function(object, ...)UseMethod("df.residual")
df.residual.default <- function(object, ...) object$df.residual

variable.names <- function(object, ...) UseMethod("variable.names")
variable.names.default <- function(object, ...) colnames(object)

case.names <- function(object, ...) UseMethod("case.names")
case.names.default <- function(object, ...) rownames(object)

simulate <- function(object, nsim = 1, seed = NULL, ...) UseMethod("simulate")

offset <- function(object) object
## ?

.checkMFClasses <- function(cl, m, ordNotOK = FALSE)
{
    ## when called from predict.nls, vars not match.
    new <- vapply(m, .MFclass, "")
    new <- new[names(new) %in% names(cl)]
    if(length(new) == 0L) return(invisible())
    ## else
    old <- cl[names(new)]
    if(!ordNotOK) {
        old[old == "ordered"] <- "factor"
        new[new == "ordered"] <- "factor"
    }
    ## ordered is OK as a substitute for factor, but not v.v.
    new[new == "ordered" & old == "factor"] <- "factor"
    ## factor is OK as a substitute for character
    ## This probably means the original character got auto-converted to
    ## factor, setting xlevels and causing the conversion of the new
    new[new == "factor" & old == "character"] <- "character"
    if(!identical(old, new)) {
        wrong <- old != new
        if(sum(wrong) == 1)
            stop(gettextf(
    "variable '%s' was fitted with type \"%s\" but type \"%s\" was supplied",
                          names(old)[wrong], old[wrong], new[wrong]),
                 call. = FALSE, domain = NA)
        else
            stop(gettextf(
    "variables %s were specified with different types from the fit",
                 paste(sQuote(names(old)[wrong]), collapse=", ")),
                 call. = FALSE, domain = NA)
    }
    else invisible()
}

##' Model Frame Class
.MFclass <- function(x)
{
    ## the idea is to identify the relevant classes that model.matrix
    ## will handle differently
    ## logical, factor, ordered vs numeric, and other for future proofing
    if(is.logical(x)) return("logical")
    if(is.ordered(x)) return("ordered")
    if(is.factor(x)) return("factor")
    ## Character vectors may be auto-converted to factors, but keep them separate for now
    if(is.character(x)) return("character")
    if(is.matrix(x) && is.numeric(x))
        return(paste0("nmatrix.", ncol(x)))
    ## this is unclear.  Prior to 2.6.0 we assumed numeric with attributes
    ## meant something, but at least for now model.matrix does not
    ## treat it differently.
##    if(is.vector(x) && is.numeric(x)) return("numeric")
    if(is.numeric(x)) return("numeric")
    return("other")
}

##' A complete deparse for "models", i.e. for formula and variable names (PR#15377)
##' @param width.cutoff = 500L: Some people have generated longer variable names
##' https://stat.ethz.ch/pipermail/r-devel/2010-October/058756.html
deparse2 <- function(x)
    paste(deparse(x, width.cutoff = 500L, backtick = !is.symbol(x) && is.language(x)),
          collapse = " ")

