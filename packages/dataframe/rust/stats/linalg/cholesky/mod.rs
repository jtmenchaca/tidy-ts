//! Cholesky decomposition and related inverse

pub mod decompose;
pub mod inverse;

pub use decompose::cholesky_decompose;
pub use inverse::chol2inv;
