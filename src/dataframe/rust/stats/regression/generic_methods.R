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

