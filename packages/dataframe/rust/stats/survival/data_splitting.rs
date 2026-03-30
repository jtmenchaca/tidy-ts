//! Split (start, stop] intervals at cutpoints
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/survsplit.c`

/// Result of splitting survival intervals at cutpoints.
pub struct SurvSplitResult {
    /// Which row of the original data (0-based)
    pub row: Vec<usize>,
    /// Which interval (index into cut vector regions)
    pub interval: Vec<usize>,
    /// New start times
    pub start: Vec<f64>,
    /// New end times
    pub end: Vec<f64>,
    /// Whether this row was artificially censored (new endpoint from a cut)
    pub censor: Vec<bool>,
}

/// Split (start, stop] time intervals at specified cutpoints.
///
/// Direct port of `survsplit()` from `survival-ref/survival-master/src/survsplit.c`.
///
/// # Arguments
///
/// * `tstart` - Entry times
/// * `tstop` - Exit times
/// * `cut` - Cutpoints at which to split intervals (must be sorted ascending)
///
/// # Returns
///
/// `SurvSplitResult` with one row per sub-interval. NaN inputs are passed through unchanged.
pub fn survsplit(tstart: &[f64], tstop: &[f64], cut: &[f64]) -> SurvSplitResult {
    let n = tstart.len();
    let ncut = cut.len();

    // Count how many extra rows we need
    let mut extra = 0;
    for i in 0..n {
        for j in 0..ncut {
            if !tstart[i].is_nan()
                && !tstop[i].is_nan()
                && cut[j] > tstart[i]
                && cut[j] < tstop[i]
            {
                extra += 1;
            }
        }
    }

    let n2 = n + extra;
    let mut row = Vec::with_capacity(n2);
    let mut interval = Vec::with_capacity(n2);
    let mut start = Vec::with_capacity(n2);
    let mut end = Vec::with_capacity(n2);
    let mut censor = Vec::with_capacity(n2);

    for i in 0..n {
        if tstart[i].is_nan() || tstop[i].is_nan() {
            start.push(tstart[i]);
            end.push(tstop[i]);
            row.push(i);
            interval.push(0); // C uses 1, but 0-based here
            censor.push(false);
        } else {
            // Find first cut > tstart[i]
            let mut j = 0;
            while j < ncut && cut[j] <= tstart[i] {
                j += 1;
            }
            start.push(tstart[i]);
            row.push(i);
            interval.push(j);

            // Split at each cut within (tstart, tstop)
            while j < ncut && cut[j] < tstop[i] {
                if cut[j] > tstart[i] {
                    end.push(cut[j]);
                    censor.push(true);
                    // Start next sub-interval
                    start.push(cut[j]);
                    row.push(i);
                    interval.push(j + 1);
                }
                j += 1;
            }
            end.push(tstop[i]);
            censor.push(false);
        }
    }

    SurvSplitResult {
        row,
        interval,
        start,
        end,
        censor,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_survsplit_no_cuts() {
        let result = survsplit(&[0.0, 5.0], &[10.0, 15.0], &[]);
        assert_eq!(result.row, vec![0, 1]);
        assert_eq!(result.start, vec![0.0, 5.0]);
        assert_eq!(result.end, vec![10.0, 15.0]);
        assert_eq!(result.censor, vec![false, false]);
    }

    #[test]
    fn test_survsplit_single_cut() {
        // (0, 10] split at 5 → (0, 5] + (5, 10]
        let result = survsplit(&[0.0], &[10.0], &[5.0]);
        assert_eq!(result.row, vec![0, 0]);
        assert_eq!(result.start, vec![0.0, 5.0]);
        assert_eq!(result.end, vec![5.0, 10.0]);
        assert_eq!(result.censor, vec![true, false]);
    }

    #[test]
    fn test_survsplit_multiple_cuts() {
        // (0, 20] split at 5, 10, 15 → 4 intervals
        let result = survsplit(&[0.0], &[20.0], &[5.0, 10.0, 15.0]);
        assert_eq!(result.row, vec![0, 0, 0, 0]);
        assert_eq!(result.start, vec![0.0, 5.0, 10.0, 15.0]);
        assert_eq!(result.end, vec![5.0, 10.0, 15.0, 20.0]);
        assert_eq!(result.censor, vec![true, true, true, false]);
    }

    #[test]
    fn test_survsplit_cut_at_boundary() {
        // Cut at start or stop should not split
        let result = survsplit(&[0.0], &[10.0], &[0.0, 10.0]);
        assert_eq!(result.row, vec![0]);
        assert_eq!(result.start, vec![0.0]);
        assert_eq!(result.end, vec![10.0]);
        assert_eq!(result.censor, vec![false]);
    }

    #[test]
    fn test_survsplit_multiple_obs() {
        // Two obs, one gets split, one doesn't
        let result = survsplit(&[0.0, 0.0], &[10.0, 3.0], &[5.0]);
        assert_eq!(result.row, vec![0, 0, 1]);
        assert_eq!(result.start, vec![0.0, 5.0, 0.0]);
        assert_eq!(result.end, vec![5.0, 10.0, 3.0]);
        assert_eq!(result.censor, vec![true, false, false]);
    }
}
