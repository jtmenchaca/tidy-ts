//! Survival data representation
//!
//! Port of R's `Surv()` object from `survival-ref/survival-master/R/Surv.R`.
//!
//! ## Supported Types
//!
//! - **Right-censored**: `(time, status)` — the standard case
//! - **Counting process**: `(tstart, tstop, status)` — left-truncated / time-varying
//!
//! Additional types (left, interval, interval2) are deferred to Tier 4.

/// Type of survival data encoding.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SurvType {
    /// Right-censored: observation has (time, status)
    Right,
    /// Counting process (left-truncated): observation has (tstart, tstop, status)
    Counting,
}

/// A single survival observation.
#[derive(Debug, Clone)]
pub struct SurvObs {
    /// Entry time (0.0 for right-censored data)
    pub tstart: f64,
    /// Event/censoring time
    pub tstop: f64,
    /// Event indicator: 1 = event, 0 = censored
    pub status: i32,
}

/// Collection of survival observations with metadata.
#[derive(Debug, Clone)]
pub struct SurvData {
    /// The type of survival encoding
    pub surv_type: SurvType,
    /// Individual observations
    pub obs: Vec<SurvObs>,
}

impl SurvData {
    /// Create right-censored survival data from parallel arrays.
    ///
    /// # Arguments
    ///
    /// * `time` - Event/censoring times
    /// * `status` - Event indicators (1 = event, 0 = censored)
    ///
    /// # Panics
    ///
    /// Panics if `time` and `status` have different lengths.
    pub fn right_censored(time: &[f64], status: &[i32]) -> Self {
        assert_eq!(
            time.len(),
            status.len(),
            "time and status must have the same length"
        );

        let obs = time
            .iter()
            .zip(status.iter())
            .map(|(&t, &s)| SurvObs {
                tstart: 0.0,
                tstop: t,
                status: s,
            })
            .collect();

        SurvData {
            surv_type: SurvType::Right,
            obs,
        }
    }

    /// Create counting process survival data from parallel arrays.
    ///
    /// # Arguments
    ///
    /// * `tstart` - Entry times
    /// * `tstop` - Exit times
    /// * `status` - Event indicators (1 = event, 0 = censored)
    ///
    /// # Panics
    ///
    /// Panics if arrays have different lengths.
    pub fn counting_process(tstart: &[f64], tstop: &[f64], status: &[i32]) -> Self {
        assert_eq!(tstart.len(), tstop.len());
        assert_eq!(tstart.len(), status.len());

        let obs = tstart
            .iter()
            .zip(tstop.iter())
            .zip(status.iter())
            .map(|((&start, &stop), &s)| SurvObs {
                tstart: start,
                tstop: stop,
                status: s,
            })
            .collect();

        SurvData {
            surv_type: SurvType::Counting,
            obs,
        }
    }

    /// Number of observations
    pub fn n(&self) -> usize {
        self.obs.len()
    }

    /// Extract stop times as a slice-compatible vector
    pub fn times(&self) -> Vec<f64> {
        self.obs.iter().map(|o| o.tstop).collect()
    }

    /// Extract status values as a slice-compatible vector
    pub fn statuses(&self) -> Vec<i32> {
        self.obs.iter().map(|o| o.status).collect()
    }

    /// Extract start times (0.0 for right-censored) as a vector
    pub fn start_times(&self) -> Vec<f64> {
        self.obs.iter().map(|o| o.tstart).collect()
    }

    /// Sort observations by stop time (ascending), breaking ties by status
    /// (events before censored, matching R's convention for survfit).
    pub fn sort_by_time(&mut self) {
        self.obs.sort_by(|a, b| {
            a.tstop
                .partial_cmp(&b.tstop)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| {
                    // Events (status=1) before censored (status=0) at same time
                    b.status.cmp(&a.status)
                })
        });
    }

    /// Get sorted unique event/censoring times
    pub fn unique_times(&self) -> Vec<f64> {
        let mut times: Vec<f64> = self.obs.iter().map(|o| o.tstop).collect();
        times.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        times.dedup();
        times
    }

    /// Validate the survival data
    pub fn validate(&self) -> Result<(), String> {
        for (i, obs) in self.obs.iter().enumerate() {
            if obs.tstop.is_nan() {
                return Err(format!("NaN stop time at observation {i}"));
            }
            if obs.status != 0 && obs.status != 1 {
                return Err(format!(
                    "status must be 0 or 1, got {} at observation {i}",
                    obs.status
                ));
            }
            if self.surv_type == SurvType::Counting {
                if obs.tstart.is_nan() {
                    return Err(format!("NaN start time at observation {i}"));
                }
                if obs.tstart >= obs.tstop {
                    return Err(format!(
                        "tstart ({}) >= tstop ({}) at observation {i}",
                        obs.tstart, obs.tstop
                    ));
                }
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_right_censored_creation() {
        let data = SurvData::right_censored(&[5.0, 10.0, 15.0], &[1, 0, 1]);
        assert_eq!(data.surv_type, SurvType::Right);
        assert_eq!(data.n(), 3);
        assert_eq!(data.obs[0].tstart, 0.0);
        assert_eq!(data.obs[0].tstop, 5.0);
        assert_eq!(data.obs[0].status, 1);
    }

    #[test]
    fn test_counting_process_creation() {
        let data = SurvData::counting_process(&[0.0, 5.0, 10.0], &[5.0, 10.0, 15.0], &[0, 1, 1]);
        assert_eq!(data.surv_type, SurvType::Counting);
        assert_eq!(data.n(), 3);
        assert_eq!(data.obs[1].tstart, 5.0);
        assert_eq!(data.obs[1].tstop, 10.0);
    }

    #[test]
    fn test_sort_by_time() {
        let mut data = SurvData::right_censored(&[15.0, 5.0, 10.0], &[1, 0, 1]);
        data.sort_by_time();
        assert_eq!(data.obs[0].tstop, 5.0);
        assert_eq!(data.obs[1].tstop, 10.0);
        assert_eq!(data.obs[2].tstop, 15.0);
    }

    #[test]
    fn test_sort_ties_events_first() {
        let mut data = SurvData::right_censored(&[10.0, 10.0], &[0, 1]);
        data.sort_by_time();
        assert_eq!(data.obs[0].status, 1); // event first
        assert_eq!(data.obs[1].status, 0); // censored second
    }

    #[test]
    fn test_unique_times() {
        let data = SurvData::right_censored(&[5.0, 10.0, 5.0, 15.0, 10.0], &[1, 0, 0, 1, 1]);
        let ut = data.unique_times();
        assert_eq!(ut, vec![5.0, 10.0, 15.0]);
    }

    #[test]
    fn test_validate_ok() {
        let data = SurvData::right_censored(&[5.0, 10.0], &[1, 0]);
        assert!(data.validate().is_ok());
    }

    #[test]
    fn test_validate_bad_status() {
        let data = SurvData::right_censored(&[5.0], &[2]);
        assert!(data.validate().is_err());
    }

    #[test]
    fn test_validate_counting_bad_interval() {
        let data = SurvData::counting_process(&[10.0], &[5.0], &[1]);
        let result = data.validate();
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("tstart"));
    }

    #[test]
    fn test_times_and_statuses() {
        let data = SurvData::right_censored(&[5.0, 10.0, 15.0], &[1, 0, 1]);
        assert_eq!(data.times(), vec![5.0, 10.0, 15.0]);
        assert_eq!(data.statuses(), vec![1, 0, 1]);
        assert_eq!(data.start_times(), vec![0.0, 0.0, 0.0]);
    }
}
