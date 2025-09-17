model.weights <- function(x) .subset2(x, "(weights)")

## we do check that offsets are numeric.
model.offset <- function(x) {
    offsets <- attr(attr(x, "terms"),"offset")
    if(length(offsets)) {
	ans <- .subset2(x, "(offset)") %||% 0
	for(i in offsets) ans <- ans+x[[i]]
    }
    else ans <- .subset2(x, "(offset)")
    if(!is.null(ans) && !is.numeric(ans)) stop("'offset' must be numeric")
    ans
}

model.response <- function (data, type = "any")
{
    if (attr(attr(data, "terms"), "response")) {
	if (is.list(data) || is.data.frame(data)) {
	    v <- data[[1L]]
	    if (type == "numeric" && is.factor(v)) {
		warning('using type = "numeric" with a factor response will be ignored')
	    } else if (type == "numeric" || type == "double")
		storage.mode(v) <- "double"
	    else if (type != "any") stop("invalid response type")
	    if (is.matrix(v) && ncol(v) == 1L) dim(v) <- NULL
	    if(is.object(v) && inherits(v, "AsIs"))
		v <- unclass(v)
	    rows <- attr(data, "row.names")
	    if (nrows <- length(rows)) {
		if (length(v) == nrows) names(v) <- rows
		else if (length(dd <- dim(v)) == 2L)
		    if (dd[1L] == nrows && !length((dn <- dimnames(v))[[1L]]))
			dimnames(v) <- list(rows, dn[[2L]])
	    }
	    return(v)
	} else stop("invalid 'data' argument")
    } else return(NULL)
}

model.extract <- function (frame, component)
{
    component <- as.character(substitute(component))
    rval <- switch(component,
		   response = model.response(frame),
		   offset   = model.offset  (frame),
                   ## otherwise :
                   frame[[paste0("(", component, ")")]]
                   )
    if(!is.null(rval)){
	if (length(rval) == nrow(frame))
	    names(rval) <- attr(frame, "row.names")
	else if (is.matrix(rval) && nrow(rval) == nrow(frame)) {
	    t1 <- dimnames(rval)
	    dimnames(rval) <- list(attr(frame, "row.names"), t1[[2L]])
	}
    }
    rval
}

preplot <- function(object, ...) UseMethod("preplot")
update <- function(object, ...) UseMethod("update")

is.empty.model <- function (x)
{
    tt <- terms(x)
    (length(attr(tt, "factors")) == 0L) & (attr(tt, "intercept") == 0L)
}

makepredictcall <- function(var, call) UseMethod("makepredictcall")

makepredictcall.default  <- function(var, call)
{
    if(as.character(call)[1L] != "scale") return(call)
    if(!is.null(z <- attr(var, "scaled:center"))) call$center <- z
    if(!is.null(z <- attr(var, "scaled:scale"))) call$scale <- z
    call
}

.getXlevels <- function(Terms, m)
{
    xvars <- vapply(attr(Terms, "variables"), deparse2, "")[-1L]
    if((yvar <- attr(Terms, "response")) > 0) xvars <- xvars[-yvar]
    if(length(xvars)) {
	xlev <- lapply(m[xvars], function(x)
	    if(is.factor(x)) levels(x)
	    else if(is.character(x)) levels(as.factor(x))) # else NULL
	xlev[!vapply(xlev, is.null, NA)]
    }
}

get_all_vars <- function(formula, data = NULL, ...)
{
    if(missing(formula)) {
	if(!missing(data) && inherits(data, "data.frame") &&
	   length(attr(data, "terms")) )
	    return(data)
	formula <- as.formula(data)
    }
    else if(missing(data) && inherits(formula, "data.frame")) {
	if(length(attr(formula, "terms")))
	    return(formula)
	data <- formula
	formula <- as.formula(data)
    }
    formula <- as.formula(formula)
    if(missing(data))
	data <- environment(formula)
    else if (!is.data.frame(data) && !is.environment(data)
             && !is.null(attr(data, "class")))
        data <- as.data.frame(data)
    else if (is.array(data))
        stop("'data' must be a data.frame, not a matrix or an array")

    ## Explicitly check "data" -- see comment in model.frame.default
    if (!is.data.frame(data) && !is.environment(data) && !is.list(data)
        && !is.null(data))
        stop("'data' must be a data.frame, environment, or list")

    if(!inherits(formula, "terms"))
	formula <- terms(formula, data = data)
    env <- environment(formula)
    rownames <- .row_names_info(data, 0L) #attr(data, "row.names")
    varnames <- all.vars(formula)
    variables <- lapply(lapply(varnames, as.name), eval, data, env)
    if(is.null(rownames) && (resp <- attr(formula, "response")) > 0) {
        ## see if we can get rownames from the response
        lhs <- variables[[resp]]
	rownames <- if(!is.null(d <- dim(lhs)) && length(d) == 2L) {
			if(is.data.frame(lhs)) .row_names_info(lhs, 0L) else rownames(lhs)
		    } else names(lhs)
    }
    extras <- substitute(list(...))
    extranames <- names(extras[-1L])
    extras <- eval(extras, data, env)
    x <- c(variables, extras)
    ## protect the unprotected matrices:
    if(anyM <- any(isM <- vapply(x, function(o) is.matrix(o) && !inherits(o,"AsIs"), NA)))
        x[isM] <- lapply(x[isM], I)
    nms.x <- c(varnames, extranames)
    if(any(vapply(x, is.data.frame, NA)))
        nms.x <- unlist(lapply(seq_along(x), function(i)
            if(is.list(x[[i]])) names(x[[i]]) else nms.x[[i]]))
    x <- as.data.frame(x, optional=TRUE)
    names(x) <- nms.x
    if(anyM)
        x[isM] <- lapply(x[isM], function(o) `class<-`(o, class(o)[class(o) != "AsIs"]))
    attr(x, "row.names") <- rownames %||%  # might be short form
        .set_row_names(max(vapply(x, NROW, integer(1))))
    x
}
