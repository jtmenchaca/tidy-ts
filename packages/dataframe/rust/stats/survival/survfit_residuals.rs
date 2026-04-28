//! Influence matrix for Aalen-Johansen survival estimates
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/survfitresid.c`
//!
//! Computes the influence matrix of the Aalen-Johansen (multi-state) estimate
//! at a particular set of output times, optionally including mean-time-in-state
//! (AUC) influence.

/// Result from survfitresid computation.
///
/// The influence matrices are stored as `nobs × (nout * nstate)` in column-major
/// order, matching R's layout. Index `[obs, state + time_idx * nstate]`.
pub struct SurvfitResidResult {
    /// Influence on P(state) — dimensions: nobs × (nout * nstate)
    pub influence_pstate: Vec<f64>,
    /// Influence on AUC (mean time in state) — dimensions: nobs × (nout * nstate)
    /// Only present if `doauc` was true.
    pub influence_auc: Option<Vec<f64>>,
    /// Number of observations
    pub nobs: usize,
    /// Number of output times
    pub nout: usize,
    /// Number of states
    pub nstate: usize,
}

/// Input data format for survfitresid.
pub enum SurvivalResponse<'a> {
    /// Right-censored: (exit_time, status) — 2-column Y
    RightCensored {
        etime: &'a [f64],
        status: &'a [f64],
    },
    /// Counting process: (entry_time, exit_time, status) — 3-column Y
    CountingProcess {
        entry: &'a [f64],
        etime: &'a [f64],
        status: &'a [f64],
    },
}

/// Compute the influence matrix of the Aalen-Johansen estimate.
///
/// Port of `survfitresid()` from `survfitresid.c`.
///
/// # Arguments
///
/// * `response` - Survival response data (right-censored or counting process)
/// * `sort1` - Sort indices for entry times (0-based; ignored for right-censored)
/// * `sort2` - Sort indices for exit times (0-based)
/// * `cstate` - Current state for each observation (0-based)
/// * `wt` - Case weights
/// * `p0` - Initial distribution of states (length nstate)
/// * `i0` - Initial influence matrix, column-major (nobs × nstate)
/// * `otime` - Requested output times
/// * `starttime` - Starting time for the curve (needed for AUC)
/// * `doauc` - Whether to compute AUC influence
/// * `nstate` - Number of states
#[allow(dead_code)]
pub(crate) fn survfitresid(
    response: &SurvivalResponse,
    sort1: &[i32],
    sort2: &[i32],
    cstate: &[i32],
    wt: &[f64],
    p0: &[f64],
    i0: &[f64],
    otime: &[f64],
    starttime: f64,
    doauc: bool,
    nstate: usize,
) -> SurvfitResidResult {
    let nobs = sort2.len();
    let nout = otime.len();

    let (entry, etime, status, is_counting) = match response {
        SurvivalResponse::RightCensored { etime, status } => {
            (None, *etime, *status, false)
        }
        SurvivalResponse::CountingProcess {
            entry,
            etime,
            status,
        } => (Some(*entry), *etime, *status, true),
    };

    // Allocate output: nobs × (nout * nstate) in column-major
    let total_size = nobs * nout * nstate;
    let mut infp_data = vec![0.0_f64; total_size];
    let mut infa_data = if doauc {
        vec![0.0_f64; total_size]
    } else {
        Vec::new()
    };

    // infp and infa are conceptually nobs × nstate matrices, but we advance
    // through slices of size nobs*nstate for each output time.
    // infp_offset tracks which output-time slice we're currently writing to.
    let mut infp_offset: usize = 0; // current slice start in infp_data
    let mut infa_offset: usize = 0;

    // Helper closures for 2D indexing into the current slice
    // infp[state][obs] in C => infp_data[infp_offset + state * nobs + obs]
    let infp_idx = |offset: usize, state: usize, obs: usize| -> usize {
        offset + state * nobs + obs
    };

    // Scratch vectors
    let mut ws = vec![0.0_f64; nstate]; // weighted count at risk, by state
    let mut pstate = vec![0.0_f64; nstate]; // current prevalence
    let mut tempvec = vec![0.0_f64; nstate];
    let mut nrisk = vec![0_i32; nstate];
    let mut atrisk = vec![0_i32; nobs];
    let mut cmat = vec![vec![0.0_f64; nstate]; nstate]; // cmat[oldstate][newstate]

    let mut starttime = starttime;

    // itime tracks output times
    let mut itime: usize = 0;

    // Handle output times before starttime: set influence to 0
    // (infp_data is already zeroed, so just advance the offset)
    while itime < nout && otime[itime] < starttime {
        // infp and infa are already 0 (vec initialized to 0)
        if itime + 1 < nout {
            // Copy zeros forward (already zero, just advance offset)
            infp_offset += nobs * nstate;
            if doauc {
                infa_offset += nobs * nstate;
            }
        }
        itime += 1;
    }

    // Initialize infp from i0 (column-major: i0[obs + state*nobs])
    for j in 0..nstate {
        for i in 0..nobs {
            infp_data[infp_idx(infp_offset, j, i)] = i0[i + j * nobs];
        }
    }
    // infa is already 0

    // Initialize risk set
    let mut eptr: usize = 0; // index into sort1 for entry times (counting process)
    if is_counting {
        // Nobody starts at risk; they enter via sort1
        for i in 0..nobs {
            atrisk[i] = 0;
        }
    } else {
        // Everyone starts at risk
        for i in 0..nobs {
            atrisk[i] = 1;
            let k = cstate[i] as usize;
            ws[k] += wt[i];
            nrisk[k] += 1;
        }
    }

    // Initialize pstate from p0
    for i in 0..nstate {
        pstate[i] = p0[i];
    }

    // Main loop over sorted exit times
    let mut i = 0_usize;
    while i < nobs {
        let p2 = sort2[i] as usize;
        let ctime = etime[p2];

        // Process output times between previous data time and current
        while itime < nout && otime[itime] < ctime {
            if doauc {
                // AUC influence += (Phat influence) * (otime[itime] - starttime)
                let dt = otime[itime] - starttime;
                for j in 0..nobs {
                    for k in 0..nstate {
                        infa_data[infp_idx(infa_offset, k, j)] +=
                            infp_data[infp_idx(infp_offset, k, j)] * dt;
                    }
                }
                starttime = otime[itime];
            }

            // Copy forward to next output time slice
            if itime + 1 < nout {
                let old_infp = infp_offset;
                infp_offset += nobs * nstate;
                for k in 0..nstate {
                    for j in 0..nobs {
                        infp_data[infp_idx(infp_offset, k, j)] =
                            infp_data[infp_idx(old_infp, k, j)];
                    }
                }
                if doauc {
                    let old_infa = infa_offset;
                    infa_offset += nobs * nstate;
                    for k in 0..nstate {
                        for j in 0..nobs {
                            infa_data[infp_idx(infa_offset, k, j)] =
                                infa_data[infp_idx(old_infa, k, j)];
                        }
                    }
                }
            }
            itime += 1;
        }
        if itime == nout {
            break;
        }

        // Add subjects whose entry time < ctime (counting process only)
        if is_counting {
            if let Some(entry_times) = entry {
                while eptr < nobs {
                    let p1 = sort1[eptr] as usize;
                    if entry_times[p1] < ctime {
                        atrisk[p1] = 1;
                        let k = cstate[p1] as usize;
                        ws[k] += wt[p1];
                        nrisk[k] += 1;
                        eptr += 1;
                    } else {
                        break;
                    }
                }
            }
        }

        // Zero cmat
        for j in 0..nstate {
            for k in 0..nstate {
                cmat[j][k] = 0.0;
            }
        }

        // Count transitions at this time point
        let mut nevent = 0_usize;
        let mut _wevent = 0.0_f64;
        let mut oldstate = 0_usize;
        let mut newstate = 0_usize;
        let mut psave = 0_usize;

        let mut j = i;
        while j < nobs {
            let p2j = sort2[j] as usize;
            if etime[p2j] > ctime {
                break;
            }
            if status[p2j] != 0.0 && cstate[p2j] as usize != (status[p2j] as usize - 1) {
                // A "move" to the same state does not count
                newstate = status[p2j] as usize - 1; // 0-based
                oldstate = cstate[p2j] as usize;
                psave = p2j;
                nevent += 1;
                _wevent += wt[p2j];
                cmat[oldstate][newstate] += wt[p2j] / ws[oldstate];
                cmat[oldstate][oldstate] -= wt[p2j] / ws[oldstate];
            }
            j += 1;
        }

        // AUC update before modifying infp (only at event times)
        if nevent > 0 && doauc {
            let temp = ctime - starttime;
            for jj in 0..nstate {
                for kk in 0..nobs {
                    infa_data[infp_idx(infa_offset, jj, kk)] +=
                        infp_data[infp_idx(infp_offset, jj, kk)] * temp;
                }
            }
            starttime = ctime;
        }

        // Update the influence matrix
        if nevent == 1 {
            // Single-event optimization
            let temp = -cmat[oldstate][oldstate];
            for jj in 0..nobs {
                // new U = UH = U + UC
                let old_val = infp_data[infp_idx(infp_offset, oldstate, jj)];
                infp_data[infp_idx(infp_offset, newstate, jj)] += temp * old_val;
                infp_data[infp_idx(infp_offset, oldstate, jj)] -= temp * old_val;
            }

            // add C/wt[i], affects all in oldstate
            let temp2 = pstate[oldstate] / ws[oldstate];
            infp_data[infp_idx(infp_offset, newstate, psave)] += temp2;
            infp_data[infp_idx(infp_offset, oldstate, psave)] -= temp2;

            let mut jj = i;
            while jj < nobs {
                let p2j = sort2[jj] as usize;
                if atrisk[p2j] == 1 && cstate[p2j] as usize == oldstate {
                    infp_data[infp_idx(infp_offset, oldstate, p2j)] += temp * temp2;
                    infp_data[infp_idx(infp_offset, newstate, p2j)] -= temp * temp2;
                }
                jj += 1;
            }
        } else if nevent > 1 {
            // Multiple events: full matrix multiplication U = U + U * C
            for jj in 0..nobs {
                for k in 0..nstate {
                    tempvec[k] = 0.0;
                    for kk in 0..nstate {
                        tempvec[k] += infp_data[infp_idx(infp_offset, kk, jj)] * cmat[kk][k];
                    }
                }
                for k in 0..nstate {
                    infp_data[infp_idx(infp_offset, k, jj)] += tempvec[k];
                }
            }

            // Step 2: add dH term for all at-risk subjects
            let mut jj = i;
            while jj < nobs {
                let p2j = sort2[jj] as usize;
                if atrisk[p2j] == 1 {
                    let os = cstate[p2j] as usize;
                    let temp2 = pstate[os] / ws[os];
                    for k in 0..nstate {
                        infp_data[infp_idx(infp_offset, k, p2j)] -= cmat[os][k] * temp2;
                    }
                }
                jj += 1;
            }

            // Additional term for subjects that made a transition
            let mut jj = i;
            while jj < nobs {
                let p2j = sort2[jj] as usize;
                if etime[p2j] > ctime {
                    break;
                }
                let os = cstate[p2j] as usize;
                if status[p2j] > 1.0 && os != status[p2j] as usize - 1 {
                    let temp2 = pstate[os] / ws[os];
                    let ns = status[p2j] as usize - 1;
                    infp_data[infp_idx(infp_offset, os, p2j)] -= temp2;
                    infp_data[infp_idx(infp_offset, ns, p2j)] += temp2;
                }
                jj += 1;
            }
        }

        // Update pstate: p = p + p * C
        for jj in 0..nstate {
            tempvec[jj] = 0.0;
            for k in 0..nstate {
                tempvec[jj] += pstate[k] * cmat[k][jj];
            }
        }
        for jj in 0..nstate {
            pstate[jj] += tempvec[jj];
        }

        // Remove all events and censors at ctime from risk set
        while i < nobs {
            let p2i = sort2[i] as usize;
            if etime[p2i] > ctime {
                break;
            }
            let os = cstate[p2i] as usize;
            ws[os] -= wt[p2i];
            nrisk[os] -= 1;
            atrisk[p2i] = 0;
            i += 1;
        }
    } // end main loop

    // Handle reporting times after the last event
    while itime < nout {
        if doauc {
            let dt = otime[itime] - starttime;
            for k in 0..nstate {
                for j in 0..nobs {
                    infa_data[infp_idx(infa_offset, k, j)] +=
                        infp_data[infp_idx(infp_offset, k, j)] * dt;
                }
            }
            starttime = otime[itime];
        }

        if itime + 1 < nout {
            let old_infp = infp_offset;
            infp_offset += nobs * nstate;
            for k in 0..nstate {
                for j in 0..nobs {
                    infp_data[infp_idx(infp_offset, k, j)] =
                        infp_data[infp_idx(old_infp, k, j)];
                }
            }
            if doauc {
                let old_infa = infa_offset;
                infa_offset += nobs * nstate;
                for k in 0..nstate {
                    for j in 0..nobs {
                        infa_data[infp_idx(infa_offset, k, j)] =
                            infa_data[infp_idx(old_infa, k, j)];
                    }
                }
            }
        }
        itime += 1;
    }

    SurvfitResidResult {
        influence_pstate: infp_data,
        influence_auc: if doauc { Some(infa_data) } else { None },
        nobs,
        nout,
        nstate,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_survfitresid_simple_two_state() {
        // 4 subjects, 2 states (alive=0, dead=1), right-censored
        // Subject 0: dies at t=1 (state 0 -> 1)
        // Subject 1: censored at t=2 (state 0)
        // Subject 2: dies at t=3 (state 0 -> 1)
        // Subject 3: censored at t=4 (state 0)
        let etime = [1.0, 2.0, 3.0, 4.0];
        // status encoding: 0=censored, 1,2,...=new state (1-based)
        // For alive(0)->dead(1): status=2 means move to state 1
        let status = [2.0, 0.0, 2.0, 0.0];

        let sort2: Vec<i32> = vec![0, 1, 2, 3]; // already sorted by etime
        let cstate = [0_i32, 0, 0, 0]; // all start in state 0
        let wt = [1.0, 1.0, 1.0, 1.0];
        let p0 = [1.0, 0.0]; // everyone starts in state 0
        // i0: nobs x nstate, column-major, initially zero
        let i0 = vec![0.0; 4 * 2];
        let otime = [1.0, 3.0]; // report at t=1 and t=3
        let starttime = 0.0;
        let nstate = 2;

        let response = SurvivalResponse::RightCensored {
            etime: &etime,
            status: &status,
        };

        let result = survfitresid(
            &response,
            &[], // sort1 unused for right-censored
            &sort2,
            &cstate,
            &wt,
            &p0,
            &i0,
            &otime,
            starttime,
            false,
            nstate,
        );

        assert_eq!(result.nobs, 4);
        assert_eq!(result.nout, 2);
        assert_eq!(result.nstate, 2);
        assert_eq!(result.influence_pstate.len(), 4 * 2 * 2);
        assert!(result.influence_auc.is_none());

        // R reference values from:
        // .Call(survival:::Csurvfitresid, Y, 0L, sort2, cst, wt, p0, i0, c(1,3), 0, 0L)
        // Layout: columns = [state0_t1, state1_t1, state0_t2, state1_t2]
        // Row-major R output:
        //   obs0: -0.1875  0.1875 -0.09375  0.09375
        //   obs1:  0.0625 -0.0625  0.03125 -0.03125
        //   obs2:  0.0625 -0.0625 -0.15625  0.15625
        //   obs3:  0.0625 -0.0625  0.21875 -0.21875
        let expected: Vec<Vec<[f64; 2]>> = vec![
            // time 0: [state0, state1]
            vec![
                [-0.1875, 0.1875],
                [0.0625, -0.0625],
                [0.0625, -0.0625],
                [0.0625, -0.0625],
            ],
            // time 1: [state0, state1]
            vec![
                [-0.09375, 0.09375],
                [0.03125, -0.03125],
                [-0.15625, 0.15625],
                [0.21875, -0.21875],
            ],
        ];

        let infp = &result.influence_pstate;
        let nobs = 4;
        for t in 0..2 {
            for obs in 0..4 {
                for s in 0..2 {
                    let idx = t * nobs * nstate + s * nobs + obs;
                    let got = infp[idx];
                    let exp = expected[t][obs][s];
                    assert!(
                        (got - exp).abs() < 1e-10,
                        "t={}, obs={}, s={}: got {} expected {}",
                        t,
                        obs,
                        s,
                        got,
                        exp
                    );
                }
            }
        }
    }

    #[test]
    fn test_survfitresid_counting_process() {
        // 3 subjects with counting process data, 2 states
        // Subject 0: enters at t=0, dies at t=2 (state 0 -> 1)
        // Subject 1: enters at t=1, censored at t=3 (state 0)
        // Subject 2: enters at t=0, censored at t=4 (state 0)
        let entry_times = [0.0, 1.0, 0.0];
        let exit_times = [2.0, 3.0, 4.0];
        let status = [2.0, 0.0, 0.0]; // 2 = move to state 1

        // sort1: sorted by entry time ascending
        let sort1 = [0_i32, 2, 1]; // entry 0.0, 0.0, 1.0
        // sort2: sorted by exit time ascending
        let sort2 = [0_i32, 1, 2]; // exit 2.0, 3.0, 4.0

        let cstate = [0_i32, 0, 0];
        let wt = [1.0, 1.0, 1.0];
        let p0 = [1.0, 0.0];
        let i0 = vec![0.0; 3 * 2];
        let otime = [2.0];
        let starttime = 0.0;
        let nstate = 2;

        let response = SurvivalResponse::CountingProcess {
            entry: &entry_times,
            etime: &exit_times,
            status: &status,
        };

        let result = survfitresid(
            &response,
            &sort1,
            &sort2,
            &cstate,
            &wt,
            &p0,
            &i0,
            &otime,
            starttime,
            false,
            nstate,
        );

        assert_eq!(result.nobs, 3);
        assert_eq!(result.nout, 1);
        assert_eq!(result.nstate, 2);

        // R reference: .Call(survival:::Csurvfitresid, ...)
        // obs0: -0.2222222  0.2222222
        // obs1:  0.1111111 -0.1111111
        // obs2:  0.1111111 -0.1111111
        let expected = [
            [-2.0 / 9.0, 2.0 / 9.0],
            [1.0 / 9.0, -1.0 / 9.0],
            [1.0 / 9.0, -1.0 / 9.0],
        ];
        let infp = &result.influence_pstate;
        for obs in 0..3 {
            for s in 0..2 {
                let got = infp[s * 3 + obs];
                assert!(
                    (got - expected[obs][s]).abs() < 1e-10,
                    "obs={}, s={}: got {} expected {}",
                    obs,
                    s,
                    got,
                    expected[obs][s]
                );
            }
        }
    }

    #[test]
    fn test_survfitresid_with_auc() {
        // Simple test: 2 subjects, 2 states, right-censored
        // Subject 0: dies at t=1
        // Subject 1: censored at t=2
        let etime = [1.0, 2.0];
        let status = [2.0, 0.0]; // 2 = move to state 1

        let sort2 = [0_i32, 1];
        let cstate = [0_i32, 0];
        let wt = [1.0, 1.0];
        let p0 = [1.0, 0.0];
        let i0 = vec![0.0; 2 * 2];
        let otime = [2.0]; // report at t=2
        let starttime = 0.0;
        let nstate = 2;

        let response = SurvivalResponse::RightCensored {
            etime: &etime,
            status: &status,
        };

        let result = survfitresid(
            &response,
            &[],
            &sort2,
            &cstate,
            &wt,
            &p0,
            &i0,
            &otime,
            starttime,
            true, // doauc
            nstate,
        );

        assert!(result.influence_auc.is_some());
        let infa = result.influence_auc.as_ref().unwrap();
        assert_eq!(infa.len(), 2 * 1 * 2);

        // R reference: pstate = [[-0.25, 0.25], [0.25, -0.25]]
        // AUC = [[-0.25, 0.25], [0.25, -0.25]]
        let infp = &result.influence_pstate;
        let expected_p = [[-0.25, 0.25], [0.25, -0.25]];
        let expected_a = [[-0.25, 0.25], [0.25, -0.25]];
        for obs in 0..2 {
            for s in 0..2 {
                let got_p = infp[s * 2 + obs];
                assert!(
                    (got_p - expected_p[obs][s]).abs() < 1e-10,
                    "pstate obs={}, s={}: got {} expected {}",
                    obs, s, got_p, expected_p[obs][s]
                );
                let got_a = infa[s * 2 + obs];
                assert!(
                    (got_a - expected_a[obs][s]).abs() < 1e-10,
                    "AUC obs={}, s={}: got {} expected {}",
                    obs, s, got_a, expected_a[obs][s]
                );
            }
        }
    }

    #[test]
    fn test_survfitresid_multiple_events_same_time() {
        // 4 subjects, 2 states
        // Subjects 0 and 1 both die at t=1 (triggers multi-event path)
        // Subject 2: censored at t=2
        // Subject 3: censored at t=3
        let etime = [1.0, 1.0, 2.0, 3.0];
        let status = [2.0, 2.0, 0.0, 0.0];

        let sort2 = [0_i32, 1, 2, 3];
        let cstate = [0_i32, 0, 0, 0];
        let wt = [1.0, 1.0, 1.0, 1.0];
        let p0 = [1.0, 0.0];
        let i0 = vec![0.0; 4 * 2];
        let otime = [1.0];
        let starttime = 0.0;
        let nstate = 2;

        let response = SurvivalResponse::RightCensored {
            etime: &etime,
            status: &status,
        };

        let result = survfitresid(
            &response,
            &[],
            &sort2,
            &cstate,
            &wt,
            &p0,
            &i0,
            &otime,
            starttime,
            false,
            nstate,
        );

        // R reference: .Call(survival:::Csurvfitresid, ...)
        // obs0: -0.125  0.125
        // obs1: -0.125  0.125
        // obs2:  0.125 -0.125
        // obs3:  0.125 -0.125
        let expected = [
            [-0.125, 0.125],
            [-0.125, 0.125],
            [0.125, -0.125],
            [0.125, -0.125],
        ];
        let infp = &result.influence_pstate;
        for obs in 0..4 {
            for s in 0..2 {
                let got = infp[s * 4 + obs];
                assert!(
                    (got - expected[obs][s]).abs() < 1e-10,
                    "obs={}, s={}: got {} expected {}",
                    obs,
                    s,
                    got,
                    expected[obs][s]
                );
            }
        }
    }
}
