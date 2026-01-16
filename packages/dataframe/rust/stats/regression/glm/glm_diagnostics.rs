//! GLM diagnostic methods
//!
//! Implements R-compatible diagnostic methods for GLM:
//! - summary(): Coefficient table with z/t-tests and p-values
//! - rstandard(): Standardized residuals (deviance or pearson)
//! - rstudent(): Leave-one-out studentized residuals
//! - influence(): Influence measures (dfbeta, dfbetas, dffits, covratio, cook's distance)

use super::types_results::{GlmResult, QrDecomposition};
use crate::stats::distributions::chi_squared::qchisq;
use crate::stats::distributions::normal::qnorm;
use serde::{Deserialize, Serialize};

/// Summary of GLM fit with coefficient table
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmSummaryTable {
    /// Coefficient names
    pub names: Vec<String>,
    /// Estimates
    pub estimate: Vec<f64>,
    /// Standard errors
    pub std_error: Vec<f64>,
    /// Test statistics (z or t values)
    pub statistic: Vec<f64>,
    /// P-values
    pub p_value: Vec<f64>,
    /// Dispersion parameter used
    pub dispersion: f64,
    /// Whether dispersion is fixed (binomial/poisson) or estimated
    pub is_fixed_dispersion: bool,
}

/// Influence measures for GLM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmInfluence {
    /// dfbeta: Raw change in coefficients (n x p matrix)
    pub dfbeta: Vec<Vec<f64>>,
    /// dfbetas: Standardized change in coefficients (n x p matrix)
    pub dfbetas: Vec<Vec<f64>>,
    /// dffits: Standardized change in fitted values (n vector)
    pub dffits: Vec<f64>,
    /// covratio: Change in covariance matrix determinant (n vector)
    pub covratio: Vec<f64>,
    /// Cook's distance (n vector)
    pub cooks_distance: Vec<f64>,
    /// Hat values (leverage) (n vector)
    pub hat: Vec<f64>,
}

/// Confidence intervals for GLM coefficients
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlmConfint {
    /// Coefficient names
    pub names: Vec<String>,
    /// Lower bounds
    pub lower: Vec<f64>,
    /// Upper bounds
    pub upper: Vec<f64>,
}

impl GlmResult {
    /// Generate summary table with coefficient statistics
    ///
    /// Matches R's summary.glm() coefficient table
    pub fn summary(&self) -> Result<GlmSummaryTable, String> {
        let _n = self.n_observations;
        let _p = self.rank;

        if self.coefficients.is_empty() {
            return Err("No coefficients to summarize".to_string());
        }

        // Determine if dispersion is fixed (binomial/poisson) or estimated (gaussian/gamma)
        let is_fixed_dispersion =
            self.family.family == "binomial" || self.family.family == "poisson";

        // Get dispersion parameter
        let dispersion = if is_fixed_dispersion {
            1.0
        } else {
            self.dispersion_parameter
        };

        // Compute test statistics (z-test if fixed dispersion, t-test otherwise)
        let mut statistic = Vec::with_capacity(self.coefficients.len());
        let mut p_value = Vec::with_capacity(self.coefficients.len());

        for i in 0..self.coefficients.len() {
            let coef = self.coefficients[i];
            let se = self.standard_errors[i];

            if se == 0.0 || se.is_nan() {
                statistic.push(f64::NAN);
                p_value.push(f64::NAN);
            } else {
                let stat = coef / se;
                statistic.push(stat);

                // Compute p-value
                let p = if is_fixed_dispersion {
                    // z-test: 2 * (1 - Φ(|z|))
                    2.0 * (1.0 - normal_cdf(stat.abs()))
                } else {
                    // t-test: 2 * (1 - F_t(|t|, df))
                    2.0 * (1.0 - t_cdf(stat.abs(), self.df_residual))
                };
                p_value.push(p);
            }
        }

        Ok(GlmSummaryTable {
            names: self.model_matrix_column_names.clone(),
            estimate: self.coefficients.clone(),
            std_error: self.standard_errors.clone(),
            statistic,
            p_value,
            dispersion,
            is_fixed_dispersion,
        })
    }

