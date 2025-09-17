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

residuals.glm <-
    function(object,
	     type = c("deviance", "pearson", "working", "response", "partial"),
	     ...)
{
    type <- match.arg(type)
    y <- object$y
    r <- object$residuals
    mu <- object$fitted.values
    wts <- object$prior.weights
    switch(type,
           deviance=,pearson=,response=
           if(is.null(y)) {
               mu.eta <- object$family$mu.eta
               eta <- object$linear.predictors
               y <-  mu + r * mu.eta(eta)
           })
    res <- switch(type,
		  deviance = if(object$df.residual > 0) {
		      d.res <- sqrt(pmax((object$family$dev.resids)(y, mu, wts), 0))
		      ifelse(y > mu, d.res, -d.res)
		  } else rep.int(0, length(mu)),
		  pearson = (y-mu)*sqrt(wts)/sqrt(object$family$variance(mu)),
		  working = r,
		  response = y - mu,
		  partial = r
		  )
    if(!is.null(object$na.action))
        res <- naresid(object$na.action, res)
    if (type == "partial") ## need to avoid doing naresid() twice.
        res <- res+predict(object, type="terms")
    res
}
