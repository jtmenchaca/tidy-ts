# Companion to finegray.test.ts — Fine-Gray competing risks data transformation.
# Usage (from this directory): Rscript finegray-source-test.R
# Ports assertions from survival-ref/survival-master/tests/finegray.R

cmd <- commandArgs(trailingOnly = FALSE)
f <- sub("^--file=", "", cmd[grep("^--file=", cmd)])
.this_dir <- if (length(f)) dirname(normalizePath(f)) else getwd()
source(file.path(.this_dir, "source-tests", "r-json-emit.R"))

# ── Test data set 1: right-censored, 14 observations, 2 event types ─────────

fdata <- data.frame(time  =c(1,2,3,4,4,4,5,5,6,8,8, 9,10,12),
                    status=factor(c(1,2,0,1,0,0,2,1,0,0,2, 0,1 ,0), 0:2,
                             c("cen", "type1", "type2")),
                    x     =c(5,4,3,1,2,1,1,2,2,4,6,1,2, 0),
                    id = 1:14)

# test1: finegray for event type 1 (default etype)
test1 <- finegray(Surv(time, status) ~., fdata, count="fgcount")

# test2: finegray for event type 2
test2 <- finegray(Surv(time, status) ~x, fdata, etype="type2")

# ── Test strata ──────────────────────────────────────────────────────────────

fdata2 <- rbind(fdata, fdata)
fdata2$group <- rep(1:2, each=nrow(fdata))
temp <- c(1,3,2)[as.numeric(fdata$status)]
fdata2$status[fdata2$group==2] <- factor(temp, 1:3, levels(fdata$status))
test3 <- finegray(Surv(time, status) ~ .+ strata(group), fdata2)

# ── Test data set 3: left truncation (delayed entry) ────────────────────────

fdata3 <- data.frame(time1 = c(0,0,0,3,2,0,0,1,0,7,5, 0, 0, 0),
                     time2 = c(1,2,3,4,4,4,5,5,6,8,8, 9,10,12),
                     status= c(1,2,0,1,0,0,2,1,0,0,2, 0, 1 ,0),
                     x     = c(5,4,3,1,2,1,1,2,2,4,6, 1, 2, 0),
                     id = 1:14)
fg3 <- finegray(Surv(time1, time2, factor(status, 0:2)) ~ x, id=id, fdata3)

result <- list(
  # Test 1: etype=1 (type1)
  test1_id = as.vector(test1$id),
  test1_fgstart = as.vector(test1$fgstart),
  test1_fgstop = as.vector(test1$fgstop),
  test1_fgstatus = as.vector(test1$fgstatus),
  test1_fgwt = as.vector(test1$fgwt),
  test1_fgcount = as.vector(test1$fgcount),

  # Test 2: etype=2 (type2)
  test2_fgstart = as.vector(test2$fgstart),
  test2_fgstop = as.vector(test2$fgstop),
  test2_fgstatus = as.vector(test2$fgstatus),
  test2_fgwt = as.vector(test2$fgwt),

  # Test 3: strata — first 19 rows should match test1, rows 20-38 match test2
  test3_fgstart_1 = as.vector(test3$fgstart[1:19]),
  test3_fgstop_1  = as.vector(test3$fgstop[1:19]),
  test3_fgstatus_1 = as.vector(test3$fgstatus[1:19]),
  test3_fgwt_1 = as.vector(test3$fgwt[1:19]),
  test3_fgstart_2 = as.vector(test3$fgstart[20:38]),
  test3_fgstop_2  = as.vector(test3$fgstop[20:38]),
  test3_fgstatus_2 = as.vector(test3$fgstatus[20:38]),
  test3_fgwt_2 = as.vector(test3$fgwt[20:38]),

  # Test data 3: left truncation
  fg3_fgstart = as.vector(fg3$fgstart),
  fg3_fgstop = as.vector(fg3$fgstop),
  fg3_fgstatus = as.vector(fg3$fgstatus),
  fg3_fgwt = as.vector(fg3$fgwt)
)

emit_reference(result)
