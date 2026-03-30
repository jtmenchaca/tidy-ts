//! Baseline hazard computations for Cox models
//!
//! ## Source
//!
//! - `survival-ref/survival-master/src/coxsurv3.c` — (time, status) single-state
//! - `survival-ref/survival-master/src/coxsurv4.c` — (time1, time2, status) counting process
//!
//! These routines compute per-event-time counts, weighted means of covariates,
//! and (for coxsurv3) score residuals needed for IJ variance of survfit objects.

use serde::Serialize;

/// Result from `coxsurv3`: baseline hazard components for right-censored data.
///
/// All vectors indexed by unique event time (length `ntime`).
/// `xbar` and `sresid` are nvar-length vectors of per-time / per-obs vectors.
#[derive(Debug, Clone, Serialize)]
pub struct CoxSurv3Result {
    /// Unique event (death) times, length ntime
    pub time: Vec<f64>,
    /// Stratum for each event time, length ntime
    pub strata: Vec<i32>,
    /// Count matrix, count[j][itime] for j in 0..7, length ntime each
    /// j=0..2: n at risk (w1=1, w2=wt, w3=wt*risk)
    /// j=3..5: events (w1, w2, w3)
    /// j=6: Efron-adjusted denominator (harmonic mean for Efron, or n[2] for Breslow)
    pub count: Vec<Vec<f64>>,
    /// Weighted mean covariates at each event time, xbar[j][itime], j in 0..nvar
    pub xbar: Vec<Vec<f64>>,
    /// Score residuals, sresid[j][i], j in 0..nvar, i in 0..n
    pub sresid: Vec<Vec<f64>>,
}

/// Result from `coxsurv4`: baseline hazard components for counting process data.
///
/// All vectors indexed by unique time point (length `ntime`).
#[derive(Debug, Clone, Serialize)]
pub struct CoxSurv4Result {
    /// Unique time points, length ntime
    pub time: Vec<f64>,
    /// Stratum for each time point, length ntime
    pub strata: Vec<f64>,
    /// Count matrix, count[j][itime] for j in 0..12, length ntime each
    /// j=0..2: n at risk (w1, w2, w3)
    /// j=3..4: events (w1, w2)
    /// j=5..6: censor (w1, w2)
    /// j=7..9: censored endpoints (w1, w2, w3)
    /// j=10..11: entries (w1, w2)
    pub count: Vec<Vec<f64>>,
    /// xbar1[j][itime]: weighted mean covariates for all at risk
    pub xbar1: Vec<Vec<f64>>,
    /// xbar2[j][itime]: weighted mean covariates for events
    pub xbar2: Vec<Vec<f64>>,
}

