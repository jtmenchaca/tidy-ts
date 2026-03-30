//! Exact partial likelihood for Cox PH model
//!
//! Port of R's `coxexact.c` — handles tied death times via exact enumeration
//! of all subsets. Uses recursive memoized functions `coxd0`, `coxd1`, `coxd2`
//! to compute the d-th elementary symmetric polynomial and its derivatives.

use super::cholesky::{chinv2, cholesky2, chsolve2};
use super::cox_regression::{CoxfitConfig, CoxfitResult};

const NOTDONE: f64 = -1.1;

/// Compute the d-th elementary symmetric polynomial of score[0..n].
/// coxd0(d, n) = sum over all C(n,d) subsets of d items from score[0..n-1]
///               of the product of the selected scores.
/// Uses memoization in `dmat[d-1, n-1]` (0-indexed: dmat[(n-1)*dmax + d-1]).
fn coxd0(d: usize, n: usize, score: &[f64], dmat: &mut [f64], dmax: usize) -> f64 {
    if d == 0 {
        return 1.0;
    }
    let idx = (n - 1) * dmax + d - 1;
    if dmat[idx] == NOTDONE {
        dmat[idx] = score[n - 1] * coxd0(d - 1, n - 1, score, dmat, dmax);
        if d < n {
            dmat[idx] += coxd0(d, n - 1, score, dmat, dmax);
        }
    }
    dmat[idx]
}

/// First derivative of the d-th elementary symmetric polynomial w.r.t. beta,
/// using covariate values `covar`.
fn coxd1(
    d: usize,
    n: usize,
    score: &[f64],
    dmat: &mut [f64],
    d1: &mut [f64],
    covar: &[f64],
    dmax: usize,
) -> f64 {
    let idx = (n - 1) * dmax + d - 1;
    if d1[idx] == NOTDONE {
        d1[idx] = score[n - 1] * covar[n - 1] * coxd0(d - 1, n - 1, score, dmat, dmax);
        if d < n {
            d1[idx] += coxd1(d, n - 1, score, dmat, d1, covar, dmax);
        }
        if d > 1 {
            d1[idx] += score[n - 1] * coxd1(d - 1, n - 1, score, dmat, d1, covar, dmax);
        }
    }
    d1[idx]
}

/// Second derivative (cross-term) of the d-th elementary symmetric polynomial.
fn coxd2(
    d: usize,
    n: usize,
    score: &[f64],
    dmat: &mut [f64],
    d1j: &mut [f64],
    d1k: &mut [f64],
    d2: &mut [f64],
    covarj: &[f64],
    covark: &[f64],
    dmax: usize,
) -> f64 {
    let idx = (n - 1) * dmax + d - 1;
    if d2[idx] == NOTDONE {
        d2[idx] =
            coxd0(d - 1, n - 1, score, dmat, dmax) * score[n - 1] * covarj[n - 1] * covark[n - 1];
        if d < n {
            d2[idx] += coxd2(
                d,
                n - 1,
                score,
                dmat,
                d1j,
                d1k,
                d2,
                covarj,
                covark,
                dmax,
            );
        }
        if d > 1 {
            d2[idx] += score[n - 1]
                * (coxd2(
                    d - 1,
                    n - 1,
                    score,
                    dmat,
                    d1j,
                    d1k,
                    d2,
                    covarj,
                    covark,
                    dmax,
                ) + covarj[n - 1] * coxd1(d - 1, n - 1, score, dmat, d1k, covark, dmax)
                    + covark[n - 1] * coxd1(d - 1, n - 1, score, dmat, d1j, covarj, dmax));
        }
    }
    d2[idx]
}