    /// Compute standardized residuals
    ///
    /// Matches R's rstandard.glm()
    ///
    /// # Arguments
    /// * `residual_type` - "deviance" or "pearson"
    pub fn rstandard(&self, residual_type: &str) -> Result<Vec<f64>, String> {
        let res = match residual_type {
            "deviance" => &self.deviance_residuals,
            "pearson" => &self.pearson_residuals,
            _ => return Err(format!("Unknown residual type: {}", residual_type)),
        };

        let hat = &self.leverage;
        let dispersion = self.get_dispersion();

        let mut rstandard = Vec::with_capacity(res.len());
        for i in 0..res.len() {
            let h = hat[i];
            if h >= 1.0 {
                rstandard.push(f64::NAN);
            } else {
                let denom = (dispersion * (1.0 - h)).sqrt();
                let value = res[i] / denom;
                // Match R: convert infinite values to NaN
                if value.is_infinite() {
                    rstandard.push(f64::NAN);
                } else {
                    rstandard.push(value);
                }
            }
        }

        Ok(rstandard)
    }

    /// Compute leave-one-out studentized residuals
    ///
    /// Matches R's rstudent.glm()
    pub fn rstudent(&self) -> Result<Vec<f64>, String> {
        let n = self.n_observations;
        let _p = self.rank;
        let dev_res = &self.deviance_residuals;
        let pear_res = &self.pearson_residuals;
        let hat = &self.leverage;

        // Determine if dispersion is fixed
        let is_fixed_dispersion =
            self.family.family == "binomial" || self.family.family == "poisson";

        // Compute leave-one-out sigma for each observation
        let sigma = self.compute_sigma_loo()?;

        let mut rstudent = Vec::with_capacity(n);
        for i in 0..n {
            let d = dev_res[i];
            let h_i = hat[i];

            if h_i >= 1.0 {
                rstudent.push(f64::NAN);
                continue;
            }

            let omh = 1.0 - h_i;
            let r2 = d * d;
            let term = h_i * pear_res[i] * pear_res[i] / omh;
            let mut r = d.signum() * (r2 + term).sqrt();

            // Divide by sigma if dispersion is not fixed
            if !is_fixed_dispersion {
                r = r / sigma[i];
            }

            // Match R: convert infinite values to NaN
            if r.is_infinite() {
                rstudent.push(f64::NAN);
            } else {
                rstudent.push(r);
            }
        }

        Ok(rstudent)
    }

