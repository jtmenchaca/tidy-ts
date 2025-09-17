model.matrix <- function(object, ...) UseMethod("model.matrix")

model.matrix.default <- function(object, data = environment(object),
				 contrasts.arg = NULL, xlev = NULL, ...)
{
    t <- if(missing(data)) terms(object) else terms(object, data=data)
    if (is.null(attr(data, "terms")))
	data <- model.frame(object, data, xlev=xlev)
    else {
	reorder <- match(vapply(attr(t, "variables"), deparse2, "")[-1L],
                         names(data))
	if (anyNA(reorder))
	    stop("model frame and formula mismatch in model.matrix()")
	if(!identical(reorder, seq_len(ncol(data))))
	    data <- data[,reorder, drop=FALSE]
    }
    int <- attr(t, "response")
    if(length(data)) {
        contr.funs <- as.character(getOption("contrasts"))
        namD <- names(data)
        ## turn any character columns into factors
        for(i in namD)
            if(is.character(data[[i]]))
                data[[i]] <- factor(data[[i]])
        isF <- vapply(data, function(x) is.factor(x) || is.logical(x), NA)
        isF[int] <- FALSE
        isOF <- vapply(data, is.ordered, NA)
        for(nn in namD[isF])            # drop response
            if(is.null(attr(data[[nn]], "contrasts")))
                contrasts(data[[nn]]) <- contr.funs[1 + isOF[nn]]
        ## it might be safer to have numerical contrasts:
        ##	  get(contr.funs[1 + isOF[nn]])(nlevels(data[[nn]]))
        if (!is.null(contrasts.arg)) {
          if (!is.list(contrasts.arg))
              warning("non-list contrasts argument ignored")
          else {  ## contrasts.arg is a list
            if (is.null(namC <- names(contrasts.arg)))
                stop("'contrasts.arg' argument must be named")
            for (nn in namC) {
                if (is.na(ni <- match(nn, namD)))
                    warning(gettextf("variable '%s' is absent, its contrast will be ignored", nn),
                            domain = NA)
                else {
                    ca <- contrasts.arg[[nn]]
                    if(is.matrix(ca)) contrasts(data[[ni]], ncol(ca)) <- ca
                    else contrasts(data[[ni]]) <- ca
                }
            }
          }
        } ## non-null contrasts.arg
    } else { #  no rhs terms ('~1', or '~0'): internal model.matrix needs some variable
	isF <- FALSE
	data[["x"]] <- raw(nrow(data))
    }
    ans <- .External2(C_modelmatrix, t, data) # modelmatrix() in ../src/model.c
    if(any(isF))
	attr(ans, "contrasts") <- lapply(data[isF], attr, "contrasts")
    ans
}

