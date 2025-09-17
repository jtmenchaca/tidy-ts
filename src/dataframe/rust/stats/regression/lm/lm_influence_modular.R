# Modular lm.influence.R - Main file that sources all components
# This replaces the monolithic lm.influence.R with a modular structure

# Source all modular components
source("influence_core.R")           # Core influence calculations
source("influence_generic.R")        # Generic functions and method dispatch
source("influence_standardized.R")   # Standardized and studentized residuals
source("influence_diagnostics.R")    # Influence diagnostic measures
source("influence_measures.R")       # Comprehensive influence measures
source("influence_print.R")          # Print and summary methods

# This modular structure provides the same functionality as the original
# lm.influence.R but is organized into logical, focused components:
#
# 1. influence_core.R - Core functions: hat(), weighted.residuals(), 
#    qr.influence(), lm.influence()
# 2. influence_generic.R - Generic functions: influence(), hatvalues()
# 3. influence_standardized.R - Standardized residuals: rstandard(), rstudent()
# 4. influence_diagnostics.R - Diagnostic measures: dffits(), dfbeta(), 
#    dfbetas(), covratio(), cooks.distance()
# 5. influence_measures.R - Comprehensive analysis: influence.measures()
# 6. influence_print.R - Display methods: print.infl(), summary.infl()
