//! Triangular matrix operations (LAPACK primitives)

pub mod dlauu2;
pub mod dtrti2;

pub use self::dlauu2::dlauu2;
pub use self::dtrti2::dtrti2;
