//! Proportional hazards (PH) assumption test
//!
//! ## Source
//!
//! - `survival-ref/survival-master/src/zph1.c` (right-censored data)
//! - `survival-ref/survival-master/src/zph2.c` (counting process / start-stop data)
//!
//! Computes the score test for non-proportional hazards using a time
//! transform g(t). Returns the 2p score vector, 2p×2p information matrix,
//! Schoenfeld residuals, and per-stratum covariate usage flags.

/// Result of the proportional hazards test computation.
pub struct Zph1Result {
    /// Score vector, length 2*nvar.
    /// First nvar entries: original covariates.
    /// Last nvar entries: time-weighted covariates.
    pub u: Vec<f64>,
    /// Information matrix, 2*nvar × 2*nvar (row-major: imat[i][j]).
    pub imat: Vec<Vec<f64>>,
    /// Schoenfeld residuals, nevent × nvar.
    /// schoen[event_index][covariate_index].
    pub schoen: Vec<Vec<f64>>,
    /// Usage flags, nstrat × nvar.
    /// used[stratum][covariate] = number of events if covariate varies in
    /// that stratum, 0 if constant.
    pub used: Vec<Vec<i32>>,
}

/// Compute the score test for the proportional hazards assumption.
///
/// Direct port of `zph1()` from `survival-ref/survival-master/src/zph1.c`.
///
/// # Arguments
///
/// * `gt` - Time transform g(t) evaluated at each observation, centered
/// * `xtime` - Event/censoring times (column 1 of y)
/// * `status` - Event indicator (1.0=event, 0.0=censored) (column 2 of y)
/// * `covar` - Covariate matrix, covar[j][i] = covariate j for obs i (nvar × n)
/// * `eta` - Linear predictor X*beta for each observation
/// * `weights` - Case weights
/// * `strata` - Stratum assignment per observation (0-based integers)
/// * `method` - 0=Breslow, 1=Efron (R passes `fit$method == "efron"` as 0/1)
/// * `sort` - Sort index: ascending (strata, time), 0-based
///
/// # Returns
///
/// `Zph1Result` containing u, imat, schoen, used.
pub fn zph1(
    gt: &[f64],
    xtime: &[f64],
    status: &[f64],
    covar: &mut [Vec<f64>],
    eta: &[f64],
    weights: &[f64],
    strata: &[i32],
    method: i32,
    sort: &[i32],
) -> Zph1Result {
    let nused = xtime.len();
    let nvar = covar.len();

    // Count events and strata (lines 68-73)
    let mut nevent: i32 = 0;
    let mut nstrat: i32 = 1;
    for i in 0..nused {
        nevent += status[i] as i32;
        if strata[i] >= nstrat {
            nstrat = strata[i] + 1;
        }
    }
    let nevent_total = nevent as usize;
    let nstrat = nstrat as usize;

    // Allocate outputs (lines 87-96)
    let mut u = vec![0.0_f64; 2 * nvar];
    let mut imat = vec![vec![0.0_f64; 2 * nvar]; 2 * nvar];
    // schoen: nevent_total rows × nvar columns
    let mut schoen = vec![vec![0.0_f64; nvar]; nevent_total];
    // used: nstrat rows × nvar columns
    let mut used = vec![vec![0_i32; nvar]; nstrat];

    // Scratch vectors (lines 99-102)
    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut cmat = vec![vec![0.0_f64; nvar]; nvar];
    let mut cmat2 = vec![vec![0.0_f64; nvar]; nvar];

    // --- Compute `used` matrix (lines 111-143) ---
    // For each covariate in each stratum: 0 if constant, nevent_in_stratum otherwise
    {
        let mut k: usize = 0; // first obs index of current stratum
        let mut ndead: f64 = 0.0;
        let mut cstrat = strata[sort[0] as usize];

        for i in 0..nused {
            let person = sort[i] as usize;
            if cstrat == strata[person] {
                ndead += status[person];
            } else {
                // End of a stratum — check each covariate
                let p1 = sort[k] as usize;
                for j in 0..nvar {
                    used[cstrat as usize][j] = 0; // start pessimistic
                    for kk in k..i {
                        let pp = sort[kk] as usize;
                        if covar[j][pp] != covar[j][p1] {
                            used[cstrat as usize][j] = ndead as i32;
                            break;
                        }
                    }
                }
                ndead = status[sort[i] as usize];
                k = i;
                cstrat = strata[sort[i] as usize];
            }
        }

        // Deal with the last stratum (lines 134-143)
        let p1 = sort[k] as usize;
        for j in 0..nvar {
            used[cstrat as usize][j] = 0;
            for kk in k..nused {
                let pp = sort[kk] as usize;
                if covar[j][pp] != covar[j][p1] {
                    used[cstrat as usize][j] = ndead as i32;
                    break;
                }
            }
        }
    }

    // --- Recenter covariates (lines 148-155) ---
    for i in 0..nvar {
        let mut tmean = 0.0_f64;
        for j in 0..nused {
            tmean += covar[i][j];
        }
        tmean /= nused as f64;
        for j in 0..nused {
            covar[i][j] -= tmean;
        }
    }

    // Zero u, imat already done by vec initialization
    // Zero a, a2, cmat, cmat2 already done by vec initialization

    // --- Main backward accumulation loop (lines 175-287) ---
    let mut cstrat: i32 = -1; // will not match any data point
    let mut ip = nused as isize - 1;
    let mut denom: f64 = 0.0;

    while ip >= 0 {
        let person = sort[ip as usize] as usize;

        // New stratum? Reset (lines 179-186)
        if strata[person] != cstrat {
            cstrat = strata[person];
            denom = 0.0;
            for i in 0..nvar {
                a[i] = 0.0;
                for j in 0..nvar {
                    cmat[i][j] = 0.0;
                }
            }
        }

        let dtime = xtime[person];
        let timewt = gt[person]; // time weight for this event time (line 189)
        let mut ndead: f64 = 0.0;
        let mut deadwt: f64 = 0.0;
        let mut denom2: f64 = 0.0;

        // Walk through tied times (lines 193-221)
        while ip >= 0 {
            let person = sort[ip as usize] as usize;
            if xtime[person] != dtime || strata[person] != cstrat {
                break;
            }

            let risk = eta[person].exp() * weights[person];

            if status[person] == 0.0 {
                // Censored: add to running sums (lines 199-205)
                denom += risk;
                for i in 0..nvar {
                    a[i] += risk * covar[i][person];
                    for j in 0..=i {
                        cmat[i][j] += risk * covar[i][person] * covar[j][person];
                    }
                }
            } else {
                // Death (lines 207-220)
                ndead += 1.0;
                deadwt += weights[person];
                denom2 += risk;
                nevent -= 1;
                let ne = nevent as usize;
                for i in 0..nvar {
                    schoen[ne][i] = covar[i][person];
                    u[i] += weights[person] * covar[i][person];
                    u[i + nvar] += timewt * weights[person] * covar[i][person];
                    a2[i] += risk * covar[i][person];
                    for j in 0..=i {
                        cmat2[i][j] += risk * covar[i][person] * covar[j][person];
                    }
                }
            }

            ip -= 1;
        }

        if ndead > 0.0 {
            if method == 0 {
                // --- Breslow (lines 224-242) ---
                denom += denom2;

                for i in 0..nvar {
                    a[i] += a2[i];
                    let temp2 = a[i] / denom; // mean
                    u[i] -= deadwt * temp2;
                    u[i + nvar] -= timewt * deadwt * temp2;
                    for j in 0..=i {
                        cmat[i][j] += cmat2[i][j];
                        let temp = deadwt * (cmat[i][j] - temp2 * a[j]) / denom;
                        imat[j][i] += temp;
                        imat[j][i + nvar] += temp * timewt;
                        imat[j + nvar][i + nvar] += temp * timewt * timewt;
                    }
                    for j in 0..(ndead as usize) {
                        schoen[nevent as usize + j][i] -= temp2;
                    }
                }
            } else {
                // --- Efron (lines 243-281) ---
                let wtave = deadwt / ndead;

                // Compute mean of means for Schoenfeld residuals (lines 254-262)
                for i in 0..nvar {
                    let mut tmean = 0.0_f64;
                    for k in 0..(ndead as i32) {
                        let temp = (k + 1) as f64 / ndead;
                        tmean += (a[i] + a2[i] * temp) / (denom + denom2 * temp);
                    }
                    for j in 0..(ndead as usize) {
                        schoen[nevent as usize + j][i] -= tmean / ndead;
                    }
                }

                // Compute U and imat (lines 265-280)
                for _k in 0..(ndead as i32) {
                    denom += denom2 / ndead;
                    for i in 0..nvar {
                        a[i] += a2[i] / ndead;
                        let temp2 = a[i] / denom;
                        u[i] -= wtave * temp2;
                        u[i + nvar] -= timewt * wtave * temp2;
                        for j in 0..=i {
                            cmat[i][j] += cmat2[i][j] / ndead;
                            let temp =
                                wtave * (cmat[i][j] - temp2 * a[j]) / denom;
                            imat[j][i] += temp;
                            imat[j][i + nvar] += timewt * temp;
                            imat[j + nvar][i + nvar] += timewt * timewt * temp;
                        }
                    }
                }
            }

            // Reset a2, cmat2 (lines 282-285)
            for i in 0..nvar {
                a2[i] = 0.0;
                for j in 0..nvar {
                    cmat2[i][j] = 0.0;
                }
            }
        }
    } // end of accumulation loop

    // --- Symmetrize information matrix (lines 290-300) ---
    // Lower-left of each quadrant (lines 290-296)
    for i in 0..nvar {
        for j in 0..i {
            imat[i][j] = imat[j][i];
            imat[i][j + nvar] = imat[j][i + nvar];
            imat[i + nvar][j + nvar] = imat[j + nvar][i + nvar];
        }
    }
    // Upper-right block (lines 297-300)
    for i in 0..nvar {
        for j in 0..nvar {
            imat[i + nvar][j] = imat[j][i + nvar];
        }
    }

    Zph1Result {
        u,
        imat,
        schoen,
        used,
    }
}

