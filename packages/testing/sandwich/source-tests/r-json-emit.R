# Shared JSON emit helper for companion *-source-test.R scripts.
# Matches extract-reference.R toJSON behavior (digits = 15).

library(sandwich)
options(digits = 15)

toJSON <- function(x) {
  if (is.matrix(x)) {
    rows <- lapply(1:nrow(x), function(i) as.vector(x[i, ]))
    paste0("[", paste(sapply(rows, toJSON), collapse = ","), "]")
  } else if (is.list(x) && !is.null(names(x))) {
    pairs <- mapply(function(k, v) paste0('"', k, '":', toJSON(v)),
                    names(x), x, SIMPLIFY = FALSE)
    paste0("{", paste(pairs, collapse = ","), "}")
  } else if (is.vector(x) && length(x) > 1) {
    paste0("[", paste(sapply(x, toJSON), collapse = ","), "]")
  } else if (length(x) == 1 && is.na(x)) {
    "null"
  } else if (is.logical(x)) {
    tolower(as.character(x))
  } else if (is.numeric(x)) {
    if (is.infinite(x)) {
      if (x > 0) '"Infinity"' else '"-Infinity"'
    } else if (is.nan(x)) {
      '"NaN"'
    } else {
      formatC(x, digits = 15, format = "g")
    }
  } else if (is.character(x)) {
    paste0('"', x, '"')
  } else {
    "null"
  }
}

emit_reference <- function(result) {
  cat(toJSON(result), "\n")
}
