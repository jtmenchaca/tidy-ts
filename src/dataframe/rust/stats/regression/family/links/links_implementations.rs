//! Link function implementations

use super::links_types::{LinkFunction, LinkFunctionType};
use super::links_utils::{INVEPS, MTHRESH, THRESH, x_d_omx, x_d_opx};

/// Logit link function
pub struct LogitLink;

impl LinkFunction for LogitLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for logit link");
        }
        Ok((mu / (1.0 - mu)).ln())
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for logit link");
        }
        Ok(1.0 / (1.0 + (-eta).exp()))
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for logit link");
        }
        let mu = self.link_inverse(eta)?;
        Ok(mu * (1.0 - mu))
    }

    fn name(&self) -> &'static str {
        "logit"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu > 0.0 && mu < 1.0
    }

    fn valid_eta(&self, _eta: f64) -> bool {
        true
    }
    
    fn clone_box(&self) -> Box<dyn LinkFunction> {
        Box::new(LogitLink)
    }
}

/// Probit link function
pub struct ProbitLink;

impl LinkFunction for ProbitLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for probit link");
        }
        Ok(normal_quantile(mu))
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for probit link");
        }
        Ok(normal_cdf(eta))
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for probit link");
        }
        Ok(normal_pdf(eta))
    }

    fn name(&self) -> &'static str {
        "probit"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu > 0.0 && mu < 1.0
    }

    fn valid_eta(&self, _eta: f64) -> bool {
        true
    }
    
    fn clone_box(&self) -> Box<dyn LinkFunction> {
        Box::new(ProbitLink)
    }
}

/// Cauchit link function
pub struct CauchitLink;

impl LinkFunction for CauchitLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for cauchit link");
        }
        Ok(cauchy_quantile(mu))
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for cauchit link");
        }
        Ok(cauchy_cdf(eta))
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for cauchit link");
        }
        Ok(cauchy_pdf(eta))
    }

    fn name(&self) -> &'static str {
        "cauchit"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu > 0.0 && mu < 1.0
    }

    fn valid_eta(&self, _eta: f64) -> bool {
        true
    }
    
    fn clone_box(&self) -> Box<dyn LinkFunction> {
        Box::new(CauchitLink)
    }
}

/// Log link function
pub struct LogLink;

impl LinkFunction for LogLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for log link");
        }
        Ok(mu.ln())
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for log link");
        }
        Ok(eta.exp())
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for log link");
        }
        Ok(eta.exp())
    }

    fn name(&self) -> &'static str {
        "log"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu > 0.0
    }

    fn valid_eta(&self, _eta: f64) -> bool {
        true
    }
    
    fn clone_box(&self) -> Box<dyn LinkFunction> {
        Box::new(LogLink)
    }
}

/// Identity link function
pub struct IdentityLink;

impl LinkFunction for IdentityLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        Ok(mu)
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        Ok(eta)
    }

    fn mu_eta(&self, _eta: f64) -> Result<f64, &'static str> {
        Ok(1.0)
    }

    fn name(&self) -> &'static str {
        "identity"
    }

    fn valid_mu(&self, _mu: f64) -> bool {
        true
    }

    fn valid_eta(&self, _eta: f64) -> bool {
        true
    }
    
    fn clone_box(&self) -> Box<dyn LinkFunction> {
        Box::new(IdentityLink)
    }
}

/// Inverse link function
pub struct InverseLink;

impl LinkFunction for InverseLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for inverse link");
        }
        Ok(1.0 / mu)
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for inverse link");
        }
        Ok(1.0 / eta)
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for inverse link");
        }
        Ok(-1.0 / (eta * eta))
    }

    fn name(&self) -> &'static str {
        "inverse"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu != 0.0
    }

    fn valid_eta(&self, eta: f64) -> bool {
        eta != 0.0
    }
    
    fn clone_box(&self) -> Box<dyn LinkFunction> {
        Box::new(InverseLink)
    }
}

/// Square root link function
pub struct SqrtLink;

