//! Link functions for GLM families - modularized
//!
//! This module provides various link functions used in GLM families,
//! including logit, probit, log, identity, and other common links.

// Module declarations
pub mod links_types;
pub mod links_implementations;
pub mod links_utils;
pub mod links_tests;

// Re-export main types
pub use links_types::{LinkFunction, LinkFunctionType};

// Re-export main implementations
pub use links_implementations::{
    LogitLink, ProbitLink, CauchitLink, LogLink, IdentityLink,
    InverseLink, SqrtLink, CloglogLink, PowerLink
};

// Re-export utility functions
pub use links_utils::{INVEPS, MTHRESH, THRESH, x_d_omx, x_d_opx};