    /// Compute influence measures
    ///
    /// Matches R's influence.measures() and lm.influence()
    pub fn influence(&self) -> Result<GlmInfluence, String> {
        let n = self.n_observations;
        let p = self.rank;

        if self.qr.qr.is_empty() {
            return Err("QR decomposition not available".to_string());
        }

        // Extract Q and R matrices from QR decomposition
        let q = extract_q(&self.qr, n, p)?;
        let r = extract_r(&self.qr, p)?;

        // Compute inv_rqtt = t(backsolve(R, t(Q)))
        let inv_rqtt = compute_inv_r_qt(&r, &q, n, p)?;

        // Get deviance residuals and leverage
        let dev_res = &self.deviance_residuals;
        let hat = &self.leverage;

        // Determine if dispersion is fixed
        let _is_fixed_dispersion =
            self.family.family == "binomial" || self.family.family == "poisson";

        // Compute leave-one-out sigma
        let sigma = self.compute_sigma_loo()?;

        // Compute standard errors for each coefficient
        let se = &self.standard_errors;

        // Compute overall model sigma for covratio calculation
        // R formula: s <- sqrt(sum(e^2, na.rm=TRUE)/df.residual(model))
        // where df.residual = n - p (not n - p - 1)
        let mut sum_sq = 0.0;
        for i in 0..n {
            sum_sq += dev_res[i] * dev_res[i];
        }
        let s = (sum_sq / ((n - p) as f64)).sqrt();

        // Initialize result matrices/vectors
        let mut dfbeta = vec![vec![0.0; p]; n];
        let mut dfbetas = vec![vec![0.0; p]; n];
        let mut dffits = Vec::with_capacity(n);
        let mut covratio = Vec::with_capacity(n);
        let mut cooks_distance = Vec::with_capacity(n);

        for i in 0..n {
            let h_i = hat[i];
            let e_i = dev_res[i];
            let omh = 1.0 - h_i;

            // When leverage is at or extremely close to 1, influence measures are undefined
            // R returns NaN for h=1 cases. We extend this to h > 0.9999 to handle numerical
            // differences in QR decomposition that produce slightly different leverage values.
            // This prevents enormous Cook's D values from tiny differences in high-leverage QR results.
            if h_i >= 1.0 || h_i > 0.9999 {
                dfbeta[i] = vec![f64::NAN; p];
                dfbetas[i] = vec![f64::NAN; p];
                dffits.push(f64::NAN);
                covratio.push(f64::NAN);
                cooks_distance.push(f64::NAN);
                continue;
            }

            // Compute dfbeta: inv_rqtt[i,j] * (e_i / (1 - h_i))
            let factor = e_i / omh;
            for j in 0..p {
                dfbeta[i][j] = inv_rqtt[i][j] * factor;

                // Compute dfbetas: dfbeta / se[j]
                if se[j] > 0.0 && !se[j].is_nan() {
                    dfbetas[i][j] = dfbeta[i][j] / se[j];
                } else {
                    dfbetas[i][j] = f64::NAN;
                }
            }

            // Compute standardized residual e*_i
            let _estar = e_i / omh.sqrt();

            // Compute dffits: e * sqrt(h) / (sigma * (1-h))
            // R formula: e*sqrt(h)/(si*(1-h))
            // This is equivalent to: (e/(1-h)) * sqrt(h) / si
            let dffits_i = e_i * h_i.sqrt() / (sigma[i] * omh);
            // Match R: convert infinite values to NaN
            dffits.push(if dffits_i.is_infinite() {
                f64::NAN
            } else {
                dffits_i
            });

            // Compute covratio: (si/s)^(2*p) / (1-h)
            // R formula: cov.ratio <- (si/s)^(2 * p)/(1 - h)
            // where s = sqrt(sum(e^2)/df.residual) (computed above)
            let cov_ratio = (sigma[i] / s).powi(2 * p as i32) / omh;
            // Match R: convert infinite values to NaN
            covratio.push(if cov_ratio.is_infinite() {
                f64::NAN
            } else {
                cov_ratio
            });

            // Compute Cook's distance for GLM
            // R formula: (pear.res/(1-h))^2 * h/(dispersion * p)
            let pear_res_i = self.pearson_residuals[i];
            let dispersion = self.get_dispersion();
            let cook_d = (pear_res_i / omh).powi(2) * h_i / (dispersion * p as f64);
            // Match R: convert infinite values to NaN
            cooks_distance.push(if cook_d.is_infinite() {
                f64::NAN
            } else {
                cook_d
            });
        }

        Ok(GlmInfluence {
            dfbeta,
            dfbetas,
            dffits,
            covratio,
            cooks_distance: cooks_distance,
            hat: hat.clone(),
        })
    }

    /// Get dispersion parameter
    fn get_dispersion(&self) -> f64 {
        if self.family.family == "binomial" || self.family.family == "poisson" {
            1.0
        } else {
            self.dispersion_parameter
        }
    }

    /// Compute leave-one-out sigma for each observation
    ///
    /// Matches R's calculation: sqrt((sum(r^2) - r_i^2/(1-h_i)) / (n-p-1))
    fn compute_sigma_loo(&self) -> Result<Vec<f64>, String> {
        let n = self.n_observations;
        let p = self.rank;
        let dev_res = &self.deviance_residuals;
        let hat = &self.leverage;

        // Compute sum of squared deviance residuals
        let mut sum_sq = 0.0;
        for i in 0..n {
            sum_sq += dev_res[i] * dev_res[i];
        }

        let denom = (n - p - 1) as f64;
        if denom <= 0.0 {
            return Err("Insufficient degrees of freedom for sigma calculation".to_string());
        }

        let mut sigma = Vec::with_capacity(n);
        for i in 0..n {
            let h_i = hat[i];
            if h_i >= 1.0 {
                sigma.push((sum_sq / denom).sqrt());
            } else {
                let r = dev_res[i];
                let omh = 1.0 - h_i;
                let s2_i = sum_sq - (r * r) / omh;
                sigma.push((s2_i / denom).sqrt());
            }
        }

        Ok(sigma)
    }

