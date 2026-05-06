//! QR decomposition and least-squares solving

pub mod apply_qy;
pub mod cdqrls;
pub mod types;

pub use apply_qy::apply_qy;
pub use cdqrls::cdqrls;
pub use types::QrLsResult;
