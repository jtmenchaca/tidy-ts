use statrs::distribution::{Beta, ContinuousCDF, Inverse};

fn qbeta(p: f64, shape1: f64, shape2: f64, _lower_tail: bool, log_p: bool) -> f64 {
    if shape1 <= 0.0 || shape2 <= 0.0 {
        return f64::NAN;
    }
    
    let p_val = if log_p { p.exp() } else { p };
    
    if p_val < 0.0 || p_val > 1.0 {
        return f64::NAN;
    }
    
    let beta = Beta::new(shape1, shape2).unwrap();
    beta.inverse_cdf(p_val)
}

fn main() {
    // Test case 1: qbeta(0.6875, 2, 3)
    let result1 = qbeta(0.6875, 2.0, 3.0, true, false);
    println!("qbeta(0.6875, 2, 3) = {}", result1);
    println!("Expected: 0.5");
    println!("Difference: {}", (result1 - 0.5).abs());
    
    // Test case 2: qbeta(ln(0.6875), 2, 3, log_p=true)
    let p = (0.6875f64).ln();
    let result2 = qbeta(p, 2.0, 3.0, true, true);
    println!("\nqbeta(ln(0.6875), 2, 3, log_p=true) = {}", result2);
    println!("Expected: 0.5");
    println!("Difference: {}", (result2 - 0.5).abs());
}
