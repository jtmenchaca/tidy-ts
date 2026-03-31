//! WASM bindings for survival analysis functions

#![cfg(feature = "wasm")]

use super::ag_cox_regression::{agfit4, AgfitConfig};
use super::ag_cox_residuals::{agmart3, agscore3};
use super::concordance::concordance3;
use super::cox_regression::{coxfit6, CoxMethod, CoxfitConfig};
use super::cox_residuals::{coxmart, coxscho};
use super::cox_residuals_derived::{deviance_residuals, dfbeta_residuals, dfbetas_residuals};
use super::cox_score_residuals::coxscore2;
use super::data_splitting::survsplit;
use super::fine_gray_transform::finegray_transform;
use super::kaplan_meier::{survfit_km, SurvfitConfig};
use super::logrank_test::survdiff2;
use super::proportional_hazards_test::zph1;
use super::survival_object::SurvData;
use serde::Serialize;
use indexmap::IndexMap;
use wasm_bindgen::prelude::*;

/// Comprehensive result from coxph fitting (matches R's coxph object fields)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoxphWasmResult {
    pub coefficients: Vec<f64>,
    pub var: Vec<Vec<f64>>,
    pub loglik: [f64; 2],
    pub score: f64,
    pub iter: i32,
    pub method: String,
    pub means: Vec<f64>,
    pub n: usize,
    pub nevent: usize,
    pub linear_predictors: Vec<f64>,
    pub residuals: Vec<f64>,
    pub score_residuals: Vec<Vec<f64>>,
    pub predictor_names: Vec<String>,
}

/// Result from survfit KM (matches R's survfit object fields)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SurvfitWasmResult {
    pub time: Vec<f64>,
    pub n_risk: Vec<f64>,
    pub n_event: Vec<f64>,
    pub n_censor: Vec<f64>,
    pub surv: Vec<f64>,
    pub cumhaz: Vec<f64>,
    pub std_err: Vec<f64>,
    pub std_chaz: Vec<f64>,
    pub strata: Option<Vec<usize>>,
    pub strata_names: Option<Vec<String>>,
}

/// Result from survdiff (log-rank test)
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SurvdiffWasmResult {
    pub n: Vec<usize>,
    pub obs: Vec<f64>,
    pub exp: Vec<f64>,
    pub var: Vec<Vec<f64>>,
    pub chisq: f64,
    pub df: usize,
    pub pvalue: f64,
}

// ── coxph ──────────────────────────────────────────────────────────────────

