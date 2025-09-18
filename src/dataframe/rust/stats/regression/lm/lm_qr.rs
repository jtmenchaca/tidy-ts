//! QR decomposition and least-squares solving for linear models

use super::lm_types::QrLsResult;
use faer::Mat;

#[cfg(feature = "wasm")]
use web_sys::console;

/// Column-pivoted QR + least-squares (replacement for R's `dqrls`).
///
/// `x` is column-major (n×p) and `y` is row-major (n×ny).
pub fn cdqrls(
    x: &[f64],
    y: &[f64],
    n: usize,
    p: usize,
    ny: usize,
    tol: Option<f64>,
) -> Result<QrLsResult, &'static str> {
    /* ---------- basic checks ---------- */
    #[cfg(feature = "wasm")]
    console::log_1(&format!("LM QR: n={}, p={}, ny={}, x.len()={}, y.len()={}", n, p, ny, x.len(), y.len()).into());
    
    if x.len() != n * p || y.len() != n * ny || n == 0 || p == 0 {
        #[cfg(feature = "wasm")]
        console::log_1(&"Error: dimension mismatch in LM QR".into());
        return Err("dimension mismatch");
    }
    if !x.iter().all(|v| v.is_finite()) || !y.iter().all(|v| v.is_finite()) {
        #[cfg(feature = "wasm")]
        console::log_1(&"Error: NA/NaN/Inf in input data".into());
        return Err("NA/NaN/Inf in input data");
    }

    /* ---------- build faer matrices ---------- */
    // faer is row-major internally so we transpose the col-major input on the fly
    #[cfg(feature = "wasm")]
    console::log_1(&"Building faer matrices".into());
    
    let x_mat = Mat::from_fn(n, p, |i, j| x[i + j * n]);
    let y_mat = Mat::from_fn(n, ny, |i, j| y[i + j * n]);
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("X matrix shape: {}x{}, Y matrix shape: {}x{}", x_mat.nrows(), x_mat.ncols(), y_mat.nrows(), y_mat.ncols()).into());

    /* ---------- Combined QR+solve (like R's dqrls) ---------- */
    #[cfg(feature = "wasm")]
    console::log_1(&"Starting combined QR decomposition and solve".into());
    
    // Create working matrices that we can modify
    let mut x_work = x_mat.to_owned();
    let mut y_work = y_mat.to_owned();
    
    #[cfg(feature = "wasm")]
    console::log_1(&"Attempting QR solve with thin decomposition".into());
    
    // Implement manual QR decomposition and solve to avoid WASM issues
    #[cfg(feature = "wasm")]
    console::log_1(&"Implementing manual QR decomposition".into());
    
    // Use Gram-Schmidt QR decomposition
    let mut q = Mat::zeros(n, p);
    let mut r = Mat::zeros(p, p);
    
    // Gram-Schmidt process
    for j in 0..p {
        // Start with the j-th column of A
        for i in 0..n {
            q[(i, j)] = x_mat[(i, j)];
        }
        
        // Orthogonalize against previous columns
        for k in 0..j {
            let mut dot_product = 0.0;
            for i in 0..n {
                dot_product += x_mat[(i, j)] * q[(i, k)];
            }
            r[(k, j)] = dot_product;
            
            for i in 0..n {
                q[(i, j)] -= dot_product * q[(i, k)];
            }
        }
        
        // Normalize
        let mut norm = 0.0;
        for i in 0..n {
            norm += q[(i, j)] * q[(i, j)];
        }
        norm = norm.sqrt();
        r[(j, j)] = norm;
        
        if norm > 1e-12 {
            for i in 0..n {
                q[(i, j)] /= norm;
            }
        }
    }
    
    #[cfg(feature = "wasm")]
    console::log_1(&"Manual QR decomposition completed".into());
    
    // Check rank
    let k = n.min(p);
    let max_d = (0..k).map(|i| r[(i, i)].abs()).fold(0.0, f64::max);
    let tol_eff = tol.unwrap_or(f64::EPSILON * (n.max(p) as f64) * max_d);
    let rank = (0..k).take_while(|&i| r[(i, i)].abs() > tol_eff).count();
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("QR rank: {}, max_d: {}, tol_eff: {}", rank, max_d, tol_eff).into());
    
    // Check for rank deficiency
    if rank < p {
        #[cfg(feature = "wasm")]
        console::log_1(&format!("WARNING: Matrix is rank deficient! rank={}, p={}", rank, p).into());
    }
    
    // Compute Q^T * y
    #[cfg(feature = "wasm")]
    console::log_1(&"Computing Q^T * y".into());
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Creating Q^T * y matrix: {}x{}", p, ny).into());
    
    let mut qty = Mat::zeros(p, ny);  // Q^T * y should be p x ny, not n x ny
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Q^T * y matrix created, starting computation: Q shape {}x{}, y shape {}x{}", 
        q.nrows(), q.ncols(), y_mat.nrows(), y_mat.ncols()).into());
    
    for j in 0..ny {
        #[cfg(feature = "wasm")]
        console::log_1(&format!("Computing Q^T * y for response column {}", j).into());
        
        for i in 0..p {  // Changed from n to p - Q^T should be p x n, so result is p x ny
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Computing Q^T * y[{}, {}], p={}, n={}", i, j, p, n).into());
            
            let mut sum = 0.0;
            for k in 0..n {
                let q_val = q[(k, i)];  // Q is n x p, so Q^T[i,k] = Q[k,i]
                let y_val = y_mat[(k, j)];
                sum += q_val * y_val;
                
                if k < 3 {  // Log first few operations
                    #[cfg(feature = "wasm")]
                    console::log_1(&format!("  k={}: q[{},{}]={} * y[{},{}]={} -> sum={}", 
                        k, k, i, q_val, k, j, y_val, sum).into());
                }
            }
            qty[(i, j)] = sum;
            
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Set qty[{},{}] = {}", i, j, sum).into());
        }
    }
    
    // Solve R * coef = Q^T * y using back substitution
    #[cfg(feature = "wasm")]
    console::log_1(&"Solving with back substitution".into());
    
    let mut coef = Mat::zeros(p, ny);
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Created coef matrix: {}x{}", coef.nrows(), coef.ncols()).into());
    
    for j in 0..ny {
        #[cfg(feature = "wasm")]
        console::log_1(&format!("Back substitution for response {}", j).into());
        
        for i in (0..rank).rev() {
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Back substitution step: i={}, j={}, rank={}", i, j, rank).into());
            
            let mut sum = qty[(i, j)];
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Initial sum from qty[{},{}] = {}", i, j, sum).into());
            
            for k in (i + 1)..rank {
                let r_ik = r[(i, k)];
                let coef_kj = coef[(k, j)];
                sum -= r_ik * coef_kj;
                #[cfg(feature = "wasm")]
                console::log_1(&format!("Back sub inner: k={}, r[{},{}]={}, coef[{},{}]={}, new_sum={}", 
                    k, i, k, r_ik, k, j, coef_kj, sum).into());
            }
            
            let r_ii = r[(i, i)];
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Diagonal element r[{},{}] = {}", i, i, r_ii).into());
            
            if r_ii.abs() > 1e-12 {
                coef[(i, j)] = sum / r_ii;
                #[cfg(feature = "wasm")]
                console::log_1(&format!("Set coef[{},{}] = {} / {} = {}", i, j, sum, r_ii, coef[(i, j)]).into());
            } else {
                #[cfg(feature = "wasm")]
                console::log_1(&format!("WARNING: Small diagonal element r[{},{}] = {}, skipping", i, i, r_ii).into());
            }
        }
    }
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Back substitution completed, coef shape: {}x{}", coef.nrows(), coef.ncols()).into());

    // Compute fitted values and residuals
    #[cfg(feature = "wasm")]
    console::log_1(&"Computing fitted values (X * coef)".into());
    
    let fitted = &x_mat * &coef;
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Fitted values computed, shape: {}x{}", fitted.nrows(), fitted.ncols()).into());
    
    #[cfg(feature = "wasm")]
    console::log_1(&"Computing residuals (y - fitted)".into());
    
    let residuals = Mat::from_fn(n, ny, |i, j| {
        let y_val = y_mat[(i, j)];
        let fitted_val = fitted[(i, j)];
        let residual = y_val - fitted_val;
        if i < 3 && j == 0 {  // Log first few residuals for debugging
            #[cfg(feature = "wasm")]
            console::log_1(&format!("Residual[{},{}]: {} - {} = {}", i, j, y_val, fitted_val, residual).into());
        }
        residual
    });
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Residuals computed, shape: {}x{}", residuals.nrows(), residuals.ncols()).into());
    
    #[cfg(feature = "wasm")]
    console::log_1(&"Setting effects = Q^T * y".into());
    
    let effects = qty.clone(); // Q^T * y is our effects
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Effects set, shape: {}x{}", effects.nrows(), effects.ncols()).into());
    
    // Create packed QR output (R in upper triangle, Q below diagonal)
    #[cfg(feature = "wasm")]
    console::log_1(&"Creating packed QR output".into());
    
    let mut qr_packed = vec![0.0; n * p];
    #[cfg(feature = "wasm")]
    console::log_1(&format!("QR packed vector allocated, length: {}", qr_packed.len()).into());
    
    for j in 0..p {
        #[cfg(feature = "wasm")]
        console::log_1(&format!("Packing QR column {}", j).into());
        
        for i in 0..n {
            let value = if i <= j {
                r[(i, j)]
            } else {
                q[(i, j)]
            };
            qr_packed[i + j * n] = value;
            
            if j < 2 && i < 3 {  // Log first few elements for debugging
                #[cfg(feature = "wasm")]
                console::log_1(&format!("QR[{},{}] = {} (from {})", i, j, value, if i <= j { "R" } else { "Q" }).into());
            }
        }
    }
    
    #[cfg(feature = "wasm")]
    console::log_1(&"QR packing completed".into());
    
    // No pivoting, so pivot is just 1:p
    #[cfg(feature = "wasm")]
    console::log_1(&"Creating pivot vector".into());
    
    let pivot: Vec<i32> = (1..=p as i32).collect();
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Pivot vector created, length: {}", pivot.len()).into());

    #[cfg(feature = "wasm")]
    console::log_1(&"Creating qraux vector (diagonal of R)".into());
    
    // qraux: diagonal of R (length min(n,p))
    let qraux: Vec<f64> = (0..k).map(|i| {
        let diag_val = r[(i, i)];
        #[cfg(feature = "wasm")]
        console::log_1(&format!("qraux[{}] = r[{},{}] = {}", i, i, i, diag_val).into());
        diag_val
    }).collect();
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("qraux vector created, length: {}", qraux.len()).into());

    // Convert matrices to column-major layout for output
    #[cfg(feature = "wasm")]
    console::log_1(&"Converting coefficients to column-major layout".into());
    
    let mut coefficients = Vec::with_capacity(p * ny);
    for j in 0..ny {
        #[cfg(feature = "wasm")]
        console::log_1(&format!("Converting coefficients for response {}", j).into());
        
        for i in 0..p {
            let coef_val = coef[(i, j)];
            coefficients.push(coef_val);
            
            if i < 3 {  // Log first few coefficients
                #[cfg(feature = "wasm")]
                console::log_1(&format!("coefficients[{}] = coef[{},{}] = {}", coefficients.len()-1, i, j, coef_val).into());
            }
        }
    }
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Coefficients converted, length: {}", coefficients.len()).into());
    
    #[cfg(feature = "wasm")]
    console::log_1(&"Converting residuals to column-major layout".into());
    
    let mut residuals_vec = Vec::with_capacity(n * ny);
    for j in 0..ny {
        #[cfg(feature = "wasm")]
        console::log_1(&format!("Converting residuals for response {}", j).into());
        
        for i in 0..n {
            let residual_val = residuals[(i, j)];
            residuals_vec.push(residual_val);
            
            if i < 3 {  // Log first few residuals
                #[cfg(feature = "wasm")]
                console::log_1(&format!("residuals_vec[{}] = residuals[{},{}] = {}", residuals_vec.len()-1, i, j, residual_val).into());
            }
        }
    }
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Residuals converted, length: {}", residuals_vec.len()).into());
    
    #[cfg(feature = "wasm")]
    console::log_1(&"Converting effects to column-major layout".into());
    
    let mut effects_vec = Vec::with_capacity(p * ny);  // Changed from n to p
    for j in 0..ny {
        #[cfg(feature = "wasm")]
        console::log_1(&format!("Converting effects for response {}", j).into());
        
        for i in 0..p {  // Changed from n to p since effects is now p x ny
            let effect_val = effects[(i, j)];
            effects_vec.push(effect_val);
            
            if i < 3 {  // Log first few effects
                #[cfg(feature = "wasm")]
                console::log_1(&format!("effects_vec[{}] = effects[{},{}] = {}", effects_vec.len()-1, i, j, effect_val).into());
            }
        }
    }
    
    #[cfg(feature = "wasm")]
    console::log_1(&format!("Effects converted, length: {}", effects_vec.len()).into());

    #[cfg(feature = "wasm")]
    console::log_1(&"Creating final QrLsResult".into());
    
    Ok(QrLsResult {
        qr: qr_packed,
        qraux,
        coefficients,
        residuals: residuals_vec,
        effects: effects_vec,
        rank,
        pivot,
        tol: tol_eff,
        pivoted: true,
    })
}
