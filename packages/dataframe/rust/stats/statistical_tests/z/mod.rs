pub mod one_sample;
pub mod sample_size;
pub mod two_sample;

// WASM bindings (when compiled for WASM)
#[cfg(feature = "wasm")]
pub mod wasm;

pub use one_sample::z_test;
pub use sample_size::z_sample_size;
pub use two_sample::{z_test_ind, z_test_paired};