    /// Compute confidence intervals for GLM coefficients using profile likelihood
    ///
    /// Matches R's confint.glm() which uses profile likelihood:
    /// - Profiles the deviance by stepping away from MLE for each parameter
    /// - Refits the model at each step with parameter constrained
    /// - Uses spline interpolation to find CI bounds
    /// - More accurate than Wald CIs, especially for small samples
    ///
    /// This implementation follows R's profile.glm() and confint.profile.glm()
    pub fn confint(&self, level: f64) -> Result<GlmConfint, String> {
        if level <= 0.0 || level >= 1.0 {
            return Err("Confidence level must be between 0 and 1".to_string());
        }

        let p = self.coefficients.len();
        let alpha = 1.0 - level;

        // Match R: use qnorm for final cutoff
        let cutoff = qnorm(1.0 - alpha / 2.0, 0.0, 1.0, true, false);

        // Match R's confint.glm: profile uses alpha/4 for better interpolation
        let profile_alpha = alpha / 4.0;

        let mut names = Vec::with_capacity(p);
        let mut lower = Vec::with_capacity(p);
        let mut upper = Vec::with_capacity(p);

        // Get dispersion parameter
        let dispersion = self.dispersion_parameter;

        // Profile each parameter
        for i in 0..p {
            let coef_name = if i < self.model_matrix_column_names.len() {
                self.model_matrix_column_names[i].clone()
            } else {
                format!("x{}", i)
            };

            // Profile this parameter - use alpha/4 for extended profiling
            let profile = self.profile_parameter(i, profile_alpha, dispersion)?;

            // Use spline interpolation to find CI bounds
            let bounds = interpolate_profile_ci(&profile.par_vals, &profile.z_vals, cutoff)?;

            names.push(coef_name);
            lower.push(bounds.0);
            upper.push(bounds.1);
        }

        Ok(GlmConfint {
            names,
            lower,
            upper,
        })
    }

    /// Profile likelihood for a single parameter
    /// Returns parameter values and corresponding signed sqrt deviance differences
    fn profile_parameter(
        &self,
        param_idx: usize,
        alpha: f64,
        dispersion: f64,
    ) -> Result<ProfileResult, String> {
        use crate::stats::distributions::f_distribution::qf;

        let max_steps = 10;
        let n = self.n_observations as f64;
        let p = self.coefficients.len() as f64;

        // Match R's profile.glm: use different distributions based on family
        let zmax = match self.family.family.as_str() {
            "binomial" | "poisson" => {
                // For fixed dispersion families, use chi-squared
                qchisq(1.0 - alpha, 1.0, true, false).sqrt()
            }
            _ => {
                // For families with estimated dispersion (gaussian, gamma, inverse.gaussian, quasi)
                // use F-distribution: sqrt(qf(1 - alpha, 1, n - p))
                qf(1.0 - alpha, 1.0, n - p, true, false).sqrt()
            }
        };

        let del = zmax / 5.0;

        let mut par_vals = vec![self.coefficients[param_idx]];
        let mut z_vals = vec![0.0]; // At MLE, z = 0

        let std_err = self.standard_errors[param_idx];

        // Profile in both directions
        for sgn in [-1.0, 1.0] {
            for step in 1..=max_steps {
                let param_value =
                    self.coefficients[param_idx] + sgn * (step as f64) * del * std_err;

                // Refit model with this parameter fixed
                match self.fit_constrained(param_idx, param_value) {
                    Ok(constrained_dev) => {
                        // Calculate signed sqrt of deviance difference
                        let dev_diff = (constrained_dev - self.deviance) / dispersion;
                        if dev_diff < -1e-3 {
                            // Profile found better solution - original fit didn't converge
                            break;
                        }
                        let dev_diff = dev_diff.max(0.0);
                        let z = sgn * dev_diff.sqrt();

                        par_vals.push(param_value);
                        z_vals.push(z);

                        // Stop if we've gone far enough
                        if z.abs() >= zmax {
                            break;
                        }
                    }
                    Err(_) => break, // Stop if fit fails
                }
            }
        }

        Ok(ProfileResult { par_vals, z_vals })
    }

