//! WASM bindings for tidy-stats regression operations
//!
//! This module provides WebAssembly exports for GLM and regression functionality.

#![cfg(feature = "wasm")]

use faer::{Mat, linalg::solvers::ColPivQr, prelude::SolveLstsq};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize)]
pub struct QrResult {
    pub coefficients: Vec<f64>,
    pub residuals: Vec<f64>,
    pub effects: Vec<f64>,
    pub rank: usize,
    pub pivot: Vec<i32>, // 1-based like R
    pub qr: Vec<f64>,
    pub qraux: Vec<f64>,
}

#[wasm_bindgen]
pub fn qr_solve(
    x: &[f64],
    y: &[f64],
    n: usize,
    p: usize,
    _ny: usize, // always 1
    tol: f64,
) -> JsValue {
    /* 1 — build matrices -------------------------------------------------- */
    let x_mat = Mat::from_fn(n, p, |i, j| x[i + j * n]);
    let y_mat = Mat::from_fn(n, 1, |i, _| y[i]);

    /* 2 — QR with column pivots ------------------------------------------ */
    let qr = ColPivQr::new(x_mat.as_ref());
    let r = qr.R();
    let k = n.min(p);
    let max = (0..k).map(|i| r[(i, i)].abs()).fold(0.0, f64::max);
    // Use R's exact tolerance calculation: min(1e-7, epsilon/1000)
    // This matches R's glm.fit implementation for numerical precision
    let eps = if tol > 0.0 { tol } else { 1e-11 }; // equivalent to epsilon/1000 when epsilon=1e-8
    let thresh = eps * max.max(1.0);
    let rank = (0..k).take_while(|&i| r[(i, i)].abs() > thresh).count();

    /* 3 — LS solve restricted to estimable columns ----------------------- */
    let mut beta_perm = Mat::zeros(p, 1); // p × 1
    
    if rank > 0 {
        // 1. rhs = Qᵀ y
        let q = qr.compute_Q();
        let qty = q.transpose() * y_mat.as_ref(); // k × 1
        
        // 2. Solve upper-triangular R11 β1 = qty[0..r]
        let r11 = qr.R().submatrix(0, 0, rank, rank); // r × r
        let b1_rhs = qty.submatrix(0, 0, rank, 1); // r × 1
        
        // Manual triangular solve: R11 * beta1 = b1_rhs
        // Since R11 is upper triangular, we can solve by back-substitution
        for i in (0..rank).rev() {
            let mut sum = b1_rhs[(i, 0)];
            for j in (i + 1)..rank {
                sum -= r11[(i, j)] * beta_perm[(j, 0)];
            }
            beta_perm[(i, 0)] = sum / r11[(i, i)];
        }
    }

    /* 4 — un-permute & mask ---------------------------------------------- */
    let perm = qr.P();
    let perm_arrays = perm.arrays();
    let forward = perm_arrays.0;
    let backward = perm_arrays.1;
    let mut beta = vec![f64::NAN; p];

    for k in 0..rank {
        let orig = backward[k];
        beta[orig] = beta_perm[(k, 0)];
    }

    /* 5 — residuals & effects in original order -------------------------- */
    let fitted: Vec<f64> = (0..n)
        .map(|i| {
            (0..p)
                .map(|j| x[i + j * n] * beta[j].nan_to(0.0))
                .sum::<f64>()
        })
        .collect();

    let residuals: Vec<f64> = y.iter().zip(&fitted).map(|(y, f)| y - f).collect();
    let q = qr.compute_Q();
    let qt_y = q.transpose() * y_mat.as_ref();
    let effects: Vec<f64> = (0..qt_y.nrows()).map(|i| qt_y[(i, 0)]).collect();

    /* 6 — package result -------------------------------------------------- */
    let result = QrResult {
        coefficients: beta,
        residuals,
        effects,
        rank,
        pivot: backward.iter().map(|&i| i as i32 + 1).collect(),
        qr: x.to_vec(),      // keep existing layout
        qraux: vec![1.0; k], // placeholder
    };
    serde_wasm_bindgen::to_value(&result).unwrap()
}

/* Helper for NaN→0 when forming fitted values */
trait NanTo {
    fn nan_to(self, v: f64) -> f64;
}
impl NanTo for f64 {
    fn nan_to(self, v: f64) -> f64 {
        if self.is_nan() { v } else { self }
    }
}