/// Fit a Cox proportional hazards model.
///
/// # Arguments
/// * `time_json` - JSON array of event/censoring times
/// * `status_json` - JSON array of event indicators (1=event, 0=censored)
/// * `covariates_json` - JSON object mapping covariate names to arrays
/// * `options_json` - JSON object with optional params: method, maxiter, eps, weights, offset
#[wasm_bindgen]
pub fn coxph_wasm(
    time_json: &str,
    status_json: &str,
    covariates_json: &str,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    let time: Vec<f64> =
        serde_json::from_str(time_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status_f64: Vec<f64> =
        serde_json::from_str(status_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let covars: IndexMap<String, Vec<f64>> =
        serde_json::from_str(covariates_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = time.len();
    let status: Vec<i32> = status_f64.iter().map(|&s| s as i32).collect();

    // Parse options
    let opts = if let Some(ref opts) = options_json {
        parse_coxph_options(opts, n)?
    } else {
        CoxphParsedOptions {
            method: CoxMethod::Efron,
            maxiter: 25,
            eps: 1e-9,
            weights: vec![1.0; n],
            offset: vec![0.0; n],
            strata: vec![0i32; n],
            init: None,
            nocenter: false,
        }
    };
    let method = opts.method;
    let maxiter = opts.maxiter;
    let eps = opts.eps;
    let weights = opts.weights;
    let offset = opts.offset;
    let strata_vec = opts.strata;

    // Collect covariate names and columns
    let predictor_names: Vec<String> = covars.keys().cloned().collect();
    let nvar = predictor_names.len();

    if nvar == 0 {
        return Err(JsValue::from_str("No covariates provided"));
    }

    // Sort data by (strata, time ascending), events before censored at ties
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| {
        strata_vec[a]
            .cmp(&strata_vec[b])
            .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
            .then(status[b].cmp(&status[a]))
    });

    let sorted_time: Vec<f64> = order.iter().map(|&i| time[i]).collect();
    let sorted_status: Vec<i32> = order.iter().map(|&i| status[i]).collect();
    let sorted_weights: Vec<f64> = order.iter().map(|&i| weights[i]).collect();
    let sorted_offset: Vec<f64> = order.iter().map(|&i| offset[i]).collect();

    // Build covariate matrix: covar[var][obs] sorted
    // Save original for residual computation (coxfit6 modifies covar in-place)
    let mut covar: Vec<Vec<f64>> = Vec::with_capacity(nvar);
    for name in &predictor_names {
        let col = covars
            .get(name)
            .ok_or_else(|| JsValue::from_str(&format!("Missing covariate: {}", name)))?;
        let sorted_col: Vec<f64> = order.iter().map(|&i| col[i]).collect();
        covar.push(sorted_col);
    }
    let covar_orig = covar.clone();

    // Build strata markers: strata[i] = 1 means last obs in stratum
    let sorted_strata: Vec<i32> = if strata_vec.iter().all(|&s| s == 0) {
        let mut s = vec![0i32; n];
        if n > 0 {
            s[n - 1] = 1;
        }
        s
    } else {
        // Sort strata values by the same ordering
        let sorted_strat_vals: Vec<i32> = order.iter().map(|&i| strata_vec[i]).collect();
        let mut markers = vec![0i32; n];
        for i in 0..n - 1 {
            if sorted_strat_vals[i] != sorted_strat_vals[i + 1] {
                markers[i] = 1;
            }
        }
        if n > 0 {
            markers[n - 1] = 1;
        }
        markers
    };

    let init = opts.init.unwrap_or_else(|| vec![0.0; nvar]);
    // R default: nocenter=c(-1, 0, 1) — variables where all values are in {-1,0,1}
    // are NOT centered. When nocenter=true, nothing is centered.
    let doscale: Vec<bool> = if opts.nocenter {
        vec![false; nvar]
    } else {
        covar
            .iter()
            .map(|col| !col.iter().all(|&v| v == -1.0 || v == 0.0 || v == 1.0))
            .collect()
    };
    let config = CoxfitConfig {
        maxiter,
        eps,
        toler: 1e-12,
        method,
        doscale,
    };

    let result = if method == CoxMethod::Exact {
        // Exact method expects data sorted DESCENDING by time (large to small)
        // This is opposite to coxfit6 which uses ascending order
        let mut exact_order: Vec<usize> = (0..n).collect();
        exact_order.sort_by(|&a, &b| {
            time[b]
                .partial_cmp(&time[a])
                .unwrap()
                .then(status[b].cmp(&status[a]))
        });

        let exact_time: Vec<f64> = exact_order.iter().map(|&i| time[i]).collect();
        let exact_status: Vec<i32> = exact_order.iter().map(|&i| status[i]).collect();
        let exact_offset: Vec<f64> = exact_order.iter().map(|&i| offset[i]).collect();

        let mut exact_covar: Vec<Vec<f64>> = Vec::with_capacity(nvar);
        for name in &predictor_names {
            let col = covars.get(name).unwrap();
            let sorted_col: Vec<f64> = exact_order.iter().map(|&i| col[i]).collect();
            exact_covar.push(sorted_col);
        }

        // Center covariates (same as R's scale())
        if !opts.nocenter {
            for j in 0..nvar {
                let mean = exact_covar[j].iter().sum::<f64>() / n as f64;
                for v in exact_covar[j].iter_mut() {
                    *v -= mean;
                }
            }
        }

        // Strata markers: strata[i] > 0 for first obs of each stratum
        let exact_strata: Vec<i32> = if strata_vec.iter().all(|&s| s == 0) {
            let mut s = vec![0i32; n];
            if n > 0 {
                s[0] = 1;
            }
            s
        } else {
            let exact_strat_vals: Vec<i32> = exact_order.iter().map(|&i| strata_vec[i]).collect();
            let mut markers = vec![0i32; n];
            if n > 0 {
                markers[0] = 1;
            }
            for i in 1..n {
                if exact_strat_vals[i] != exact_strat_vals[i - 1] {
                    markers[i] = 1;
                }
            }
            markers
        };

        use super::cox_exact::coxexact;
        coxexact(
            &exact_time,
            &exact_status,
            &exact_covar,
            &exact_strata,
            &exact_offset,
            &init,
            &config,
        )
    } else {
        coxfit6(
            &sorted_time,
            &sorted_status,
            &covar,
            &sorted_strata,
            &sorted_offset,
            &sorted_weights,
            &init,
            &config,
        )
    };

    // Compute linear predictor and martingale residuals on original order
    // Use covar_orig (unmodified by coxfit6 centering/scaling)
    // Center the linear predictor: lp = X*beta - means*beta (matches R's coxph.fit)
    let nevent = sorted_status.iter().filter(|&&s| s == 1).count();
    let center: f64 = (0..nvar).map(|j| result.coef[j] * result.means[j]).sum();
    let mut linear_pred = vec![0.0; n];
    for i in 0..n {
        let orig_idx = order[i];
        let mut eta = sorted_offset[i] - center;
        for j in 0..nvar {
            eta += result.coef[j] * covar_orig[j][i];
        }
        linear_pred[orig_idx] = eta;
    }

    // Compute score for martingale residuals
    let score: Vec<f64> = (0..n).map(|i| {
        let mut eta = sorted_offset[i];
        for j in 0..nvar {
            eta += result.coef[j] * covar_orig[j][i];
        }
        eta.exp()
    }).collect();

    let method_int = match method {
        CoxMethod::Breslow => 0,
        CoxMethod::Efron | CoxMethod::Exact => 1,
    };

    // Martingale residuals (sorted order)
    let mart_sorted = coxmart(
        &sorted_time,
        &sorted_status,
        &score,
        &sorted_strata,
        &sorted_weights,
        method_int,
    );

    // Unsort martingale residuals back to original order
    let mut mart = vec![0.0; n];
    for i in 0..n {
        mart[order[i]] = mart_sorted[i];
    }

    // Score residuals (sorted order)
    let status_f64_sorted: Vec<f64> = sorted_status.iter().map(|&s| s as f64).collect();
    let score_resid_sorted = coxscore2(
        &sorted_time,
        &status_f64_sorted,
        &covar,
        &sorted_strata,
        &score,
        &sorted_weights,
        method_int,
    );

    // Unsort score residuals
    let mut score_resid = vec![vec![0.0; n]; nvar];
    for j in 0..nvar {
        for i in 0..n {
            score_resid[j][order[i]] = score_resid_sorted[j][i];
        }
    }

    let wasm_result = CoxphWasmResult {
        coefficients: result.coef,
        var: result.imat,
        loglik: result.loglik,
        score: result.sctest,
        iter: result.iter,
        method: match method {
            CoxMethod::Breslow => "breslow".to_string(),
            CoxMethod::Efron => "efron".to_string(),
            CoxMethod::Exact => "exact".to_string(),
        },
        means: result.means,
        n,
        nevent,
        linear_predictors: linear_pred,
        residuals: mart,
        score_residuals: score_resid,
        predictor_names,
    };

    serde_wasm_bindgen::to_value(&wasm_result).map_err(|e| JsValue::from_str(&e.to_string()))
}

struct CoxphParsedOptions {
    method: CoxMethod,
    maxiter: i32,
    eps: f64,
    weights: Vec<f64>,
    offset: Vec<f64>,
    strata: Vec<i32>,
    init: Option<Vec<f64>>,
    nocenter: bool,
}

fn parse_coxph_options(json: &str, n: usize) -> Result<CoxphParsedOptions, JsValue> {
    let parsed: serde_json::Value =
        serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let method = match parsed.get("method").and_then(|v| v.as_str()) {
        Some("breslow") => CoxMethod::Breslow,
        Some("exact") => CoxMethod::Exact,
        _ => CoxMethod::Efron,
    };

    let maxiter = parsed
        .get("maxiter")
        .and_then(|v| v.as_i64())
        .unwrap_or(25) as i32;

    let eps = parsed.get("eps").and_then(|v| v.as_f64()).unwrap_or(1e-9);

    let weights = if let Some(w) = parsed.get("weights") {
        serde_json::from_value(w.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?
    } else {
        vec![1.0; n]
    };

    let offset = if let Some(o) = parsed.get("offset") {
        serde_json::from_value(o.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?
    } else {
        vec![0.0; n]
    };

    let strata: Vec<i32> = if let Some(s) = parsed.get("strata") {
        serde_json::from_value(s.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?
    } else {
        vec![0; n]
    };

    let init: Option<Vec<f64>> = if let Some(i) = parsed.get("init") {
        Some(serde_json::from_value(i.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?)
    } else {
        None
    };

    let nocenter = parsed
        .get("nocenter")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    Ok(CoxphParsedOptions {
        method,
        maxiter,
        eps,
        weights,
        offset,
        strata,
        init,
        nocenter,
    })
}

// ── survfit_km ─────────────────────────────────────────────────────────────

/// Compute Kaplan-Meier survival curves.
///
/// # Arguments
/// * `time_json` - JSON array of event/censoring times
/// * `status_json` - JSON array of event indicators (1=event, 0=censored)
/// * `options_json` - JSON with optional: groups (int[]), weights, stype, ctype
#[wasm_bindgen]
pub fn survfit_km_wasm(
    time_json: &str,
    status_json: &str,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    let time: Vec<f64> =
        serde_json::from_str(time_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status_f64: Vec<f64> =
        serde_json::from_str(status_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = time.len();
    let status: Vec<i32> = status_f64.iter().map(|&s| s as i32).collect();

    // Parse options
    let (groups, weights, stype, influence) = if let Some(ref opts) = options_json {
        parse_survfit_options(opts, n)?
    } else {
        (None, vec![1.0; n], 1i32, 0i32)
    };

    if let Some(ref grp) = groups {
        // Stratified: compute per-group KM
        let mut unique_groups: Vec<i32> = grp.clone();
        unique_groups.sort();
        unique_groups.dedup();

        let mut all_results = SurvfitWasmResult {
            time: Vec::new(),
            n_risk: Vec::new(),
            n_event: Vec::new(),
            n_censor: Vec::new(),
            surv: Vec::new(),
            cumhaz: Vec::new(),
            std_err: Vec::new(),
            std_chaz: Vec::new(),
            strata: Some(Vec::new()),
            strata_names: Some(unique_groups.iter().map(|g| g.to_string()).collect()),
        };

        for &g in &unique_groups {
            let mask: Vec<bool> = grp.iter().map(|&gi| gi == g).collect();
            let sub_time: Vec<f64> = mask
                .iter()
                .zip(time.iter())
                .filter(|(m, _)| **m)
                .map(|(_, &t)| t)
                .collect();
            let sub_status: Vec<i32> = mask
                .iter()
                .zip(status.iter())
                .filter(|(m, _)| **m)
                .map(|(_, &s)| s)
                .collect();
            let sub_weights: Vec<f64> = mask
                .iter()
                .zip(weights.iter())
                .filter(|(m, _)| **m)
                .map(|(_, &w)| w)
                .collect();

            let data = SurvData::right_censored(&sub_time, &sub_status);
            let config = SurvfitConfig {
                surv_type: stype,
                robust: false,
                id: None,
                nid: 0,
                influence,
            };
            let km = survfit_km(&data, &sub_weights, &config);

            let len = km.time.len();
            all_results
                .strata
                .as_mut()
                .unwrap()
                .push(len);
            all_results.time.extend(km.time);
            all_results.n_risk.extend(km.n_risk);
            all_results.n_event.extend(km.n_event);
            all_results.n_censor.extend(km.n_censor);
            all_results.surv.extend(km.surv);
            all_results.cumhaz.extend(km.cumhaz);
            all_results.std_err.extend(km.std_err);
            all_results.std_chaz.extend(km.std_chaz);
        }

        serde_wasm_bindgen::to_value(&all_results)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    } else {
        // Single group KM
        let data = SurvData::right_censored(&time, &status);
        let config = SurvfitConfig {
            surv_type: stype,
            robust: false,
            id: None,
            nid: 0,
            influence,
        };
        let km = survfit_km(&data, &weights, &config);

        let result = SurvfitWasmResult {
            time: km.time,
            n_risk: km.n_risk,
            n_event: km.n_event,
            n_censor: km.n_censor,
            surv: km.surv,
            cumhaz: km.cumhaz,
            std_err: km.std_err,
            std_chaz: km.std_chaz,
            strata: None,
            strata_names: None,
        };

        serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

fn parse_survfit_options(
    json: &str,
    n: usize,
) -> Result<(Option<Vec<i32>>, Vec<f64>, i32, i32), JsValue> {
    let parsed: serde_json::Value =
        serde_json::from_str(json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let groups: Option<Vec<i32>> = parsed
        .get("groups")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_default());

    let weights = if let Some(w) = parsed.get("weights") {
        serde_json::from_value(w.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?
    } else {
        vec![1.0; n]
    };

    // stype: 1=KM+NA (default), 2=KM+FH, 3=exp+NA, 4=exp+FH
    let stype = parsed
        .get("stype")
        .and_then(|v| v.as_i64())
        .unwrap_or(1) as i32;

    let influence = parsed
        .get("influence")
        .and_then(|v| v.as_i64())
        .unwrap_or(0) as i32;

    Ok((groups, weights, stype, influence))
}

// ── survdiff (log-rank test) ───────────────────────────────────────────────

/// Compute log-rank test (survdiff).
///
/// # Arguments
/// * `time_json` - JSON array of event/censoring times
/// * `status_json` - JSON array of event indicators
/// * `group_json` - JSON array of group assignments (0-based integers)
/// * `options_json` - optional: rho, strata
#[wasm_bindgen]
pub fn survdiff_wasm(
    time_json: &str,
    status_json: &str,
    group_json: &str,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    let time: Vec<f64> =
        serde_json::from_str(time_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status_f64: Vec<f64> =
        serde_json::from_str(status_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let group: Vec<i32> =
        serde_json::from_str(group_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = time.len();
    let status: Vec<i32> = status_f64.iter().map(|&s| s as i32).collect();

    let (rho, strata_vec) = if let Some(ref opts) = options_json {
        let parsed: serde_json::Value =
            serde_json::from_str(opts).map_err(|e| JsValue::from_str(&e.to_string()))?;
        let rho = parsed.get("rho").and_then(|v| v.as_f64()).unwrap_or(0.0);
        let strata: Vec<i32> = parsed
            .get("strata")
            .map(|v| serde_json::from_value(v.clone()).unwrap_or_else(|_| vec![0; n]))
            .unwrap_or_else(|| vec![0; n]);
        (rho, strata)
    } else {
        (0.0, vec![0i32; n])
    };

    // Sort by strata then time
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| {
        strata_vec[a]
            .cmp(&strata_vec[b])
            .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
            .then(status[b].cmp(&status[a]))
    });

    let sorted_time: Vec<f64> = order.iter().map(|&i| time[i]).collect();
    let sorted_status: Vec<i32> = order.iter().map(|&i| status[i]).collect();
    // survdiff2 expects 1-based groups (R convention), so add 1
    let sorted_group: Vec<i32> = order.iter().map(|&i| group[i] + 1).collect();
    let sorted_strata: Vec<i32> = order.iter().map(|&i| strata_vec[i]).collect();

    let ngroup = *sorted_group.iter().max().unwrap_or(&1) as usize;

    // Convert strata to 0-based contiguous IDs and count unique strata
    let mut unique_strata: Vec<i32> = sorted_strata.clone();
    unique_strata.sort();
    unique_strata.dedup();
    let nstrat = unique_strata.len();

    // survdiff2 expects a marker array: 1 = last observation of this stratum, 0 otherwise
    // Data is already sorted by strata, so mark transitions
    let mut strata_markers: Vec<i32> = vec![0; n];
    for i in 0..n {
        if i == n - 1 || sorted_strata[i] != sorted_strata[i + 1] {
            strata_markers[i] = 1;
        }
    }

    let result = survdiff2(
        &sorted_time,
        &sorted_status,
        &sorted_group,
        &strata_markers,
        ngroup,
        nstrat,
        rho,
    );

    // Count observations per group
    let mut group_n = vec![0usize; ngroup];
    for &g in &group {
        group_n[g as usize] += 1;
    }

    // Compute p-value from chi-squared
    let pvalue = if result.df > 0 {
        crate::stats::distributions::chi_squared::pchisq(result.chisq, result.df as f64, false, false)
    } else {
        1.0
    };

    let wasm_result = SurvdiffWasmResult {
        n: group_n,
        obs: result.observed,
        exp: result.expected,
        var: result.var,
        chisq: result.chisq,
        df: result.df,
        pvalue,
    };

    serde_wasm_bindgen::to_value(&wasm_result).map_err(|e| JsValue::from_str(&e.to_string()))
}

// ── Residuals ──────────────────────────────────────────────────────────────

/// Compute Cox model residuals.
///
/// # Arguments
/// * `time_json` - JSON array of event/censoring times
/// * `status_json` - JSON array of event indicators
/// * `coef_json` - JSON array of fitted coefficients
/// * `covariates_json` - JSON object mapping covariate names to arrays
/// * `options_json` - optional: method, type (mart/score/scho/deviance/dfbeta/dfbetas),
///                    weights, offset, var (variance matrix for dfbeta/dfbetas)
#[wasm_bindgen]
pub fn cox_residuals_wasm(
    time_json: &str,
    status_json: &str,
    coef_json: &str,
    covariates_json: &str,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    let time: Vec<f64> =
        serde_json::from_str(time_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status_f64: Vec<f64> =
        serde_json::from_str(status_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let coef: Vec<f64> =
        serde_json::from_str(coef_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let covars: IndexMap<String, Vec<f64>> =
        serde_json::from_str(covariates_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = time.len();
    let status: Vec<i32> = status_f64.iter().map(|&s| s as i32).collect();

    let (resid_type, method_int, weights, offset, strata_input) = if let Some(ref opts) =
        options_json
    {
        let parsed: serde_json::Value =
            serde_json::from_str(opts).map_err(|e| JsValue::from_str(&e.to_string()))?;
        let rtype = parsed
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("martingale")
            .to_string();
        let method = match parsed.get("method").and_then(|v| v.as_str()) {
            Some("breslow") | Some("exact") => 0i32,
            _ => 1i32,
        };
        let wts: Vec<f64> = parsed
            .get("weights")
            .map(|v| serde_json::from_value(v.clone()).unwrap_or_else(|_| vec![1.0; n]))
            .unwrap_or_else(|| vec![1.0; n]);
        let off: Vec<f64> = parsed
            .get("offset")
            .map(|v| serde_json::from_value(v.clone()).unwrap_or_else(|_| vec![0.0; n]))
            .unwrap_or_else(|| vec![0.0; n]);
        let strata: Vec<i32> = parsed
            .get("strata")
            .map(|v| serde_json::from_value(v.clone()).unwrap_or_else(|_| vec![0; n]))
            .unwrap_or_else(|| vec![0; n]);
        (rtype, method, wts, off, strata)
    } else {
        (
            "martingale".to_string(),
            1i32,
            vec![1.0; n],
            vec![0.0; n],
            vec![0i32; n],
        )
    };

    // Collect covariates in sorted name order
    let predictor_names: Vec<String> = covars.keys().cloned().collect();
    let nvar = predictor_names.len();

    // Sort data by (strata, time), events before censored at ties
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| {
        strata_input[a]
            .cmp(&strata_input[b])
            .then(time[a].partial_cmp(&time[b]).unwrap_or(std::cmp::Ordering::Equal))
            .then(status[b].cmp(&status[a]))
    });

    let sorted_time: Vec<f64> = order.iter().map(|&i| time[i]).collect();
    let sorted_status: Vec<i32> = order.iter().map(|&i| status[i]).collect();
    let sorted_weights: Vec<f64> = order.iter().map(|&i| weights[i]).collect();
    let sorted_offset: Vec<f64> = order.iter().map(|&i| offset[i]).collect();
    let sorted_strata: Vec<i32> = order.iter().map(|&i| strata_input[i]).collect();

    let mut covar: Vec<Vec<f64>> = Vec::with_capacity(nvar);
    for name in &predictor_names {
        let col = covars.get(name).unwrap();
        let sorted_col: Vec<f64> = order.iter().map(|&i| col[i]).collect();
        covar.push(sorted_col);
    }

    // coxmart and coxscho use marker convention (1 = last obs in stratum)
    let mut strata_marker = vec![0i32; n];
    for i in 0..n.saturating_sub(1) {
        if sorted_strata[i] != sorted_strata[i + 1] {
            strata_marker[i] = 1;
        }
    }
    if n > 0 {
        strata_marker[n - 1] = 1;
    }
    // coxscore2 uses same-value convention (same int = same stratum)
    let strata_sameval = sorted_strata.clone();

    // Compute score = exp(linear predictor)
    let score: Vec<f64> = (0..n)
        .map(|i| {
            let mut eta = sorted_offset[i];
            for j in 0..nvar {
                eta += coef[j] * covar[j][i];
            }
            eta.exp()
        })
        .collect();

    match resid_type.as_str() {
        "martingale" | "mart" => {
            let mart_sorted = coxmart(
                &sorted_time,
                &sorted_status,
                &score,
                &strata_marker,
                &sorted_weights,
                method_int,
            );
            let mut mart = vec![0.0; n];
            for i in 0..n {
                mart[order[i]] = mart_sorted[i];
            }
            serde_wasm_bindgen::to_value(&mart)
                .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        "score" => {
            let status_f64_s: Vec<f64> = sorted_status.iter().map(|&s| s as f64).collect();
            let sr = coxscore2(
                &sorted_time,
                &status_f64_s,
                &covar,
                &strata_sameval,
                &score,
                &sorted_weights,
                method_int,
            );
            // Unsort
            let mut result = vec![vec![0.0; n]; nvar];
            for j in 0..nvar {
                for i in 0..n {
                    result[j][order[i]] = sr[j][i];
                }
            }
            serde_wasm_bindgen::to_value(&result)
                .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        "schoenfeld" | "scho" => {
            let start = vec![0.0; n];
            let stop = sorted_time.clone();
            let event: Vec<f64> = sorted_status.iter().map(|&s| s as f64).collect();
            // R passes score * weights to coxscho (residuals.coxph.R line 99)
            let weighted_score: Vec<f64> = score
                .iter()
                .zip(sorted_weights.iter())
                .map(|(&s, &w)| s * w)
                .collect();
            let (death_times, scho) = coxscho(
                &start, &stop, &event, &covar, &weighted_score, &strata_marker, method_int,
            );
            #[derive(Serialize)]
            struct SchoResult {
                time: Vec<f64>,
                residuals: Vec<Vec<f64>>,
            }
            serde_wasm_bindgen::to_value(&SchoResult {
                time: death_times,
                residuals: scho,
            })
            .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        "deviance" => {
            let mart_sorted = coxmart(
                &sorted_time,
                &sorted_status,
                &score,
                &strata_marker,
                &sorted_weights,
                method_int,
            );
            let status_f64_s: Vec<f64> = sorted_status.iter().map(|&s| s as f64).collect();
            let dev_sorted = deviance_residuals(&mart_sorted, &status_f64_s);
            let mut dev = vec![0.0; n];
            for i in 0..n {
                dev[order[i]] = dev_sorted[i];
            }
            serde_wasm_bindgen::to_value(&dev)
                .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        "dfbeta" | "dfbetas" => {
            let status_f64_s: Vec<f64> = sorted_status.iter().map(|&s| s as f64).collect();
            let sr = coxscore2(
                &sorted_time,
                &status_f64_s,
                &covar,
                &strata_sameval,
                &score,
                &sorted_weights,
                method_int,
            );

            // Parse variance matrix from options
            let var: Vec<Vec<f64>> = if let Some(ref opts) = options_json {
                let parsed: serde_json::Value =
                    serde_json::from_str(opts).map_err(|e| JsValue::from_str(&e.to_string()))?;
                parsed
                    .get("var")
                    .map(|v| serde_json::from_value(v.clone()).unwrap_or_default())
                    .unwrap_or_default()
            } else {
                Vec::new()
            };

            if var.is_empty() {
                return Err(JsValue::from_str("dfbeta/dfbetas requires var matrix"));
            }

            let dfb = dfbeta_residuals(&sr, &var);

            let result = if resid_type == "dfbetas" {
                dfbetas_residuals(&dfb, &var)
            } else {
                dfb
            };

            // Unsort
            let mut unsorted = vec![vec![0.0; n]; nvar];
            for j in 0..nvar {
                for i in 0..n {
                    unsorted[j][order[i]] = result[j][i];
                }
            }
            serde_wasm_bindgen::to_value(&unsorted)
                .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        _ => Err(JsValue::from_str(&format!(
            "Unknown residual type: {}",
            resid_type
        ))),
    }
}

// ── survsplit ──────────────────────────────────────────────────────────────

/// Split survival data at specified cut points.
#[wasm_bindgen]
pub fn survsplit_wasm(
    tstart_json: &str,
    tstop_json: &str,
    cut_json: &str,
) -> Result<JsValue, JsValue> {
    let tstart: Vec<f64> =
        serde_json::from_str(tstart_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let tstop: Vec<f64> =
        serde_json::from_str(tstop_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let cut: Vec<f64> =
        serde_json::from_str(cut_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = survsplit(&tstart, &tstop, &cut);

    #[derive(Serialize)]
    struct SplitResult {
        row: Vec<usize>,
        interval: Vec<usize>,
        start: Vec<f64>,
        end: Vec<f64>,
        censor: Vec<bool>,
    }

    serde_wasm_bindgen::to_value(&SplitResult {
        row: result.row,
        interval: result.interval,
        start: result.start,
        end: result.end,
        censor: result.censor,
    })
    .map_err(|e| JsValue::from_str(&e.to_string()))
}

// ── concordance ────────────────────────────────────────────────────────────

/// Build a balanced binary tree index mapping, matching R's survival::btree().
/// Input: n = number of unique values. Output: vector of length n where
/// output[i] = 0-based tree index for the (i+1)-th smallest unique value.
fn btree(n: usize) -> Vec<i32> {
    fn tfun(n: usize, id: i32, power: usize, out: &mut Vec<i32>) {
        if n == 1 {
            out.push(id);
        } else if n == 2 {
            out.push(2 * id + 1);
            out.push(id);
        } else if n == 3 {
            out.push(2 * id + 1);
            out.push(id);
            out.push(2 * id + 2);
        } else {
            let nleft = if n == power * 2 {
                power
            } else {
                std::cmp::min(power - 1, n - power / 2)
            };
            tfun(nleft, 2 * id + 1, power / 2, out);
            out.push(id);
            tfun(n - (nleft + 1), 2 * id + 2, power / 2, out);
        }
    }
    let mut result = Vec::with_capacity(n);
    if n == 0 {
        return result;
    }
    let power = 2_usize.pow(((n - 1) as f64).log2().floor() as u32);
    tfun(n, 0, power, &mut result);
    result
}

/// Rank raw x values to 0-based balanced binary tree indices, matching R's
/// `utemp <- match(risk, sort(unique(risk))); bindex <- btree(max(utemp))[utemp]`
fn rank_to_btree_indices(x: &[f64]) -> Vec<i32> {
    let mut unique_vals: Vec<f64> = x.to_vec();
    unique_vals.sort_by(|a, b| a.partial_cmp(b).unwrap());
    unique_vals.dedup();

    let tree_map = btree(unique_vals.len());

    x.iter()
        .map(|&val| {
            let rank = unique_vals
                .binary_search_by(|v| v.partial_cmp(&val).unwrap())
                .unwrap();
            tree_map[rank]
        })
        .collect()
}

/// Compute concordance statistic.
#[wasm_bindgen]
pub fn concordance_wasm(
    time_json: &str,
    status_json: &str,
    x_json: &str,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    let time: Vec<f64> =
        serde_json::from_str(time_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status: Vec<f64> =
        serde_json::from_str(status_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let x_raw: Vec<f64> =
        serde_json::from_str(x_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = time.len();
    let wt = vec![1.0; n];
    let timewt = vec![1.0; n];

    // Rank x values to balanced binary tree indices (like R's concordance.fit)
    let x = rank_to_btree_indices(&x_raw);

    // Sort by (-time, status, x) — matches R's order(-y[,1], y[,2], risk)
    // Descending time, ascending status, ascending bindex
    let mut sort_stop: Vec<i32> = (0..n as i32).collect();
    sort_stop.sort_by(|&a, &b| {
        let ai = a as usize;
        let bi = b as usize;
        time[bi].partial_cmp(&time[ai]).unwrap()  // descending time
            .then(status[ai].partial_cmp(&status[bi]).unwrap())  // ascending status
            .then(x[ai].cmp(&x[bi]))  // ascending bindex
    });

    // Parse options
    let reverse = options_json
        .as_deref()
        .and_then(|s| serde_json::from_str::<serde_json::Value>(s).ok())
        .and_then(|v| v.get("reverse").and_then(|r| r.as_bool()))
        .unwrap_or(false);

    let doresid = false;
    let mut result = concordance3(&time, &status, &x, &wt, &timewt, &sort_stop, doresid);

    // reverse=TRUE swaps concordant/discordant (R's concordance.R lines 435-447)
    if reverse {
        result.count.swap(0, 1);
    }

    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

// ── cox.zph ────────────────────────────────────────────────────────────────

/// Proportional hazards test (cox.zph).
#[wasm_bindgen]
pub fn cox_zph_wasm(
    time_json: &str,
    status_json: &str,
    coef_json: &str,
    covariates_json: &str,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    let time: Vec<f64> =
        serde_json::from_str(time_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status_f64: Vec<f64> =
        serde_json::from_str(status_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let coef: Vec<f64> =
        serde_json::from_str(coef_json).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let covars: IndexMap<String, Vec<f64>> =
        serde_json::from_str(covariates_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = time.len();

    let method_int = if let Some(ref opts) = options_json {
        let parsed: serde_json::Value =
            serde_json::from_str(opts).map_err(|e| JsValue::from_str(&e.to_string()))?;
        match parsed.get("method").and_then(|v| v.as_str()) {
            Some("breslow") => 0i32,
            _ => 1i32,
        }
    } else {
        1i32
    };

    // Sort and prepare
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| {
        time[a]
            .partial_cmp(&time[b])
            .unwrap()
            .then(status_f64[b].partial_cmp(&status_f64[a]).unwrap_or(std::cmp::Ordering::Equal))
    });

    let sorted_time: Vec<f64> = order.iter().map(|&i| time[i]).collect();
    let sorted_status: Vec<f64> = order.iter().map(|&i| status_f64[i]).collect();

    let predictor_names: Vec<String> = covars.keys().cloned().collect();
    let nvar = predictor_names.len();

    let mut covar: Vec<Vec<f64>> = Vec::with_capacity(nvar);
    for name in &predictor_names {
        let col = covars.get(name).unwrap();
        let sorted_col: Vec<f64> = order.iter().map(|&i| col[i]).collect();
        covar.push(sorted_col);
    }

    let weights = vec![1.0; n];
    let mut strata = vec![0i32; n];
    if n > 0 {
        strata[n - 1] = 1;
    }

    // Compute eta = X*beta
    let eta: Vec<f64> = (0..n)
        .map(|i| {
            let mut e = 0.0;
            for j in 0..nvar {
                e += coef[j] * covar[j][i];
            }
            e
        })
        .collect();

    // Default time transform: rank
    let gt: Vec<f64> = {
        let mut ranks = vec![0.0; n];
        // Use sorted_time to compute ranks of event times
        let event_times: Vec<f64> = sorted_time
            .iter()
            .zip(sorted_status.iter())
            .filter(|(_, s)| **s > 0.0)
            .map(|(&t, _)| t)
            .collect();
        let nevent = event_times.len();
        for (rank, &_t) in event_times.iter().enumerate() {
            ranks[rank] = (rank + 1) as f64 / nevent as f64;
        }
        ranks
    };

    let sort: Vec<i32> = (0..n as i32).collect();

    let result = zph1(
        &gt,
        &sorted_time,
        &sorted_status,
        &mut covar,
        &eta,
        &weights,
        &strata,
        method_int,
        &sort,
    );

    #[derive(Serialize)]
    struct ZphResult {
        table: Vec<Vec<f64>>,
        schoenfeld: Vec<Vec<f64>>,
    }

    // The table would need to be computed from u and imat
    // For now return the raw components
    serde_wasm_bindgen::to_value(&ZphResult {
        table: result.u.iter().map(|v| vec![*v]).collect(),
        schoenfeld: result.schoen,
    })
    .map_err(|e| JsValue::from_str(&e.to_string()))
}

// ── survfit from Cox model ──────────────────────────────────────────────

/// Result from survfit on a Cox model
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SurvfitCoxWasmResult {
    pub time: Vec<f64>,
    pub n_risk: Vec<f64>,
    pub n_event: Vec<f64>,
    pub surv: Vec<f64>,
    pub cumhaz: Vec<f64>,
    pub std_err: Vec<f64>,
}

/// Compute survival curves from a fitted Cox model.
///
/// Implements the R logic from `agsurv.R` + `coxsurv.fit` `expand()`:
/// - ctype=1 (Nelson-Aalen/Breslow): haz = nevent/nrisk_weighted
/// - ctype=2 (Efron): uses agsurv5 for tied deaths
/// - stype=1 (KP): product-limit via agsurv4
/// - stype=2 (exp): surv = exp(-cumhaz)
///
/// # Arguments
/// * `input_json` - JSON object with:
///   - time: event/censoring times
///   - status: event indicators (0/1)
///   - coef: fitted coefficients (empty array for null model)
///   - covariates: covariate name→values map (empty for null model)
///   - offset: offset terms (optional)
///   - stype: 1=KP, 2=exp(-cumhaz) (default 2)
///   - ctype: 1=Nelson-Aalen, 2=Efron (default 1)
///   - censor: whether to include censoring times in output (default true)
///   - newx: covariate values at which to predict (optional, for S(t|newx))
///   - means: covariate means from fitted model (optional, for centering)
///   - var: variance-covariance matrix from fitted model (fit$var, optional, for variance)
#[wasm_bindgen]
pub fn survfit_cox_wasm(input_json: &str) -> Result<JsValue, JsValue> {
    let parsed: serde_json::Value =
        serde_json::from_str(input_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let time: Vec<f64> = serde_json::from_value(
        parsed.get("time").cloned().unwrap_or_default(),
    )
    .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let start: Option<Vec<f64>> = parsed
        .get("start")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_default());
    let status_f64: Vec<f64> = serde_json::from_value(
        parsed.get("status").cloned().unwrap_or_default(),
    )
    .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = time.len();
    let status: Vec<i32> = status_f64.iter().map(|&s| s as i32).collect();

    let coef: Vec<f64> = parsed
        .get("coef")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_default())
        .unwrap_or_default();

    let covars: IndexMap<String, Vec<f64>> = parsed
        .get("covariates")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_default())
        .unwrap_or_default();

    let offset: Vec<f64> = parsed
        .get("offset")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_else(|_| vec![0.0; n]))
        .unwrap_or_else(|| vec![0.0; n]);

    let stype = parsed
        .get("stype")
        .and_then(|v| v.as_i64())
        .unwrap_or(2) as i32;
    let ctype = parsed
        .get("ctype")
        .and_then(|v| v.as_i64())
        .unwrap_or(1) as i32;
    let censor = parsed
        .get("censor")
        .and_then(|v| v.as_bool())
        .unwrap_or(true);

    // newx: covariate values for prediction (e.g., list(x=0) in R)
    let newx: Vec<f64> = parsed
        .get("newx")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_default())
        .unwrap_or_default();

    // means: covariate means from fitted model (for centering)
    let means: Vec<f64> = parsed
        .get("means")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_default())
        .unwrap_or_default();

    // var: variance-covariance matrix from fitted model (for variance adjustment)
    let var_matrix: Vec<Vec<f64>> = parsed
        .get("var")
        .map(|v| serde_json::from_value(v.clone()).unwrap_or_default())
        .unwrap_or_default();

    // Collect covariates
    let predictor_names: Vec<String> = covars.keys().cloned().collect();
    let nvar = predictor_names.len();

    // Compute offset mean (R: offset.mean <- mean(offset))
    let offset_mean = if offset.iter().all(|&o| o == 0.0) {
        0.0
    } else {
        offset.iter().sum::<f64>() / n as f64
    };

    // R: xcenter <- sum(object$means * beta) + offset.mean
    let xcenter = if !means.is_empty() && !coef.is_empty() {
        means.iter().zip(coef.iter()).map(|(m, b)| m * b).sum::<f64>() + offset_mean
    } else {
        offset_mean
    };

    // Sort by time ascending, events first at ties
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| {
        time[a]
            .partial_cmp(&time[b])
            .unwrap()
            .then(status[b].cmp(&status[a]))
    });

    let sorted_time: Vec<f64> = order.iter().map(|&i| time[i]).collect();
    let sorted_status: Vec<i32> = order.iter().map(|&i| status[i]).collect();
    let sorted_offset: Vec<f64> = order.iter().map(|&i| offset[i]).collect();

    // Compute risk scores for each observation (sorted)
    let risk: Vec<f64> = (0..n)
        .map(|i| {
            let orig = order[i];
            let mut eta = offset[orig] - xcenter;
            for (j, name) in predictor_names.iter().enumerate() {
                if let Some(col) = covars.get(name) {
                    eta += coef[j] * col[orig];
                }
            }
            eta.exp()
        })
        .collect();

    let weights: Vec<f64> = parsed
        .get("weights")
        .and_then(|v| serde_json::from_value::<Vec<f64>>(v.clone()).ok())
        .map(|w| order.iter().map(|&i| w[i]).collect())
        .unwrap_or_else(|| vec![1.0_f64; n]);

    // Compute per-unique-time aggregates using the agsurv R logic:
    // time_u = unique sorted death/censor times
    // nevent = weighted events at each time
    // nrisk = reverse cumsum of weighted risk scores
    let mut unique_times: Vec<f64> = Vec::new();
    let mut nevent_at: Vec<f64> = Vec::new();
    let mut ncensor_at: Vec<f64> = Vec::new();
    let mut nrisk_at: Vec<f64> = Vec::new();

    // Group by unique time
    {
        let mut i = 0;
        while i < n {
            let t = sorted_time[i];
            let mut ev = 0.0;
            let mut cen = 0.0;
            while i < n && sorted_time[i] == t {
                if sorted_status[i] == 1 {
                    ev += weights[i];
                } else {
                    cen += weights[i];
                }
                i += 1;
            }
            unique_times.push(t);
            nevent_at.push(ev);
            ncensor_at.push(cen);
        }
    }

    // nrisk = reverse cumsum of weighted risk at each unique time
    // Also track xsum (weighted covariate sums) for xbar computation
    let ntime = unique_times.len();
    let mut wrisk_at = vec![0.0_f64; ntime];
    let mut irisk_at = vec![0.0_f64; ntime];
    let mut xsum_at: Vec<Vec<f64>> = vec![vec![0.0; ntime]; nvar];
    {
        let mut tidx = 0;
        let mut i = 0;
        while i < n {
            let t = sorted_time[i];
            while tidx < ntime && unique_times[tidx] < t {
                tidx += 1;
            }
            while i < n && sorted_time[i] == t {
                let wr = weights[i] * risk[i];
                wrisk_at[tidx] += wr;
                irisk_at[tidx] += weights[i];
                let orig = order[i];
                for (j, name) in predictor_names.iter().enumerate() {
                    if let Some(col) = covars.get(name) {
                        xsum_at[j][tidx] += wr * col[orig];
                    }
                }
                i += 1;
            }
        }
    }

    // Reverse cumsum for number at risk
    {
        let mut cumwr = 0.0;
        let mut cumir = 0.0;
        for i in (0..ntime).rev() {
            cumwr += wrisk_at[i];
            cumir += irisk_at[i];
            nrisk_at.push(cumwr);
            irisk_at[i] = cumir;
        }
        nrisk_at.reverse();
    }
    // Reverse cumsum for xsum
    for j in 0..nvar {
        let mut cum = 0.0;
        for i in (0..ntime).rev() {
            cum += xsum_at[j][i];
            xsum_at[j][i] = cum;
        }
    }

    // Left-truncation adjustment for counting process (start-stop) data.
    // R agsurv lines 28-37: subtract "not yet entered" subjects from risk sets.
    if let Some(ref start_times) = start {
        let sorted_start: Vec<f64> = order.iter().map(|&i| start_times[i]).collect();

        // Unique entry times, sorted
        let mut entry_times: Vec<f64> = sorted_start.clone();
        entry_times.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        entry_times.dedup();

        // esum = rcumsum(rowsum(wrisk, start)) — weighted risk by entry time
        let n_entry = entry_times.len();
        let mut esum_wr = vec![0.0_f64; n_entry];
        let mut esum_ir = vec![0.0_f64; n_entry];
        let mut esum_x: Vec<Vec<f64>> = vec![vec![0.0; n_entry]; nvar];
        for i in 0..n {
            let s = sorted_start[i];
            let eidx = entry_times.iter().position(|&e| e == s).unwrap();
            let wr = weights[i] * risk[i];
            esum_wr[eidx] += wr;
            esum_ir[eidx] += weights[i];
            let orig = order[i];
            for (j, name) in predictor_names.iter().enumerate() {
                if let Some(col) = covars.get(name) {
                    esum_x[j][eidx] += wr * col[orig];
                }
            }
        }
        // Reverse cumsum of entry sums
        {
            let mut cum_wr = 0.0;
            let mut cum_ir = 0.0;
            for i in (0..n_entry).rev() {
                cum_wr += esum_wr[i];
                cum_ir += esum_ir[i];
                esum_wr[i] = cum_wr;
                esum_ir[i] = cum_ir;
            }
            for j in 0..nvar {
                let mut cum = 0.0;
                for i in (0..n_entry).rev() {
                    cum += esum_x[j][i];
                    esum_x[j][i] = cum;
                }
            }
        }

        // R agsurv: at event time t, subtract subjects not yet entered (start >= t).
        // esum[i] = rcumsum of wrisk grouped by entry time = total risk of subjects
        // with start >= entry_times[i].
        // We want: subjects with start > t should be subtracted. But R's Surv(start,stop)
        // convention is that subjects enter AFTER their start time, so subjects with
        // start == t are also not yet in the risk set.
        // Therefore: subtract esum at the first entry_time >= t.
        // If no entry_time >= t, all subjects have entered → subtract 0.
        for i in 0..ntime {
            let t = unique_times[i];
            // Find first entry_time >= t
            let eidx = entry_times.iter().position(|&e| e >= t);
            if let Some(idx) = eidx {
                nrisk_at[i] -= esum_wr[idx];
                irisk_at[i] -= esum_ir[idx];
                for j in 0..nvar {
                    xsum_at[j][i] -= esum_x[j][idx];
                }
            }
            // else: all entry times < t, all subjects entered, subtract 0
        }
    }

    // xbar = xsum / nrisk at each time (weighted mean covariate among at-risk)
    let xbar_at: Vec<Vec<f64>> = (0..nvar)
        .map(|j| {
            (0..ntime)
                .map(|i| {
                    if nrisk_at[i] > 0.0 {
                        xsum_at[j][i] / nrisk_at[i]
                    } else {
                        0.0
                    }
                })
                .collect()
        })
        .collect();

    // Compute hazard and cumhaz
    // ctype=1 (Nelson-Aalen/Breslow): haz = nevent / nrisk_weighted
    // ctype=2 (Efron): uses agsurv5 — need ndeath, erisk, etc.
    let mut haz = vec![0.0_f64; ntime];
    // efron_sum2 stores Efron-adjusted variance increments (from agsurv5)
    let mut efron_sum2: Option<Vec<f64>> = None;
    // efron_xbar stores Efron-adjusted xbar for variance: nevent * agsurv5.xbar
    let mut efron_xbar: Option<Vec<Vec<f64>>> = None;
    if ctype == 1 {
        for i in 0..ntime {
            if nevent_at[i] > 0.0 && nrisk_at[i] > 0.0 {
                haz[i] = nevent_at[i] / nrisk_at[i];
            }
        }
    } else {
        // Efron: need ndeath (unweighted), erisk (sum of w*risk for deaths)
        // and call agsurv5
        let mut ndeath = vec![0_i32; ntime];
        let mut erisk = vec![0.0_f64; ntime];
        // xsum2_death: weighted covariate sum for deaths only = rowsum((wrisk*death)*x, dtime)
        // Layout: xsum2_death[i + ntime*j] for time i, covariate j (column-major like C)
        let mut xsum2_death = vec![0.0_f64; ntime * nvar];
        {
            let mut tidx = 0;
            let mut i = 0;
            while i < n {
                let t = sorted_time[i];
                while tidx < ntime && unique_times[tidx] < t {
                    tidx += 1;
                }
                while i < n && sorted_time[i] == t {
                    if sorted_status[i] == 1 {
                        ndeath[tidx] += 1;
                        let wr = weights[i] * risk[i];
                        erisk[tidx] += wr;
                        let orig = order[i];
                        for (j, name) in predictor_names.iter().enumerate() {
                            if let Some(col) = covars.get(name) {
                                xsum2_death[tidx + ntime * j] += wr * col[orig];
                            }
                        }
                    }
                    i += 1;
                }
            }
        }
        // agsurv5 computes the Efron-adjusted hazard increments, variance, and xbar
        use super::cox_survival_efron::agsurv5;
        // Convert xsum_at (nvar x ntime, row-major) to column-major layout for agsurv5
        let mut xsum_colmajor = vec![0.0_f64; ntime * nvar];
        for j in 0..nvar {
            for i in 0..ntime {
                xsum_colmajor[i + ntime * j] = xsum_at[j][i];
            }
        }
        let (sum1, sum2, efron_xbar_raw) =
            agsurv5(&ndeath, &nrisk_at, &erisk, &xsum_colmajor, &xsum2_death, nvar);
        for i in 0..ntime {
            haz[i] = nevent_at[i] * sum1[i];
        }
        efron_sum2 = Some(sum2);
        // Store Efron xbar: final xbar[i,j] = nevent[i] * agsurv5_xbar[i + ntime*j]
        // Convert to row-major: efron_xbar_final[j][i]
        let mut efron_xbar_final = vec![vec![0.0_f64; ntime]; nvar];
        for j in 0..nvar {
            for i in 0..ntime {
                efron_xbar_final[j][i] = nevent_at[i] * efron_xbar_raw[i + ntime * j];
            }
        }
        efron_xbar = Some(efron_xbar_final);
    }

    let mut cumhaz = vec![0.0_f64; ntime];
    let mut ch = 0.0;
    for i in 0..ntime {
        ch += haz[i];
        cumhaz[i] = ch;
    }

    // Compute survival
    let surv: Vec<f64> = if stype == 1 {
        // Kalbfleisch-Prentice: need agsurv4
        use super::cox_survival_kp::agsurv4;
        let mut ndeath = vec![0_i32; ntime];
        let mut death_risk: Vec<f64> = Vec::new();
        let mut death_wt: Vec<f64> = Vec::new();
        {
            let mut tidx = 0;
            let mut i = 0;
            while i < n {
                let t = sorted_time[i];
                while tidx < ntime && unique_times[tidx] < t {
                    tidx += 1;
                }
                while i < n && sorted_time[i] == t {
                    if sorted_status[i] == 1 {
                        ndeath[tidx] += 1;
                        death_risk.push(risk[i]);
                        death_wt.push(weights[i]);
                    }
                    i += 1;
                }
            }
        }
        let km = agsurv4(&ndeath, &death_risk, &death_wt, &nrisk_at);
        // cumprod of km increments
        let mut s = 1.0;
        km.iter()
            .map(|&ki| {
                s *= ki;
                s
            })
            .collect()
    } else {
        // stype=2: exp(-cumhaz)
        cumhaz.iter().map(|&ch| (-ch).exp()).collect()
    };

    // Variance computation
    // Full formula: var(cumhaz(t|newx)) = varhaz.g(t) + varhaz.d(t)^2 / imat
    // where varhaz.g = cumsum(nevent/nrisk^2) is the baseline hazard variance
    //       varhaz.d = cumsum((newx - xbar) * haz) is the covariate adjustment
    // scaled by exp(2 * beta * newx)

    // Determine the newx risk adjustment factor
    let has_newx = !newx.is_empty() && nvar > 0;
    let newx_eta: f64 = if has_newx {
        (0..nvar)
            .map(|j| {
                let m = if j < means.len() { means[j] } else { 0.0 };
                coef.get(j).unwrap_or(&0.0) * (newx[j] - m)
            })
            .sum()
    } else {
        0.0
    };

    let mut varhaz_g = vec![0.0_f64; ntime];
    if let Some(ref sum2) = efron_sum2 {
        // Efron variance: varhaz = nevent * sum2 (from agsurv5)
        for i in 0..ntime {
            varhaz_g[i] = nevent_at[i] * sum2[i];
        }
    } else {
        // Breslow variance: varhaz = nevent / nrisk^2
        for i in 0..ntime {
            if nrisk_at[i] > 0.0 {
                varhaz_g[i] = nevent_at[i] / (nrisk_at[i] * nrisk_at[i]);
            }
        }
    }

    let std_err: Vec<f64> = if has_newx && !var_matrix.is_empty() {
        // Full variance with covariate adjustment
        // R formula: dt = outer(haz, newx, '*') - xbar; dt = cumsum(dt)
        // Breslow: xbar[i,j] = (xsum[j][i]/nrisk[i]) * haz[i]
        // Efron:   xbar[i,j] = nevent[i] * agsurv5_xbar[i,j]
        let mut varhaz_d = vec![vec![0.0_f64; ntime]; nvar];
        for j in 0..nvar {
            let nx = newx[j];
            let mut cum = 0.0;
            for i in 0..ntime {
                let xbar_haz = if let Some(ref ex) = efron_xbar {
                    // Efron: xbar already incorporates the hazard weighting
                    ex[j][i]
                } else {
                    // Breslow: xbar = (xsum/nrisk) * haz
                    xbar_at[j][i] * haz[i]
                };
                cum += haz[i] * nx - xbar_haz;
                varhaz_d[j][i] = cum;
            }
        }

        // Compute imat_inv * varhaz_d^2 for single covariate
        // For nvar=1: var_d_term = varhaz_d^2 / imat[0][0]
        // For nvar>1: var_d_term = varhaz_d' * imat_inv * varhaz_d
        // We use imat directly (it's the variance matrix = imat_inv in R's convention)
        let mut cum_g = 0.0;
        let scale = (2.0 * newx_eta).exp();
        (0..ntime)
            .map(|i| {
                cum_g += varhaz_g[i];
                // d' * V * d where V = fit$var (variance-covariance matrix)
                // For single covariate: d^2 * V[0][0] = d^2 / information
                let mut d_term = 0.0;
                for j1 in 0..nvar {
                    for j2 in 0..nvar {
                        d_term += varhaz_d[j1][i] * var_matrix[j1][j2] * varhaz_d[j2][i];
                    }
                }
                ((cum_g + d_term) * scale).sqrt()
            })
            .collect()
    } else {
        // Simple variance (no covariate adjustment)
        let mut cumvar = 0.0;
        varhaz_g
            .iter()
            .map(|&v| {
                cumvar += v;
                cumvar.sqrt()
            })
            .collect()
    };

    // Adjust survival for newx prediction
    let surv: Vec<f64> = if has_newx {
        let exp_eta = newx_eta.exp();
        cumhaz.iter().map(|&ch| (-ch * exp_eta).exp()).collect()
    } else {
        surv
    };
    let cumhaz: Vec<f64> = if has_newx {
        let exp_eta = newx_eta.exp();
        cumhaz.iter().map(|&ch| ch * exp_eta).collect()
    } else {
        cumhaz
    };

    // Filter to event times only if censor=false
    let keep: Vec<bool> = if censor {
        vec![true; ntime]
    } else {
        nevent_at.iter().map(|&e| e > 0.0).collect()
    };

    let filter = |v: &[f64]| -> Vec<f64> {
        v.iter()
            .zip(keep.iter())
            .filter(|&(_, k)| *k)
            .map(|(&val, _)| val)
            .collect()
    };

    let result = SurvfitCoxWasmResult {
        time: filter(&unique_times),
        n_risk: filter(&irisk_at),
        n_event: filter(&nevent_at),
        surv: filter(&surv),
        cumhaz: filter(&cumhaz),
        std_err: filter(&std_err),
    };

    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}

// ── Counting process Cox PH ────────────────────────────────────────────

/// Fit a Cox proportional hazards model to counting process (start-stop) data.
///
/// # Arguments
/// * `input_json` - JSON object with:
///   - start: entry times
///   - stop: exit times
///   - status: event indicators (0/1)
///   - covariates: covariate name→values map
///   - method: "breslow" or "efron" (default "efron")
///   - maxiter: max iterations (default 25)
///   - eps: convergence tolerance (default 1e-9)
#[wasm_bindgen]
pub fn coxph_counting_wasm(input_json: &str) -> Result<JsValue, JsValue> {
    let parsed: serde_json::Value =
        serde_json::from_str(input_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let start: Vec<f64> = serde_json::from_value(
        parsed.get("start").cloned().unwrap_or_default(),
    )
    .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let stop: Vec<f64> = serde_json::from_value(
        parsed.get("stop").cloned().unwrap_or_default(),
    )
    .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status_f64: Vec<f64> = serde_json::from_value(
        parsed.get("status").cloned().unwrap_or_default(),
    )
    .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = stop.len();

    let covars: IndexMap<String, Vec<f64>> = serde_json::from_value(
        parsed.get("covariates").cloned().unwrap_or_default(),
    )
    .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let method = match parsed.get("method").and_then(|v| v.as_str()) {
        Some("breslow") => 0i32,
        _ => 1i32,
    };
    let maxiter = parsed
        .get("maxiter")
        .and_then(|v| v.as_i64())
        .unwrap_or(25) as i32;
    let eps = parsed
        .get("eps")
        .and_then(|v| v.as_f64())
        .unwrap_or(1e-9);
    let nocenter = parsed
        .get("nocenter")
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    // Collect covariates
    let predictor_names: Vec<String> = covars.keys().cloned().collect();
    let nvar = predictor_names.len();

    if nvar == 0 {
        return Err(JsValue::from_str("No covariates provided"));
    }

    // Parse optional init, weights, offset, strata
    let ibeta: Vec<f64> = if let Some(init_val) = parsed.get("init") {
        serde_json::from_value(init_val.clone()).unwrap_or_else(|_| vec![0.0; nvar])
    } else {
        vec![0.0_f64; nvar]
    };
    let weights: Vec<f64> = if let Some(w_val) = parsed.get("weights") {
        serde_json::from_value(w_val.clone()).unwrap_or_else(|_| vec![1.0; n])
    } else {
        vec![1.0_f64; n]
    };
    let offset: Vec<f64> = if let Some(o_val) = parsed.get("offset") {
        serde_json::from_value(o_val.clone()).unwrap_or_else(|_| vec![0.0; n])
    } else {
        vec![0.0_f64; n]
    };
    let strata: Vec<i32> = if let Some(s_val) = parsed.get("strata") {
        serde_json::from_value(s_val.clone()).unwrap_or_else(|_| vec![0; n])
    } else {
        vec![0_i32; n]
    };

    // Build covariate matrix (will be modified in-place by agfit4)
    // Save original for residual computation after fit
    let covar_orig: Vec<Vec<f64>> = predictor_names
        .iter()
        .map(|name| covars.get(name).unwrap().clone())
        .collect();
    let mut covar: Vec<Vec<f64>> = covar_orig.clone();

    // sort1: descending order of (strata, start)
    let mut sort1: Vec<usize> = (0..n).collect();
    sort1.sort_by(|&a, &b| {
        strata[a]
            .cmp(&strata[b])
            .then(start[b].partial_cmp(&start[a]).unwrap_or(std::cmp::Ordering::Equal))
    });
    let sort1_i32: Vec<i32> = sort1.iter().map(|&i| i as i32).collect();

    // sort2: descending order of (strata, stop), events first at ties
    let mut sort2: Vec<usize> = (0..n).collect();
    sort2.sort_by(|&a, &b| {
        strata[a]
            .cmp(&strata[b])
            .then(
                stop[b]
                    .partial_cmp(&stop[a])
                    .unwrap()
                    .then(
                        (status_f64[a] as i32).cmp(&(status_f64[b] as i32)),
                    ),
            )
    });
    let sort2_i32: Vec<i32> = sort2.iter().map(|&i| i as i32).collect();

    // R default: nocenter=c(-1, 0, 1) — variables where all values are in {-1,0,1}
    // are NOT centered. When nocenter=true, nothing is centered.
    let doscale: Vec<i32> = if nocenter {
        vec![0; nvar]
    } else {
        covar
            .iter()
            .map(|col| {
                if col.iter().all(|&v| v == -1.0 || v == 0.0 || v == 1.0) {
                    0
                } else {
                    1
                }
            })
            .collect()
    };
    let config = AgfitConfig {
        maxiter,
        eps,
        toler: 1e-12,
        method,
        doscale,
    };

    let result = agfit4(
        &start,
        &stop,
        &status_f64,
        &mut covar,
        &weights,
        &offset,
        &ibeta,
        &sort1_i32,
        &sort2_i32,
        &strata,
        &config,
    );

    let nevent = status_f64.iter().filter(|&&s| s == 1.0).count();

    // Compute linear predictors in original order using ORIGINAL (uncentered) covariates
    let mut linear_pred = vec![0.0; n];
    for i in 0..n {
        let mut eta = offset[i];
        for j in 0..nvar {
            eta += result.coef[j] * covar_orig[j][i];
        }
        linear_pred[i] = eta;
    }

    // Compute martingale residuals using agmart3
    // agmart3 expects data in ascending (strata, stop) order with events first at ties
    let mut asc_order: Vec<usize> = (0..n).collect();
    asc_order.sort_by(|&a, &b| {
        strata[a].cmp(&strata[b])
            .then(stop[a].partial_cmp(&stop[b]).unwrap_or(std::cmp::Ordering::Equal))
            .then((status_f64[b] as i32).cmp(&(status_f64[a] as i32)))
    });

    let asc_start: Vec<f64> = asc_order.iter().map(|&i| start[i]).collect();
    let asc_stop: Vec<f64> = asc_order.iter().map(|&i| stop[i]).collect();
    let asc_status: Vec<f64> = asc_order.iter().map(|&i| status_f64[i]).collect();
    let asc_weights: Vec<f64> = asc_order.iter().map(|&i| weights[i]).collect();
    let asc_strata: Vec<i32> = asc_order.iter().map(|&i| strata[i]).collect();

    // Compute score = exp(linear predictor) using ORIGINAL covariates
    let asc_score: Vec<f64> = asc_order.iter().map(|&orig_i| {
        let mut eta = offset[orig_i];
        for j in 0..nvar {
            eta += result.coef[j] * covar_orig[j][orig_i];
        }
        eta.exp()
    }).collect();

    // agmart3 needs sort1 (descending start) and sort2 (descending stop) as indices
    // into the ascending-sorted arrays
    let mut ag_sort2: Vec<usize> = (0..n).collect();
    ag_sort2.sort_by(|&a, &b| {
        asc_strata[a].cmp(&asc_strata[b])
            .then(asc_stop[b].partial_cmp(&asc_stop[a]).unwrap_or(std::cmp::Ordering::Equal))
    });
    let mut ag_sort1: Vec<usize> = (0..n).collect();
    ag_sort1.sort_by(|&a, &b| {
        asc_strata[a].cmp(&asc_strata[b])
            .then(asc_start[b].partial_cmp(&asc_start[a]).unwrap_or(std::cmp::Ordering::Equal))
    });

    let ag_sort1_i32: Vec<i32> = ag_sort1.iter().map(|&i| i as i32).collect();
    let ag_sort2_i32: Vec<i32> = ag_sort2.iter().map(|&i| i as i32).collect();

    let mart_asc = agmart3(
        n,
        &asc_start,
        &asc_stop,
        &asc_status,
        &asc_score,
        &asc_weights,
        &asc_strata,
        &ag_sort1_i32,
        &ag_sort2_i32,
        method,
    );

    // Unsort martingale residuals back to original order
    let mut mart = vec![0.0; n];
    for i in 0..n {
        mart[asc_order[i]] = mart_asc[i];
    }

    let wasm_result = CoxphWasmResult {
        coefficients: result.coef,
        var: result.imat,
        loglik: result.loglik,
        score: result.sctest,
        iter: result.iter,
        method: if method == 0 {
            "breslow".to_string()
        } else {
            "efron".to_string()
        },
        means: vec![], // AG model doesn't return means in the same way
        n,
        nevent,
        linear_predictors: linear_pred,
        residuals: mart,
        score_residuals: vec![], // computed via cox_residuals_counting_wasm
        predictor_names,
    };

    serde_wasm_bindgen::to_value(&wasm_result).map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Compute residuals for a counting process (start-stop) Cox model.
///
/// # Arguments
/// * `input_json` - JSON object with:
///   - start, stop, status, coef, covariates, type, method, weights, strata
#[wasm_bindgen]
pub fn cox_residuals_counting_wasm(input_json: &str) -> Result<JsValue, JsValue> {
    let parsed: serde_json::Value =
        serde_json::from_str(input_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let start: Vec<f64> =
        serde_json::from_value(parsed.get("start").cloned().unwrap_or_default())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let stop: Vec<f64> =
        serde_json::from_value(parsed.get("stop").cloned().unwrap_or_default())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let status_raw: Vec<f64> =
        serde_json::from_value(parsed.get("status").cloned().unwrap_or_default())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let coef: Vec<f64> =
        serde_json::from_value(parsed.get("coef").cloned().unwrap_or_default())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let covars: IndexMap<String, Vec<f64>> =
        serde_json::from_value(parsed.get("covariates").cloned().unwrap_or_default())
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = stop.len();
    let resid_type = parsed
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("mart")
        .to_string();
    let method_int = match parsed.get("method").and_then(|v| v.as_str()) {
        Some("breslow") => 0i32,
        _ => 1i32,
    };
    let weights: Vec<f64> = if let Some(w_val) = parsed.get("weights") {
        serde_json::from_value(w_val.clone()).unwrap_or_else(|_| vec![1.0; n])
    } else {
        vec![1.0_f64; n]
    };
    let strata_input: Vec<i32> = if let Some(s_val) = parsed.get("strata") {
        serde_json::from_value(s_val.clone()).unwrap_or_else(|_| vec![0; n])
    } else {
        vec![0_i32; n]
    };

    // Sort ascending by (strata, stop), events before censored at ties
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| {
        strata_input[a]
            .cmp(&strata_input[b])
            .then(stop[a].partial_cmp(&stop[b]).unwrap_or(std::cmp::Ordering::Equal))
            .then(
                (status_raw[b] as i32)
                    .cmp(&(status_raw[a] as i32)),
            )
    });

    let sorted_start: Vec<f64> = order.iter().map(|&i| start[i]).collect();
    let sorted_stop: Vec<f64> = order.iter().map(|&i| stop[i]).collect();
    let sorted_status: Vec<i32> = order.iter().map(|&i| status_raw[i] as i32).collect();
    let sorted_status_f64: Vec<f64> = order.iter().map(|&i| status_raw[i]).collect();
    let sorted_weights: Vec<f64> = order.iter().map(|&i| weights[i]).collect();
    let sorted_strata: Vec<i32> = order.iter().map(|&i| strata_input[i]).collect();

    // Build strata marker (1 = last obs in stratum)
    let mut strata_marker = vec![0_i32; n];
    for i in 0..n - 1 {
        if sorted_strata[i] != sorted_strata[i + 1] {
            strata_marker[i] = 1;
        }
    }
    if n > 0 {
        strata_marker[n - 1] = 1;
    }

    // Collect covariates sorted
    let predictor_names: Vec<String> = covars.keys().cloned().collect();
    let nvar = predictor_names.len();

    let covar: Vec<Vec<f64>> = predictor_names
        .iter()
        .map(|name| {
            let col = covars.get(name).unwrap();
            order.iter().map(|&i| col[i]).collect()
        })
        .collect();

    // Compute score = exp(linear predictor)
    let score: Vec<f64> = (0..n)
        .map(|i| {
            let mut eta = 0.0;
            for j in 0..nvar {
                eta += coef[j] * covar[j][i];
            }
            eta.exp()
        })
        .collect();

    match resid_type.as_str() {
        "martingale" | "mart" => {
            // Build sort arrays for agmart3: descending stop (sort2) and descending start (sort1)
            let mut sort2: Vec<usize> = (0..n).collect();
            sort2.sort_by(|&a, &b| {
                sorted_strata[a]
                    .cmp(&sorted_strata[b])
                    .then(
                        sorted_stop[b]
                            .partial_cmp(&sorted_stop[a])
                            .unwrap_or(std::cmp::Ordering::Equal),
                    )
            });
            let mut sort1: Vec<usize> = (0..n).collect();
            sort1.sort_by(|&a, &b| {
                sorted_strata[a]
                    .cmp(&sorted_strata[b])
                    .then(
                        sorted_start[b]
                            .partial_cmp(&sorted_start[a])
                            .unwrap_or(std::cmp::Ordering::Equal),
                    )
            });
            let sort1_i32: Vec<i32> = sort1.iter().map(|&i| i as i32).collect();
            let sort2_i32: Vec<i32> = sort2.iter().map(|&i| i as i32).collect();

            let mart_sorted = agmart3(
                n,
                &sorted_start,
                &sorted_stop,
                &sorted_status_f64,
                &score,
                &sorted_weights,
                &sorted_strata,
                &sort1_i32,
                &sort2_i32,
                method_int,
            );
            let mut mart = vec![0.0; n];
            for i in 0..n {
                mart[order[i]] = mart_sorted[i];
            }
            serde_wasm_bindgen::to_value(&mart)
                .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        "score" => {
            let mut sort1: Vec<usize> = (0..n).collect();
            sort1.sort_by(|&a, &b| {
                sorted_strata[a]
                    .cmp(&sorted_strata[b])
                    .then(sorted_start[a].partial_cmp(&sorted_start[b]).unwrap_or(std::cmp::Ordering::Equal))
            });
            let sort1_i32: Vec<i32> = sort1.iter().map(|&i| i as i32).collect();

            let sr = agscore3(
                &sorted_start,
                &sorted_stop,
                &sorted_status_f64,
                &covar,
                &sorted_strata,
                &score,
                &sorted_weights,
                method_int,
                &sort1_i32,
            );
            let mut result = vec![vec![0.0; n]; nvar];
            for j in 0..nvar {
                for i in 0..n {
                    result[j][order[i]] = sr[j][i];
                }
            }
            serde_wasm_bindgen::to_value(&result)
                .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        "schoenfeld" | "scho" => {
            let event_f64: Vec<f64> = sorted_status.iter().map(|&s| s as f64).collect();
            let weighted_score: Vec<f64> = score
                .iter()
                .zip(sorted_weights.iter())
                .map(|(&s, &w)| s * w)
                .collect();
            let (death_times, scho) = coxscho(
                &sorted_start,
                &sorted_stop,
                &event_f64,
                &covar,
                &weighted_score,
                &strata_marker,
                method_int,
            );
            #[derive(Serialize)]
            struct SchoResult {
                time: Vec<f64>,
                residuals: Vec<Vec<f64>>,
            }
            serde_wasm_bindgen::to_value(&SchoResult {
                time: death_times,
                residuals: scho,
            })
            .map_err(|e| JsValue::from_str(&e.to_string()))
        }
        _ => Err(JsValue::from_str(&format!(
            "Unknown residual type: {}",
            resid_type
        ))),
    }
}

// ── finegray ──────────────────────────────────────────────────────────────

/// R's `findInterval(x, vec)`: for each x[i], find the index j such that
/// vec[j] <= x[i] < vec[j+1]. Returns 1-based indices matching R convention
/// (0 means before vec[0]).
/// `vec` must be sorted ascending.
/// When `left_open` is true, uses vec[j] < x[i] <= vec[j+1] (left-open intervals).
fn find_interval(x: &[f64], vec: &[f64], left_open: bool) -> Vec<usize> {
    x.iter()
        .map(|&xi| {
            if left_open {
                // left-open: find largest j such that vec[j] < xi
                // R returns 0 for xi <= vec[0]
                match vec.iter().rposition(|&v| v < xi) {
                    Some(j) => j + 1, // 1-based like R
                    None => 0,
                }
            } else {
                // Default: find largest j such that vec[j] <= xi
                match vec.iter().rposition(|&v| v <= xi) {
                    Some(j) => j + 1, // 1-based like R
                    None => 0,
                }
            }
        })
        .collect()
}

/// Fine-Gray competing risks data transformation.
///
/// Ports the full R `finegray()` function including:
/// - Censoring distribution G(t) via Kaplan-Meier
/// - Truncation distribution H(t) for delayed entry (Geskus 2011)
/// - Per-stratum processing
/// - Interval expansion via the core C algorithm
///
/// # Input JSON format
///
/// ```json
/// {
///   "tstart": [0, 0, ...],       // entry times (all 0 for right-censored)
///   "tstop": [1, 2, 3, ...],     // exit times
///   "status": [1, 2, 0, ...],    // 0=censor, 1..k=event types
///   "etype": 1,                   // event type of interest (1-based, default 1)
///   "strata": [0, 0, 1, ...],    // optional stratum indicators
///   "id": [1, 1, 2, 2, ...],     // optional subject IDs (required for counting process)
///   "weights": [1, 1, ...],      // optional case weights
///   "counting": false             // true if (start, stop] data
/// }
/// ```
#[wasm_bindgen]
pub fn finegray_wasm(input_json: &str) -> Result<JsValue, JsValue> {
    let parsed: serde_json::Value =
        serde_json::from_str(input_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Parse required fields
    let tstart_orig: Vec<f64> = serde_json::from_value(
        parsed.get("tstart").cloned().unwrap_or(serde_json::Value::Array(vec![])),
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let tstop_orig: Vec<f64> = serde_json::from_value(
        parsed.get("tstop").cloned().ok_or_else(|| JsValue::from_str("missing tstop"))?,
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let status_orig: Vec<i32> = serde_json::from_value(
        parsed.get("status").cloned().ok_or_else(|| JsValue::from_str("missing status"))?,
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let n = tstop_orig.len();
    if tstart_orig.len() != n || status_orig.len() != n {
        return Err(JsValue::from_str("tstart, tstop, status must have same length"));
    }

    let enum_val = parsed.get("etype").and_then(|v| v.as_i64()).unwrap_or(1) as i32;

    let is_counting = parsed.get("counting").and_then(|v| v.as_bool()).unwrap_or(false);

    let strata: Vec<i32> = if let Some(s) = parsed.get("strata") {
        serde_json::from_value(s.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?
    } else {
        vec![0i32; n]
    };

    let id: Option<Vec<i32>> = parsed.get("id").map(|v| {
        serde_json::from_value::<Vec<i32>>(v.clone()).unwrap_or_default()
    });

    let user_weights: Vec<f64> = if let Some(w) = parsed.get("weights") {
        serde_json::from_value(w.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?
    } else {
        vec![1.0; n]
    };

    // For right-censored data (2-column Surv), add a start column
    // R: if (ncol(Y)==2) { zero <- 0 or 2*min-1; Y <- cbind(zero, Y) }
    let (tstart, tstop, status) = if !is_counting {
        let min_time = tstop_orig.iter().copied().filter(|t| !t.is_nan()).fold(f64::INFINITY, f64::min);
        let zero = if min_time > 0.0 { 0.0 } else { 2.0 * min_time - 1.0 };
        let tstart_new = vec![zero; n];
        (tstart_new, tstop_orig.clone(), status_orig.clone())
    } else {
        (tstart_orig.clone(), tstop_orig.clone(), status_orig.clone())
    };

    // Determine first/last observation per subject (needed for counting process)
    let mut first_obs = vec![false; n];
    let mut last_obs = vec![true; n]; // default: all are "last" for right-censored
    let mut delay = false;

    if is_counting {
        let id_vec = id.as_ref().ok_or_else(|| {
            JsValue::from_str("(start, stop] data requires a subject id")
        })?;

        // Sort by (id, tstop) to find first/last per subject
        let mut index: Vec<usize> = (0..n).collect();
        index.sort_by(|&a, &b| {
            id_vec[a].cmp(&id_vec[b])
                .then(tstop[a].partial_cmp(&tstop[b]).unwrap_or(std::cmp::Ordering::Equal))
        });

        // Find first occurrence of each id in sorted order
        let mut first_indices = Vec::new();
        let mut prev_id = i32::MIN;
        for (pos, &orig_idx) in index.iter().enumerate() {
            if id_vec[orig_idx] != prev_id {
                first_indices.push(pos);
                prev_id = id_vec[orig_idx];
            }
        }
        let mut last_indices: Vec<usize> = first_indices[1..].iter().map(|&f| f - 1).collect();
        last_indices.push(n - 1);

        // Validate: no transitions before last time point
        let last_set: std::collections::HashSet<usize> = last_indices.iter().copied().collect();
        for pos in 0..n {
            if !last_set.contains(&pos) {
                let orig = index[pos];
                if status[orig] != 0 {
                    return Err(JsValue::from_str(
                        "a subject has a transition before their last time point",
                    ));
                }
            }
        }

        // Validate: no gaps in time
        for pos in 0..n - 1 {
            if !last_set.contains(&pos) {
                let curr_orig = index[pos];
                let next_orig = index[pos + 1];
                if (tstart[next_orig] - tstop[curr_orig]).abs() > 1e-10 {
                    return Err(JsValue::from_str("a subject has gaps in time"));
                }
            }
        }

        // Check for delayed entry
        let min_tstop = tstop.iter().copied().filter(|t| !t.is_nan()).fold(f64::INFINITY, f64::min);
        for &fi in &first_indices {
            let orig = index[fi];
            if tstart[orig] > min_tstop {
                delay = true;
                break;
            }
        }

        // Map back to original indices
        first_obs = vec![false; n];
        last_obs = vec![false; n];
        for &fi in &first_indices {
            first_obs[index[fi]] = true;
        }
        for &li in &last_indices {
            last_obs[index[li]] = true;
        }
    }

    // Build unique time grid: utime = sort(unique(c(tstart, tstop)))
    let mut utime: Vec<f64> = Vec::with_capacity(2 * n);
    for i in 0..n {
        if !tstart[i].is_nan() {
            utime.push(tstart[i]);
        }
        if !tstop[i].is_nan() {
            utime.push(tstop[i]);
        }
    }
    utime.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    utime.dedup();

    // Map times to integer grid indices: newtime = findInterval(Y[,1:2], utime)
    // R's findInterval is 1-based
    let newtime_start = find_interval(&tstart, &utime, false);
    let newtime_stop = find_interval(&tstop, &utime, false);

    // newtime[status != 0, 2] -= 0.2 (shift events so they precede censors at same time)
    let newtime_stop_adj: Vec<f64> = (0..n)
        .map(|i| {
            let v = newtime_stop[i] as f64;
            if status[i] != 0 { v - 0.2 } else { v }
        })
        .collect();
    let newtime_start_f64: Vec<f64> = newtime_start.iter().map(|&v| v as f64).collect();

    // Build censoring distribution G(t):
    // Gsurv <- survfit(Surv(newtime[,1], newtime[,2], last & status==0) ~ istrat)
    // Status for G: 1 if last_obs AND status==0 (censored), 0 otherwise
    let g_status: Vec<i32> = (0..n)
        .map(|i| if last_obs[i] && status[i] == 0 { 1 } else { 0 })
        .collect();

    // Compute G per stratum
    let mut unique_strata: Vec<i32> = strata.clone();
    unique_strata.sort();
    unique_strata.dedup();
    let nstrata = unique_strata.len();

    // For each stratum, compute KM of censoring distribution
    struct StratumKm {
        time: Vec<f64>,
        n_event: Vec<f64>,
        surv: Vec<f64>,
    }

    let compute_km = |sub_start: &[f64], sub_stop: &[f64], sub_status: &[i32], sub_weights: &[f64]| -> StratumKm {
        let data = SurvData::counting_process(sub_start, sub_stop, sub_status);
        let config = SurvfitConfig {
            surv_type: 1,
            robust: false,
            id: None,
            nid: 0,
            influence: 0,
        };
        let km = survfit_km(&data, sub_weights, &config);
        StratumKm {
            time: km.time,
            n_event: km.n_event,
            surv: km.surv,
        }
    };

    // Compute G per stratum
    let mut g_by_stratum: Vec<StratumKm> = Vec::with_capacity(nstrata);
    for &s in &unique_strata {
        let mask: Vec<bool> = strata.iter().map(|&si| si == s).collect();
        let sub_start: Vec<f64> = mask.iter().zip(newtime_start_f64.iter()).filter(|(m, _)| **m).map(|(_, &v)| v).collect();
        let sub_stop: Vec<f64> = mask.iter().zip(newtime_stop_adj.iter()).filter(|(m, _)| **m).map(|(_, &v)| v).collect();
        let sub_status: Vec<i32> = mask.iter().zip(g_status.iter()).filter(|(m, _)| **m).map(|(_, &v)| v).collect();
        let sub_weights: Vec<f64> = vec![1.0; sub_start.len()];
        g_by_stratum.push(compute_km(&sub_start, &sub_stop, &sub_status, &sub_weights));
    }

    // Compute H per stratum if delayed entry
    // Hsurv <- survfit(Surv(-newtime[,2], -newtime[,1], first) ~ istrat)
    let mut h_by_stratum: Vec<StratumKm> = Vec::new();
    if delay {
        for &s in &unique_strata {
            let mask: Vec<bool> = strata.iter().map(|&si| si == s).collect();
            let sub_start: Vec<f64> = mask.iter().zip(newtime_stop_adj.iter()).filter(|(m, _)| **m).map(|(_, &v)| -v).collect();
            let sub_stop: Vec<f64> = mask.iter().zip(newtime_start_f64.iter()).filter(|(m, _)| **m).map(|(_, &v)| -v).collect();
            let sub_status: Vec<i32> = mask.iter().zip(first_obs.iter()).filter(|(m, _)| **m).map(|(_, &v)| if v { 1 } else { 0 }).collect();
            let sub_weights: Vec<f64> = vec![1.0; sub_start.len()];
            h_by_stratum.push(compute_km(&sub_start, &sub_stop, &sub_status, &sub_weights));
        }
    }

    // Per-stratum processing (R's stratfun)
    let mut out_row: Vec<usize> = Vec::new();
    let mut out_start: Vec<f64> = Vec::new();
    let mut out_stop: Vec<f64> = Vec::new();
    let mut out_status: Vec<i32> = Vec::new();
    let mut out_wt: Vec<f64> = Vec::new();
    let mut out_add: Vec<i32> = Vec::new();

    for (si, &s) in unique_strata.iter().enumerate() {
        let mask: Vec<bool> = strata.iter().map(|&si2| si2 == s).collect();
        let indices: Vec<usize> = (0..n).filter(|&i| mask[i]).collect();

        // Unique event times of interest in this stratum
        let mut event_times: Vec<f64> = indices
            .iter()
            .filter(|&&i| status[i] == enum_val)
            .map(|&i| tstop[i])
            .collect();
        event_times.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        event_times.dedup();

        if event_times.is_empty() {
            continue; // no events of interest in this stratum
        }

        let maxtime = indices.iter().map(|&i| tstop[i]).fold(f64::NEG_INFINITY, f64::max);

        let g = &g_by_stratum[si];

        // Build ctime and cprob
        let (ctime, cprob) = if delay {
            let h = &h_by_stratum[si];

            // dtime <- rev(-Htemp$time[Htemp$n.event > 0])
            let dtime: Vec<f64> = h.time.iter().zip(h.n_event.iter())
                .filter(|&(_, ne)| *ne > 0.0)
                .map(|(&t, _)| -t)
                .collect::<Vec<_>>()
                .into_iter().rev().collect();

            // dprob <- c(rev(Htemp$surv[Htemp$n.event > 0])[-1], 1)
            let h_surv_events: Vec<f64> = h.time.iter().zip(h.n_event.iter()).zip(h.surv.iter())
                .filter(|&((_, ne), _)| *ne > 0.0)
                .map(|((_, _), &sv)| sv)
                .collect();
            let mut dprob: Vec<f64> = h_surv_events.iter().rev().skip(1).copied().collect();
            dprob.push(1.0);

            // ctime_g <- Gtemp$time[Gtemp$n.event > 0]
            let g_ctime: Vec<f64> = g.time.iter().zip(g.n_event.iter())
                .filter(|&(_, ne)| *ne > 0.0)
                .map(|(&t, _)| t)
                .collect();

            // cprob_g <- c(1, Gtemp$surv[Gtemp$n.event > 0])
            let mut g_cprob = vec![1.0];
            g_cprob.extend(
                g.time.iter().zip(g.n_event.iter()).zip(g.surv.iter())
                    .filter(|&((_, ne), _)| *ne > 0.0)
                    .map(|((_, _), &sv)| sv),
            );

            // temp <- sort(unique(c(dtime, ctime)))
            let mut combined: Vec<f64> = Vec::new();
            combined.extend(&dtime);
            combined.extend(&g_ctime);
            combined.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
            combined.dedup();

            // index1 <- findInterval(temp, dtime)
            let index1 = find_interval(&combined, &dtime, false);
            // index2 <- findInterval(temp, ctime)
            let index2 = find_interval(&combined, &g_ctime, false);

            // ctime <- utime[temp] (temp are integer indices into utime)
            let final_ctime: Vec<f64> = combined.iter().map(|&t| {
                let idx = t as usize;
                if idx > 0 && idx <= utime.len() { utime[idx - 1] } else if idx == 0 { utime[0] } else { utime[utime.len() - 1] }
            }).collect();

            // cprob <- dprob[index1] * cprob[index2+1]
            // R indexing: index1 and index2 are 1-based, dprob is 1-based in R, g_cprob has leading 1
            let final_cprob: Vec<f64> = (0..combined.len()).map(|i| {
                let d_idx = if index1[i] > 0 { index1[i] - 1 } else { 0 };
                let g_idx = index2[i]; // index2 is 1-based, g_cprob[0] = 1.0, so index2+1 in R → index2 in 0-based
                let d = if d_idx < dprob.len() { dprob[d_idx] } else { *dprob.last().unwrap_or(&1.0) };
                let g = if g_idx < g_cprob.len() { g_cprob[g_idx] } else { *g_cprob.last().unwrap_or(&1.0) };
                d * g
            }).collect();

            (final_ctime, final_cprob)
        } else {
            // ctime <- utime[Gtemp$time[Gtemp$n.event > 0]]
            // The KM times are on the integer grid; map back to original times via utime
            let ctime: Vec<f64> = g.time.iter().zip(g.n_event.iter())
                .filter(|&(_, ne)| *ne > 0.0)
                .map(|(&t, _)| {
                    // t is on the integer grid (1-based findInterval output)
                    let idx = t as usize;
                    if idx > 0 && idx <= utime.len() { utime[idx - 1] } else { utime[0] }
                })
                .collect();

            // cprob <- Gtemp$surv[Gtemp$n.event > 0]
            let cprob: Vec<f64> = g.time.iter().zip(g.n_event.iter()).zip(g.surv.iter())
                .filter(|&((_, ne), _)| *ne > 0.0)
                .map(|((_, _), &sv)| sv)
                .collect();

            (ctime, cprob)
        };

        // ct2 <- c(ctime, maxtime)
        let mut ct2 = ctime.clone();
        ct2.push(maxtime);

        // cp2 <- c(1.0, cprob)
        let mut cp2 = vec![1.0];
        cp2.extend(&cprob);

        // index <- findInterval(times, ct2, left.open=TRUE)
        let fi_indices = find_interval(&event_times, &ct2, true);
        // index <- sort(unique(index))
        let mut unique_indices: Vec<usize> = fi_indices.clone();
        unique_indices.sort();
        unique_indices.dedup();

        // ckeep <- rep(FALSE, length(ct2)); ckeep[index] <- TRUE
        // R uses 1-based indexing from findInterval, but ckeep is 0-based array
        // In R: ckeep[index] where index is 1-based → ckeep is length(ct2) and index values 0..length(ct2)
        // Index 0 from findInterval means "before first element" — R treats ckeep[0] as no-op
        let mut ckeep = vec![false; ct2.len()];
        for &idx in &unique_indices {
            // findInterval returns 1-based; convert to 0-based for ckeep
            if idx > 0 && idx <= ckeep.len() {
                ckeep[idx - 1] = true;
            }
            // idx == 0 means before first ctime — R ignores this (ckeep[0] in R is valid but
            // the C code's keep[0] is always TRUE via the c(TRUE, ckeep) prepend)
        }

        // expand <- (Y[keep, 3] != 0 & Y[keep, 3] != enum & last[keep])
        let expand: Vec<bool> = indices
            .iter()
            .map(|&i| status[i] != 0 && status[i] != enum_val && last_obs[i])
            .collect();

        // keep_arg = c(TRUE, ckeep) — R prepends TRUE
        let mut keep_arg = vec![true];
        keep_arg.extend(&ckeep);

        // Call the core C transform
        let sub_tstart: Vec<f64> = indices.iter().map(|&i| tstart[i]).collect();
        let sub_tstop: Vec<f64> = indices.iter().map(|&i| tstop[i]).collect();

        let split = finegray_transform(
            &sub_tstart,
            &sub_tstop,
            &ct2,
            &cp2,
            &expand,
            &keep_arg,
        );

        // Map results back to original row indices and compute output status
        for k in 0..split.row.len() {
            let orig_idx = indices[split.row[k]];
            out_row.push(orig_idx);
            out_start.push(split.start[k]);
            out_stop.push(split.end[k]);
            // fgstatus: 1 if the original status == etype, 0 otherwise
            let fgstatus = if status[orig_idx] == enum_val { 1 } else { 0 };
            out_status.push(fgstatus);
            out_wt.push(split.wt[k] * user_weights[orig_idx]);
            out_add.push(split.add[k]);
        }
    }

    #[derive(Serialize)]
    #[serde(rename_all = "camelCase")]
    struct FineGrayWasmResult {
        row: Vec<usize>,
        start: Vec<f64>,
        stop: Vec<f64>,
        status: Vec<i32>,
        wt: Vec<f64>,
        add: Vec<i32>,
    }

    serde_wasm_bindgen::to_value(&FineGrayWasmResult {
        row: out_row,
        start: out_start,
        stop: out_stop,
        status: out_status,
        wt: out_wt,
        add: out_add,
    })
    .map_err(|e| JsValue::from_str(&e.to_string()))
}
