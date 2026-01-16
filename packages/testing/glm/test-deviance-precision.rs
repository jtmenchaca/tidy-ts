// Test deviance precision
// Compile with: rustc test-deviance-precision.rs && ./test-deviance-precision

fn main() {
    let y = vec![5.0, 7.0, 9.0, 11.0, 13.0];
    let mu = vec![5.0, 7.0, 9.0, 11.0, 13.0];
    let weights = vec![1.0, 1.0, 1.0, 1.0, 1.0];

    let mut total_deviance = 0.0;

    for i in 0..y.len() {
        let yi = y[i];
        let mui = mu[i];
        let weight = weights[i];

        if weight > 0.0 {
            // For Gaussian: deviance = sum(weight * (y - mu)^2)
            let diff: f64 = yi - mui;
            let contribution = weight * diff.powi(2);
            println!("i={}: y={}, mu={}, (y-mu)^2={}, contribution={}",
                     i, yi, mui, diff.powi(2), contribution);
            total_deviance += contribution;
        }
    }

    println!("\nTotal deviance: {}", total_deviance);
    println!("Total deviance (scientific): {:e}", total_deviance);
    println!("Total deviance == 0.0: {}", total_deviance == 0.0);
    println!("Total deviance < 1e-20: {}", total_deviance < 1e-20);
}
