//! geese.control analogue

#[derive(Debug, Clone)]
pub struct GeeControl {
    pub epsilon: f64,
    pub max_iter: usize,
    pub trace: bool,
    pub jack: bool,
    pub j1s: bool,
    pub fij: bool,
}

impl Default for GeeControl {
    fn default() -> Self {
        Self {
            epsilon: 1e-4,
            max_iter: 25,
            trace: false,
            jack: false,
            j1s: false,
            fij: false,
        }
    }
}

pub fn geese_control(
    epsilon: Option<f64>,
    max_iter: Option<usize>,
    trace: Option<bool>,
    jack: Option<bool>,
    j1s: Option<bool>,
    fij: Option<bool>,
) -> Result<GeeControl, String> {
    let epsilon = epsilon.unwrap_or(1e-4);
    let max_iter = max_iter.unwrap_or(25);
    let trace = trace.unwrap_or(false);
    let jack = jack.unwrap_or(false);
    let j1s = j1s.unwrap_or(false);
    let fij = fij.unwrap_or(false);
    if epsilon <= 0.0 {
        return Err("epsilon must be > 0".to_string());
    }
    if max_iter == 0 {
        return Err("max_iter must be > 0".to_string());
    }
    Ok(GeeControl {
        epsilon,
        max_iter,
        trace,
        jack,
        j1s,
        fij,
    })
}