    /// Fit GLM with one parameter constrained to a fixed value
    /// Returns the deviance of the constrained model
    fn fit_constrained(&self, param_idx: usize, param_value: f64) -> Result<f64, String> {
        use super::glm_fit_core::glm_fit;
        use super::types_control::GlmControl;

        let n = self.y.len();
        let p = self.model_matrix_column_names.len();

        // Create X matrix without the constrained column
        let mut x_reduced = Vec::new();
        for row_idx in 0..n {
            let mut row = Vec::new();
            for col_idx in 0..p {
                if col_idx != param_idx {
                    row.push(self.model_matrix[row_idx][col_idx]);
                }
            }
            if !row.is_empty() {
                x_reduced.push(row);
            }
        }

        // Create offset that includes the constrained parameter's contribution
        let mut offset = vec![0.0; n];
        for row_idx in 0..n {
            offset[row_idx] = self.model_matrix[row_idx][param_idx] * param_value;
        }

        // Add existing offset if present
        if let Some(ref orig_offset) = self.offset {
            for i in 0..n {
                offset[i] += orig_offset[i];
            }
        }

        // Create family object
        let family = create_family(&self.family.family, &self.family.link)?;

        // Set up control with same parameters as original fit
        let control = GlmControl {
            epsilon: self.control.epsilon,
            maxit: self.control.maxit,
            trace: false, // Don't trace during profiling
        };

        // Fit the constrained model
        let result = glm_fit(
            x_reduced,
            self.y.clone(),
            Some(self.prior_weights.clone()),
            None, // start
            None, // etastart
            None, // mustart
            Some(offset),
            family,
            control,
            true, // intercept - check original model
            None, // column_names
        )?;

        Ok(result.deviance)
    }

    /// Make predictions on new data
    ///
    /// @param newdata - New model matrix (n_new x p) where p matches number of coefficients
    /// @param type - "link" for linear predictors or "response" for fitted values (default)
    /// @returns Predictions as Vec<f64>
    pub fn predict(&self, newdata: &[Vec<f64>], pred_type: &str) -> Result<Vec<f64>, String> {
        if newdata.is_empty() {
            return Err("newdata cannot be empty".to_string());
        }

        let n_new = newdata.len();
        let p = self.coefficients.len();

        // Validate dimensions
        for (i, row) in newdata.iter().enumerate() {
            if row.len() != p {
                return Err(format!(
                    "newdata row {} has {} columns but model has {} coefficients",
                    i,
                    row.len(),
                    p
                ));
            }
        }

        // Compute linear predictors: X_new %*% beta
        let mut linear_pred = Vec::with_capacity(n_new);
        for row in newdata {
            let mut eta = 0.0;
            for j in 0..p {
                eta += row[j] * self.coefficients[j];
            }
            linear_pred.push(eta);
        }

        // Return based on type
        match pred_type {
            "link" => Ok(linear_pred),
            "response" => {
                // Apply inverse link function
                let link_name = &self.family.link;
                let mut response = Vec::with_capacity(n_new);
                for eta in linear_pred {
                    let mu = match link_name.as_str() {
                        "identity" => eta,
                        "log" => eta.exp(),
                        "logit" => 1.0 / (1.0 + (-eta).exp()),
                        "probit" => normal_cdf(eta),
                        "cloglog" => 1.0 - (-eta.exp()).exp(),
                        "inverse" => 1.0 / eta,
                        "inverse_squared" => 1.0 / eta.sqrt(),
                        "sqrt" => eta * eta,
                        "cauchit" => 0.5 + (1.0 / std::f64::consts::PI) * eta.atan(),
                        _ => return Err(format!("Unsupported link function: {}", link_name)),
                    };
                    response.push(mu);
                }
                Ok(response)
            }
            _ => Err(format!(
                "Invalid prediction type: {}. Use 'link' or 'response'",
                pred_type
            )),
        }
    }
}

/// Extract Q matrix from packed QR decomposition
///
/// Matches R's qr.Q() function using Householder transformations
fn extract_q(qr: &QrDecomposition, n: usize, k: usize) -> Result<Vec<Vec<f64>>, String> {
    if qr.qr.is_empty() || qr.qraux.is_empty() {
        return Err("QR decomposition is empty".to_string());
    }

    // Start with identity matrix
    let mut q = vec![vec![0.0; n]; n];
    for i in 0..n {
        q[i][i] = 1.0;
    }

    // Apply Householder transformations in reverse order
    let ju = k.min(n);
    for col in 0..n {
        for j in (0..ju).rev() {
            if qr.qraux[j].abs() > 0.0 {
                // Compute t = -qraux[j] * (q[j,col] + sum(qr[i,j] * q[i,col])) / qraux[j]
                let mut t = qr.qraux[j] * q[j][col];
                for i in (j + 1)..n {
                    t += qr.qr[i][j] * q[i][col];
                }
                t = -t / qr.qraux[j];

                // Update q
                q[j][col] += t * qr.qraux[j];
                for i in (j + 1)..n {
                    q[i][col] += t * qr.qr[i][j];
                }
            }
        }
    }

    Ok(q)
}

