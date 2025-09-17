model.frame <- function(formula, ...) UseMethod("model.frame")
model.frame.default <-
    function(formula, data = NULL, subset = NULL, na.action,
	     drop.unused.levels = FALSE, xlev = NULL,...)
{
    ## first off, establish if we were passed a data frame 'newdata'
    ## and note the number of rows.
    possible_newdata <-
        !missing(data) && is.data.frame(data) &&
        identical(substitute(data), quote(newdata)) &&
        (nr <- nrow(data)) > 0

    ## were we passed just a fitted model object?
    ## the fit might have a saved model object
    if(!missing(formula) && nargs() == 1 && is.list(formula)
       && !is.null(m <- formula$model)) return(m)
    ## if not use the saved call (if there is one).
    if(!missing(formula) && nargs() == 1 && is.list(formula)
       && all(c("terms", "call") %in% names(formula))) {
        fcall <- formula$call
        m <- match(c("formula", "data", "subset", "weights", "na.action"),
                   names(fcall), 0)
        fcall <- fcall[c(1, m)]
        ## need stats:: for non-standard evaluation
        fcall[[1L]] <- quote(stats::model.frame)
        env <- environment(formula$terms) %||% parent.frame()
        return(eval(fcall, env)) # 2-arg form as env is an environment
    }
    if(missing(formula)) {
	if(!missing(data) && inherits(data, "data.frame") && length(attr(data, "terms")))
	    return(data)
	formula <- as.formula(data)
    }
    else if(missing(data) && inherits(formula, "data.frame")) {
	if(length(attr(formula, "terms")))
	    return(formula)
	data <- formula
	formula <- as.formula(data)
    } else
        formula <- as.formula(formula)
    if(missing(na.action)) {
	na.action <-
            if(!is.null(naa <- attr(data, "na.action")) && mode(naa)!="numeric")
                naa
            else getOption("na.action") %||%
                     na.fail # rarely happens (option historically unset in S, see FAQ 3.3.2)
    }

    ## The following logic is quite ancient and should possibly be revised
    ## In particular it lets data=1 slip through and subsequent eval()
    ## would interpret it as a sys.frame() index (PR#17879).
    ## For now, insert explicit check below

    if(missing(data))
	data <- environment(formula)
    else if (!is.data.frame(data) && !is.environment(data)
             && !is.null(attr(data, "class")))
        data <- as.data.frame(data)
    else if (is.array(data))
        stop("'data' must be a data.frame, not a matrix or an array")

    ## Explicitly check "data"
    if (!is.data.frame(data) && !is.environment(data) && !is.list(data)
        && !is.null(data))
        stop("'data' must be a data.frame, environment, or list")

    if(!inherits(formula, "terms"))
	formula <- terms(formula, data = data)
    env <- environment(formula)
    rownames <- .row_names_info(data, 0L) #attr(data, "row.names")
    vars <- attr(formula, "variables")
    predvars <- attr(formula, "predvars") %||% vars
    varnames <- vapply(vars, deparse2, " ")[-1L]
    variables <- eval(predvars, data, env)
    resp <- attr(formula, "response")
    if(is.null(rownames) && resp > 0L) {
        ## see if we can get rownames from the response
        lhs <- variables[[resp]]
        rownames <- if(is.matrix(lhs)) rownames(lhs) else names(lhs)
    }
    if(possible_newdata && length(variables)) {
        ## need to do this before subsetting and na.action
        nr2 <- max(sapply(variables, NROW))
        if(nr2 != nr)
            warning(sprintf(paste0(ngettext(nr,
                                            "'newdata' had %d row",
                                            "'newdata' had %d rows"),
                                   " ",
                                  ngettext(nr2,
                                           "but variable found had %d row",
                                           "but variables found have %d rows")),
                            nr, nr2),
                    call. = FALSE, domain = NA)
    }
    if(is.null(attr(formula, "predvars"))) {
        for (i in seq_along(varnames))
            predvars[[i+1L]] <- makepredictcall(variables[[i]], vars[[i+1L]])
        attr(formula, "predvars") <- predvars
    }
    extras <- substitute(list(...))
    extranames <- names(extras[-1L])
    extras <- eval(extras, data, env)
    subset <- eval(substitute(subset), data, env)
    data <- .External2(C_modelframe, formula, rownames, variables, varnames,
                       extras, extranames, subset, na.action)
    ## fix up the levels
    if(length(xlev)) {
	for(nm in names(xlev))
	    if(!is.null(xl <- xlev[[nm]])) {
		xi <- data[[nm]]
                if(is.character(xi))
                    xi <- as.factor(xi)
		if(!is.factor(xi) || is.null(nxl <- levels(xi)))
		    warning(gettextf("variable '%s' is not a factor", nm),
                            domain = NA)
		else {
		    ctr <- attr(xi, "contrasts")
		    xi <- xi[, drop = TRUE] # drop unused levels
                    nxl <- levels(xi)
		    if(any(m <- is.na(match(nxl, xl))))
                        stop(sprintf(ngettext(length(m),
                                              "factor %s has new level %s",
                                              "factor %s has new levels %s"),
                                     nm, paste(nxl[m], collapse=", ")),
                             domain = NA)
		    data[[nm]] <- factor(xi, levels=xl, exclude=NULL)
		    if (!identical(attr(data[[nm]], "contrasts"), ctr))
		    	warning(gettextf("contrasts dropped from factor %s", nm),
		    	        call. = FALSE, domain = NA)
		}
	    }
    } else if(drop.unused.levels) {
	for(nm in names(data)) {
	    x <- data[[nm]]
	    if(is.factor(x) &&
	       length(unique(x[!is.na(x)])) < length(levels(x))) {
	        ctr <- attr(x, "contrasts")
		data[[nm]] <- x[, drop = TRUE]
		if (!identical(attr(data[[nm]], "contrasts"), ctr))
		    warning(gettextf(
				"contrasts dropped from factor %s due to missing levels",
					    nm), domain = NA, call. = FALSE)
	    }
	}
    }
    attr(formula, "dataClasses") <- vapply(data, .MFclass, "")
    attr(data, "terms") <- formula
    data
}

## we don't assume weights are numeric or a vector, leaving this to the
## calling application
