//! Multistate baseline hazard computation for Cox models
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/coxsurv1.c` (time, status)
//! `survival-ref/survival-master/src/coxsurv2.c` (time1, time2, status)
//!
//! These are the multistate versions of coxsurv3/coxsurv4. They handle stacked
//! data with multiple transitions. Output is a matrix with `ntime * ntrans` rows.

/// Result from coxsurv1 (multistate, right-censored).
///
/// All output matrices are stored in column-major order with `ntime * ntrans` rows.
/// Rows are filled from the end (last transition, last time point first).
pub struct CoxSurv1Result {
    /// Number of transitions detected
    pub ntrans: usize,
    /// Count matrix: `ntime * ntrans` rows x 10 columns (column-major)
    /// Columns: n0-n2 (at-risk: w1,w2,w3), n3-n5 (events: w1,w2,w3),
    ///          n6-n7 (censored: w1,w2), n8-n9 (Efron at-risk)
    pub count: Vec<f64>,
    /// Weighted mean covariates for at-risk set: `ntime * ntrans` rows x nvar columns (column-major)
    /// xbar[k][irow] = xsum1[k] / n[3]  (divided by number of events, not at-risk count)
    pub xbar: Vec<f64>,
    /// Weighted covariate sum for events: `ntime * ntrans` rows x nvar columns (column-major)
    pub xsum2: Vec<f64>,
}

/// Multistate baseline hazard for (time, status) data.
///
/// Direct port of `coxsurv1()` from `survival-ref/survival-master/src/coxsurv1.c`.
///
/// # Arguments
///
/// * `otime` - Output times (event times to report at)
/// * `tstop` - Stop times for each observation (from y[,1])
/// * `status` - Event status for each observation (from y[,2])
/// * `weight` - Observation weights
/// * `sort2` - Sort index for stop time (0-based), sorted by (transition, tstop)
/// * `trans` - Transition indicator for each observation (stacked: all trans 1 first, then trans 2, etc.)
/// * `xmat` - Covariate matrix in column-major order: xmat[k * nused + i] for obs i, covariate k
/// * `risk` - Risk scores (exp(linear predictor))
/// * `nvar` - Number of covariates
///
/// # Returns
///
/// `CoxSurv1Result` with count matrix (10 cols), xbar, and xsum2.
#[allow(dead_code)]
pub(crate) fn coxsurv1(
    otime: &[f64],
    tstop: &[f64],
    status: &[f64],
    weight: &[f64],
    sort2: &[i32],
    trans: &[i32],
    xmat: &[f64],
    risk: &[f64],
    nvar: usize,
) -> CoxSurv1Result {
    let nused = tstop.len();
    let ntime = otime.len();

    // Pass 1: count number of transitions
    // Data is sorted by time within trans (via sort2)
    let mut itrans = trans[0];
    let mut ntrans: usize = 1;
    for i in 1..nused {
        let i2 = sort2[i] as usize;
        if trans[i2] != itrans {
            ntrans += 1;
            itrans = trans[i2];
        }
    }

    // Allocate working vectors
    let mut xsum1 = vec![0.0_f64; nvar];
    let mut xsum2_work = vec![0.0_f64; nvar];

    // Allocate output: ntime*ntrans rows
    let irow_total = ntime * ntrans;
    // count: irow_total rows x 10 columns, column-major
    let mut rn = vec![0.0_f64; irow_total * 10];
    // xbar: irow_total rows x nvar columns, column-major
    let mut rx1 = vec![0.0_f64; irow_total * nvar];
    // xsum2 output: irow_total rows x nvar columns, column-major
    let mut rx2 = vec![0.0_f64; irow_total * nvar];

    let mut n = [0.0_f64; 12];

    // Main loop: backwards in time
    // person2 is a position in the sort2 array
    let mut person2: i64 = nused as i64 - 1;
    let mut irow: i64 = (ntime * ntrans) as i64;

    for _ii in 0..ntrans {
        let itrans_val = trans[sort2[person2 as usize] as usize];

        // Zero n[0..9] at start of each transition
        for k in 0..10 {
            n[k] = 0.0;
        }
        for k in 0..nvar {
            xsum1[k] = 0.0;
            xsum2_work[k] = 0.0;
        }

        for jj in (0..ntime).rev() {
            let dtime = otime[jj];
            // Zero per-interval counts: n[3..7]
            for k in 3..8 {
                n[k] = 0.0;
            }

            // Step 1: walk backward through observations with tstop >= dtime
            while person2 >= 0 && trans[person2 as usize] == itrans_val {
                let i2 = sort2[person2 as usize] as usize;
                if tstop[i2] < dtime {
                    break;
                }
                // Add to risk set
                n[0] += 1.0;
                n[1] += weight[i2];
                n[2] += weight[i2] * risk[i2];
                for k in 0..nvar {
                    xsum1[k] += weight[i2] * risk[i2] * xmat[k * nused + i2];
                }

                if status[i2] == 0.0 {
                    // Count as censor
                    n[6] += 1.0;
                    n[7] += weight[i2];
                } else if tstop[i2] == dtime {
                    // Step 2: events at this time
                    n[3] += 1.0;
                    n[4] += weight[i2];
                    n[5] += weight[i2] * risk[i2];
                    for k in 0..nvar {
                        xsum2_work[k] += weight[i2] * risk[i2] * xmat[k * nused + i2];
                    }
                }
                person2 -= 1;
            }

            // Compute the Efron number at risk
            if n[3] <= 1.0 {
                // Only one event (or zero)
                n[8] = n[2];
                n[9] = n[2] * n[2];
            } else {
                let meanwt = n[5] / (n[3] * n[3]); // average weight of deaths / n
                let nd = n[3] as i32;
                for k in 0..nd {
                    n[8] += n[2] - k as f64 * meanwt;
                    n[9] += (n[2] - k as f64 * meanwt) * (n[2] - k as f64 * meanwt);
                }
                n[8] /= n[3];
                n[9] /= n[3];
            }

            // Save the results
            irow -= 1;
            debug_assert!(irow >= 0, "irow error in coxsurv1");
            let ir = irow as usize;
            for k in 0..10 {
                rn[k * irow_total + ir] = n[k];
            }
            for k in 0..nvar {
                if n[0] == 0.0 {
                    rx1[k * irow_total + ir] = 0.0;
                } else {
                    rx1[k * irow_total + ir] = xsum1[k] / n[3];
                }
                rx2[k * irow_total + ir] = xsum2_work[k];
            }
        } // end of time points

        // Walk past any data after the last selected time point
        while person2 >= 0 && trans[person2 as usize] == itrans_val {
            person2 -= 1;
        }
    }

    CoxSurv1Result {
        ntrans,
        count: rn,
        xbar: rx1,
        xsum2: rx2,
    }
}

/// Result from coxsurv2 (multistate, counting process).
///
/// All output matrices are stored in column-major order with `ntime * ntrans` rows.
pub struct CoxSurv2Result {
    /// Number of transitions detected
    pub ntrans: usize,
    /// Count matrix: `ntime * ntrans` rows x 12 columns (column-major)
    /// Columns: n0-n2 (at-risk: w1,w2,w3), n3-n5 (events: w1,w2,w3),
    ///          n6-n7 (censored endpoints: w1,w2), n8-n9 (Efron sums),
    ///          n10-n11 (censored counts: w1,w2)
    pub count: Vec<f64>,
    /// Weighted mean covariates: `ntime * ntrans` rows x nvar columns (column-major)
    pub xbar: Vec<f64>,
    /// Weighted covariate sum for events: `ntime * ntrans` rows x nvar columns (column-major)
    pub xsum2: Vec<f64>,
}

/// Multistate baseline hazard for (time1, time2, status) counting process data.
///
/// Direct port of `coxsurv2()` from `survival-ref/survival-master/src/coxsurv2.c`.
///
/// # Arguments
///
/// * `otime` - Output times (event times to report at)
/// * `tstart` - Start times for each observation (from y[,1])
/// * `tstop` - Stop times for each observation (from y[,2])
/// * `status` - Event status for each observation (from y[,3])
/// * `weight` - Observation weights
/// * `sort1` - Sort index for start time (0-based), sorted by (transition, tstart)
/// * `sort2` - Sort index for stop time (0-based), sorted by (transition, tstop)
/// * `sindex` - Position indicator: 1=start of sequence, 2=end, 3=both, 0=middle
/// * `trans` - Transition indicator for each observation
/// * `xmat` - Covariate matrix in column-major order: xmat[k * nused + i]
/// * `risk` - Risk scores (exp(linear predictor))
/// * `nvar` - Number of covariates
///
/// # Returns
///
/// `CoxSurv2Result` with count matrix (12 cols), xbar, and xsum2.
#[allow(dead_code)]
pub(crate) fn coxsurv2(
    otime: &[f64],
    tstart: &[f64],
    tstop: &[f64],
    status: &[f64],
    weight: &[f64],
    sort1: &[i32],
    sort2: &[i32],
    sindex: &[i32],
    trans: &[i32],
    xmat: &[f64],
    risk: &[f64],
    nvar: usize,
) -> CoxSurv2Result {
    let nused = tstop.len();
    let ntime = otime.len();

    // Pass 1: count number of transitions
    let mut itrans = trans[0];
    let mut ntrans: usize = 1;
    for i in 1..nused {
        let i2 = sort2[i] as usize;
        if trans[i2] != itrans {
            ntrans += 1;
            itrans = trans[i2];
        }
    }

    // Allocate working vectors
    let mut xsum1 = vec![0.0_f64; nvar];
    let mut xsum2_work = vec![0.0_f64; nvar];
    let mut atrisk = vec![0_i32; nused];

    // Allocate output: ntime*ntrans rows
    let irow_total = ntime * ntrans;
    let mut rn = vec![0.0_f64; irow_total * 12];
    let mut rx1 = vec![0.0_f64; irow_total * nvar];
    let mut rx2 = vec![0.0_f64; irow_total * nvar];

    let mut n = [0.0_f64; 12];

    // Main loop: backwards in time
    let mut person1: i64 = nused as i64 - 1;
    let mut person2: i64 = nused as i64 - 1;
    let mut irow: i64 = (ntime * ntrans) as i64;

    for _ii in 0..ntrans {
        let itrans_val = trans[sort2[person2 as usize] as usize];

        // Zero n[0..2] at start of each transition
        for k in 0..3 {
            n[k] = 0.0;
        }
        for k in 0..nvar {
            xsum1[k] = 0.0;
            xsum2_work[k] = 0.0;
        }

        for jj in (0..ntime).rev() {
            let dtime = otime[jj];
            // Zero per-interval counts: n[3..11]
            for k in 3..12 {
                n[k] = 0.0;
            }

            // Step 1: walk backward through observations with tstop >= dtime
            while person2 >= 0 && trans[person2 as usize] == itrans_val {
                let i2 = sort2[person2 as usize] as usize;
                if tstop[i2] < dtime {
                    break;
                }
                if tstart[i2] < dtime {
                    // Add them to the risk set
                    atrisk[i2] = 1;
                    n[0] += 1.0;
                    n[1] += weight[i2];
                    n[2] += weight[i2] * risk[i2];
                    for k in 0..nvar {
                        xsum1[k] += weight[i2] * risk[i2] * xmat[k * nused + i2];
                    }

                    if sindex[i2] > 1 && status[i2] == 0.0 {
                        // Count them as a 'censor'
                        n[10] += 1.0;
                        n[11] += weight[i2];
                    }
                }

                if tstop[i2] == dtime && status[i2] > 0.0 {
                    // Step 2: events at this time (tstart < tstop BTW)
                    n[3] += 1.0;
                    n[4] += weight[i2];
                    n[5] += weight[i2] * risk[i2];
                    for k in 0..nvar {
                        xsum2_work[k] += weight[i2] * risk[i2] * xmat[k * nused + i2];
                    }
                    if sindex[i2] > 1 {
                        n[6] += 1.0;
                        n[7] += weight[i2];
                    }
                }
                person2 -= 1;
            }

            // Step 3: remove observations whose start time >= dtime
            while person1 >= 0 && trans[person1 as usize] == itrans_val {
                let i1 = sort1[person1 as usize] as usize;
                if tstart[i1] < dtime {
                    break;
                }
                if atrisk[i1] != 0 {
                    // Remove from risk set
                    n[0] -= 1.0;
                    if n[0] == 0.0 {
                        n[1] = 0.0;
                        n[2] = 0.0;
                        for k in 0..nvar {
                            xsum1[k] = 0.0;
                        }
                    } else {
                        n[1] -= weight[i1];
                        n[2] -= weight[i1] * risk[i1];
                        for k in 0..nvar {
                            xsum1[k] -= xmat[k * nused + i1] * weight[i1] * risk[i1];
                        }
                    }
                }
                person1 -= 1;
            }

            // Compute the Efron number at risk
            if n[3] <= 1.0 {
                // Only one event (or zero)
                n[8] = n[2];
                n[9] = n[2] * n[2];
            } else {
                let meanwt = n[5] / (n[3] * n[3]); // average weight of deaths / n
                let nd = n[3] as i32;
                for k in 0..nd {
                    n[8] += n[2] - k as f64 * meanwt;
                    n[9] += (n[2] - k as f64 * meanwt) * (n[2] - k as f64 * meanwt);
                }
                n[8] /= n[3];
                n[9] /= n[3];
            }

            // Save the results
            irow -= 1;
            debug_assert!(irow >= 0, "irow error in coxsurv2");
            let ir = irow as usize;
            for k in 0..12 {
                rn[k * irow_total + ir] = n[k];
            }
            for k in 0..nvar {
                if n[0] == 0.0 {
                    rx1[k * irow_total + ir] = 0.0;
                } else {
                    rx1[k * irow_total + ir] = xsum1[k] / n[3];
                }
                rx2[k * irow_total + ir] = xsum2_work[k];
            }
        } // end of time points

        // Walk past any data after the last selected time point
        while person2 >= 0 && trans[person2 as usize] == itrans_val {
            person2 -= 1;
        }
        while person1 >= 0 && trans[person1 as usize] == itrans_val {
            person1 -= 1;
        }
    }

    CoxSurv2Result {
        ntrans,
        count: rn,
        xbar: rx1,
        xsum2: rx2,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper to extract a value from a column-major matrix
    fn cm_get(data: &[f64], nrows: usize, row: usize, col: usize) -> f64 {
        data[col * nrows + row]
    }

    #[test]
    fn test_coxsurv1_basic_two_transitions() {
        // Two transitions, 3 obs each, stacked:
        //   Trans 1 (indices 0,1,2): times 1,3,5; status 1,0,1
        //   Trans 2 (indices 3,4,5): times 2,4,6; status 1,1,0
        // sort2 sorts by (trans, tstop ascending)
        // Stacked data order already matches trans grouping.

        let tstop = vec![1.0, 3.0, 5.0, 2.0, 4.0, 6.0];
        let status = vec![1.0, 0.0, 1.0, 1.0, 1.0, 0.0];
        let weight = vec![1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
        let risk = vec![1.0, 1.5, 2.0, 1.0, 1.5, 2.0];
        let trans = vec![0, 0, 0, 1, 1, 1];

        // sort2: sorted by (trans, tstop ascending) => indices [0,1,2, 3,4,5]
        // Since data is already in order within each transition
        let sort2 = vec![0, 1, 2, 3, 4, 5];

        // 1 covariate: x = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6]
        let xmat = vec![0.1, 0.2, 0.3, 0.4, 0.5, 0.6]; // column-major, nvar=1
        let nvar = 1_usize;

        // Output times: report at times 1, 3, 5 (all possible times)
        let otime = vec![1.0, 3.0, 5.0];
        let ntime = otime.len();

        let result = coxsurv1(&otime, &tstop, &status, &weight, &sort2, &trans, &xmat, &risk, nvar);

        assert_eq!(result.ntrans, 2);
        // Output has ntime * ntrans = 3 * 2 = 6 rows
        let nrows = ntime * result.ntrans;
        assert_eq!(nrows, 6);

        // The output is filled from the end:
        // Row 5: trans 2, time 5 (jj=2, first processed for trans 2)
        // Row 4: trans 2, time 3
        // Row 3: trans 2, time 1
        // Row 2: trans 1, time 5
        // Row 1: trans 1, time 3
        // Row 0: trans 1, time 1

        // Wait, the outer loop goes ii=0..ntrans, and picks itrans from
        // sort2[person2] which starts at nused-1=5 => trans[sort2[5]]=trans[5]=1.
        // So ii=0 processes transition 1 (value=1), ii=1 processes transition 0 (value=0).
        // Within each transition, jj goes from ntime-1=2 down to 0.
        // irow starts at 6, decrements:
        //   ii=0 (trans=1): jj=2 -> irow=5, jj=1 -> irow=4, jj=0 -> irow=3
        //   ii=1 (trans=0): jj=2 -> irow=2, jj=1 -> irow=1, jj=0 -> irow=0

        // For trans=1 (indices 3,4,5), person2 walks backward from 5:
        //   sort2[5]=5, sort2[4]=4, sort2[3]=3
        //   tstop = [2.0, 4.0, 6.0], status = [1,1,0], risk = [1.0,1.5,2.0]

        // jj=2, dtime=5.0:
        //   person2=5: i2=5, tstop[5]=6.0 >= 5.0: add to risk. n[0]=1,n[1]=1,n[2]=2.0
        //     status[5]=0 => censor: n[6]=1, n[7]=1.0
        //   person2=4: i2=4, tstop[4]=4.0 < 5.0 => break
        //   Efron: n[3]=0 <= 1 => n[8]=n[2]=2.0, n[9]=4.0
        //   irow=5: n = [1,1,2, 0,0,0, 1,1, 2,4]

        assert!((cm_get(&result.count, nrows, 5, 0) - 1.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 5, 2) - 2.0).abs() < 1e-10); // n[2]
        assert!((cm_get(&result.count, nrows, 5, 3) - 0.0).abs() < 1e-10); // n[3] = 0
        assert!((cm_get(&result.count, nrows, 5, 6) - 1.0).abs() < 1e-10); // n[6]
        assert!((cm_get(&result.count, nrows, 5, 8) - 2.0).abs() < 1e-10); // n[8]

        // jj=1, dtime=3.0:
        //   n[3..7] zeroed. n[0]=1,n[1]=1,n[2]=2.0 still from before.
        //   person2=4: i2=4, tstop[4]=4.0 >= 3.0: add to risk. n[0]=2,n[1]=2,n[2]=3.5
        //     status[4]=1 and tstop[4]=4.0 != 3.0 => not an event at this time, not a censor
        //     Actually status[4]=1.0 is an event, but tstop[4]=4.0 != dtime=3.0, and status!=0
        //     So neither branch taken for n[6]/n[3].
        //   person2=3: i2=3, tstop[3]=2.0 < 3.0 => break
        //   Efron: n[3]=0 <= 1 => n[8]=3.5, n[9]=12.25
        //   irow=4: n = [2,2,3.5, 0,0,0, 0,0, 3.5,12.25]

        assert!((cm_get(&result.count, nrows, 4, 0) - 2.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 4, 2) - 3.5).abs() < 1e-10); // n[2]
        assert!((cm_get(&result.count, nrows, 4, 8) - 3.5).abs() < 1e-10); // n[8]
    }

    #[test]
    fn test_coxsurv1_with_events() {
        // Simple case: 1 transition, 3 obs, events at times that match otime
        let tstop = vec![2.0, 4.0, 6.0];
        let status = vec![1.0, 1.0, 1.0];
        let weight = vec![1.0, 1.0, 1.0];
        let risk = vec![1.0, 1.0, 1.0];
        let trans = vec![0, 0, 0];
        let sort2 = vec![0, 1, 2]; // already sorted by tstop
        let xmat = vec![1.0, 2.0, 3.0]; // 1 covariate
        let nvar = 1_usize;

        // Output at the event times
        let otime = vec![2.0, 4.0, 6.0];

        let result = coxsurv1(&otime, &tstop, &status, &weight, &sort2, &trans, &xmat, &risk, nvar);

        assert_eq!(result.ntrans, 1);
        let nrows = otime.len() * result.ntrans;

        // Walking backward:
        // jj=2, dtime=6.0:
        //   person2=2: i2=2, tstop=6.0>=6.0, add: n[0]=1,n[1]=1,n[2]=1
        //     status=1, tstop==dtime: n[3]=1,n[4]=1,n[5]=1
        //   person2=1: i2=1, tstop=4.0 < 6.0 => break
        //   Efron: n[3]=1: n[8]=1, n[9]=1
        //   xbar = xsum1/n[3] = 3.0/1 = 3.0
        //   xsum2 = 3.0

        assert!((cm_get(&result.count, nrows, 2, 0) - 1.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 2, 3) - 1.0).abs() < 1e-10); // n[3]
        assert!((cm_get(&result.xbar, nrows, 2, 0) - 3.0).abs() < 1e-10);
        assert!((cm_get(&result.xsum2, nrows, 2, 0) - 3.0).abs() < 1e-10);

        // jj=1, dtime=4.0:
        //   n[3..7] zeroed. n[0]=1,n[1]=1,n[2]=1 still.
        //   person2=1: i2=1, tstop=4.0>=4.0, add: n[0]=2,n[1]=2,n[2]=2
        //     status=1, tstop==dtime: n[3]=1,n[4]=1,n[5]=1
        //   person2=0: i2=0, tstop=2.0 < 4.0 => break
        //   xsum1 = 3+2 = 5 (accumulated). xsum2_work = 3+2 = 5? No...
        //   Wait, xsum2_work is never reset between time points! Let me check the C code.
        //   In C: xsum2 is allocated once and used as a running sum. It is never zeroed
        //   between time points. So it accumulates.
        //   xsum2_work after jj=2: 3.0 (from obs 2)
        //   jj=1: xsum2_work += 2.0 = 5.0
        //   rx2 = xsum2_work = 5.0
        //   xbar = xsum1/n[3] = 5.0/1 = 5.0

        assert!((cm_get(&result.count, nrows, 1, 0) - 2.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 1, 3) - 1.0).abs() < 1e-10); // n[3]
        assert!((cm_get(&result.xbar, nrows, 1, 0) - 5.0).abs() < 1e-10);
        assert!((cm_get(&result.xsum2, nrows, 1, 0) - 5.0).abs() < 1e-10);

        // jj=0, dtime=2.0:
        //   person2=0: i2=0, tstop=2.0>=2.0, add: n[0]=3,n[1]=3,n[2]=3
        //     status=1, tstop==dtime: n[3]=1,n[4]=1,n[5]=1
        //   Efron: n[3]=1: n[8]=3, n[9]=9
        //   xsum1 = 5+1 = 6. xsum2_work = 5+1 = 6.
        //   xbar = 6.0/1 = 6.0

        assert!((cm_get(&result.count, nrows, 0, 0) - 3.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 0, 2) - 3.0).abs() < 1e-10); // n[2]
        assert!((cm_get(&result.count, nrows, 0, 8) - 3.0).abs() < 1e-10); // n[8]
        assert!((cm_get(&result.xbar, nrows, 0, 0) - 6.0).abs() < 1e-10);
    }

    #[test]
    fn test_coxsurv1_tied_deaths_efron() {
        // 2 events at the same time to trigger Efron path
        let tstop = vec![3.0, 3.0, 5.0];
        let status = vec![1.0, 1.0, 0.0];
        let weight = vec![1.0, 1.0, 1.0];
        let risk = vec![1.0, 2.0, 1.5];
        let trans = vec![0, 0, 0];
        let sort2 = vec![0, 1, 2]; // sorted by tstop
        let xmat: Vec<f64> = vec![]; // nvar=0
        let nvar = 0_usize;

        let otime = vec![3.0, 5.0];

        let result = coxsurv1(&otime, &tstop, &status, &weight, &sort2, &trans, &xmat, &risk, nvar);

        let nrows = otime.len() * result.ntrans;

        // jj=1, dtime=5.0:
        //   person2=2: i2=2, tstop=5.0>=5.0: n[0]=1,n[1]=1,n[2]=1.5
        //     status=0 => censor: n[6]=1,n[7]=1
        //   person2=1: i2=1, tstop=3.0 < 5.0 => break
        //   Efron: n[3]=0 => n[8]=1.5, n[9]=2.25
        //   irow=1

        assert!((cm_get(&result.count, nrows, 1, 0) - 1.0).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 1, 2) - 1.5).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 1, 8) - 1.5).abs() < 1e-10);

        // jj=0, dtime=3.0:
        //   person2=1: i2=1, tstop=3.0>=3.0: n[0]=2,n[1]=2,n[2]=3.5
        //     status=1, tstop==3.0: n[3]=1,n[4]=1,n[5]=2.0
        //   person2=0: i2=0, tstop=3.0>=3.0: n[0]=3,n[1]=3,n[2]=4.5
        //     status=1, tstop==3.0: n[3]=2,n[4]=2,n[5]=3.0
        //   person2=-1: break
        //   Efron: n[3]=2 > 1
        //     meanwt = n[5]/(n[3]*n[3]) = 3.0/4 = 0.75
        //     k=0: n[8] += 4.5 - 0*0.75 = 4.5; n[9] += 20.25
        //     k=1: n[8] += 4.5 - 0.75 = 3.75; n[9] += 14.0625
        //     n[8] = (4.5+3.75)/2 = 4.125; n[9] = (20.25+14.0625)/2 = 17.15625

        assert!((cm_get(&result.count, nrows, 0, 0) - 3.0).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 0, 3) - 2.0).abs() < 1e-10);
        // n[8] and n[9] are NOT zeroed between time points in coxsurv1 (faithful port).
        // At jj=1: n[8]=1.5 (assignment), n[9]=2.25 (assignment)
        // At jj=0: n[3]=2>1, so n[8] += from previous value 1.5:
        //   meanwt=0.75, k=0: n[8]+=4.5=>6.0, k=1: n[8]+=3.75=>9.75, /2 = 4.875
        //   k=0: n[9]+=20.25=>22.5, k=1: n[9]+=14.0625=>36.5625, /2 = 18.28125
        assert!((cm_get(&result.count, nrows, 0, 8) - 4.875).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 0, 9) - 18.28125).abs() < 1e-10);
    }

    #[test]
    fn test_coxsurv2_basic() {
        // Counting process: 1 transition, 3 obs with intervals
        // (0,3) status=1, (1,5) status=0, (2,4) status=1
        let tstart = vec![0.0, 1.0, 2.0];
        let tstop = vec![3.0, 5.0, 4.0];
        let status = vec![1.0, 0.0, 1.0];
        let weight = vec![1.0, 1.0, 1.0];
        let risk = vec![1.0, 1.5, 2.0];
        let trans = vec![0, 0, 0];
        // sort2: sorted by (trans, tstop ascending): obs 0 (t=3), obs 2 (t=4), obs 1 (t=5)
        let sort2 = vec![0, 2, 1];
        // sort1: sorted by (trans, tstart ascending): obs 0 (t=0), obs 1 (t=1), obs 2 (t=2)
        let sort1 = vec![0, 1, 2];
        // sindex: all single intervals, so sindex=3 (start and end)
        let sindex = vec![3, 3, 3];
        let xmat: Vec<f64> = vec![]; // nvar=0
        let nvar = 0_usize;

        let otime = vec![3.0, 4.0, 5.0];

        let result = coxsurv2(
            &otime, &tstart, &tstop, &status, &weight, &sort1, &sort2, &sindex, &trans, &xmat,
            &risk, nvar,
        );

        assert_eq!(result.ntrans, 1);
        let nrows = otime.len() * result.ntrans;

        // Walking backward, person2 starts at 2, person1 at 2:
        // jj=2, dtime=5.0:
        //   person2=2: i2=sort2[2]=1, tstop[1]=5.0>=5.0, tstart[1]=1.0<5.0:
        //     atrisk[1]=1, n[0]=1,n[1]=1,n[2]=1.5
        //     sindex[1]=3>1, status[1]=0: n[10]=1,n[11]=1
        //     tstop[1]==5.0, status[1]=0: NOT an event (status not > 0)
        //   person2=1: i2=sort2[1]=2, tstop[2]=4.0<5.0: break
        //   Step 3: person1=2: i1=sort1[2]=2, tstart[2]=2.0<5.0: break
        //   Efron: n[3]=0<=1: n[8]=1.5, n[9]=2.25

        assert!((cm_get(&result.count, nrows, 2, 0) - 1.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 2, 2) - 1.5).abs() < 1e-10); // n[2]
        assert!((cm_get(&result.count, nrows, 2, 3) - 0.0).abs() < 1e-10); // n[3] no events

        // jj=1, dtime=4.0:
        //   person2=1: i2=sort2[1]=2, tstop[2]=4.0>=4.0, tstart[2]=2.0<4.0:
        //     atrisk[2]=1, n[0]=2,n[1]=2,n[2]=3.5
        //     sindex[2]=3>1, status[2]=1: not censor (status!=0)
        //     tstop[2]==4.0, status[2]=1>0: event! n[3]=1,n[4]=1,n[5]=2.0
        //       sindex[2]=3>1: n[6]=1,n[7]=1
        //   person2=0: i2=sort2[0]=0, tstop[0]=3.0<4.0: break
        //   Step 3: person1=2: i1=sort1[2]=2, tstart[2]=2.0<4.0: break
        //   Efron: n[3]=1: n[8]=3.5, n[9]=12.25

        assert!((cm_get(&result.count, nrows, 1, 0) - 2.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 1, 3) - 1.0).abs() < 1e-10); // n[3]
        assert!((cm_get(&result.count, nrows, 1, 8) - 3.5).abs() < 1e-10); // n[8]

        // jj=0, dtime=3.0:
        //   person2=0: i2=sort2[0]=0, tstop[0]=3.0>=3.0, tstart[0]=0.0<3.0:
        //     atrisk[0]=1, n[0]=3,n[1]=3,n[2]=4.5
        //     sindex[0]=3>1, status[0]=1: not censor
        //     tstop[0]==3.0, status[0]=1>0: event! n[3]=1,n[4]=1,n[5]=1.0
        //       sindex[0]=3>1: n[6]=1,n[7]=1
        //   person2=-1
        //   Step 3: person1=2: i1=sort1[2]=2, tstart[2]=2.0<3.0: break
        //   Efron: n[3]=1: n[8]=4.5, n[9]=20.25

        assert!((cm_get(&result.count, nrows, 0, 0) - 3.0).abs() < 1e-10); // n[0]
        assert!((cm_get(&result.count, nrows, 0, 3) - 1.0).abs() < 1e-10); // n[3]
        assert!((cm_get(&result.count, nrows, 0, 8) - 4.5).abs() < 1e-10); // n[8]
    }

    #[test]
    fn test_coxsurv2_with_removal() {
        // Test Step 3: removal of subjects whose start time >= dtime
        // Two intervals: (3,6) and (0,4), single transition
        // sort2 by tstop: obs 1(t=4), obs 0(t=6)
        // sort1 by tstart: obs 1(t=0), obs 0(t=3)
        let tstart = vec![3.0, 0.0];
        let tstop = vec![6.0, 4.0];
        let status = vec![1.0, 1.0];
        let weight = vec![1.0, 1.0];
        let risk = vec![2.0, 1.0];
        let trans = vec![0, 0];
        let sort2 = vec![1, 0]; // sorted by tstop ascending
        let sort1 = vec![1, 0]; // sorted by tstart ascending
        let sindex = vec![3, 3]; // all single intervals
        let xmat: Vec<f64> = vec![];
        let nvar = 0_usize;

        let otime = vec![3.0, 4.0, 6.0];

        let result = coxsurv2(
            &otime, &tstart, &tstop, &status, &weight, &sort1, &sort2, &sindex, &trans, &xmat,
            &risk, nvar,
        );

        let nrows = otime.len();

        // jj=2, dtime=6.0:
        //   person2=1: i2=sort2[1]=0, tstop[0]=6.0>=6.0, tstart[0]=3.0<6.0:
        //     atrisk[0]=1, n[0]=1,n[1]=1,n[2]=2
        //     tstop==6.0, status=1: n[3]=1,n[4]=1,n[5]=2, n[6]=1,n[7]=1
        //   person2=0: i2=sort2[0]=1, tstop[1]=4.0<6.0: break
        //   Step 3: person1=1: i1=sort1[1]=0, tstart[0]=3.0<6.0: break
        //   Efron: n[3]=1: n[8]=2, n[9]=4

        assert!((cm_get(&result.count, nrows, 2, 0) - 1.0).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 2, 2) - 2.0).abs() < 1e-10);

        // jj=1, dtime=4.0:
        //   person2=0: i2=sort2[0]=1, tstop[1]=4.0>=4.0, tstart[1]=0.0<4.0:
        //     atrisk[1]=1, n[0]=2,n[1]=2,n[2]=3
        //     tstop==4.0, status=1: n[3]=1,n[4]=1,n[5]=1, n[6]=1,n[7]=1
        //   person2=-1
        //   Step 3: person1=1: i1=sort1[1]=0, tstart[0]=3.0<4.0: break
        //   Efron: n[3]=1: n[8]=3, n[9]=9

        assert!((cm_get(&result.count, nrows, 1, 0) - 2.0).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 1, 2) - 3.0).abs() < 1e-10);

        // jj=0, dtime=3.0:
        //   person2=-1: no more obs
        //   Step 3: person1=1: i1=sort1[1]=0, tstart[0]=3.0 >= 3.0 (NOT < 3.0):
        //     atrisk[0]=1: remove! n[0]=1
        //     n[0]!=0: n[1] -= 1 = 1, n[2] -= 2 = 1
        //   person1=0: i1=sort1[0]=1, tstart[1]=0.0<3.0: break
        //   n = [1,1,1, 0,0,0, ...]
        //   Efron: n[3]=0: n[8]=1, n[9]=1

        assert!((cm_get(&result.count, nrows, 0, 0) - 1.0).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 0, 2) - 1.0).abs() < 1e-10);
        assert!((cm_get(&result.count, nrows, 0, 8) - 1.0).abs() < 1e-10);
    }
}