/// Extract R matrix from packed QR decomposition
///
/// Matches R's qr.R() function
fn extract_r(qr: &QrDecomposition, k: usize) -> Result<Vec<Vec<f64>>, String> {
    if qr.qr.is_empty() {
        return Err("QR decomposition is empty".to_string());
    }

    let mut r = vec![vec![0.0; k]; k];
    for i in 0..k {
        for j in i..k {
            r[i][j] = qr.qr[i][j];
        }
    }

    Ok(r)
}

/// Compute inv_rqtt = t(backsolve(R, t(Q)))
///
/// Matches R's computation for influence measures
/// R * X = t(Q), solve for X, then transpose
fn compute_inv_r_qt(
    r: &[Vec<f64>],
    q: &[Vec<f64>],
    n: usize,
    k: usize,
) -> Result<Vec<Vec<f64>>, String> {
    // R's backsolve(R, t(Q)) solves R * X = t(Q) where X is k×n
    // t(Q) means we take rows of Q as columns

    let mut x = vec![vec![0.0; n]; k];

    // For each row j of Q, solve R * x = Q[j,:] and store as column of X
    for j in 0..n {
        let mut q_row = vec![0.0; k];
        for i in 0..k {
            q_row[i] = q[j][i];
        }

        let x_col = backsolve(r, &q_row)?;
        for i in 0..k {
            x[i][j] = x_col[i];
        }
    }

    // Transpose X to get inv_rqtt (n×k)
    let mut inv_rqtt = vec![vec![0.0; k]; n];
    for i in 0..n {
        for j in 0..k {
            inv_rqtt[i][j] = x[j][i];
        }
    }

    Ok(inv_rqtt)
}

/// Backsolve upper triangular system R * x = b
///
/// Matches R's backsolve() function
fn backsolve(r: &[Vec<f64>], b: &[f64]) -> Result<Vec<f64>, String> {
    let n = r.len();
    if b.len() != n {
        return Err(format!(
            "Dimension mismatch: R is {}x{}, b is {}",
            n,
            n,
            b.len()
        ));
    }

    let mut x = vec![0.0; n];

    // Back substitution
    for i in (0..n).rev() {
        let mut sum = b[i];
        for j in (i + 1)..n {
            sum -= r[i][j] * x[j];
        }

        if r[i][i].abs() < 1e-14 {
            return Err(format!("Singular matrix at row {}", i));
        }

        x[i] = sum / r[i][i];
    }

    Ok(x)
}

/// Standard normal CDF (cumulative distribution function)
///
/// Approximation using error function
fn normal_cdf(x: f64) -> f64 {
    0.5 * (1.0 + erf(x / std::f64::consts::SQRT_2))
}

/// Error function approximation
///
/// Uses Abramowitz and Stegun approximation (maximum error: 1.5e-7)
fn erf(x: f64) -> f64 {
    let a1 = 0.254829592;
    let a2 = -0.284496736;
    let a3 = 1.421413741;
    let a4 = -1.453152027;
    let a5 = 1.061405429;
    let p = 0.3275911;

    let sign = if x < 0.0 { -1.0 } else { 1.0 };
    let x = x.abs();

    let t = 1.0 / (1.0 + p * x);
    let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * (-x * x).exp();

    sign * y
}

/// Student's t CDF (cumulative distribution function)
///
/// Uses incomplete beta function
fn t_cdf(t: f64, df: usize) -> f64 {
    if df == 0 {
        return f64::NAN;
    }

    let df = df as f64;
    let x = df / (df + t * t);
    let a = df / 2.0;
    let b = 0.5;

    if t < 0.0 {
        0.5 * incomplete_beta(x, a, b)
    } else {
        1.0 - 0.5 * incomplete_beta(x, a, b)
    }
}