impl LinkFunction for SqrtLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for sqrt link");
        }
        Ok(mu.sqrt())
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for sqrt link");
        }
        Ok(eta * eta)
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for sqrt link");
        }
        Ok(2.0 * eta)
    }

    fn name(&self) -> &'static str {
        "sqrt"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu >= 0.0
    }

    fn valid_eta(&self, eta: f64) -> bool {
        eta >= 0.0
    }
}

/// Complementary log-log link function
pub struct CloglogLink;

impl LinkFunction for CloglogLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for cloglog link");
        }
        Ok((-(-mu).ln()).ln())
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for cloglog link");
        }
        Ok(1.0 - (-eta).exp().exp())
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for cloglog link");
        }
        let mu = self.link_inverse(eta)?;
        Ok(mu * (1.0 - mu) * (-mu).ln())
    }

    fn name(&self) -> &'static str {
        "cloglog"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu > 0.0 && mu < 1.0
    }

    fn valid_eta(&self, _eta: f64) -> bool {
        true
    }
    
    fn clone_box(&self) -> Box<dyn LinkFunction> {
        Box::new(CloglogLink)
    }
}

/// Power link function
pub struct PowerLink(pub f64);

impl LinkFunction for PowerLink {
    fn link(&self, mu: f64) -> Result<f64, &'static str> {
        if !self.valid_mu(mu) {
            return Err("Invalid mu for power link");
        }
        if self.0 == 0.0 {
            Ok(mu.ln())
        } else {
            Ok(mu.powf(self.0))
        }
    }

    fn link_inverse(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for power link");
        }
        if self.0 == 0.0 {
            Ok(eta.exp())
        } else {
            Ok(eta.powf(1.0 / self.0))
        }
    }

    fn mu_eta(&self, eta: f64) -> Result<f64, &'static str> {
        if !self.valid_eta(eta) {
            return Err("Invalid eta for power link");
        }
        if self.0 == 0.0 {
            Ok(eta.exp())
        } else {
            Ok(self.0 * eta.powf(self.0 - 1.0))
        }
    }

    fn name(&self) -> &'static str {
        "power"
    }

    fn valid_mu(&self, mu: f64) -> bool {
        mu > 0.0
    }

    fn valid_eta(&self, eta: f64) -> bool {
        if self.0 == 0.0 {
            true
        } else if self.0 > 0.0 {
            eta >= 0.0
        } else {
            eta > 0.0
        }
    }
}

// Helper functions for statistical distributions
fn normal_quantile(p: f64) -> f64 {
    // Simplified normal quantile function
    if p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    // This is a simplified approximation
    if p < 0.5 {
        -((-2.0 * p.ln()).sqrt())
    } else {
        ((-2.0 * (1.0 - p).ln()).sqrt())
    }
}

fn normal_cdf(x: f64) -> f64 {
    // Simplified normal CDF approximation
    0.5 * (1.0 + erf(x / 2.0_f64.sqrt()))
}

fn normal_pdf(x: f64) -> f64 {
    // Normal PDF
    (-0.5 * x * x).exp() / (2.0 * std::f64::consts::PI).sqrt()
}

fn cauchy_quantile(p: f64) -> f64 {
    if p <= 0.0 || p >= 1.0 {
        return f64::NAN;
    }
    (std::f64::consts::PI * (p - 0.5)).tan()
}

fn cauchy_cdf(x: f64) -> f64 {
    0.5 + (x / std::f64::consts::PI).atan()
}

fn cauchy_pdf(x: f64) -> f64 {
    1.0 / (std::f64::consts::PI * (1.0 + x * x))
}

fn erf(x: f64) -> f64 {
    // Abramowitz and Stegun approximation
    let a1 = 0.254829592;
    let a2 = -0.284496736;
    let a3 = 1.421413741;
    let a4 = -1.453152027;
    let a5 = 1.061405429;
    let p = 0.3275911;
    
    let sign = if x >= 0.0 { 1.0 } else { -1.0 };
    let x = x.abs();
    
    let t = 1.0 / (1.0 + p * x);
    let y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * (-x * x).exp();
    
    sign * y
}