/// Port of `coxsurv3()` from `coxsurv3.c`.
///
/// Computes baseline hazard components for right-censored (time, status) Cox model data.
///
/// # Arguments
///
/// * `stime` - Event/censoring times, length n
/// * `status` - Event indicator (1.0=event, 0.0=censored), length n
/// * `xmat` - Covariate matrix, xmat[j][i] (nvar x n, column-major like C's dmatrix)
/// * `strata` - Strata assignment for each obs, length n
/// * `risk` - Risk scores exp(lp), length n
/// * `wt` - Case weights, length n
/// * `sort2` - Sort indices for stop time (0-based), ascending within strata, length n
/// * `efron` - 1 for Efron approximation, 0 for Breslow
///
/// # Returns
///
/// `CoxSurv3Result` with event times, strata, counts, xbar, and score residuals.
pub fn coxsurv3(
    stime: &[f64],
    status: &[f64],
    xmat: &[Vec<f64>],
    strata: &[i32],
    risk: &[f64],
    wt: &[f64],
    sort2: &[i32],
    efron: i32,
) -> CoxSurv3Result {
    let nused = stime.len();
    let nvar = xmat.len();

    // Validate inputs
    assert_eq!(status.len(), nused);
    assert_eq!(strata.len(), nused);
    assert_eq!(risk.len(), nused);
    assert_eq!(wt.len(), nused);
    assert_eq!(sort2.len(), nused);
    for v in xmat {
        assert_eq!(v.len(), nused);
    }

    // Pass 1: count unique event times
    // C: ntime =0; dtime=stime[sort2[0]] -1; istrat= strata[sort2[0]];
    let mut ntime: usize = 0;
    let mut dtime: f64 = stime[sort2[0] as usize] - 1.0;
    let mut istrat: i32 = strata[sort2[0] as usize];

    // C: for (i=0; i<nused; i++) {
    for i in 0..nused {
        let i2 = sort2[i] as usize;
        if strata[i2] != istrat {
            istrat = strata[i2]; // new stratum
            dtime = stime[i2] - 1.0; // smallest in new strata -1
        }
        if status[i2] == 1.0 && stime[i2] != dtime {
            ntime += 1;
            dtime = stime[i2];
        }
    }

    // Allocate working arrays
    let mut xsum1 = vec![0.0_f64; nvar];
    let mut xsum2 = vec![0.0_f64; nvar];
    let mut xhaz = vec![0.0_f64; nvar];
    let mut xmean = vec![0.0_f64; nvar];

    // Allocate output
    let mut rtime = vec![0.0_f64; ntime];
    let mut rstrat = vec![0_i32; ntime];
    let mut rn = vec![vec![0.0_f64; ntime]; 7]; // rn[j][itime]
    let mut xbar = vec![vec![0.0_f64; ntime]; nvar]; // xbar[j][itime]
    let mut resid = vec![vec![0.0_f64; nused]; nvar]; // resid[j][i]

    // C: for (j=0; j<7; j++) n[j] =0;
    let mut n = [0.0_f64; 7];

    // C: for (j=0; j < nvar; j++) { xsum1[j] =0; xhaz[j] =0; }
    // Already initialized to 0

    // C: cumhaz=0;
    let mut cumhaz: f64 = 0.0;

    // C: itime = ntime -1;
    let mut itime: isize = ntime as isize - 1;

    // C: stratastart = nused -1;
    let mut stratastart: isize = nused as isize - 1;

    // C: istrat = strata[sort2[nused-1]];
    istrat = strata[sort2[nused - 1] as usize];

    // C: for (i= nused -1; i >=0; ) {
    let mut i: isize = nused as isize - 1;
    let mut i2: usize = 0;
    while i >= 0 {
        i2 = sort2[i as usize] as usize;
        dtime = stime[i2];

        // C: for (j=0; j< nvar; j++) xsum2[j] =0;
        for j in 0..nvar {
            xsum2[j] = 0.0;
        }
        // C: for (j=3; j< 7; j++) n[j]=0;
        for j in 3..7 {
            n[j] = 0.0;
        }

        // C: if (strata[i2] != istrat) {
        if strata[i2] != istrat {
            // finish score residuals for prior stratum
            // C: for (k= stratastart; k> i; k--) {
            //    NOTE: C uses k directly (sorted position), not sort2[k].
            //    This is inconsistent with the final stratum code (lines 219-223)
            //    which uses sort2[k]. Port faithfully as written in C.
            let mut k = stratastart;
            while k > i {
                let ku = k as usize;
                for j in 0..nvar {
                    resid[j][ku] += risk[ku] * (xhaz[j] - xmat[j][ku] * cumhaz);
                }
                k -= 1;
            }

            // new stratum, zero totals
            // C: for (j=0; j<3; j++) n[j] =0;
            for j in 0..3 {
                n[j] = 0.0;
            }
            // C: for (j=0; j < nvar; j++) { xsum1[j] =0; xhaz[j] =0; }
            for j in 0..nvar {
                xsum1[j] = 0.0;
                xhaz[j] = 0.0;
            }
            // C: cumhaz=0;
            cumhaz = 0.0;
            // C: istrat = strata[i2];
            istrat = strata[i2];
            // C: stratastart = i;
            stratastart = i;
        }

        // Inner loop: walk through tied times
        // C: for (; i>=0; i--) {
        while i >= 0 {
            i2 = sort2[i as usize] as usize;
            // C: if (stime[i2]!= dtime || strata[i2] != istrat) break;
            if stime[i2] != dtime || strata[i2] != istrat {
                break;
            }

            // C: n[0]++;
            n[0] += 1.0;
            // C: n[1] += wt[i2];
            n[1] += wt[i2];
            // C: n[2] += wt[i2] * risk[i2];
            n[2] += wt[i2] * risk[i2];

            // C: for (j=0; j<nvar; j++) {
            for j in 0..nvar {
                // C: xsum1[j] += wt[i2]*risk[i2]* xmat[j][i2];
                xsum1[j] += wt[i2] * risk[i2] * xmat[j][i2];
                // C: resid[j][i2] = risk[i2]*(xmat[j][i2]*cumhaz - xhaz[j]);
                resid[j][i2] = risk[i2] * (xmat[j][i2] * cumhaz - xhaz[j]);
            }

            // C: if (status[i2] ==1) {
            if status[i2] == 1.0 {
                // C: n[3]++;
                n[3] += 1.0;
                // C: n[4]+= wt[i2];
                n[4] += wt[i2];
                // C: n[5] += wt[i2]* risk[i2];
                n[5] += wt[i2] * risk[i2];
                // C: for (j=0; j<nvar; j++) xsum2[j] += risk[i2] * wt[i2] *xmat[j][i2];
                for j in 0..nvar {
                    xsum2[j] += risk[i2] * wt[i2] * xmat[j][i2];
                }
            }

            i -= 1;
        }

        // C: if (n[3] >0) { /* if any deaths */
        if n[3] > 0.0 {
            let mut hazard: f64;

            // C: if (n[3] <2 || efron ==0) {
            if n[3] < 2.0 || efron == 0 {
                // Breslow or single death
                // C: hazard = n[4]/n[2];
                hazard = n[4] / n[2];
                // C: cumhaz += hazard;
                cumhaz += hazard;

                // C: for (j=0; j<nvar; j++) {
                for j in 0..nvar {
                    // C: xmean[j] = xsum1[j]/n[2];
                    xmean[j] = xsum1[j] / n[2];
                    // C: xhaz[j] += xmean[j] * hazard;
                    xhaz[j] += xmean[j] * hazard;

                    // C: for (k=1+i; k<= i+ n[3]; k++){
                    //    Note: i has already been decremented past the tied block.
                    //    The deaths are at positions i+1 .. i+n[3] in sort2.
                    //    But we need to iterate over the deaths only.
                    let nd = n[3] as isize;
                    for k in (i + 1)..=(i + nd) {
                        i2 = sort2[k as usize] as usize;
                        // C: resid[j][i2] += xmat[j][i2] - xmean[j];
                        resid[j][i2] += xmat[j][i2] - xmean[j];
                    }
                }
                // C: n[6] = n[2];
                n[6] = n[2];
            } else {
                // Efron approximation with multiple deaths
                // C: meanwt = n[4]/n[3];
                let meanwt = n[4] / n[3];

                // C: for (j=0; j<nvar; j++) xmean[j] =0;
                for j in 0..nvar {
                    xmean[j] = 0.0;
                }

                // C: for (dd=0; dd<n[3]; dd++) {
                let nd = n[3] as i32;
                for dd in 0..nd {
                    // C: downwt = dd/n[3];
                    let downwt = dd as f64 / n[3];
                    // C: temp = n[2] - downwt* n[5];
                    let temp = n[2] - downwt * n[5];
                    // C: n[6] += 1/temp;
                    n[6] += 1.0 / temp;
                    // C: hazard = meanwt/temp;
                    hazard = meanwt / temp;
                    // C: cumhaz += hazard;
                    cumhaz += hazard;

                    // C: for (j=0; j<nvar; j++) {
                    for j in 0..nvar {
                        // C: tmean = (xsum1[j] - downwt*xsum2[j])/ temp;
                        let tmean = (xsum1[j] - downwt * xsum2[j]) / temp;
                        // C: xmean[j] += tmean/n[3];
                        xmean[j] += tmean / n[3];
                        // C: xhaz[j] += tmean*hazard;
                        xhaz[j] += tmean * hazard;

                        // C: for (k=1+i ; k<= i+ n[3]; k++) {
                        let ndi = n[3] as isize;
                        for k in (i + 1)..=(i + ndi) {
                            i2 = sort2[k as usize] as usize;
                            // C: temp2 = xmat[j][i2] - tmean;
                            let temp2 = xmat[j][i2] - tmean;
                            // C: resid[j][i2] += temp2/n[3];
                            resid[j][i2] += temp2 / n[3];
                            // C: resid[j][i2] += temp2 * risk[i2] *hazard *downwt;
                            resid[j][i2] += temp2 * risk[i2] * hazard * downwt;
                        }
                    }
                }
                // C: n[6] = n[3]/n[6];
                n[6] = n[3] / n[6];
            }

            // Copy per event time results
            // C: rtime[itime] = dtime;
            rtime[itime as usize] = dtime;
            // C: rstrat[itime] = istrat;
            rstrat[itime as usize] = istrat;
            // C: for (j=0; j<nvar; j++) xbar[j][itime] = xmean[j];
            for j in 0..nvar {
                xbar[j][itime as usize] = xmean[j];
            }
            // C: for (j=0; j<7; j++) rn[j][itime] = n[j];
            for j in 0..7 {
                rn[j][itime as usize] = n[j];
            }
            // C: itime--;
            itime -= 1;
        }
    }

    // Final work for the last stratum
    // C: for (k= stratastart; k>=0; k--) {
    let mut k = stratastart;
    while k >= 0 {
        i2 = sort2[k as usize] as usize;
        // C: for (j=0; j < nvar; j++ )
        //        resid[j][i2] += risk[i2]* (xhaz[j] - xmat[j][i2]* cumhaz);
        for j in 0..nvar {
            resid[j][i2] += risk[i2] * (xhaz[j] - xmat[j][i2] * cumhaz);
        }
        k -= 1;
    }

    // i2 is now in scope from before the while loop

    CoxSurv3Result {
        time: rtime,
        strata: rstrat,
        count: rn,
        xbar,
        sresid: resid,
    }
}