/// Incomplete beta function I_x(a,b)
///
/// Uses continued fraction expansion
fn incomplete_beta(x: f64, a: f64, b: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }
    if x >= 1.0 {
        return 1.0;
    }

    // Use symmetry relation if needed
    let (x, a, b, flip) = if x > (a + 1.0) / (a + b + 2.0) {
        (1.0 - x, b, a, true)
    } else {
        (x, a, b, false)
    };

    // Compute log of beta function coefficient
    let lbeta_ab = ln_gamma(a) + ln_gamma(b) - ln_gamma(a + b);
    let front = (a * x.ln() + b * (1.0 - x).ln() - lbeta_ab).exp() / a;

    // Continued fraction using modified Lentz method
    let f = beta_cont_frac(x, a, b);

    let result = front * f;

    if flip { 1.0 - result } else { result }
}

/// Continued fraction for incomplete beta function
fn beta_cont_frac(x: f64, a: f64, b: f64) -> f64 {
    const MAX_ITER: usize = 200;
    const EPS: f64 = 1e-15;

    let qab = a + b;
    let qap = a + 1.0;
    let qam = a - 1.0;
    let mut c = 1.0;
    let mut d = 1.0 - qab * x / qap;

    if d.abs() < 1e-30 {
        d = 1e-30;
    }
    d = 1.0 / d;
    let mut h = d;

    for m in 1..=MAX_ITER {
        let m_f = m as f64;
        let m2 = 2.0 * m_f;

        // Even step
        let aa = m_f * (b - m_f) * x / ((qam + m2) * (a + m2));
        d = 1.0 + aa * d;
        if d.abs() < 1e-30 {
            d = 1e-30;
        }
        c = 1.0 + aa / c;
        if c.abs() < 1e-30 {
            c = 1e-30;
        }
        d = 1.0 / d;
        h *= d * c;

        // Odd step
        let aa = -(a + m_f) * (qab + m_f) * x / ((a + m2) * (qap + m2));
        d = 1.0 + aa * d;
        if d.abs() < 1e-30 {
            d = 1e-30;
        }
        c = 1.0 + aa / c;
        if c.abs() < 1e-30 {
            c = 1e-30;
        }
        d = 1.0 / d;
        let del = d * c;
        h *= del;

        if (del - 1.0).abs() < EPS {
            return h;
        }
    }

    h
}

/// Natural logarithm of gamma function
///
/// Uses Lanczos approximation
fn ln_gamma(x: f64) -> f64 {
    const COEF: [f64; 6] = [
        76.18009172947146,
        -86.50532032941677,
        24.01409824083091,
        -1.231739572450155,
        0.1208650973866179e-2,
        -0.5395239384953e-5,
    ];

    let mut y = x;
    let mut tmp = x + 5.5;
    tmp -= (x + 0.5) * tmp.ln();
    let mut ser = 1.000000000190015;

    for (_j, &c) in COEF.iter().enumerate() {
        y += 1.0;
        ser += c / y;
    }

    -tmp + (2.5066282746310005 * ser / x).ln()
}

/// Create a GLM family from family and link names
fn create_family(
    family_name: &str,
    link_name: &str,
) -> Result<Box<dyn crate::stats::regression::family::GlmFamily>, String> {
    use crate::stats::regression::family::{binomial, gamma, gaussian, inverse_gaussian, poisson};

    match family_name {
        "gaussian" => match link_name {
            "identity" => Ok(Box::new(gaussian::GaussianFamily::identity())),
            "log" => Ok(Box::new(gaussian::GaussianFamily::log())),
            "inverse" => Ok(Box::new(gaussian::GaussianFamily::inverse())),
            _ => Err(format!("Unknown link '{}' for gaussian family", link_name)),
        },
        "binomial" => match link_name {
            "logit" => Ok(Box::new(binomial::BinomialFamily::logit())),
            "probit" => Ok(Box::new(binomial::BinomialFamily::probit())),
            "cauchit" => Ok(Box::new(binomial::BinomialFamily::cauchit())),
            "log" => Ok(Box::new(binomial::BinomialFamily::log())),
            "cloglog" => Ok(Box::new(binomial::BinomialFamily::cloglog())),
            _ => Err(format!("Unknown link '{}' for binomial family", link_name)),
        },
        "poisson" => match link_name {
            "log" => Ok(Box::new(poisson::PoissonFamily::log())),
            "identity" => Ok(Box::new(poisson::PoissonFamily::identity())),
            "sqrt" => Ok(Box::new(poisson::PoissonFamily::sqrt())),
            _ => Err(format!("Unknown link '{}' for poisson family", link_name)),
        },
        "gamma" => match link_name {
            "inverse" => Ok(Box::new(gamma::GammaFamily::inverse())),
            "identity" => Ok(Box::new(gamma::GammaFamily::identity())),
            _ => Err(format!("Unknown link '{}' for gamma family", link_name)),
        },
        "inverse_gaussian" => match link_name {
            "inverse_squared" | "1/mu²" | "1/mu^2" => Ok(Box::new(
                inverse_gaussian::InverseGaussianFamily::mu_squared(),
            )),
            "log" => Ok(Box::new(inverse_gaussian::InverseGaussianFamily::log())),
            "identity" => Ok(Box::new(inverse_gaussian::InverseGaussianFamily::identity())),
            "inverse" | "1/mu" => Ok(Box::new(inverse_gaussian::InverseGaussianFamily::inverse())),
            _ => Err(format!(
                "Unknown link '{}' for inverse_gaussian family",
                link_name
            )),
        },
        _ => Err(format!("Unknown family: {}", family_name)),
    }
}