/// Compute the score test for proportional hazards — counting process data.
///
/// Direct port of `zph2()` from `survival-ref/survival-master/src/zph2.c`.
///
/// # Arguments
///
/// * `gt` - Time transform g(t) evaluated at each observation, centered
/// * `start` - Entry times (column 1 of y)
/// * `tstop` - Exit times (column 2 of y)
/// * `status` - Event indicator (1.0=event, 0.0=censored) (column 3 of y)
/// * `covar` - Covariate matrix, covar[j][i] (nvar × n)
/// * `eta` - Linear predictor X*beta (mutable — may be recentered for stability)
/// * `weights` - Case weights
/// * `strata` - Stratum assignment per observation (0-based integers)
/// * `method` - 0=Breslow, 1=Efron
/// * `sort1` - Sort index for descending (strata, start), 0-based
/// * `sort2` - Sort index for descending (strata, tstop), 0-based
///
/// # Returns
///
/// `Zph1Result` containing u, imat, schoen, used (same struct as zph1).
#[allow(clippy::too_many_arguments)]
pub(crate) fn zph2(
    gt: &[f64],
    start: &[f64],
    tstop: &[f64],
    status: &[f64],
    covar: &mut [Vec<f64>],
    eta: &mut [f64],
    weights: &[f64],
    strata: &[i32],
    method: i32,
    sort1: &[i32],
    sort2: &[i32],
) -> Zph1Result {
    let nused = start.len();
    let nvar = covar.len();

    // Count events and strata (lines 57-62)
    let mut nevent: i32 = 0;
    let mut nstrat: i32 = 1;
    for i in 0..nused {
        nevent += status[i] as i32;
        if strata[i] >= nstrat {
            nstrat = strata[i] + 1;
        }
    }
    let nevent_total = nevent as usize;
    let nstrat = nstrat as usize;

    // Allocate outputs (lines 76-85)
    let mut u = vec![0.0_f64; 2 * nvar];
    let mut imat = vec![vec![0.0_f64; 2 * nvar]; 2 * nvar];
    let mut schoen = vec![vec![0.0_f64; nvar]; nevent_total];
    let mut used = vec![vec![0_i32; nvar]; nstrat];

    // Scratch (lines 88-92)
    let mut a = vec![0.0_f64; nvar];
    let mut a2 = vec![0.0_f64; nvar];
    let mut cmat = vec![vec![0.0_f64; nvar]; nvar];
    let mut cmat2 = vec![vec![0.0_f64; nvar]; nvar];
    let mut keep = vec![0_i32; nused];

    // --- Compute `used` matrix (lines 117-152) ---
    {
        let mut k: usize = 0;
        let mut ndead: f64 = 0.0;
        let mut cstrat = strata[sort2[0] as usize];

        for i in 0..nused {
            let person = sort2[i] as usize;
            if cstrat == strata[person] {
                ndead += status[person];
            } else {
                let p1 = sort2[k] as usize;
                for j in 0..nvar {
                    used[cstrat as usize][j] = 0;
                    for kk in k..i {
                        let person = sort2[kk] as usize;
                        if covar[j][person] != covar[j][p1] {
                            used[cstrat as usize][j] = ndead as i32;
                            break;
                        }
                    }
                }
                k = i;
                ndead = status[sort2[i] as usize];
                cstrat = strata[sort2[i] as usize];
            }
        }

        // Last stratum (lines 141-152)
        let p1 = sort2[k] as usize;
        for j in 0..nvar {
            used[cstrat as usize][j] = 0;
            for kk in k..nused {
                let person = sort2[kk] as usize;
                if covar[j][person] != covar[j][p1] {
                    used[cstrat as usize][j] = ndead as i32;
                    break;
                }
            }
        }
    }

    // --- Recenter covariates (lines 157-162) ---
    for i in 0..nvar {
        let mut tmean = 0.0_f64;
        for j in 0..nused {
            tmean += covar[i][j];
        }
        tmean /= nused as f64;
        for j in 0..nused {
            covar[i][j] -= tmean;
        }
    }

    // --- Main forward accumulation loop (lines 170-360) ---
    // sort2 is descending (strata, tstop), so person=0 is largest tstop
    let mut person: usize = 0;
    let mut indx1: usize = 0;
    let mut denom: f64 = 0.0;
    let mut nrisk: i32 = 0;
    let mut etasum: f64 = 0.0;
    let mut cstrat: i32 = -1;
    let mut recenter: f64 = 0.0;
    let mut dtime: f64 = 0.0;
    let mut timewt: f64 = 1.0;

    while person < nused {
        // Find the next death time (lines 179-199)
        let mut k = person;
        let mut found_death = false;
        while k < nused {
            if strata[sort2[k] as usize] != cstrat {
                // New stratum: reset (lines 181-191)
                cstrat = strata[sort2[k] as usize];
                denom = 0.0;
                nrisk = 0;
                etasum = 0.0;
                for i in 0..nvar {
                    a[i] = 0.0;
                    for j in 0..nvar {
                        cmat[i][j] = 0.0;
                    }
                }
                person = k;
                indx1 = k;
            }
            let p = sort2[k] as usize;
            if status[p] == 1.0 {
                dtime = tstop[p];
                timewt = gt[p];
                found_death = true;
                break;
            }
            k += 1;
        }

        if !found_death {
            person = nused; // no more deaths (line 200)
        } else {
            // --- Remove subjects no longer at risk (lines 207-230) ---
            while indx1 < nused {
                let p1 = sort1[indx1] as usize;
                if strata[p1] != cstrat || start[p1] < dtime {
                    break;
                }
                if keep[p1] == 0 {
                    indx1 += 1;
                    continue; // skip never-at-risk rows (line 210)
                }
                nrisk -= 1;
                if nrisk == 0 {
                    etasum = 0.0;
                    denom = 0.0;
                    for i in 0..nvar {
                        a[i] = 0.0;
                        for j in 0..=i {
                            cmat[i][j] = 0.0;
                        }
                    }
                } else {
                    etasum -= eta[p1];
                    let risk = (eta[p1] - recenter).exp() * weights[p1];
                    denom -= risk;
                    for i in 0..nvar {
                        a[i] -= risk * covar[i][p1];
                        for j in 0..=i {
                            cmat[i][j] -= risk * covar[i][p1] * covar[j][p1];
                        }
                    }
                }
                indx1 += 1;
            }

            // --- Add new subjects at risk (lines 236-294) ---
            let mut denom2: f64 = 0.0;
            let mut ndead: f64 = 0.0;
            let mut meanwt: f64 = 0.0;
            for i in 0..nvar {
                a2[i] = 0.0;
                for j in 0..nvar {
                    cmat2[i][j] = 0.0;
                }
            }

            while person < nused {
                let p = sort2[person] as usize;
                if strata[p] != cstrat || tstop[p] < dtime {
                    break;
                }
                etasum += eta[p];
                nrisk += 1;

                // Recenter check (lines 250-267)
                if nrisk > 0 && (etasum / nrisk as f64 - recenter).abs() > 200.0 {
                    let temp = etasum / nrisk as f64 - recenter;
                    recenter = etasum / nrisk as f64;

                    if denom > 0.0 {
                        if temp.abs() > 709.0 {
                            panic!("exp overflow due to covariates");
                        }
                        let temp = (-temp).exp();
                        denom *= temp;
                        for i in 0..nvar {
                            a[i] *= temp;
                            for j in 0..nvar {
                                cmat[i][j] *= temp;
                            }
                        }
                    }
                }

                let risk = (eta[p] - recenter).exp() * weights[p];

                if status[p] == 1.0 {
                    // Death (lines 270-283)
                    nevent -= 1;
                    keep[p] = 1;
                    ndead += 1.0;
                    denom2 += risk;
                    meanwt += weights[p];
                    let ne = nevent as usize;
                    for i in 0..nvar {
                        u[i] += weights[p] * covar[i][p];
                        u[i + nvar] += weights[p] * covar[i][p] * timewt;
                        a2[i] += risk * covar[i][p];
                        schoen[ne][i] = covar[i][p];
                        for j in 0..=i {
                            cmat2[i][j] += risk * covar[i][p] * covar[j][p];
                        }
                    }
                } else if start[p] < dtime {
                    // At-risk non-event (lines 285-293)
                    keep[p] = 1;
                    denom += risk;
                    for i in 0..nvar {
                        a[i] += risk * covar[i][p];
                        for j in 0..=i {
                            cmat[i][j] += risk * covar[i][p] * covar[j][p];
                        }
                    }
                }

                person += 1;
            }

            // --- Accumulate into u and imat (lines 298-345) ---
            if ndead > 0.0 {
                if method == 0 || ndead == 1.0 {
                    // Breslow (lines 298-314)
                    denom += denom2;
                    for i in 0..nvar {
                        a[i] += a2[i];
                        let temp = a[i] / denom;
                        u[i] -= meanwt * temp;
                        u[i + nvar] -= meanwt * temp * timewt;
                        for j in 0..=i {
                            cmat[i][j] += cmat2[i][j];
                            let temp2 =
                                meanwt * ((cmat[i][j] - temp * a[j]) / denom);
                            imat[j][i] += temp2;
                            imat[j][i + nvar] += temp2 * timewt;
                            imat[j + nvar][i + nvar] += temp2 * timewt * timewt;
                        }
                        for j in 0..(ndead as usize) {
                            schoen[nevent as usize + j][i] -= temp;
                        }
                    }
                } else {
                    // Efron (lines 316-344)
                    meanwt /= ndead;

                    // Schoenfeld mean-of-means (lines 319-327)
                    for i in 0..nvar {
                        let mut tmean = 0.0_f64;
                        for kk in 0..(ndead as i32) {
                            let temp = (kk + 1) as f64 / ndead;
                            tmean +=
                                (a[i] + a2[i] * temp) / (denom + denom2 * temp);
                        }
                        for j in 0..(ndead as usize) {
                            schoen[nevent as usize + j][i] -= tmean / ndead;
                        }
                    }

                    // U and imat (lines 329-344)
                    for _kk in 0..(ndead as i32) {
                        denom += denom2 / ndead;
                        for i in 0..nvar {
                            a[i] += a2[i] / ndead;
                            let temp = a[i] / denom;
                            u[i] -= meanwt * temp;
                            u[i + nvar] -= meanwt * temp * timewt;
                            for j in 0..=i {
                                cmat[i][j] += cmat2[i][j] / ndead;
                                let temp2 = meanwt
                                    * ((cmat[i][j] - temp * a[j]) / denom);
                                imat[j][i] += temp2;
                                imat[j][i + nvar] += temp2 * timewt;
                                imat[j + nvar][i + nvar] +=
                                    temp2 * timewt * timewt;
                            }
                        }
                    }
                }
            }

            // Post-event recenter check (lines 346-358)
            if nrisk > 0 && (etasum / nrisk as f64).abs() > 200.0 {
                let temp = etasum / nrisk as f64;
                for i in 0..nused {
                    eta[i] -= temp;
                }
                let temp_exp = (-temp).exp();
                denom *= temp_exp;
                for i in 0..nvar {
                    a[i] *= temp_exp;
                    for j in 0..nvar {
                        cmat[i][j] *= temp_exp;
                    }
                }
                etasum = 0.0;
            }
        }
    } // end of accumulation loop

    // --- Symmetrize information matrix (lines 362-373) ---
    for i in 0..nvar {
        for j in 0..i {
            imat[i][j] = imat[j][i];
            imat[i][j + nvar] = imat[j][i + nvar];
            imat[i + nvar][j + nvar] = imat[j + nvar][i + nvar];
        }
    }
    for i in 0..nvar {
        for j in 0..nvar {
            imat[i + nvar][j] = imat[j][i + nvar];
        }
    }

    Zph1Result {
        u,
        imat,
        schoen,
        used,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Build AML test data in the format zph1 expects.
    ///
    /// Returns (gt, xtime, status, covar, eta, weights, strata, sort)
    /// with data in original (unsorted) order and sort index for
    /// ascending time.
    ///
    /// The 23 AML observations are in R's original row order:
    ///   rows 1-11: Maintained (x=0), rows 12-23: Nonmaintained (x=1)
    ///
    /// Model matrix covariate: 0.0 for Maintained, 1.0 for Nonmaintained.
    /// eta = beta * x where beta = 0.915532575014718.
    fn aml_zph_data() -> (
        Vec<f64>,   // gt
        Vec<f64>,   // xtime
        Vec<f64>,   // status
        Vec<Vec<f64>>, // covar (nvar x n)
        Vec<f64>,   // eta
        Vec<f64>,   // weights
        Vec<i32>,   // strata
        Vec<i32>,   // sort
    ) {
        let beta = 0.915532575014718_f64;

        // Original order (R row order): Maintained then Nonmaintained
        // Maintained: times 9,13,13,18,23,28,31,34,45,48,161
        // Nonmaint:   times 5,5,8,8,12,16,23,27,30,33,43,45
        let xtime = vec![
            9.0, 13.0, 13.0, 18.0, 23.0, 28.0, 31.0, 34.0, 45.0, 48.0, 161.0,
            5.0, 5.0, 8.0, 8.0, 12.0, 16.0, 23.0, 27.0, 30.0, 33.0, 43.0, 45.0,
        ];
        let status = vec![
            1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
        ];
        // Model matrix: 0 for Maintained, 1 for Nonmaintained
        let x: Vec<f64> = vec![
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
        ];
        let eta: Vec<f64> = x.iter().map(|&xi| beta * xi).collect();
        let weights = vec![1.0_f64; 23];
        let strata = vec![0_i32; 23];

        // Sort order: order(istrat, y[,1]) - 1  (0-based, ascending time)
        // From R output:
        let sort = vec![
            11, 12, 13, 14, 0, 15, 1, 2, 16, 3, 4, 17, 18, 5, 19, 6, 20, 7, 21, 8, 22, 9, 10,
        ];

        // gt = KM transform, centered by mean at events
        // From R output (gtime vector, length 23, in original obs order):
        let gt = vec![
            -2.134805613066483e-01,
            -1.265240395675178e-01,
            -1.265240395675178e-01,
            -8.304577869795260e-02,
            -3.335633770416380e-02,
             1.157119852772026e-01,
             1.709224752703014e-01,
             2.813434552564987e-01,
             3.917644352426961e-01,
             4.469749252357949e-01,
             5.297906602254429e-01,
            -3.873936047849091e-01,
            -3.873936047849091e-01,
            -3.004370830457787e-01,
            -3.004370830457787e-01,
            -1.700023004370830e-01,
            -8.304577869795260e-02,
            -3.335633770416380e-02,
             6.602254428341381e-02,
             1.157119852772026e-01,
             2.261329652634001e-01,
             3.365539452495974e-01,
             3.917644352426961e-01,
        ];

        (gt, xtime, status, vec![x], eta, weights, strata, sort)
    }

    #[test]
    fn test_zph1_efron_aml() {
        let (gt, xtime, status, mut covar, eta, weights, strata, sort) = aml_zph_data();

        let result = zph1(
            &gt, &xtime, &status, &mut covar, &eta, &weights, &strata,
            1, // Efron (method != 0)
            &sort,
        );

        // Verify dimensions
        assert_eq!(result.u.len(), 2); // 2 * nvar = 2 * 1
        assert_eq!(result.imat.len(), 2);
        assert_eq!(result.imat[0].len(), 2);
        assert_eq!(result.schoen.len(), 18); // 18 events
        assert_eq!(result.used.len(), 1); // 1 stratum
        assert_eq!(result.used[0].len(), 1); // 1 covariate

        // used: covariate varies in the single stratum, so should be nevent=18
        assert_eq!(result.used[0][0], 18);

        // --- Verify u vector (R: .Call(Czph1, ...)$u) ---
        // R: u = [2.113587083130142e-13, 4.234111518259906e-02]
        assert!(
            result.u[0].abs() < 1e-6,
            "u[0]: got {:.15e}, expected ~0",
            result.u[0]
        );
        assert!(
            (result.u[1] - 4.234111518259906e-02).abs() < 1e-6,
            "u[1]: got {:.15e}, expected 4.234111518259906e-02",
            result.u[1]
        );

        // --- Verify imat (R: .Call(Czph1, ...)$imat) ---
        // R imat (2x2):
        //   [3.815676830495708e+00, -5.649298678664945e-02]
        //   [-5.649298678664945e-02, 2.284874976053571e-01]
        let expected_imat = [
            [3.815676830495708e+00, -5.649298678664945e-02],
            [-5.649298678664945e-02, 2.284874976053571e-01],
        ];
        for i in 0..2 {
            for j in 0..2 {
                assert!(
                    (result.imat[i][j] - expected_imat[i][j]).abs() < 1e-6,
                    "imat[{}][{}]: got {:.15e}, expected {:.15e}",
                    i, j, result.imat[i][j], expected_imat[i][j]
                );
            }
        }

        // --- Verify Schoenfeld residuals ---
        // R: .Call(Czph1, ...)$schoen
        let expected_schoen = vec![
            2.771552904422383e-01,
            2.771552904422383e-01,
            3.171209437687265e-01,
            3.171209437687265e-01,
            -6.449877077422687e-01,
            3.335018339190051e-01,
            -6.361881769754381e-01,
            -6.520019105550741e-01,
            -6.802503812347026e-01,
            3.197496187652974e-01,
            3.244904874686475e-01,
            3.335018339190051e-01,
            -5.998180285661624e-01,
            3.479980894449259e-01,
            -5.553683484548400e-01,
            3.751777098469107e-01,
            5.456425117429757e-01,
            0.000000000000000e+00,
        ];

        for i in 0..18 {
            assert!(
                (result.schoen[i][0] - expected_schoen[i]).abs() < 1e-6,
                "schoen[{}]: got {:.15e}, expected {:.15e}",
                i, result.schoen[i][0], expected_schoen[i]
            );
        }

        // --- Verify derived test statistic ---
        // R computes: kk=[1,2], u_sub=[0, u[2]], test = solve(imat, u_sub) %*% u_sub
        // R: chisq = 0.007875077723324, p = 0.929287243364592
        let u_test = [0.0, result.u[1]];
        let det = result.imat[0][0] * result.imat[1][1]
            - result.imat[0][1] * result.imat[1][0];
        let x0 = (result.imat[1][1] * u_test[0] - result.imat[0][1] * u_test[1]) / det;
        let x1 = (-result.imat[1][0] * u_test[0] + result.imat[0][0] * u_test[1]) / det;
        let chisq = x0 * u_test[0] + x1 * u_test[1];

        assert!(
            (chisq - 0.007875077723324).abs() < 1e-6,
            "chisq: got {:.15e}, expected 7.875077723324e-03",
            chisq
        );
    }

    #[test]
    fn test_zph1_breslow_aml() {
        let beta = 0.904219723685700_f64;

        // Same data as Efron test, but with Breslow beta and method=0
        let xtime = vec![
            9.0, 13.0, 13.0, 18.0, 23.0, 28.0, 31.0, 34.0, 45.0, 48.0, 161.0,
            5.0, 5.0, 8.0, 8.0, 12.0, 16.0, 23.0, 27.0, 30.0, 33.0, 43.0, 45.0,
        ];
        let status = vec![
            1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
        ];
        let x: Vec<f64> = vec![
            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
            1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
        ];
        let eta: Vec<f64> = x.iter().map(|&xi| beta * xi).collect();
        let weights = vec![1.0_f64; 23];
        let strata = vec![0_i32; 23];
        let sort = vec![
            11, 12, 13, 14, 0, 15, 1, 2, 16, 3, 4, 17, 18, 5, 19, 6, 20, 7, 21, 8, 22, 9, 10,
        ];
        // Same gt as Efron test (KM transform is model-independent)
        let gt = vec![
            -2.134805613066483e-01, -1.265240395675178e-01, -1.265240395675178e-01,
            -8.304577869795260e-02, -3.335633770416380e-02,  1.157119852772026e-01,
             1.709224752703014e-01,  2.813434552564987e-01,  3.917644352426961e-01,
             4.469749252357949e-01,  5.297906602254429e-01, -3.873936047849091e-01,
            -3.873936047849091e-01, -3.004370830457787e-01, -3.004370830457787e-01,
            -1.700023004370830e-01, -8.304577869795260e-02, -3.335633770416380e-02,
             6.602254428341381e-02,  1.157119852772026e-01,  2.261329652634001e-01,
             3.365539452495974e-01,  3.917644352426961e-01,
        ];

        let mut covar = vec![x];

        let result = zph1(
            &gt, &xtime, &status, &mut covar, &eta, &weights, &strata,
            0, // Breslow
            &sort,
        );

        // R: u = [1.947442207494987e-12, 5.545533920537971e-02]
        assert!(result.u[0].abs() < 1e-6, "u[0]: got {:.15e}", result.u[0]);
        assert!(
            (result.u[1] - 5.545533920537971e-02).abs() < 1e-6,
            "u[1]: got {:.15e}, expected 5.545533920537971e-02",
            result.u[1]
        );

        // R imat:
        //   [3.811005840189830e+00, -5.218883097431451e-02]
        //   [-5.218883097431451e-02, 2.272481634420029e-01]
        let expected_imat = [
            [3.811005840189830e+00, -5.218883097431451e-02],
            [-5.218883097431451e-02, 2.272481634420029e-01],
        ];
        for i in 0..2 {
            for j in 0..2 {
                assert!(
                    (result.imat[i][j] - expected_imat[i][j]).abs() < 1e-6,
                    "imat[{}][{}]: got {:.15e}, expected {:.15e}",
                    i, j, result.imat[i][j], expected_imat[i][j]
                );
            }
        }

        // Schoenfeld residuals
        let expected_schoen = vec![
            2.706689808077694e-01, 2.706689808077694e-01,
            3.081229139527036e-01, 3.081229139527036e-01,
            -6.423930791821341e-01, 3.360211544125261e-01,
            -6.335657737732520e-01, -6.494306824131159e-01,
            -6.791937433003777e-01, 3.208062566996223e-01,
            3.269751306709142e-01, 3.360211544125261e-01,
            -5.970994920483956e-01, 3.505693175868841e-01,
            -5.525730958488196e-01, 3.778333833642988e-01,
            5.484456799003248e-01, 0.000000000000000e+00,
        ];
        for i in 0..18 {
            assert!(
                (result.schoen[i][0] - expected_schoen[i]).abs() < 1e-6,
                "schoen[{}]: got {:.15e}, expected {:.15e}",
                i, result.schoen[i][0], expected_schoen[i]
            );
        }

        // Derived chisq: R reports 0.013575453335470
        let u_test = [0.0, result.u[1]];
        let det = result.imat[0][0] * result.imat[1][1]
            - result.imat[0][1] * result.imat[1][0];
        let x0 = (result.imat[1][1] * u_test[0] - result.imat[0][1] * u_test[1]) / det;
        let x1 = (-result.imat[1][0] * u_test[0] + result.imat[0][0] * u_test[1]) / det;
        let chisq = x0 * u_test[0] + x1 * u_test[1];
        assert!(
            (chisq - 0.013575453335470).abs() < 1e-6,
            "chisq: got {:.15e}, expected 1.3575453335470e-02",
            chisq
        );
    }

    #[test]
    fn test_zph2_efron_counting_process() {
        // Counting process data: 12 observations with start-stop intervals
        let beta = 1.186529009989266_f64;

        let start = vec![0.0, 0.0, 0.0, 5.0, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0, 8.0];
        let stop = vec![5.0, 3.0, 8.0, 10.0, 6.0, 12.0, 15.0, 4.0, 7.0, 9.0, 11.0, 14.0];
        let status = vec![1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0];
        let x = vec![1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
        let mut eta: Vec<f64> = x.iter().map(|&xi| beta * xi).collect();
        let weights = vec![1.0_f64; 12];
        let strata = vec![0_i32; 12];

        // gt = KM transform centered (from R)
        let gt = vec![
            -2.736111111111111e-01,
            -3.847222222222223e-01,
             3.194444444444444e-02,
             3.194444444444444e-02,
            -1.625000000000000e-01,
             2.652777777777777e-01,
             4.402777777777777e-01,
            -3.847222222222223e-01,
            -6.527777777777777e-02,
             3.194444444444444e-02,
             1.486111111111111e-01,
             2.652777777777777e-01,
        ];

        // sort1: order(-istrat, -start) - 1 (descending start)
        let sort1 = vec![11_i32, 3, 6, 0, 1, 2, 4, 5, 7, 8, 9, 10];
        // sort2: order(-istrat, -stop) - 1 (descending stop)
        let sort2 = vec![6_i32, 11, 5, 10, 3, 9, 2, 8, 4, 0, 7, 1];

        let mut covar = vec![x];

        let result = zph2(
            &gt, &start, &stop, &status, &mut covar, &mut eta, &weights,
            &strata, 1, // Efron
            &sort1, &sort2,
        );

        // Verify dimensions
        assert_eq!(result.u.len(), 2);
        assert_eq!(result.imat.len(), 2);
        assert_eq!(result.schoen.len(), 8); // 8 events
        assert_eq!(result.used.len(), 1);
        assert_eq!(result.used[0][0], 8);

        // R: u = [1.387778780781446e-15, -2.830646970445342e-01]
        assert!(
            result.u[0].abs() < 1e-6,
            "u[0]: got {:.15e}, expected ~0",
            result.u[0]
        );
        assert!(
            (result.u[1] - (-2.830646970445342e-01)).abs() < 1e-6,
            "u[1]: got {:.15e}, expected -2.830646970445342e-01",
            result.u[1]
        );

        // R imat (2x2):
        //   [1.577589144454410e+00, -1.010019384782807e-01]
        //   [-1.010019384782807e-01, 7.225641278560578e-02]
        let expected_imat = [
            [1.577589144454410e+00, -1.010019384782807e-01],
            [-1.010019384782807e-01, 7.225641278560578e-02],
        ];
        for i in 0..2 {
            for j in 0..2 {
                assert!(
                    (result.imat[i][j] - expected_imat[i][j]).abs() < 1e-6,
                    "imat[{}][{}]: got {:.15e}, expected {:.15e}",
                    i, j, result.imat[i][j], expected_imat[i][j]
                );
            }
        }

        // Schoenfeld residuals (8 events)
        let expected_schoen = vec![
            2.762008819154212e-01,
            3.372209359200723e-01,
            4.780349658003572e-01,
            -3.531479608244574e-01,
            -4.502240828503541e-01,
            -5.219650341996428e-01,
            2.338802942386051e-01,
            0.000000000000000e+00,
        ];
        for i in 0..8 {
            assert!(
                (result.schoen[i][0] - expected_schoen[i]).abs() < 1e-6,
                "schoen[{}]: got {:.15e}, expected {:.15e}",
                i, result.schoen[i][0], expected_schoen[i]
            );
        }

        // Derived chisq: R reports 1.217900296577096
        let u_test = [0.0, result.u[1]];
        let det = result.imat[0][0] * result.imat[1][1]
            - result.imat[0][1] * result.imat[1][0];
        let x0 = (result.imat[1][1] * u_test[0] - result.imat[0][1] * u_test[1]) / det;
        let x1 = (-result.imat[1][0] * u_test[0] + result.imat[0][0] * u_test[1]) / det;
        let chisq = x0 * u_test[0] + x1 * u_test[1];
        assert!(
            (chisq - 1.217900296577096).abs() < 1e-6,
            "chisq: got {:.15e}, expected 1.217900296577096e+00",
            chisq
        );
    }
}
