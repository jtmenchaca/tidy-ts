//! Fine-Gray competing risks data transformation
//!
//! ## Source
//!
//! `survival-ref/survival-master/src/finegray.c`
//!
//! Creates the expanded dataset needed for Fine-Gray subdistribution hazard
//! modeling. Subjects who experience a competing event are extended forward
//! in time with decreasing IPCW weights.

/// Result of the Fine-Gray data expansion.
pub struct FineGrayResult {
    /// Which row of the original data (0-based)
    pub row: Vec<usize>,
    /// New start times
    pub start: Vec<f64>,
    /// New end times
    pub end: Vec<f64>,
    /// Probability weight for the interval (1.0 for non-extended)
    pub wt: Vec<f64>,
    /// Replication count (0 for original row, 1+ for extended intervals)
    pub add: Vec<i32>,
}

/// Core Fine-Gray data transformation.
///
/// Direct port of `finegray()` from `survival-ref/survival-master/src/finegray.c`.
///
/// # Arguments
///
/// * `tstart` - Entry times for each observation
/// * `tstop` - Exit times for each observation
/// * `ctime` - Censoring distribution time points (cutpoints for interval boundaries)
/// * `cprob` - Censoring distribution probabilities at each ctime
/// * `extend` - Whether each observation should be extended (competing event subjects)
/// * `keep` - Whether each interval in the censoring distribution should be kept in output
///
/// # Returns
///
/// `FineGrayResult` with expanded rows. NaN inputs are passed through unchanged.
pub fn finegray_transform(
    tstart: &[f64],
    tstop: &[f64],
    ctime: &[f64],
    cprob: &[f64],
    extend: &[bool],
    keep: &[bool],
) -> FineGrayResult {
    let n = tstart.len();
    let ncut = cprob.len();

    // Count how many extra rows we need.
    // Extend observations have weight 1 up to the next cutpoint after their
    // max, and an extra for any cutpoints after that.
    let mut extra = 0;
    for i in 0..n {
        if !tstart[i].is_nan() && !tstop[i].is_nan() && extend[i] {
            // Find j = first cutpoint >= tstop[i]
            let mut j = 0;
            while j < ncut && ctime[j] < tstop[i] {
                j += 1;
            }
            // j = the interval they lie in. We have to add any intervals
            // after the one the subject falls in.
            j += 1;
            while j < ncut {
                if keep[j] {
                    extra += 1;
                }
                j += 1;
            }
        }
    }

    let n2 = n + extra;
    let mut row = Vec::with_capacity(n2);
    let mut start = Vec::with_capacity(n2);
    let mut end = Vec::with_capacity(n2);
    let mut wt = Vec::with_capacity(n2);
    let mut add = Vec::with_capacity(n2);

    for i in 0..n {
        // Put out the original interval
        start.push(tstart[i]);
        end.push(tstop[i]);
        row.push(i);
        wt.push(1.0);
        add.push(0);

        if !tstart[i].is_nan() && !tstop[i].is_nan() && extend[i] {
            // ctime contains the time at the end of the interval
            let mut j = 0;
            while j < ncut && ctime[j] < tstop[i] {
                j += 1;
            }
            // Extend them to the end of the interval
            let last = start.len() - 1;
            end[last] = ctime[j];
            let tempwt = cprob[j];

            j += 1;
            let mut iadd = 0;
            while j < ncut {
                if keep[j] {
                    // Add more intervals
                    iadd += 1;
                    row.push(i);
                    start.push(ctime[j - 1]);
                    end.push(ctime[j]);
                    wt.push(cprob[j] / tempwt);
                    add.push(iadd);
                }
                j += 1;
            }
        }
    }

    FineGrayResult {
        row,
        start,
        end,
        wt,
        add,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_finegray_no_extend() {
        // No observations to extend — output matches input
        let result = finegray_transform(
            &[0.0, 0.0],
            &[5.0, 10.0],
            &[3.0, 6.0, 12.0],
            &[0.9, 0.8, 0.5],
            &[false, false],
            &[true, true, true],
        );
        assert_eq!(result.row, vec![0, 1]);
        assert_eq!(result.start, vec![0.0, 0.0]);
        assert_eq!(result.end, vec![5.0, 10.0]);
        assert_eq!(result.wt, vec![1.0, 1.0]);
        assert_eq!(result.add, vec![0, 0]);
    }

    #[test]
    fn test_finegray_single_extend() {
        // One subject extended past their event time
        // ctime = [3, 6, 12], cprob = [0.9, 0.8, 0.5]
        // Subject at tstop=2 → j=0 (first cutpoint >= 2 is ctime[0]=3)
        // Extended to ctime[0]=3, then adds intervals for j=1,2 if keep[j]
        let result = finegray_transform(
            &[0.0],
            &[2.0],
            &[3.0, 6.0, 12.0],
            &[0.9, 0.8, 0.5],
            &[true],
            &[true, true, true],
        );
        // Original row extended to ctime[0]=3
        // Then two more intervals: (3,6] with wt=0.8/0.9, (6,12] with wt=0.5/0.9
        assert_eq!(result.row, vec![0, 0, 0]);
        assert_eq!(result.start, vec![0.0, 3.0, 6.0]);
        assert_eq!(result.end, vec![3.0, 6.0, 12.0]);
        assert!((result.wt[0] - 1.0).abs() < 1e-10);
        assert!((result.wt[1] - 0.8 / 0.9).abs() < 1e-10);
        assert!((result.wt[2] - 0.5 / 0.9).abs() < 1e-10);
        assert_eq!(result.add, vec![0, 1, 2]);
    }

    #[test]
    fn test_finegray_keep_filtering() {
        // keep=false for middle interval → that row is omitted
        let result = finegray_transform(
            &[0.0],
            &[2.0],
            &[3.0, 6.0, 12.0],
            &[0.9, 0.8, 0.5],
            &[true],
            &[true, false, true],
        );
        // Extended to 3, skip (3,6], keep (6,12]
        assert_eq!(result.row, vec![0, 0]);
        assert_eq!(result.start, vec![0.0, 6.0]);
        assert_eq!(result.end, vec![3.0, 12.0]);
        assert!((result.wt[0] - 1.0).abs() < 1e-10);
        assert!((result.wt[1] - 0.5 / 0.9).abs() < 1e-10);
        // iadd still increments only for kept intervals
        assert_eq!(result.add, vec![0, 1]);
    }

    #[test]
    fn test_finegray_nan_passthrough() {
        // NaN inputs are passed through unchanged (not extended)
        let result = finegray_transform(
            &[f64::NAN],
            &[f64::NAN],
            &[3.0, 6.0],
            &[0.9, 0.5],
            &[true], // extend=true but NaN, so no extension
            &[true, true],
        );
        assert_eq!(result.row, vec![0]);
        assert!(result.start[0].is_nan());
        assert!(result.end[0].is_nan());
        assert_eq!(result.wt, vec![1.0]);
        assert_eq!(result.add, vec![0]);
    }

    #[test]
    fn test_finegray_mixed() {
        // Mix of extended and non-extended observations
        let result = finegray_transform(
            &[0.0, 0.0, 0.0],
            &[5.0, 3.0, 8.0],
            &[4.0, 7.0, 10.0],
            &[0.9, 0.7, 0.4],
            &[false, true, false],
            &[true, true, true],
        );
        // Obs 0: not extended, (0,5] as-is
        // Obs 1: extended, tstop=3, j=0 (ctime[0]=4 >= 3), extended to 4
        //   then j=1: (4,7] wt=0.7/0.9, j=2: (7,10] wt=0.4/0.9
        // Obs 2: not extended, (0,8] as-is
        assert_eq!(result.row, vec![0, 1, 1, 1, 2]);
        assert_eq!(result.start, vec![0.0, 0.0, 4.0, 7.0, 0.0]);
        assert_eq!(result.end, vec![5.0, 4.0, 7.0, 10.0, 8.0]);
        assert!((result.wt[0] - 1.0).abs() < 1e-10);
        assert!((result.wt[1] - 1.0).abs() < 1e-10);
        assert!((result.wt[2] - 0.7 / 0.9).abs() < 1e-10);
        assert!((result.wt[3] - 0.4 / 0.9).abs() < 1e-10);
        assert!((result.wt[4] - 1.0).abs() < 1e-10);
    }
}
