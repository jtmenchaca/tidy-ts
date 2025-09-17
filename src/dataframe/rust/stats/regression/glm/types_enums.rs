//! GLM enum types
//!
//! This file contains enums and their implementations for GLM.

/// Residual type for GLM
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResidualType {
    /// Deviance residuals
    Deviance,
    /// Pearson residuals
    Pearson,
    /// Working residuals
    Working,
    /// Response residuals
    Response,
    /// Partial residuals
    Partial,
}

impl std::fmt::Display for ResidualType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ResidualType::Deviance => write!(f, "deviance"),
            ResidualType::Pearson => write!(f, "pearson"),
            ResidualType::Working => write!(f, "working"),
            ResidualType::Response => write!(f, "response"),
            ResidualType::Partial => write!(f, "partial"),
        }
    }
}

impl std::str::FromStr for ResidualType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "deviance" => Ok(ResidualType::Deviance),
            "pearson" => Ok(ResidualType::Pearson),
            "working" => Ok(ResidualType::Working),
            "response" => Ok(ResidualType::Response),
            "partial" => Ok(ResidualType::Partial),
            _ => Err(format!("Unknown residual type: {}", s)),
        }
    }
}

/// Weight type for GLM
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WeightType {
    /// Prior weights
    Prior,
    /// Working weights
    Working,
}

impl std::fmt::Display for WeightType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WeightType::Prior => write!(f, "prior"),
            WeightType::Working => write!(f, "working"),
        }
    }
}

impl std::str::FromStr for WeightType {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "prior" => Ok(WeightType::Prior),
            "working" => Ok(WeightType::Working),
            _ => Err(format!("Unknown weight type: {}", s)),
        }
    }
}
