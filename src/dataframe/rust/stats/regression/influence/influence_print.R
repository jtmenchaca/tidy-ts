# Print and summary methods for influence measures
# Part of lm.influence.R modularization

print.infl <- function(x, digits = max(3L, getOption("digits") - 4L), ...)
{
    ## `x' : as the result of  influence.measures(.)
    cat("Influence measures of\n\t", deparse(x$call),":\n\n")
    is.star <- apply(x$is.inf, 1L, any, na.rm = TRUE)
    print(data.frame(x$infmat,
		     inf = ifelse(is.star, "*", " ")),
	  digits = digits, ...)
    invisible(x)
}

summary.infl <-
    function(object, digits = max(2L, getOption("digits") - 5L), ...)
{
    ## object must be as the result of	influence.measures(.)
    is.inf <- object$is.inf
    isMLM <- length(dim(is.inf)) == 3L
    ## will have NaN values from any hat=1 rows.
    is.inf[is.na(is.inf)] <- FALSE
    is.star <- apply(is.inf, 1L, any)
    cat("Potentially influential observations of\n\t",
	deparse(object$call),":\n")
    if(any(is.star)) {
	if(isMLM) {
	    is.inf <- is.inf       [is.star,,]
	    imat <- object $ infmat[is.star,, , drop = FALSE]
	} else { # regular "lm"
	    is.inf <- is.inf       [is.star, ]
	    imat <- object $ infmat[is.star, , drop = FALSE]
	}
	rownam <- dimnames(object $ infmat)[[1L]] %||% format(seq(is.star))
	dimnames(imat)[[1L]] <- rownam[is.star]
	chmat <- format(round(imat, digits = digits))
	cat("\n")
	print(array(paste0(chmat, c("", "_*")[1L + is.inf]),
		    dimnames = dimnames(imat), dim = dim(imat)),
	      quote = FALSE)
	invisible(imat)
    } else {
	cat("NONE\n")
	numeric()
    }
}
