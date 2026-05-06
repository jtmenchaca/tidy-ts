//! Linear algebra primitives shared across the stats module

pub mod cholesky;
pub mod matrix;
pub mod qr;
pub mod solve;
pub mod triangular;

pub use cholesky::*;
pub use matrix::*;
pub use qr::*;
pub use solve::*;
pub use triangular::*;