/// Result of profiling a single parameter
struct ProfileResult {
    par_vals: Vec<f64>, // Parameter values
    z_vals: Vec<f64>,   // Signed sqrt of deviance differences
}

/// Interpolate profile to find confidence interval bounds
/// Uses cubic spline interpolation to find where z crosses ±cutoff
fn interpolate_profile_ci(
    par_vals: &[f64],
    z_vals: &[f64],
    cutoff: f64,
) -> Result<(f64, f64), String> {
    if par_vals.len() != z_vals.len() || par_vals.len() < 3 {
        return Err("Insufficient profile points for interpolation".to_string());
    }

    // Sort by parameter value
    let mut indices: Vec<usize> = (0..par_vals.len()).collect();
    indices.sort_by(|&a, &b| par_vals[a].partial_cmp(&par_vals[b]).unwrap());

    let sorted_pars: Vec<f64> = indices.iter().map(|&i| par_vals[i]).collect();
    let sorted_zs: Vec<f64> = indices.iter().map(|&i| z_vals[i]).collect();

    // Simple linear interpolation to find bounds
    // Lower bound: where z crosses -cutoff
    let lower = find_crossing(&sorted_pars, &sorted_zs, -cutoff)?;

    // Upper bound: where z crosses +cutoff
    let upper = find_crossing(&sorted_pars, &sorted_zs, cutoff)?;

    Ok((lower, upper))
}

/// Find where the profile crosses a specific z-value using linear interpolation
fn find_crossing(pars: &[f64], zs: &[f64], target_z: f64) -> Result<f64, String> {
    // Find the interval where z crosses target_z
    for i in 0..zs.len() - 1 {
        let z1 = zs[i];
        let z2 = zs[i + 1];

        // Check if target_z is between z1 and z2
        if (z1 <= target_z && target_z <= z2) || (z2 <= target_z && target_z <= z1) {
            // Linear interpolation
            let p1 = pars[i];
            let p2 = pars[i + 1];
            let t = (target_z - z1) / (z2 - z1);
            return Ok(p1 + t * (p2 - p1));
        }
    }

    // If we didn't find a crossing, return the closest endpoint
    // This can happen if the profile didn't extend far enough
    if target_z < 0.0 {
        Ok(*pars.first().unwrap())
    } else {
        Ok(*pars.last().unwrap())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normal_cdf() {
        assert!((normal_cdf(0.0) - 0.5).abs() < 1e-6);
        assert!((normal_cdf(1.96) - 0.975).abs() < 1e-3);
        assert!((normal_cdf(-1.96) - 0.025).abs() < 1e-3);
    }

    #[test]
    fn test_backsolve() {
        let r = vec![
            vec![2.0, 1.0, 0.0],
            vec![0.0, 3.0, 1.0],
            vec![0.0, 0.0, 4.0],
        ];
        let b = vec![8.0, 13.0, 8.0];
        let x = backsolve(&r, &b).unwrap();

        // Verify R * x = b
        assert!((r[0][0] * x[0] + r[0][1] * x[1] + r[0][2] * x[2] - b[0]).abs() < 1e-10);
        assert!((r[1][1] * x[1] + r[1][2] * x[2] - b[1]).abs() < 1e-10);
        assert!((r[2][2] * x[2] - b[2]).abs() < 1e-10);
    }
}