/// Fit Cox PH model using exact partial likelihood for tied death times.
///
/// Port of R's `coxexact()` from `coxexact.c`.
/// Same interface as `coxfit6` but uses exact combinatorial enumeration
/// instead of Breslow or Efron approximation for tied events.
pub fn coxexact(
    xtime: &[f64],
    status: &[i32],
    covar_in: &[Vec<f64>],
    strata_in: &[i32],
    offset: &[f64],
    init: &[f64],
    config: &CoxfitConfig,
) -> CoxfitResult {
    let nused = xtime.len();
    let nvar = covar_in.len();
    let maxiter = config.maxiter;
    let eps = config.eps;
    let toler = config.toler;

    let covar: Vec<Vec<f64>> = covar_in.to_vec();
    let mut strata: Vec<i32> = strata_in.to_vec();
    let mut imat = vec![vec![0.0_f64; nvar]; nvar];
    let mut u_vec = vec![0.0_f64; nvar];
    let mut beta: Vec<f64> = init.to_vec();
    let mut score = vec![0.0_f64; nused];

    // First pass: determine maxdeath per stratum and dsize
    strata[0] = 1; // ensure first obs is marked as stratum start
    let mut maxdeath_global: usize = 0;
    let mut dsize: usize = 0;
    {
        let mut j = 0;
        let mut maxdeath: usize = 0;
        let mut nrisk: usize = 0;
        let mut i = 0;
        while i < nused {
            if strata[i] >= 1 {
                // first obs of new stratum
                if i > 0 {
                    if maxdeath > 1 {
                        strata[j] = maxdeath as i32;
                    }
                    if maxdeath * nrisk > dsize {
                        dsize = maxdeath * nrisk;
                    }
                    j = i;
                }
                maxdeath = 0;
                nrisk = 0;
            }
            let dtime = xtime[i];
            let mut ndeath: usize = 0;
            while i < nused && xtime[i] == dtime && (i == j || strata[i] == 0) {
                nrisk += 1;
                if status[i] == 1 {
                    ndeath += 1;
                }
                i += 1;
            }
            if ndeath > maxdeath {
                maxdeath = ndeath;
            }
        }
        // final stratum
        if maxdeath * nrisk > dsize {
            dsize = maxdeath * nrisk;
        }
        if maxdeath > 1 {
            strata[j] = maxdeath as i32;
        }
        maxdeath_global = maxdeath;
    }
    let _ = maxdeath_global; // used for stack overflow prevention

    // Allocate scratch memory
    let dmemtot = dsize * ((nvar * (nvar + 1)) / 2 + nvar + 1);
    let mut dmem0 = vec![NOTDONE; dsize.max(1)]; // d0 array
    let mut dmem1: Vec<Vec<f64>> = (0..nvar).map(|_| vec![NOTDONE; dsize.max(1)]).collect();
    let mut d1_result = vec![0.0_f64; nvar];
    let _ = dmemtot;

    // Inner function: compute loglik, u, imat for given beta
    let compute_iteration = |beta: &[f64],
                             score: &mut [f64],
                             u_vec: &mut [f64],
                             imat: &mut [Vec<f64>],
                             strata: &[i32],
                             dmem0: &mut [f64],
                             dmem1: &mut [Vec<f64>],
                             d1_result: &mut [f64]|
     -> f64 {
        let mut newlk = 0.0_f64;
        for j in 0..nvar {
            u_vec[j] = 0.0;
            for k in 0..nvar {
                imat[j][k] = 0.0;
            }
        }

        let mut sstart: usize = 0;
        let mut nrisk: usize = 0;
        let mut maxdeath_s: usize = 1;
        let mut i = 0;

        while i < nused {
            if strata[i] >= 1 {
                // first obs of new stratum
                maxdeath_s = strata[i].max(1) as usize;
                for v in dmem0.iter_mut() {
                    *v = NOTDONE;
                }
                for d1v in dmem1.iter_mut() {
                    for v in d1v.iter_mut() {
                        *v = NOTDONE;
                    }
                }
                sstart = i;
                nrisk = 0;
            }

            let dtime = xtime[i];
            let mut ndeath: usize = 0;
            while i < nused
                && xtime[i] == dtime
                && (i == sstart || strata[i] == 0)
            {
                let mut zbeta = offset[i];
                for j in 0..nvar {
                    zbeta += covar[j][i] * beta[j];
                }
                score[i] = zbeta.exp();
                if status[i] == 1 {
                    newlk += zbeta;
                    for j in 0..nvar {
                        u_vec[j] += covar[j][i];
                    }
                    ndeath += 1;
                }
                nrisk += 1;
                i += 1;
            }

            if ndeath > 0 {
                let d0 = coxd0(
                    ndeath,
                    nrisk,
                    &score[sstart..],
                    dmem0,
                    maxdeath_s,
                );
                newlk -= d0.ln();

                // Second derivative scratch: need nvar*(nvar+1)/2 arrays of size dsize
                let n_d2 = nvar * (nvar + 1) / 2;
                let mut dmem2: Vec<Vec<f64>> =
                    (0..n_d2).map(|_| vec![NOTDONE; dsize.max(1)]).collect();

                for j in 0..nvar {
                    let d1j = coxd1(
                        ndeath,
                        nrisk,
                        &score[sstart..],
                        dmem0,
                        &mut dmem1[j],
                        &covar[j][sstart..],
                        maxdeath_s,
                    ) / d0;
                    d1_result[j] = d1j;
                    u_vec[j] -= d1j;

                    for k in 0..=j {
                        let flat = j * (j + 1) / 2 + k;
                        let temp = if j == k {
                            // Same covariate: d1j and d1k are the same memo array.
                            // Safe because coxd1 writes identical values for identical inputs.
                            // SAFETY: same semantics as the C code (coxexact.c) which passes
                            // the same pointer for both d1j and d1k when j==k.
                            let ptr = dmem1[j].as_mut_ptr();
                            let len = dmem1[j].len();
                            let d1j = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
                            let d1k = unsafe { std::slice::from_raw_parts_mut(ptr, len) };
                            coxd2(
                                ndeath,
                                nrisk,
                                &score[sstart..],
                                dmem0,
                                d1j,
                                d1k,
                                &mut dmem2[flat],
                                &covar[j][sstart..],
                                &covar[k][sstart..],
                                maxdeath_s,
                            )
                        } else {
                            // Different covariates: use split_at_mut for non-overlapping borrows
                            let (left, right) = dmem1.split_at_mut(j.max(k));
                            let (d1_lo, d1_hi) = if j > k {
                                (&mut right[0], &mut left[k])
                            } else {
                                (&mut left[j], &mut right[0])
                            };
                            coxd2(
                                ndeath,
                                nrisk,
                                &score[sstart..],
                                dmem0,
                                d1_lo,
                                d1_hi,
                                &mut dmem2[flat],
                                &covar[j][sstart..],
                                &covar[k][sstart..],
                                maxdeath_s,
                            )
                        };
                        imat[k][j] += temp / d0 - d1_result[j] * d1_result[k];
                    }
                }
            }
        }
        newlk
    };

    // Initial iteration
    let newlk = compute_iteration(
        &beta,
        &mut score,
        &mut u_vec,
        &mut imat,
        &strata,
        &mut dmem0,
        &mut dmem1,
        &mut d1_result,
    );

    let loglik_0 = newlk;
    let mut loglik_1 = newlk;

    // Score test
    let u0: Vec<f64> = u_vec.clone();
    let _flag = cholesky2(&mut imat, nvar, toler);
    chsolve2(&imat, nvar, &mut u_vec);
    let sctest: f64 = u_vec.iter().zip(u0.iter()).map(|(u, u0)| u * u0).sum();

    if maxiter == 0 {
        chinv2(&mut imat, nvar);
        for i in 1..nvar {
            for j in 0..i {
                imat[i][j] = imat[j][i];
            }
        }
        return CoxfitResult {
            coef: beta,
            means: vec![0.0; nvar],
            u: u0,
            imat,
            loglik: [loglik_0, loglik_0],
            sctest,
            iter: 0,
            flag: 0,
        };
    }

    // Update beta
    let mut oldbeta = beta.clone();
    for i in 0..nvar {
        beta[i] += u_vec[i];
    }

    let mut halving = false;
    let mut final_iter = 0;

    for iter in 1..=maxiter {
        let newlk = compute_iteration(
            &beta,
            &mut score,
            &mut u_vec,
            &mut imat,
            &strata,
            &mut dmem0,
            &mut dmem1,
            &mut d1_result,
        );

        let _flag = cholesky2(&mut imat, nvar, toler);

        let all_finite = newlk.is_finite()
            && u_vec.iter().all(|u| u.is_finite())
            && imat.iter().all(|row| row.iter().all(|v| v.is_finite()));

        if all_finite && (1.0 - loglik_1 / newlk).abs() <= eps && !halving {
            // Converged
            loglik_1 = newlk;
            final_iter = iter;
            chinv2(&mut imat, nvar);
            for i in 1..nvar {
                for j in 0..i {
                    imat[i][j] = imat[j][i];
                }
            }
            return CoxfitResult {
                coef: beta,
                means: vec![0.0; nvar],
                u: u_vec,
                imat,
                loglik: [loglik_0, loglik_1],
                sctest,
                iter: final_iter as i32,
                flag: 0,
            };
        }

        if iter == maxiter {
            loglik_1 = newlk;
            break;
        }

        if !all_finite || newlk < loglik_1 {
            // Step halving
            halving = true;
            for i in 0..nvar {
                beta[i] = (oldbeta[i] + beta[i]) / 2.0;
            }
        } else {
            halving = false;
            loglik_1 = newlk;
            chsolve2(&imat, nvar, &mut u_vec);
            for i in 0..nvar {
                oldbeta[i] = beta[i];
                beta[i] += u_vec[i];
            }
        }
        final_iter = iter;
    }

    // Did not converge — recompute at last good beta
    if maxiter > 1 {
        for i in 0..nvar {
            beta[i] = oldbeta[i];
        }
        let newlk = compute_iteration(
            &beta,
            &mut score,
            &mut u_vec,
            &mut imat,
            &strata,
            &mut dmem0,
            &mut dmem1,
            &mut d1_result,
        );
        loglik_1 = newlk;
    }

    chinv2(&mut imat, nvar);
    for i in 1..nvar {
        for j in 0..i {
            imat[i][j] = imat[j][i];
        }
    }

    CoxfitResult {
        coef: beta,
        means: vec![0.0; nvar],
        u: u_vec,
        imat,
        loglik: [loglik_0, loglik_1],
        sctest,
        iter: final_iter as i32,
        flag: 1000, // signal no convergence
    }
}
