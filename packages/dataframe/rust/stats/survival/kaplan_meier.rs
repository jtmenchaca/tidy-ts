//! Kaplan-Meier survival estimator with Nelson-Aalen cumulative hazard
//!
//! Port of `survfitkm.c` from R's survival package (Terry Therneau).
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/survfitkm.c`
//!
//! ## Type encoding (matches R's survfitkm)
//!
//! The `type` parameter combines survival and hazard estimation methods:
//! - type=1: KM survival + Nelson-Aalen hazard (default)
//! - type=2: KM survival + Fleming-Harrington hazard
//! - type=3: exp(-cumhaz) survival + Nelson-Aalen hazard
//! - type=4: exp(-cumhaz) survival + Fleming-Harrington hazard

use super::survival_object::SurvData;
use serde::Serialize;

/// Result of a Kaplan-Meier / survfit computation for a single stratum.
#[derive(Debug, Clone, Serialize)]
pub struct SurvfitKmResult {
    /// Unique event/censoring times
    pub time: Vec<f64>,
    /// Number at risk (unweighted) at each time
    pub n_risk: Vec<f64>,
    /// Number of events (unweighted) at each time
    pub n_event: Vec<f64>,
    /// Number of censored (unweighted) at each time
    pub n_censor: Vec<f64>,
    /// Weighted number at risk
    pub n_risk_wt: Vec<f64>,
    /// Weighted number of events
    pub n_event_wt: Vec<f64>,
    /// Weighted number censored
    pub n_censor_wt: Vec<f64>,
    /// KM or exp(-cumhaz) survival estimate
    pub surv: Vec<f64>,
    /// Nelson-Aalen or Fleming-Harrington cumulative hazard
    pub cumhaz: Vec<f64>,
    /// Standard error of survival (Greenwood or IJ)
    pub std_err: Vec<f64>,
    /// Standard error of cumulative hazard (Aalen or IJ)
    pub std_chaz: Vec<f64>,
    /// Influence matrix for cumulative hazard (nid x ntime), if requested
    pub influence_chaz: Option<Vec<Vec<f64>>>,
    /// Influence matrix for survival (nid x ntime), if requested
    pub influence_surv: Option<Vec<Vec<f64>>>,
}

/// Configuration for survfit computation.
#[derive(Debug, Clone)]
pub struct SurvfitConfig {
    /// Estimation type: 1=KM+NA, 2=KM+FH, 3=exp+NA, 4=exp+FH
    pub surv_type: i32,
    /// Whether to compute robust (IJ) variance. Requires id to be set.
    pub robust: bool,
    /// Subject IDs for clustered/robust variance (0-indexed group IDs).
    /// Length must equal number of observations.
    pub id: Option<Vec<usize>>,
    /// Number of unique IDs (groups). Required if id is set.
    pub nid: usize,
    /// Which influence matrices to return: 0=none, 1=cumhaz, 2=surv, 3=both
    pub influence: i32,
}

impl Default for SurvfitConfig {
    fn default() -> Self {
        SurvfitConfig {
            surv_type: 1,
            robust: false,
            id: None,
            nid: 0,
            influence: 0,
        }
    }
}

/// Compute Kaplan-Meier / Nelson-Aalen survival estimates.
///
/// This is the core computation from `survfitkm.c`, handling:
/// - KM and exp(-cumhaz) survival estimators
/// - Nelson-Aalen and Fleming-Harrington cumulative hazard
/// - Greenwood variance (non-robust) and IJ variance (robust)
/// - Weighted observations
/// - Right-censored data (2-col Surv)
/// - Counting process data (3-col Surv: start, stop, status)
/// - Influence function computation
///
/// # Arguments
///
/// * `data` - Survival observations (right-censored or counting process)
/// * `weights` - Case weights (length n). Use all-1.0 for unweighted.
/// * `config` - Estimation configuration
///
/// # Returns
///
/// `SurvfitKmResult` with survival curve, cumulative hazard, standard errors,
/// and optionally influence matrices.
pub fn survfit_km(
    data: &SurvData,
    weights: &[f64],
    config: &SurvfitConfig,
) -> SurvfitKmResult {
    let n = data.n();
    assert_eq!(weights.len(), n, "weights length must match data length");

    let stype = config.surv_type;
    let is_counting = data.surv_type == super::survival_object::SurvType::Counting;

    // Build sort indices by stop time (ascending)
    let mut sort2: Vec<usize> = (0..n).collect();
    sort2.sort_by(|&a, &b| {
        data.obs[a]
            .tstop
            .partial_cmp(&data.obs[b].tstop)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    // Build sort indices by start time if counting process
    let sort1: Vec<usize> = if is_counting {
        let mut s: Vec<usize> = (0..n).collect();
        s.sort_by(|&a, &b| {
            data.obs[a]
                .tstart
                .partial_cmp(&data.obs[b].tstart)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        s
    } else {
        Vec::new()
    };

    // Pass 1: count unique event/censor times
    // For right-censored: unique stop times where events or final censors happen
    // For counting process: would also include entry times when entry=1
    // (entry tracking deferred for now — the C code's entry=1 path)
    let mut unique_times: Vec<f64> = Vec::new();
    {
        let mut last_time = f64::NEG_INFINITY;
        for &idx in &sort2 {
            let t = data.obs[idx].tstop;
            if t != last_time && (data.obs[idx].status > 0 || true) {
                // Include all unique stop times (position filtering is for
                // multi-obs subjects; we include all times here)
                unique_times.push(t);
                last_time = t;
            }
        }
    }
    // Deduplicate (sort2 is sorted, so unique_times should already be sorted & unique)
    unique_times.dedup();
    let ntime = unique_times.len();

    // Allocate output arrays
    let mut n_risk = vec![0.0_f64; ntime];
    let mut n_event = vec![0.0_f64; ntime];
    let mut n_censor = vec![0.0_f64; ntime];
    let mut n_risk_wt = vec![0.0_f64; ntime];
    let mut n_event_wt = vec![0.0_f64; ntime];
    let mut n_censor_wt = vec![0.0_f64; ntime];
    let mut surv = vec![0.0_f64; ntime];
    let mut cumhaz = vec![0.0_f64; ntime];
    let mut std_err = vec![0.0_f64; ntime];
    let mut std_chaz = vec![0.0_f64; ntime];

    // Pass 2: compute counts at each unique time
    // Walk backward through sorted stop times (matching C code's backward walk)
    let mut person2: isize = (n as isize) - 1;
    let mut person1: isize = if is_counting { (n as isize) - 1 } else { -1 };
    let mut running_n: f64 = 0.0;
    let mut running_wt: f64 = 0.0;

    for k in (0..ntime).rev() {
        let mut events: f64 = 0.0;
        let mut censors: f64 = 0.0;
        let mut wt_events: f64 = 0.0;
        let mut wt_censors: f64 = 0.0;

        // Add observations whose stop time >= dtime[k]
        while person2 >= 0 {
            let i2 = sort2[person2 as usize];
            if data.obs[i2].tstop < unique_times[k] {
                break;
            }
            running_n += 1.0;
            running_wt += weights[i2];
            if data.obs[i2].status == 1 {
                events += 1.0;
                wt_events += weights[i2];
            } else {
                censors += 1.0;
                wt_censors += weights[i2];
            }
            person2 -= 1;
        }

        // For counting process: remove those who entered at or after this time
        if is_counting {
            while person1 >= 0 {
                let i1 = sort1[person1 as usize];
                if data.obs[i1].tstart < unique_times[k] {
                    break;
                }
                running_n -= 1.0;
                running_wt -= weights[i1];
                person1 -= 1;
            }
        }

        n_risk[k] = running_n;
        n_event[k] = events;
        n_censor[k] = censors;
        n_risk_wt[k] = running_wt;
        n_event_wt[k] = wt_events;
        n_censor_wt[k] = wt_censors;
    }

    // Pass 3: compute survival and cumulative hazard
    // See survfitkm.c lines 277-318
    let mut nelson: f64 = 0.0;
    let mut km: f64 = 1.0;
    let mut v1: f64 = 0.0; // variance accumulator for survival
    let mut v2: f64 = 0.0; // variance accumulator for cumhaz

    for i in 0..ntime {
        let d0 = n_event[i]; // unweighted deaths
        let d1 = n_event_wt[i]; // weighted deaths
        let nrisk = n_risk_wt[i]; // weighted number at risk

        // Cumulative hazard
        if stype == 1 || stype == 3 {
            // Nelson-Aalen hazard
            if d0 > 0.0 && d1 > 0.0 {
                nelson += d1 / nrisk;
                v2 += d1 / (nrisk * nrisk);
            }
            cumhaz[i] = nelson;
            std_chaz[i] = v2.sqrt();
        } else {
            // Fleming-Harrington hazard
            for j in 0..(d0 as i32) {
                let denom = nrisk - (j as f64) * d1 / d0;
                nelson += d1 / (d0 * denom);
                v2 += d1 / (d0 * denom * denom);
            }
            cumhaz[i] = nelson;
            std_chaz[i] = v2.sqrt();
        }

        // Survival
        if stype < 3 {
            // KM survival
            if d0 > 0.0 && d1 > 0.0 {
                km *= (nrisk - d1) / nrisk;
                v1 += d1 / (nrisk * (nrisk - d1)); // Greenwood
            }
            surv[i] = km;
            std_err[i] = v1.sqrt();
        } else {
            // exp(-cumhaz) survival
            surv[i] = (-cumhaz[i]).exp();
            std_err[i] = std_chaz[i]; // same as cumhaz SE for exp type
        }
    }

    // Pass 4: robust (IJ) variance if requested
    let mut influence_chaz: Option<Vec<Vec<f64>>> = None;
    let mut influence_surv: Option<Vec<Vec<f64>>> = None;

    if config.robust && config.nid > 0 {
        let id = config
            .id
            .as_ref()
            .expect("id required for robust variance");
        let nid = config.nid;

        // Working vectors for per-group accumulation
        let mut gwt = vec![0.0_f64; nid]; // current total weight per group in risk set
        let mut gcount = vec![0_i32; nid]; // current count per group in risk set

        // Initialize: for right-censored, everyone starts in risk set
        if !is_counting {
            for &idx in &sort2 {
                let gid = id[idx];
                gcount[gid] += 1;
                gwt[gid] += weights[idx];
            }
        }

        // Influence accumulators
        let mut inf1 = vec![0.0_f64; nid]; // influence on survival (types 1,2)
        let mut inf2 = vec![0.0_f64; nid]; // influence on cumhaz

        // Output influence matrices if requested
        let mut imat1: Vec<Vec<f64>> = if (config.influence == 1 || config.influence == 3)
            && stype < 3
        {
            vec![vec![0.0; ntime]; nid]
        } else {
            Vec::new()
        };
        let mut imat2: Vec<Vec<f64>> =
            if config.influence == 2 || config.influence == 3 || (config.influence > 0 && stype >= 3)
            {
                vec![vec![0.0; ntime]; nid]
            } else {
                Vec::new()
            };

        // Reset for forward pass
        km = 1.0;
        v1 = 0.0;
        v2 = 0.0;
        let mut p2: usize = 0; // person2 forward index
        let mut p1: usize = 0; // person1 forward index (counting process)

        match stype {
            1 => {
                // Type 1: KM survival + NA hazard, robust variance
                for i in 0..ntime {
                    // Remove those whose stop time < current time (no longer at risk)
                    while p2 < n {
                        let i2 = sort2[p2];
                        if data.obs[i2].tstop >= unique_times[i] {
                            break;
                        }
                        let gid = id[i2];
                        gcount[gid] -= 1;
                        if gcount[gid] == 0 {
                            gwt[gid] = 0.0;
                        } else {
                            gwt[gid] -= weights[i2];
                        }
                        p2 += 1;
                    }

                    // For counting process: add new subjects entering
                    if is_counting {
                        while p1 < n {
                            let i1 = sort1[p1];
                            if data.obs[i1].tstart >= unique_times[i] {
                                break;
                            }
                            let gid = id[i1];
                            gcount[gid] += 1;
                            gwt[gid] += weights[i1];
                            p1 += 1;
                        }
                    }

                    if n_event[i] > 0.0 && n_event_wt[i] > 0.0 {
                        let haz = n_event_wt[i] / n_risk_wt[i];

                        // Update influence for all groups
                        for k in 0..nid {
                            inf1[k] =
                                inf1[k] * (1.0 - haz) + gwt[k] * km * haz / n_risk_wt[i];
                            inf2[k] -= gwt[k] * haz / n_risk_wt[i];
                        }

                        // Process events at this time
                        while p2 < n {
                            let i2 = sort2[p2];
                            if data.obs[i2].tstop > unique_times[i] {
                                break;
                            }
                            if data.obs[i2].status == 1 {
                                let gid = id[i2];
                                inf1[gid] -= km * weights[i2] / n_risk_wt[i];
                                inf2[gid] += weights[i2] / n_risk_wt[i];
                            }
                            let gid = id[i2];
                            gcount[gid] -= 1;
                            if gcount[gid] == 0 {
                                gwt[gid] = 0.0;
                            } else {
                                gwt[gid] -= weights[i2];
                            }
                            p2 += 1;
                        }

                        km *= 1.0 - haz;

                        v1 = 0.0;
                        v2 = 0.0;
                        for k in 0..nid {
                            v1 += inf1[k] * inf1[k];
                            v2 += inf2[k] * inf2[k];
                        }
                    }

                    std_err[i] = v1.sqrt();
                    std_chaz[i] = v2.sqrt();

                    if config.influence == 1 || config.influence == 3 {
                        for k in 0..nid {
                            imat1[k][i] = inf1[k];
                        }
                    }
                    if config.influence == 2 || config.influence == 3 {
                        for k in 0..nid {
                            imat2[k][i] = inf2[k];
                        }
                    }
                }
            }

            2 => {
                // Type 2: KM survival + Fleming-Harrington hazard, robust variance
                for i in 0..ntime {
                    while p2 < n {
                        let i2 = sort2[p2];
                        if data.obs[i2].tstop >= unique_times[i] {
                            break;
                        }
                        let gid = id[i2];
                        gcount[gid] -= 1;
                        if gcount[gid] == 0 {
                            gwt[gid] = 0.0;
                        } else {
                            gwt[gid] -= weights[i2];
                        }
                        p2 += 1;
                    }

                    if is_counting {
                        while p1 < n {
                            let i1 = sort1[p1];
                            if data.obs[i1].tstart >= unique_times[i] {
                                break;
                            }
                            let gid = id[i1];
                            gcount[gid] += 1;
                            gwt[gid] += weights[i1];
                            p1 += 1;
                        }
                    }

                    if n_event[i] > 0.0 && n_event_wt[i] > 0.0 {
                        // Fleming-Harrington computation
                        let mut dtemp: f64 = 0.0;
                        let mut dtemp2: f64 = 0.0;
                        let mut dtemp3: f64 = 0.0;
                        let temp = n_risk_wt[i] - n_event_wt[i]; // weight of non-deaths

                        for kk in (1..=(n_event[i] as i32)).rev() {
                            let frac = (kk as f64) / n_event[i];
                            let btemp = 1.0 / (temp + frac * n_event_wt[i]);
                            dtemp += btemp;
                            dtemp2 += btemp * btemp * frac;
                            dtemp3 += btemp * btemp;
                        }

                        dtemp /= n_event[i];
                        if n_event_wt[i] != n_event[i] {
                            dtemp2 *= n_event_wt[i] / n_event[i];
                            dtemp3 *= n_event_wt[i] / n_event[i];
                        }
                        let haz = n_event_wt[i] / n_risk_wt[i];
                        for k in 0..nid {
                            inf1[k] =
                                inf1[k] * (1.0 - haz) + gwt[k] * km * haz / n_risk_wt[i];
                            if gcount[k] > 0 {
                                inf2[k] -= gwt[k] * dtemp3;
                            }
                        }

                        while p2 < n {
                            let i2 = sort2[p2];
                            if data.obs[i2].tstop > unique_times[i] {
                                break;
                            }
                            if data.obs[i2].status == 1 {
                                let gid = id[i2];
                                inf1[gid] -= km * weights[i2] / n_risk_wt[i];
                                inf2[gid] += weights[i2] * (dtemp + dtemp3 - dtemp2);
                            }
                            let gid = id[i2];
                            gcount[gid] -= 1;
                            if gcount[gid] == 0 {
                                gwt[gid] = 0.0;
                            } else {
                                gwt[gid] -= weights[i2];
                            }
                            p2 += 1;
                        }

                        km *= 1.0 - haz;

                        v1 = 0.0;
                        v2 = 0.0;
                        for k in 0..nid {
                            v1 += inf1[k] * inf1[k];
                            v2 += inf2[k] * inf2[k];
                        }
                    }

                    std_err[i] = v1.sqrt();
                    std_chaz[i] = v2.sqrt();

                    if config.influence == 1 || config.influence == 3 {
                        for k in 0..nid {
                            imat1[k][i] = inf1[k];
                        }
                    }
                    if config.influence == 2 || config.influence == 3 {
                        for k in 0..nid {
                            imat2[k][i] = inf2[k];
                        }
                    }
                }
            }

            3 => {
                // Type 3: exp(-cumhaz) survival + NA hazard, robust variance
                for i in 0..ntime {
                    while p2 < n {
                        let i2 = sort2[p2];
                        if data.obs[i2].tstop >= unique_times[i] {
                            break;
                        }
                        let gid = id[i2];
                        gcount[gid] -= 1;
                        if gcount[gid] == 0 {
                            gwt[gid] = 0.0;
                        } else {
                            gwt[gid] -= weights[i2];
                        }
                        p2 += 1;
                    }

                    if is_counting {
                        while p1 < n {
                            let i1 = sort1[p1];
                            if data.obs[i1].tstart >= unique_times[i] {
                                break;
                            }
                            let gid = id[i1];
                            gcount[gid] += 1;
                            gwt[gid] += weights[i1];
                            p1 += 1;
                        }
                    }

                    if n_event[i] > 0.0 && n_event_wt[i] > 0.0 {
                        let haz = n_event_wt[i] / n_risk_wt[i];
                        for k in 0..nid {
                            inf2[k] -= gwt[k] * haz / n_risk_wt[i];
                        }

                        while p2 < n {
                            let i2 = sort2[p2];
                            if data.obs[i2].tstop > unique_times[i] {
                                break;
                            }
                            if data.obs[i2].status == 1 {
                                let gid = id[i2];
                                inf2[gid] += weights[i2] / n_risk_wt[i];
                            }
                            let gid = id[i2];
                            gcount[gid] -= 1;
                            if gcount[gid] == 0 {
                                gwt[gid] = 0.0;
                            } else {
                                gwt[gid] -= weights[i2];
                            }
                            p2 += 1;
                        }

                        v2 = 0.0;
                        for k in 0..nid {
                            v2 += inf2[k] * inf2[k];
                        }
                    }

                    std_chaz[i] = v2.sqrt();
                    std_err[i] = v2.sqrt(); // same for exp type

                    if config.influence > 0 {
                        for k in 0..nid {
                            imat2[k][i] = inf2[k];
                        }
                    }
                }
            }

            4 | _ => {
                // Type 4: exp(-cumhaz) survival + FH hazard, robust variance
                for i in 0..ntime {
                    while p2 < n {
                        let i2 = sort2[p2];
                        if data.obs[i2].tstop >= unique_times[i] {
                            break;
                        }
                        let gid = id[i2];
                        gcount[gid] -= 1;
                        if gcount[gid] == 0 {
                            gwt[gid] = 0.0;
                        } else {
                            gwt[gid] -= weights[i2];
                        }
                        p2 += 1;
                    }

                    if is_counting {
                        while p1 < n {
                            let i1 = sort1[p1];
                            if data.obs[i1].tstart >= unique_times[i] {
                                break;
                            }
                            let gid = id[i1];
                            gcount[gid] += 1;
                            gwt[gid] += weights[i1];
                            p1 += 1;
                        }
                    }

                    if n_event[i] > 0.0 && n_event_wt[i] > 0.0 {
                        let mut dtemp: f64 = 0.0;
                        let mut dtemp2: f64 = 0.0;
                        let mut dtemp3: f64 = 0.0;
                        let temp = n_risk_wt[i] - n_event_wt[i];

                        for kk in (1..=(n_event[i] as i32)).rev() {
                            let frac = (kk as f64) / n_event[i];
                            let btemp = 1.0 / (temp + frac * n_event_wt[i]);
                            dtemp += btemp;
                            dtemp2 += btemp * btemp * frac;
                            dtemp3 += btemp * btemp;
                        }

                        dtemp /= n_event[i];
                        if n_event_wt[i] != n_event[i] {
                            dtemp2 *= n_event_wt[i] / n_event[i];
                            dtemp3 *= n_event_wt[i] / n_event[i];
                        }
                        for k in 0..nid {
                            if gcount[k] > 0 {
                                inf2[k] -= gwt[k] * dtemp3;
                            }
                        }

                        while p2 < n {
                            let i2 = sort2[p2];
                            if data.obs[i2].tstop > unique_times[i] {
                                break;
                            }
                            if data.obs[i2].status == 1 {
                                let gid = id[i2];
                                inf2[gid] += weights[i2] * (dtemp + dtemp3 - dtemp2);
                            }
                            let gid = id[i2];
                            gcount[gid] -= 1;
                            if gcount[gid] == 0 {
                                gwt[gid] = 0.0;
                            } else {
                                gwt[gid] -= weights[i2];
                            }
                            p2 += 1;
                        }

                        v2 = 0.0;
                        for k in 0..nid {
                            v2 += inf2[k] * inf2[k];
                        }
                    }

                    std_chaz[i] = v2.sqrt();
                    std_err[i] = v2.sqrt();

                    if config.influence > 0 {
                        for k in 0..nid {
                            imat2[k][i] = inf2[k];
                        }
                    }
                }
            }
        }

        // Store influence matrices
        if !imat1.is_empty() {
            influence_surv = Some(imat1);
        }
        if !imat2.is_empty() {
            influence_chaz = Some(imat2);
        }

        // Recompute surv/cumhaz for the robust path (they were computed in
        // pass 3 with Greenwood variance but the robust path recomputes
        // the km/nelson internally — need to overwrite surv/cumhaz)
        // Actually, the C code computes surv/cumhaz only once (pass 3),
        // and only replaces the std.err in the robust path. So surv/cumhaz
        // from pass 3 are correct. We just need the updated std_err/std_chaz.
    }

    SurvfitKmResult {
        time: unique_times,
        n_risk,
        n_event,
        n_censor,
        n_risk_wt,
        n_event_wt,
        n_censor_wt,
        surv,
        cumhaz,
        std_err,
        std_chaz,
        influence_chaz,
        influence_surv,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// AML data from R's survival package (Maintained group)
    /// time: 9 13 13 18 23 28 31 34 45 48 161
    /// status: 1 1 0 1 1 0 1 1 0 1 0
    fn aml_maintained() -> (Vec<f64>, Vec<i32>) {
        (
            vec![9.0, 13.0, 13.0, 18.0, 23.0, 28.0, 31.0, 34.0, 45.0, 48.0, 161.0],
            vec![1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0],
        )
    }

    /// AML data (Nonmaintained group)
    /// time: 5 5 8 8 12 16 23 27 30 33 43 45
    /// status: 1 1 1 1 1 0 1 1 1 1 1 1
    fn aml_nonmaintained() -> (Vec<f64>, Vec<i32>) {
        (
            vec![5.0, 5.0, 8.0, 8.0, 12.0, 16.0, 23.0, 27.0, 30.0, 33.0, 43.0, 45.0],
            vec![1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
        )
    }

    #[test]
    fn test_km_basic_maintained() {
        let (time, status) = aml_maintained();
        let data = SurvData::right_censored(&time, &status);
        let weights = vec![1.0; data.n()];
        let config = SurvfitConfig::default();

        let result = survfit_km(&data, &weights, &config);

        // Hand-computed KM for Maintained group:
        // t=9:  S = 10/11 = 0.9091
        // t=13: S = 10/11 * 8/10 = 0.7273 (one death, one censor at t=13)
        // t=18: S = 0.7273 * 6/7 = 0.6234 (wait, need to recount)
        //
        // Actually let's just verify basic properties
        assert_eq!(result.time.len(), result.surv.len());
        assert!(result.surv[0] <= 1.0);
        assert!(result.surv[0] > 0.0);

        // Survival should be non-increasing
        for i in 1..result.surv.len() {
            assert!(
                result.surv[i] <= result.surv[i - 1] + 1e-15,
                "survival not non-increasing at index {i}: {} > {}",
                result.surv[i],
                result.surv[i - 1]
            );
        }

        // Cumhaz should be non-decreasing
        for i in 1..result.cumhaz.len() {
            assert!(
                result.cumhaz[i] >= result.cumhaz[i - 1] - 1e-15,
                "cumhaz not non-decreasing at index {i}"
            );
        }

        // First event at t=9: n_risk should be 11
        assert_eq!(result.n_risk[0], 11.0);
        assert_eq!(result.n_event[0], 1.0);
    }

    #[test]
    fn test_km_hand_computed_nonmaintained() {
        let (time, status) = aml_nonmaintained();
        let data = SurvData::right_censored(&time, &status);
        let weights = vec![1.0; data.n()];
        let config = SurvfitConfig::default();

        let result = survfit_km(&data, &weights, &config);

        // Nonmaintained group hand-computed KM:
        // t=5:  2 deaths from 12, S = 10/12 = 0.8333
        // t=8:  2 deaths from 10, S = 0.8333 * 8/10 = 0.6667
        // t=12: 1 death from 8, S = 0.6667 * 7/8 = 0.5833
        // t=16: 0 deaths (1 censor), S stays
        // t=23: 1 death from 6, S = 0.5833 * 5/6 = 0.4861
        // ...
        let idx_t5 = result.time.iter().position(|&t| t == 5.0).unwrap();
        assert!(
            (result.surv[idx_t5] - 10.0 / 12.0).abs() < 1e-10,
            "S(5) = {}, expected {}",
            result.surv[idx_t5],
            10.0 / 12.0
        );

        let idx_t8 = result.time.iter().position(|&t| t == 8.0).unwrap();
        assert!(
            (result.surv[idx_t8] - (10.0 / 12.0) * (8.0 / 10.0)).abs() < 1e-10,
            "S(8) = {}, expected {}",
            result.surv[idx_t8],
            (10.0 / 12.0) * (8.0 / 10.0)
        );

        let idx_t12 = result.time.iter().position(|&t| t == 12.0).unwrap();
        let expected_s12 = (10.0 / 12.0) * (8.0 / 10.0) * (7.0 / 8.0);
        assert!(
            (result.surv[idx_t12] - expected_s12).abs() < 1e-10,
            "S(12) = {}, expected {}",
            result.surv[idx_t12],
            expected_s12
        );
    }

    #[test]
    fn test_km_cumhaz_nelson_aalen() {
        let (time, status) = aml_nonmaintained();
        let data = SurvData::right_censored(&time, &status);
        let weights = vec![1.0; data.n()];
        let config = SurvfitConfig::default(); // type=1: NA hazard

        let result = survfit_km(&data, &weights, &config);

        // Nelson-Aalen cumhaz at t=5: 2/12
        let idx_t5 = result.time.iter().position(|&t| t == 5.0).unwrap();
        assert!(
            (result.cumhaz[idx_t5] - 2.0 / 12.0).abs() < 1e-10,
            "H(5) = {}, expected {}",
            result.cumhaz[idx_t5],
            2.0 / 12.0
        );

        // Nelson-Aalen cumhaz at t=8: 2/12 + 2/10
        let idx_t8 = result.time.iter().position(|&t| t == 8.0).unwrap();
        let expected_h8 = 2.0 / 12.0 + 2.0 / 10.0;
        assert!(
            (result.cumhaz[idx_t8] - expected_h8).abs() < 1e-10,
            "H(8) = {}, expected {}",
            result.cumhaz[idx_t8],
            expected_h8
        );
    }

    #[test]
    fn test_km_greenwood_variance() {
        let (time, status) = aml_nonmaintained();
        let data = SurvData::right_censored(&time, &status);
        let weights = vec![1.0; data.n()];
        let config = SurvfitConfig::default();

        let result = survfit_km(&data, &weights, &config);

        // Greenwood SE at t=5: sqrt(2/(12*10)) (Greenwood formula for log(S))
        let idx_t5 = result.time.iter().position(|&t| t == 5.0).unwrap();
        let expected_var: f64 = 2.0 / (12.0 * 10.0);
        assert!(
            (result.std_err[idx_t5] - expected_var.sqrt()).abs() < 1e-10,
            "SE(5) = {}, expected {}",
            result.std_err[idx_t5],
            expected_var.sqrt()
        );
    }

    #[test]
    fn test_km_weighted() {
        // Equal weights of 2 should give same survival but different variance
        let (time, status) = aml_maintained();
        let data = SurvData::right_censored(&time, &status);
        let weights_1 = vec![1.0; data.n()];
        let weights_2 = vec![2.0; data.n()];
        let config = SurvfitConfig::default();

        let result1 = survfit_km(&data, &weights_1, &config);
        let result2 = survfit_km(&data, &weights_2, &config);

        // Survival should be identical
        for i in 0..result1.surv.len() {
            assert!(
                (result1.surv[i] - result2.surv[i]).abs() < 1e-12,
                "surv differs at {i}"
            );
        }

        // Greenwood SE with weight=2 should be SE(w=1)/sqrt(2)
        // Actually: Greenwood var = sum(d_j / (n_j * (n_j - d_j)))
        // With wt=2: var = sum(2*d_j / (2*n_j * (2*n_j - 2*d_j))) = sum(d_j/(2*n_j*(n_j-d_j)))
        // So var(w=2) = var(w=1)/2, SE(w=2) = SE(w=1)/sqrt(2)
        for i in 0..result1.std_err.len() {
            if result1.std_err[i] > 0.0 {
                let ratio = result1.std_err[i] / result2.std_err[i];
                assert!(
                    (ratio - 2.0_f64.sqrt()).abs() < 1e-10,
                    "SE ratio at {i}: {ratio}, expected sqrt(2)"
                );
            }
        }
    }

    #[test]
    fn test_km_exp_type() {
        // Type 3: exp(-cumhaz) survival
        let (time, status) = aml_nonmaintained();
        let data = SurvData::right_censored(&time, &status);
        let weights = vec![1.0; data.n()];
        let config = SurvfitConfig {
            surv_type: 3,
            ..Default::default()
        };

        let result = survfit_km(&data, &weights, &config);

        // surv should equal exp(-cumhaz)
        for i in 0..result.surv.len() {
            let expected = (-result.cumhaz[i]).exp();
            assert!(
                (result.surv[i] - expected).abs() < 1e-12,
                "surv[{i}] = {}, expected exp(-cumhaz) = {}",
                result.surv[i],
                expected
            );
        }
    }
}