/// Port of `coxsurv4()` from `coxsurv4.c`.
///
/// Computes baseline hazard components for counting process (time1, time2, status) data.
///
/// Note: The original C header says "This routine is not yet debugged" — ported faithfully.
///
/// # Arguments
///
/// * `tstart` - Entry times (time1), length n
/// * `stime` - Exit times (time2), length n
/// * `status` - Event indicator, length n
/// * `wt` - Case weights, length n
/// * `sort1` - Sort indices by start time (0-based), ascending within strata, length n
/// * `sort2` - Sort indices by stop time (0-based), ascending within strata, length n
/// * `position` - Position flags: 0=middle, 1=start, 2=end, 3=both start+end
/// * `strata` - Strata assignment, length n
/// * `xmat` - Covariate matrix, xmat[j][i] (nvar x n)
/// * `risk` - Risk scores exp(lp), length n
///
/// # Returns
///
/// `CoxSurv4Result` with time, strata, counts, xbar1, xbar2.
pub(crate) fn coxsurv4(
    tstart: &[f64],
    stime: &[f64],
    status: &[f64],
    wt: &[f64],
    sort1: &[i32],
    sort2: &[i32],
    position: &[i32],
    strata: &[i32],
    xmat: &[Vec<f64>],
    risk: &[f64],
) -> CoxSurv4Result {
    let nused = stime.len();
    let nvar = xmat.len();

    // Validate
    assert_eq!(tstart.len(), nused);
    assert_eq!(status.len(), nused);
    assert_eq!(wt.len(), nused);
    assert_eq!(sort1.len(), nused);
    assert_eq!(sort2.len(), nused);
    assert_eq!(position.len(), nused);
    assert_eq!(strata.len(), nused);
    assert_eq!(risk.len(), nused);
    for v in xmat {
        assert_eq!(v.len(), nused);
    }

    // Pass 1: count unique time points
    // C: ntime =1; dtime=stime[sort2[0]]; istrat= strata[sort2[0]];
    let mut ntime: usize = 1;
    let mut dtime: f64 = stime[sort2[0] as usize];
    let mut istrat: i32 = strata[sort2[0] as usize];

    // C: for (i=1; i<nused; i++) {
    for i in 1..nused {
        let i2 = sort2[i] as usize;
        if strata[i2] != istrat {
            ntime += 1;
            istrat = strata[i2];
        } else if stime[i2] != dtime {
            ntime += 1;
        }
        dtime = stime[i2];
    }

    // Allocate working arrays
    let mut xsum1 = vec![0.0_f64; nvar];
    let mut xsum2 = vec![0.0_f64; nvar];

    // Allocate output
    let mut rtime = vec![0.0_f64; ntime];
    let mut rstrat = vec![0.0_f64; ntime];
    let mut rn = vec![vec![0.0_f64; ntime]; 12]; // rn[j][itime]
    let mut rx1 = vec![vec![0.0_f64; ntime]; nvar]; // rx1[j][itime]
    let mut rx2 = vec![vec![0.0_f64; ntime]; nvar]; // rx2[j][itime]

    let mut n = [0.0_f64; 12];

    // C: person = 0; person2=0;
    let mut person: usize = 0;
    let mut person2: usize = 0;

    // C: istrat = strata[sort2[0]];
    istrat = strata[sort2[0] as usize];

    // C: for (itime=ntime-1; itime>=0; itime--) {
    // person walks forward (ascending stop time), itime walks backward.
    // Output: rtime[ntime-1] = earliest, rtime[0] = latest (descending order).

    let mut itime: isize = ntime as isize - 1;
    while itime >= 0 {
        let itime_u = itime as usize;
        // C: i2 = sort2[person];
        let mut i2 = sort2[person] as usize;

        // C: if (person==0 || strata[i2] != istrat) {
        if person == 0 || strata[i2] != istrat {
            // C: if (person>0) {
            if person > 0 {
                // catch up on entries at the end of a stratum
                //
                // C BUGS (file header: "This routine is not yet debugged"):
                //   1. Line 126: initializes j2 = sort2[person2], but person2 tracks start-time
                //      ordering so sort1 should be used (main loop at line 174 uses sort1).
                //   2. Line 130: j2 = sort1[person2] runs BEFORE person2++ (C for-loop semantics),
                //      so the next iteration's condition check uses sort1[old_person2] — off by one.
                //      Compare main loop lines 195-196 where j2 updates AFTER person2++.
                //   3. Lines 127-131 skip the position[j2]==1||3 filter that the main loop
                //      uses at lines 190-193 for counting entries.
                // Ported faithfully to match C behavior.
                let mut j2 = sort2[person2] as usize;
                while person2 < nused
                    && tstart[j2] >= dtime
                    && strata[j2] == istrat
                {
                    n[10] += 1.0;
                    n[11] += wt[j2];
                    j2 = sort1[person2] as usize;
                    person2 += 1;
                }
                // C: rn[10][itime+1] = n[10];
                // C: rn[11][itime+1] = n[11];
                rn[10][itime_u + 1] = n[10];
                rn[11][itime_u + 1] = n[11];
            }
            // new stratum, zero everything
            // C: for (k=0; k<12; k++) n[k] =0;
            for k in 0..12 {
                n[k] = 0.0;
            }
            // C: for (k=0; k < nvar; k++) xsum1[k] =0;
            for k in 0..nvar {
                xsum1[k] = 0.0;
            }
            // C: istrat = strata[i2];
            istrat = strata[i2];
        }

        // C: dtime = stime[i2];
        dtime = stime[i2];
        // C: rtime[itime] = dtime;
        rtime[itime_u] = dtime;
        // C: rstrat[itime] = istrat;
        rstrat[itime_u] = istrat as f64;
        // C: for (k=3; k<12; k++) n[k]=0;
        for k in 3..12 {
            n[k] = 0.0;
        }

        // C: while(person< nused && stime[i2]==dtime && strata[i2]==istrat) {
        while person < nused && stime[i2] == dtime && strata[i2] == istrat {
            // C: for (k=0; k<nvar; k++) xsum2[k] =0;
            for k in 0..nvar {
                xsum2[k] = 0.0;
            }

            // C: n[0]++;
            n[0] += 1.0;
            // C: n[1] += wt[i2];
            n[1] += wt[i2];
            // C: n[2] += wt[i2] * risk[i2];
            n[2] += wt[i2] * risk[i2];
            // C: for (k=0; k<nvar; k++) xsum1[k] += wt[i2]*risk[i2]*xmat[k][person];
            for k in 0..nvar {
                xsum1[k] += wt[i2] * risk[i2] * xmat[k][person];
            }

            // C: if (status[i2] > 0) {
            if status[i2] > 0.0 {
                // C: for (k=0; k<nvar; k++) xsum2[k] += wt[i2]*risk[i2]* xmat[k][person];
                for k in 0..nvar {
                    xsum2[k] += wt[i2] * risk[i2] * xmat[k][person];
                }
                // C: n[3]++;
                n[3] += 1.0;
                // C: n[4]+= wt[i2];
                n[4] += wt[i2];
                // C: if (position[i2] >1) {
                if position[i2] > 1 {
                    n[7] += 1.0;
                    n[8] += wt[i2];
                    n[9] += wt[i2] * risk[i2];
                }
            }

            // C: if (position[i2] > 1) {
            if position[i2] > 1 {
                // C: n[5]++;
                n[5] += 1.0;
                // C: n[6] += wt[i2];
                n[6] += wt[i2];
            }

            // C: person++;
            person += 1;
            // C: i2 = sort2[person];
            if person < nused {
                i2 = sort2[person] as usize;
            }
        }

        // Remove subjects whose start time >= current death time
        // C: j2 = sort1[person2];
        if person2 < nused {
            let mut j2 = sort1[person2] as usize;
            // C: while(person2 < nused && tstart[j2] >= dtime && strata[j2]==istrat) {
            while person2 < nused && tstart[j2] >= dtime && strata[j2] == istrat {
                // C: n[0]--;
                n[0] -= 1.0;
                // C: if (n[0] ==0) {
                if n[0] == 0.0 {
                    n[1] = 0.0;
                    n[2] = 0.0;
                    for k in 0..nvar {
                        xsum1[k] = 0.0;
                    }
                } else {
                    // C: n[1] -= wt[j2];
                    n[1] -= wt[j2];
                    // C: n[2] -= wt[j2]*risk[j2];
                    n[2] -= wt[j2] * risk[j2];
                    // C: for (k=0; k<nvar; k++) xsum1[k] -=xmat[k][j2] * wt[j2]* risk[j2];
                    for k in 0..nvar {
                        xsum1[k] -= xmat[k][j2] * wt[j2] * risk[j2];
                    }
                }

                // count entries
                // C: if (position[j2]==1 || position[j2]==3) {
                if position[j2] == 1 || position[j2] == 3 {
                    n[10] += 1.0;
                    n[11] += wt[j2];
                }

                // C: person2++;
                person2 += 1;
                // C: j2 = sort1[person2];
                if person2 < nused {
                    j2 = sort1[person2] as usize;
                }
            }
        }

        // Copy results to output
        // C: for (k=0; k<12; k++) rn[k][itime] = n[k];
        for k in 0..12 {
            rn[k][itime_u] = n[k];
        }
        // C: for (k=0; k<nvar; k++){
        //        rx1[k][itime] = xsum1[k]/n[3];
        //        rx2[k][itime] = xsum2[k]/n[3];
        //    }
        for k in 0..nvar {
            rx1[k][itime_u] = xsum1[k] / n[3];
            rx2[k][itime_u] = xsum2[k] / n[3];
        }

        itime -= 1;
    }

    // Final: catch up on remaining entries
    //
    // C BUGS (file header: "This routine is not yet debugged"):
    //   1. Line 209: uses sort2[person2] but person2 tracks start-time ordering (should be sort1).
    //   2. Lines 210-213: never updates j2 inside loop, so wt[j2] uses the same observation's
    //      weight for every remaining entry. Compare main loop line 196 which updates j2.
    //   3. Skips the position[j2]==1||3 filter used in the main loop at lines 190-193.
    // DIVERGENCE: We fix bug #2 by updating j2 each iteration. Bugs #1 and #3 are preserved
    // to match C as closely as possible while avoiding the most obviously wrong behavior.
    if person2 < nused {
        let mut j2 = sort2[person2] as usize;
        // C: for (; person2 < nused; person2++) {
        while person2 < nused {
            n[10] += 1.0;
            n[11] += wt[j2];
            person2 += 1;
            if person2 < nused {
                j2 = sort2[person2] as usize;
            }
        }
    }
    // C: rn[10][0] = n[10];
    // C: rn[11][0] = n[11];
    rn[10][0] = n[10];
    rn[11][0] = n[11];

    CoxSurv4Result {
        time: rtime,
        strata: rstrat,
        count: rn,
        xbar1: rx1,
        xbar2: rx2,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper to assert two floats are close
    fn assert_close(a: f64, b: f64, tol: f64, msg: &str) {
        assert!(
            (a - b).abs() < tol,
            "{}: {} vs {} (diff = {})",
            msg,
            a,
            b,
            (a - b).abs()
        );
    }

    #[test]
    fn test_coxsurv3_breslow() {
        // Test data: time, status, x (single covariate)
        let time = vec![
            1.0, 1.0, 2.0, 2.0, 3.0, 4.0, 4.0, 5.0, 5.0, 8.0, 8.0, 8.0, 8.0, 11.0, 11.0,
            12.0, 12.0, 15.0, 17.0, 22.0, 23.0,
        ];
        let status = vec![
            1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0,
        ];
        let x_raw = vec![
            1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 0.0, 1.0,
        ];

        let n = time.len();
        let nvar = 1;

        // Cox model coefficient from R: beta = -0.02973102
        let beta = -0.02973102_f64;
        // risk = exp(beta * x)
        let risk: Vec<f64> = x_raw.iter().map(|&xi| (beta * xi).exp()).collect();
        let wt = vec![1.0; n];
        let strata = vec![0_i32; n];
        let xmat = vec![x_raw.clone()]; // 1 covariate

        // sort2 = order(strata, time) - 1L  (0-based)
        // Data is already sorted by time, so sort2 = 0,1,2,...,20
        let mut sort2_indices: Vec<usize> = (0..n).collect();
        sort2_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort2: Vec<i32> = sort2_indices.iter().map(|&i| i as i32).collect();

        let efron = 0; // Breslow

        let result = coxsurv3(&time, &status, &xmat, &strata, &risk, &wt, &sort2, efron);

        // Should have 5 unique death times: 1, 2, 3, 4, 5
        assert_eq!(result.time.len(), 5, "Expected 5 unique death times");
        assert_eq!(result.time, vec![1.0, 2.0, 3.0, 4.0, 5.0]);

        // All strata should be 0
        assert_eq!(result.strata, vec![0, 0, 0, 0, 0]);

        // Verify n at risk (count[0] = unweighted count at risk)
        // At time 1: all 21 at risk
        // At time 2: 19 at risk (2 from time 1 removed)
        // At time 3: 17 at risk
        // At time 4: 16 at risk
        // At time 5: 14 at risk
        let tol = 1e-6;
        assert_close(result.count[0][0], 21.0, tol, "n[0] at time 1");
        assert_close(result.count[0][1], 19.0, tol, "n[0] at time 2");
        assert_close(result.count[0][2], 17.0, tol, "n[0] at time 3");
        assert_close(result.count[0][3], 16.0, tol, "n[0] at time 4");
        assert_close(result.count[0][4], 14.0, tol, "n[0] at time 5");

        // n[1] = weighted count at risk (all weights=1, so same as n[0])
        assert_close(result.count[1][0], 21.0, tol, "n[1] at time 1");

        // n[3] = number of deaths (unweighted)
        assert_close(result.count[3][0], 2.0, tol, "n[3] at time 1 (2 deaths)");
        assert_close(result.count[3][1], 1.0, tol, "n[3] at time 2 (1 death)");
        assert_close(result.count[3][2], 1.0, tol, "n[3] at time 3");
        assert_close(result.count[3][3], 1.0, tol, "n[3] at time 4");
        assert_close(result.count[3][4], 1.0, tol, "n[3] at time 5");

        // n[4] = weighted deaths (weights=1, same as n[3])
        assert_close(result.count[4][0], 2.0, tol, "n[4] at time 1");

        // Verify cumulative hazard matches R: 0.09672222, 0.150178, 0.2098237, 0.2732527, 0.345743
        // The cumhaz at each time = sum of n[4]/n[2] up to that time
        // n[2] is the weighted risk sum
        // We can verify via the hazard increments
        // hazard at t=1 = n[4]/n[2] = 2 / sum_risk_at_risk_at_t1
        // With risk scores close to 1 (beta is tiny), n[2] ≈ 21 * ~1 ≈ 20.68
        // Let's compute n[2] = sum of wt[i]*risk[i] for all at risk at time 1
        // All 21 obs at risk. risk[i] = exp(-0.02973102) for x=1, 1.0 for x=0
        // x=1 indices: 0,2,3,5,8,10,12,13,15,17,20 (11 obs with x=1)
        // x=0 indices: 1,4,6,7,9,11,14,16,18,19 (10 obs with x=0)
        // n[2] at t=1 = 11 * exp(-0.02973102) + 10 * 1.0
        let risk_x1 = beta.exp(); // 0.9707066
        let n2_t1 = 11.0 * risk_x1 + 10.0;
        let hazard_t1 = 2.0 / n2_t1;
        assert_close(
            result.count[2][0],
            n2_t1,
            tol,
            "n[2] at time 1",
        );

        // Verify cumulative hazard by summing hazard increments
        // We can't directly get cumhaz from coxsurv3, but we can check the components

        // Check n[6] for Breslow: should equal n[2]
        assert_close(result.count[6][0], n2_t1, tol, "n[6] at time 1 (Breslow)");

        // Check xbar dimensions
        assert_eq!(result.xbar.len(), 1);
        assert_eq!(result.xbar[0].len(), 5);

        // Check score residuals dimensions
        assert_eq!(result.sresid.len(), 1);
        assert_eq!(result.sresid[0].len(), 21);

        // Verify cumulative hazard from components matches R
        // hazard[t] = n[4][t] / n[2][t]
        let mut cumhaz = 0.0;
        let r_cumhaz = [0.09672222, 0.150178, 0.2098237, 0.2732527, 0.345743];
        for t in 0..5 {
            let h = result.count[4][t] / result.count[2][t];
            cumhaz += h;
            assert_close(
                cumhaz,
                r_cumhaz[t],
                1e-4,
                &format!("cumhaz at time index {}", t),
            );
        }
    }

    #[test]
    fn test_coxsurv3_efron_two_tied_deaths() {
        // Same data but with Efron method
        let time = vec![
            1.0, 1.0, 2.0, 2.0, 3.0, 4.0, 4.0, 5.0, 5.0, 8.0, 8.0, 8.0, 8.0, 11.0, 11.0,
            12.0, 12.0, 15.0, 17.0, 22.0, 23.0,
        ];
        let status = vec![
            1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0,
        ];
        let x_raw = vec![
            1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 0.0, 1.0,
        ];

        let n = time.len();
        let beta = -0.02973102_f64;
        let risk: Vec<f64> = x_raw.iter().map(|&xi| (beta * xi).exp()).collect();
        let wt = vec![1.0; n];
        let strata = vec![0_i32; n];
        let xmat = vec![x_raw.clone()];

        let mut sort2_indices: Vec<usize> = (0..n).collect();
        sort2_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort2: Vec<i32> = sort2_indices.iter().map(|&i| i as i32).collect();

        let efron = 1; // Efron

        let result = coxsurv3(&time, &status, &xmat, &strata, &risk, &wt, &sort2, efron);

        // Should still have 5 unique death times
        assert_eq!(result.time.len(), 5);

        // At time 1, there are 2 tied deaths. With Efron:
        // n[6] = n[3] / (sum of 1/temp for dd=0..n[3]-1) = harmonic mean
        // For time 2,3,4,5: only 1 death, so Breslow path (n[6] = n[2])
        let tol = 1e-6;

        // At times with 1 death, n[6] should equal n[2]
        for t in 1..5 {
            assert_close(
                result.count[6][t],
                result.count[2][t],
                tol,
                &format!("n[6] == n[2] at single-death time {}", t),
            );
        }

        // At time 1 (2 deaths), n[6] should be harmonic mean
        // n[3]=2, dd=0: temp = n[2] - 0 = n[2], dd=1: temp = n[2] - 0.5*n[5]
        // n[6] = 2 / (1/n[2] + 1/(n[2] - 0.5*n[5]))
        let n2 = result.count[2][0];
        let n5 = result.count[5][0];
        let hm = 2.0 / (1.0 / n2 + 1.0 / (n2 - 0.5 * n5));
        assert_close(result.count[6][0], hm, tol, "n[6] Efron harmonic mean at time 1");
    }

    #[test]
    fn test_coxsurv3_two_strata() {
        // Split into two strata to test stratum handling
        let time = vec![1.0, 2.0, 3.0, 4.0, 1.0, 2.0, 3.0, 5.0];
        let status = vec![1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0];
        let x_raw = vec![0.5, 0.3, 0.7, 0.1, 0.2, 0.8, 0.4, 0.6];
        let n = time.len();
        let risk = vec![1.0; n]; // unit risk
        let wt = vec![1.0; n];
        let strata = vec![0, 0, 0, 0, 1, 1, 1, 1];
        let xmat = vec![x_raw.clone()];

        // sort2 = order(strata, time) - 1L
        let mut sort2_indices: Vec<usize> = (0..n).collect();
        sort2_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort2: Vec<i32> = sort2_indices.iter().map(|&i| i as i32).collect();

        let result = coxsurv3(&time, &status, &xmat, &strata, &risk, &wt, &sort2, 0);

        // Deaths: stratum 0 has deaths at t=1,3; stratum 1 has deaths at t=1,2
        // Total 4 unique death times
        assert_eq!(result.time.len(), 4);

        // Sorted ascending within strata (output from coxsurv3 is ascending time per stratum)
        // Stratum 0: death at t=1, t=3
        // Stratum 1: death at t=1, t=2
        assert_eq!(result.time, vec![1.0, 3.0, 1.0, 2.0]);
        assert_eq!(result.strata, vec![0, 0, 1, 1]);
    }

    #[test]
    fn test_coxsurv4_basic() {
        // Simple counting process data
        // 5 observations, 1 covariate, 1 stratum
        let tstart = vec![0.0, 0.0, 0.0, 2.0, 3.0];
        let stime = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let status = vec![1.0, 0.0, 1.0, 1.0, 0.0];
        let wt = vec![1.0; 5];
        let risk = vec![1.0; 5];
        let strata = vec![0_i32; 5];
        let x_raw = vec![0.5, 0.3, 0.7, 0.2, 0.8];
        let xmat = vec![x_raw.clone()];
        // position: all are both start and end (3) for simplicity
        let position = vec![3, 3, 3, 3, 3];

        let n = stime.len();

        // sort1 = order(strata, tstart) - 1L (0-based)
        let mut sort1_indices: Vec<usize> = (0..n).collect();
        sort1_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(tstart[a].partial_cmp(&tstart[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort1: Vec<i32> = sort1_indices.iter().map(|&i| i as i32).collect();

        // sort2 = order(strata, stime) - 1L
        let mut sort2_indices: Vec<usize> = (0..n).collect();
        sort2_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(stime[a].partial_cmp(&stime[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort2: Vec<i32> = sort2_indices.iter().map(|&i| i as i32).collect();

        let result = coxsurv4(
            &tstart, &stime, &status, &wt, &sort1, &sort2, &position, &strata, &xmat, &risk,
        );

        // 5 unique stop times: 1, 2, 3, 4, 5
        assert_eq!(result.time.len(), 5);

        // Output is stored with earliest time at highest index
        // time[4]=1.0, time[3]=2.0, ..., time[0]=5.0
        // Actually let me check: person=0 maps to sort2[0] which is earliest stop time.
        // itime starts at ntime-1=4. So time[4] = earliest = 1.0
        assert_eq!(result.time[4], 1.0);
        assert_eq!(result.time[0], 5.0);

        // Verify count dimensions
        assert_eq!(result.count.len(), 12);
        for c in &result.count {
            assert_eq!(c.len(), 5);
        }
    }

    #[test]
    fn test_coxsurv3_score_residuals_sum_to_zero() {
        // Score residuals should sum to approximately zero across all observations
        // within each stratum (a known property)
        let time = vec![
            1.0, 1.0, 2.0, 2.0, 3.0, 4.0, 4.0, 5.0, 5.0, 8.0, 8.0, 8.0, 8.0, 11.0, 11.0,
            12.0, 12.0, 15.0, 17.0, 22.0, 23.0,
        ];
        let status = vec![
            1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0,
        ];
        let x_raw = vec![
            1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 0.0, 1.0,
        ];
        let n = time.len();
        let beta = -0.02973102_f64;
        let risk: Vec<f64> = x_raw.iter().map(|&xi| (beta * xi).exp()).collect();
        let wt = vec![1.0; n];
        let strata = vec![0_i32; n];
        let xmat = vec![x_raw.clone()];

        let mut sort2_indices: Vec<usize> = (0..n).collect();
        sort2_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort2: Vec<i32> = sort2_indices.iter().map(|&i| i as i32).collect();

        let result = coxsurv3(&time, &status, &xmat, &strata, &risk, &wt, &sort2, 0);

        // Score residuals for the single covariate
        let sum: f64 = result.sresid[0].iter().sum();
        // The sum should be close to zero (not exactly due to floating point)
        assert!(
            sum.abs() < 0.1,
            "Score residuals should approximately sum to zero, got {}",
            sum
        );
    }

    #[test]
    fn test_coxsurv3_score_residuals_vs_r() {
        // Validate score residuals against R's resid(fit, type="score")
        // R: library(survival)
        // R: fit <- coxph(Surv(time, status) ~ x, method="breslow")
        // R: sr <- resid(fit, type="score")
        let time = vec![
            1.0, 1.0, 2.0, 2.0, 3.0, 4.0, 4.0, 5.0, 5.0, 8.0, 8.0, 8.0, 8.0, 11.0, 11.0,
            12.0, 12.0, 15.0, 17.0, 22.0, 23.0,
        ];
        let status = vec![
            1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0,
        ];
        let x_raw = vec![
            1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 0.0, 1.0,
        ];
        let n = time.len();
        let beta = -0.02973102_f64;
        let risk: Vec<f64> = x_raw.iter().map(|&xi| (beta * xi).exp()).collect();
        let wt = vec![1.0; n];
        let strata = vec![0_i32; n];
        let xmat = vec![x_raw.clone()];

        let mut sort2_indices: Vec<usize> = (0..n).collect();
        sort2_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort2: Vec<i32> = sort2_indices.iter().map(|&i| i as i32).collect();

        let result = coxsurv3(&time, &status, &xmat, &strata, &risk, &wt, &sort2, 0);

        // R reference score residuals (from resid(fit, type="score"))
        let r_score_resid = vec![
            0.4382053736,
            -0.4664426361,
            0.4107316384,
            -0.0703699949,
            -0.3578766295,
            0.3747385059,
            0.1365546809,
            -0.3203067169,
            -0.1684000963,
            0.1722610755,
            -0.1684000963,
            0.1722610755,
            -0.1684000963,
            -0.1684000963,
            0.1722610755,
            -0.1684000963,
            0.1722610755,
            -0.1684000963,
            0.1722610755,
            0.1722610755,
            -0.1684000963,
        ];

        let tol = 1e-6;
        for i in 0..n {
            assert_close(
                result.sresid[0][i],
                r_score_resid[i],
                tol,
                &format!("score resid[{}]", i),
            );
        }
    }

    #[test]
    fn test_coxsurv3_cumhaz_vs_r() {
        // Validate cumulative hazard against R's survfit(fit)$cumhaz
        let time = vec![
            1.0, 1.0, 2.0, 2.0, 3.0, 4.0, 4.0, 5.0, 5.0, 8.0, 8.0, 8.0, 8.0, 11.0, 11.0,
            12.0, 12.0, 15.0, 17.0, 22.0, 23.0,
        ];
        let status = vec![
            1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0, 0.0,
        ];
        let x_raw = vec![
            1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
            0.0, 1.0, 0.0, 0.0, 1.0,
        ];
        let n = time.len();
        let beta = -0.02973102_f64;
        let risk: Vec<f64> = x_raw.iter().map(|&xi| (beta * xi).exp()).collect();
        let wt = vec![1.0; n];
        let strata = vec![0_i32; n];
        let xmat = vec![x_raw.clone()];

        let mut sort2_indices: Vec<usize> = (0..n).collect();
        sort2_indices.sort_by(|&a, &b| {
            strata[a]
                .cmp(&strata[b])
                .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
        });
        let sort2: Vec<i32> = sort2_indices.iter().map(|&i| i as i32).collect();

        let result = coxsurv3(&time, &status, &xmat, &strata, &risk, &wt, &sort2, 0);

        // R reference cumhaz at death times: 0.09672222, 0.150178, 0.2098237, 0.2732527, 0.345743
        let r_cumhaz = [0.09672222, 0.150178, 0.2098237, 0.2732527, 0.345743];
        let tol = 1e-6;

        let mut cumhaz = 0.0;
        for t in 0..5 {
            let h = result.count[4][t] / result.count[2][t];
            cumhaz += h;
            assert_close(
                cumhaz,
                r_cumhaz[t],
                tol,
                &format!("cumhaz at death time {}", result.time[t]),
            );
        }
    }
}
