//! Basic matrix operations

pub mod invert;
pub mod matmul;
pub mod transpose;

pub use invert::invert_symmetric;
pub use matmul::matmul;
pub use transpose::transpose;
