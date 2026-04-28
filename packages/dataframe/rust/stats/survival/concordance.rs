//! Concordance (Harrell's C-statistic) for survival data.
//!
//! Faithful port of R's `survival` package C code:
//! - `concordance3.c`: walkup, addin, concordance3, concordance4
//! - `concordance5.c`: concordance5, concordance6
//!
//! Original C code by Terry Therneau.

use serde::Serialize;

/// Result from concordance3/concordance4 (with influence and optional residuals).
#[derive(Debug, Clone, Serialize)]
pub struct Concordance3Result {
    /// count[0..6]: concordant, discordant, tied_x, tied_y, tied_xy, variance_term
    pub count: [f64; 6],
    /// Influence matrix: 5 columns x n rows, stored as [col0, col1, col2, col3, col4]
    /// Each column has n elements.
    pub influence: Vec<Vec<f64>>,
    /// Optional residuals: 3 columns x nevent rows, stored as [rank, timewt, casewt]
    /// Only present if doresid is true.
    pub resid: Option<Vec<Vec<f64>>>,
}

/// Result from concordance5/concordance6 (without influence, faster).
#[derive(Debug, Clone, Serialize)]
pub struct Concordance5Result {
    /// count[0..5]: concordant, discordant, tied_x, tied_y, tied_xy
    pub count: [f64; 5],
}

/// Given a binary tree described by:
///   nwt = weight at each node
///   twt = weight of node + children
///   index = pointer to a location in the tree
///   ntree = number of nodes in the tree
/// Return the count of those smaller (sums[0]), greater (sums[1]), tied (sums[2]).
///
/// Direct port of walkup() from concordance3.c lines 13-29.
fn walkup(nwt: &[f64], twt: &[f64], index: usize, sums: &mut [f64; 3], ntree: usize) {
    // for (i=0; i<3; i++) sums[i] = 0.0;
    sums[0] = 0.0;
    sums[1] = 0.0;
    sums[2] = 0.0;

    // sums[2] = nwt[index];   /* tied on x */
    sums[2] = nwt[index];

    // j = 2*index +2;  /* right child */
    let j = 2 * index + 2;

    // if (j < ntree) sums[0] += twt[j];
    if j < ntree {
        sums[0] += twt[j];
    }

    // if (j <=ntree) sums[1]+= twt[j-1]; /*left child */
    // Note: j-1 = 2*index+1, and j <= ntree means 2*index+2 <= ntree
    // which means 2*index+1 < ntree, so twt[j-1] is valid
    if j <= ntree {
        sums[1] += twt[j - 1]; /* left child */
    }

    // while(index > 0) { /* for as long as I have a parent... */
    let mut index = index;
    while index > 0 {
        // parent = (index-1)/2;
        let parent = (index - 1) / 2;

        // if (index%2 == 1) sums[0] += twt[parent] - twt[index]; /* left child */
        if index % 2 == 1 {
            sums[0] += twt[parent] - twt[index]; /* left child */
        }
        // else sums[1] += twt[parent] - twt[index]; /* I am a right child */
        else {
            sums[1] += twt[parent] - twt[index]; /* I am a right child */
        }

        // index = parent;
        index = parent;
    }
}

/// Add an observation into the tree (a negative weight takes them out).
///
/// Direct port of addin() from concordance3.c lines 32-39.
fn addin(nwt: &mut [f64], twt: &mut [f64], index: usize, wt: f64) {
    // nwt[index] += wt;
    nwt[index] += wt;

    // while (index >0) {
    let mut index = index;
    while index > 0 {
        // twt[index] += wt;
        twt[index] += wt;
        // index = (index-1)/2;
        index = (index - 1) / 2;
    }
    // twt[0] += wt;
    twt[0] += wt;
}

/// Right-censored concordance with influence estimation.
///
/// Direct port of concordance3() from concordance3.c lines 41-227.
///
/// # Arguments
/// * `time` - Event/censoring times (length n)
/// * `status` - Event indicator: 1=event, 0=censored (length n)
/// * `x` - Pre-ranked integer indices into the binary tree (length n) (0-based bindex values)
/// * `wt` - Case weights (length n)
/// * `timewt` - Time weights, already reversed (length = number of unique event times)
/// * `sort_stop` - Sort order by decreasing time, then status, then x (0-based indices, length n)
/// * `doresid` - Whether to compute residuals
pub fn concordance3(
    time: &[f64],
    status: &[f64],
    x: &[i32],
    wt: &[f64],
    timewt: &[f64],
    sort_stop: &[i32],
    doresid: bool,
) -> Concordance3Result {
    let n = time.len();

    // ntree =0; nevent =0;
    let mut ntree: usize = 0;
    let mut nevent: usize = 0;
    // for (i=0; i<n; i++) {
    //     if (x[i] >= ntree) ntree = x[i] +1;
    //     nevent += status[i];
    // }
    for i in 0..n {
        if x[i] as usize >= ntree {
            ntree = x[i] as usize + 1;
        }
        nevent += status[i] as usize;
    }

    // nwt = (double *) R_alloc(4*ntree, sizeof(double));
    // twt = nwt + ntree;
    // dnwt = twt + ntree;
    // dtwt = dnwt + ntree;
    // for (i=0; i< 4*ntree; i++) nwt[i] =0.0;
    let mut nwt = vec![0.0_f64; ntree];
    let mut twt = vec![0.0_f64; ntree];
    let mut dnwt = vec![0.0_f64; ntree];
    let mut dtwt = vec![0.0_f64; ntree];

    // for (i=0; i<6; i++) count[i]=0.0;
    let mut count = [0.0_f64; 6];

    // imat[i] = REAL(imat2) + i*n;
    // for (j=0; j<n; j++) imat[i][j] =0;
    let mut imat: Vec<Vec<f64>> = vec![vec![0.0; n]; 5];

    // if (doresid==1) {
    //     resid2 = SET_VECTOR_ELT(rlist, 2, allocMatrix(REALSXP, nevent, 3));
    //     for (i=0; i<3; i++) resid[i] = REAL(resid2) + i*nevent;
    // }
    let mut resid_data: Option<Vec<Vec<f64>>> = if doresid {
        Some(vec![vec![0.0; nevent]; 3])
    } else {
        None
    };

    // z2 =0; utime=0;
    let mut z2: f64 = 0.0;
    let mut utime: usize = 0;
    let mut wsum = [0.0_f64; 3];

    // Mutable nevent counter for residuals (C code decrements nevent)
    let mut nevent_idx = nevent;

    // for (i=0; i<n;) {
    let mut i: usize = 0;
    while i < n {
        // ii = sort2[i];
        let ii = sort_stop[i] as usize;

        // if (status[ii]==0) { /* censored, simply add them into the tree */
        if status[ii] == 0.0 {
            // /* Initialize the influence */
            // walkup(dnwt, dtwt, x[ii], wsum, ntree);
            walkup(&dnwt, &dtwt, x[ii] as usize, &mut wsum, ntree);
            // imat[0][ii] -= wsum[1];
            imat[0][ii] -= wsum[1];
            // imat[1][ii] -= wsum[0];
            imat[1][ii] -= wsum[0];
            // imat[2][ii] -= wsum[2];
            imat[2][ii] -= wsum[2];

            // /* Cox variance */
            // walkup(nwt, twt, x[ii], wsum, ntree);
            walkup(&nwt, &twt, x[ii] as usize, &mut wsum, ntree);
            // z2 += wt[ii]*(wsum[0]*(wt[ii] + 2*(wsum[1] + wsum[2])) +
            //               wsum[1]*(wt[ii] + 2*(wsum[0] + wsum[2])) +
            //               (wsum[0]-wsum[1])*(wsum[0]-wsum[1]));
            z2 += wt[ii]
                * (wsum[0] * (wt[ii] + 2.0 * (wsum[1] + wsum[2]))
                    + wsum[1] * (wt[ii] + 2.0 * (wsum[0] + wsum[2]))
                    + (wsum[0] - wsum[1]) * (wsum[0] - wsum[1]));

            // /* add them to the tree */
            // addin(nwt, twt, x[ii], wt[ii]);
            addin(&mut nwt, &mut twt, x[ii] as usize, wt[ii]);

            // i++;
            i += 1;
        } else {
            // /* process all tied deaths at this point */
            // ndeath=0; dwt=0;
            let mut ndeath: usize = 0;
            let mut dwt: f64 = 0.0;
            // dwt2 =0; xsave=x[ii]; j2= i;
            let mut dwt2: f64 = 0.0;
            let mut xsave: i32 = x[ii];
            let mut j2: usize = i;
            // adjtimewt = timewt[utime++];
            let adjtimewt = timewt[utime];
            utime += 1;

            // /* pass 1 */
            // for (j=i; j<n && time[sort2[j]]==time[ii]; j++) {
            let mut j: usize = i;
            while j < n && time[sort_stop[j] as usize] == time[ii] {
                // jj = sort2[j];
                let jj = sort_stop[j] as usize;
                // ndeath++;
                ndeath += 1;
                // count[3] += wt[jj] * dwt * adjtimewt;  /* update total tied on y */
                count[3] += wt[jj] * dwt * adjtimewt;
                // dwt += wt[jj];   /* sum of wts at this death time */
                dwt += wt[jj];

                // if (x[jj] != xsave) {  /* restart the tied.xy counts */
                if x[jj] != xsave {
                    // if (wt[sort2[j2]] < dwt2) { /* more than 1 tied */
                    if wt[sort_stop[j2] as usize] < dwt2 {
                        // for (; j2<j; j2++) {
                        while j2 < j {
                            // kk = sort2[j2];
                            let kk = sort_stop[j2] as usize;
                            // imat[4][kk] += (dwt2- wt[kk]) * adjtimewt;
                            imat[4][kk] += (dwt2 - wt[kk]) * adjtimewt;
                            // imat[3][kk] -= (dwt2- wt[kk]) * adjtimewt;
                            imat[3][kk] -= (dwt2 - wt[kk]) * adjtimewt;
                            j2 += 1;
                        }
                    } else {
                        // else j2 = j;
                        j2 = j;
                    }
                    // dwt2 =0;
                    dwt2 = 0.0;
                    // xsave = x[jj];
                    xsave = x[jj];
                }

                // count[4] += wt[jj] * dwt2 * adjtimewt; /* tied on xy */
                count[4] += wt[jj] * dwt2 * adjtimewt;
                // dwt2 += wt[jj]; /* sum of tied.xy weights */
                dwt2 += wt[jj];

                // /* Count concordant, discordant, etc. */
                // walkup(nwt, twt, x[jj], wsum, ntree);
                walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                // for (k=0; k<3; k++) {
                //     count[k] += wt[jj]* wsum[k] * adjtimewt;
                //     imat[k][jj] += wsum[k]*adjtimewt;
                // }
                for k in 0..3 {
                    count[k] += wt[jj] * wsum[k] * adjtimewt;
                    imat[k][jj] += wsum[k] * adjtimewt;
                }

                // /* add to the event tree */
                // addin(dnwt, dtwt, x[jj], adjtimewt*wt[jj]);  /* weighted deaths */
                addin(&mut dnwt, &mut dtwt, x[jj] as usize, adjtimewt * wt[jj]);

                j += 1;
            }

            // /* finish the tied.xy influence */
            // if (wt[sort2[j2]] < dwt2) { /* more than 1 tied */
            if wt[sort_stop[j2] as usize] < dwt2 {
                // for (; j2<j; j2++) {
                while j2 < j {
                    // kk = sort2[j2];
                    let kk = sort_stop[j2] as usize;
                    // imat[4][kk] += (dwt2- wt[kk]) * adjtimewt;
                    imat[4][kk] += (dwt2 - wt[kk]) * adjtimewt;
                    // imat[3][kk] -= (dwt2- wt[kk]) * adjtimewt;
                    imat[3][kk] -= (dwt2 - wt[kk]) * adjtimewt;
                    j2 += 1;
                }
            }

            // /* pass 2 */
            // for (j=i; j< (i+ndeath); j++) {
            for j in i..(i + ndeath) {
                // jj = sort2[j];
                let jj = sort_stop[j] as usize;
                // /* Update influence */
                // walkup(dnwt, dtwt, x[jj], wsum, ntree);
                walkup(&dnwt, &dtwt, x[jj] as usize, &mut wsum, ntree);
                // imat[0][jj] -= wsum[1];
                imat[0][jj] -= wsum[1];
                // imat[1][jj] -= wsum[0];
                imat[1][jj] -= wsum[0];
                // imat[2][jj] -= wsum[2];  /* tied.x */
                imat[2][jj] -= wsum[2];
                // imat[3][jj] += (dwt- wt[jj])* adjtimewt;
                imat[3][jj] += (dwt - wt[jj]) * adjtimewt;

                // /* increment Cox var and add obs into the tree */
                // walkup(nwt, twt, x[jj], wsum, ntree);
                walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                // z2 += wt[jj]*(wsum[0]*(wt[jj] + 2*(wsum[1] + wsum[2])) +
                //               wsum[1]*(wt[jj] + 2*(wsum[0] + wsum[2])) +
                //               (wsum[0]-wsum[1])*(wsum[0]-wsum[1]));
                z2 += wt[jj]
                    * (wsum[0] * (wt[jj] + 2.0 * (wsum[1] + wsum[2]))
                        + wsum[1] * (wt[jj] + 2.0 * (wsum[0] + wsum[2]))
                        + (wsum[0] - wsum[1]) * (wsum[0] - wsum[1]));

                // addin(nwt, twt, x[jj], wt[jj]);
                addin(&mut nwt, &mut twt, x[jj] as usize, wt[jj]);
            }

            // count[5] += dwt * adjtimewt* z2/twt[0]; /* weighted var in risk set*/
            count[5] += dwt * adjtimewt * z2 / twt[0];

            // if (doresid) {
            if doresid {
                if let Some(ref mut resid) = resid_data {
                    // for (j=i; j< (i+ndeath); j++) {
                    for j in i..(i + ndeath) {
                        // jj = sort2[j];
                        let jj = sort_stop[j] as usize;
                        // walkup(nwt, twt, x[jj], wsum, ntree);
                        walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                        // nevent--;
                        nevent_idx -= 1;
                        // resid[0][nevent] = (wsum[0] - wsum[1])/twt[0]; /* -1 to 1 */
                        resid[0][nevent_idx] = (wsum[0] - wsum[1]) / twt[0];
                        // resid[1][nevent] = twt[0] * adjtimewt;
                        resid[1][nevent_idx] = twt[0] * adjtimewt;
                        // resid[2][nevent] = wt[jj];
                        resid[2][nevent_idx] = wt[jj];
                    }
                }
            }

            // i += ndeath;
            i += ndeath;
        }
    }

    // /* Now finish off the influence for each observation
    // **  Since times flip (looking backwards) the wsum contributions flip too */
    // for (i=0; i<n; i++) {
    for i in 0..n {
        // ii = sort2[i];
        let ii = sort_stop[i] as usize;
        // walkup(dnwt, dtwt, x[ii], wsum, ntree);
        walkup(&dnwt, &dtwt, x[ii] as usize, &mut wsum, ntree);
        // imat[0][ii] += wsum[1];
        imat[0][ii] += wsum[1];
        // imat[1][ii] += wsum[0];
        imat[1][ii] += wsum[0];
        // imat[2][ii] += wsum[2];
        imat[2][ii] += wsum[2];
    }

    // count[3] -= count[4];   /* the tied.xy were counted twice, once as tied.y */
    count[3] -= count[4];

    Concordance3Result {
        count,
        influence: imat,
        resid: resid_data,
    }
}

/// Counting process concordance with influence estimation.
///
/// Direct port of concordance4() from concordance3.c lines 228-437.
///
/// # Arguments
/// * `time1` - Start times (length n)
/// * `time2` - Stop times (length n)
/// * `status` - Event indicator: 1=event, 0=censored (length n)
/// * `x` - Pre-ranked integer indices into the binary tree (length n) (0-based bindex values)
/// * `wt` - Case weights (length n)
/// * `timewt` - Time weights, already reversed (length = number of unique event times)
/// * `sort_start` - Sort order by decreasing start time (0-based indices, length n)
/// * `sort_stop` - Sort order by decreasing stop time, then status, then x (0-based indices, length n)
/// * `doresid` - Whether to compute residuals
#[allow(dead_code)]
pub(crate) fn concordance4(
    time1: &[f64],
    time2: &[f64],
    status: &[f64],
    x: &[i32],
    wt: &[f64],
    timewt: &[f64],
    sort_start: &[i32],
    sort_stop: &[i32],
    doresid: bool,
) -> Concordance3Result {
    let n = time1.len();

    // ntree =0; nevent =0;
    let mut ntree: usize = 0;
    let mut nevent: usize = 0;
    // for (i=0; i<n; i++) {
    //     if (x[i] >= ntree) ntree = x[i] +1;
    //     nevent += status[i];
    // }
    for i in 0..n {
        if x[i] as usize >= ntree {
            ntree = x[i] as usize + 1;
        }
        nevent += status[i] as usize;
    }

    // nwt = (double *) R_alloc(4*ntree, sizeof(double));
    let mut nwt = vec![0.0_f64; ntree];
    let mut twt = vec![0.0_f64; ntree];
    let mut dnwt = vec![0.0_f64; ntree];
    let mut dtwt = vec![0.0_f64; ntree];

    let mut count = [0.0_f64; 6];
    let mut imat: Vec<Vec<f64>> = vec![vec![0.0; n]; 5];

    let mut resid_data: Option<Vec<Vec<f64>>> = if doresid {
        Some(vec![vec![0.0; nevent]; 3])
    } else {
        None
    };

    // z2 =0; utime=0; i2 =0;  /* i2 tracks the start times */
    let mut z2: f64 = 0.0;
    let mut utime: usize = 0;
    let mut i2: usize = 0;
    let mut wsum = [0.0_f64; 3];
    let mut nevent_idx = nevent;

    // for (i=0; i<n;) {
    let mut i: usize = 0;
    while i < n {
        // ii = sort2[i];
        let ii = sort_stop[i] as usize;

        // if (status[ii]==0) { /* censored, simply add them into the tree */
        if status[ii] == 0.0 {
            // /* Initialize the influence */
            // walkup(dnwt, dtwt, x[ii], wsum, ntree);
            walkup(&dnwt, &dtwt, x[ii] as usize, &mut wsum, ntree);
            imat[0][ii] -= wsum[1];
            imat[1][ii] -= wsum[0];
            imat[2][ii] -= wsum[2];

            // /* Cox variance */
            // walkup(nwt, twt, x[ii], wsum, ntree);
            walkup(&nwt, &twt, x[ii] as usize, &mut wsum, ntree);
            z2 += wt[ii]
                * (wsum[0] * (wt[ii] + 2.0 * (wsum[1] + wsum[2]))
                    + wsum[1] * (wt[ii] + 2.0 * (wsum[0] + wsum[2]))
                    + (wsum[0] - wsum[1]) * (wsum[0] - wsum[1]));

            // addin(nwt, twt, x[ii], wt[ii]);
            addin(&mut nwt, &mut twt, x[ii] as usize, wt[ii]);
            i += 1;
        } else {
            // /* a death */
            // /* remove any subjects whose start time has been passed */
            // for (; i2<n && (time1[sort1[i2]] >= time2[ii]); i2++) {
            while i2 < n && time1[sort_start[i2] as usize] >= time2[ii] {
                // jj = sort1[i2];
                let jj = sort_start[i2] as usize;

                // /* influence */
                // walkup(dnwt, dtwt, x[jj], wsum, ntree);
                walkup(&dnwt, &dtwt, x[jj] as usize, &mut wsum, ntree);
                imat[0][jj] += wsum[1];
                imat[1][jj] += wsum[0];
                imat[2][jj] += wsum[2];

                // addin(nwt, twt, x[jj], -wt[jj]);  /*remove from main tree */
                addin(&mut nwt, &mut twt, x[jj] as usize, -wt[jj]);

                // /* Cox variance */
                // walkup(nwt, twt, x[jj], wsum, ntree);
                walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                z2 -= wt[jj]
                    * (wsum[0] * (wt[jj] + 2.0 * (wsum[1] + wsum[2]))
                        + wsum[1] * (wt[jj] + 2.0 * (wsum[0] + wsum[2]))
                        + (wsum[0] - wsum[1]) * (wsum[0] - wsum[1]));

                i2 += 1;
            }

            // ndeath=0; dwt=0;
            let mut ndeath: usize = 0;
            let mut dwt: f64 = 0.0;
            // dwt2 =0; xsave=x[ii]; j2= i;
            let mut dwt2: f64 = 0.0;
            let mut xsave: i32 = x[ii];
            let mut j2: usize = i;
            // adjtimewt = timewt[utime++];
            let adjtimewt = timewt[utime];
            utime += 1;

            // /* pass 1 */
            // for (j=i; j<n && (time2[sort2[j]]==time2[ii]); j++) {
            let mut j: usize = i;
            while j < n && time2[sort_stop[j] as usize] == time2[ii] {
                // jj = sort2[j];
                let jj = sort_stop[j] as usize;
                ndeath += 1;
                // jj = sort2[j];  (duplicate in C)
                // count[3] += wt[jj] * dwt * adjtimewt;
                count[3] += wt[jj] * dwt * adjtimewt;
                // dwt += wt[jj];
                dwt += wt[jj];

                // if (x[jj] != xsave) {
                if x[jj] != xsave {
                    if wt[sort_stop[j2] as usize] < dwt2 {
                        while j2 < j {
                            let kk = sort_stop[j2] as usize;
                            imat[4][kk] += (dwt2 - wt[kk]) * adjtimewt;
                            imat[3][kk] -= (dwt2 - wt[kk]) * adjtimewt;
                            j2 += 1;
                        }
                    } else {
                        j2 = j;
                    }
                    dwt2 = 0.0;
                    xsave = x[jj];
                }

                // count[4] += wt[jj] * dwt2 * adjtimewt;
                count[4] += wt[jj] * dwt2 * adjtimewt;
                // dwt2 += wt[jj];
                dwt2 += wt[jj];

                // walkup(nwt, twt, x[jj], wsum, ntree);
                walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                for k in 0..3 {
                    count[k] += wt[jj] * wsum[k] * adjtimewt;
                    imat[k][jj] += wsum[k] * adjtimewt;
                }

                // addin(dnwt, dtwt, x[jj], adjtimewt*wt[jj]);
                addin(&mut dnwt, &mut dtwt, x[jj] as usize, adjtimewt * wt[jj]);

                j += 1;
            }

            // /* finish the tied.xy influence */
            if wt[sort_stop[j2] as usize] < dwt2 {
                while j2 < j {
                    let kk = sort_stop[j2] as usize;
                    imat[4][kk] += (dwt2 - wt[kk]) * adjtimewt;
                    imat[3][kk] -= (dwt2 - wt[kk]) * adjtimewt;
                    j2 += 1;
                }
            }

            // /* pass 3 */  (called pass 3 in concordance4, pass 2 in concordance3)
            for j in i..(i + ndeath) {
                let jj = sort_stop[j] as usize;
                // walkup(dnwt, dtwt, x[jj], wsum, ntree);
                walkup(&dnwt, &dtwt, x[jj] as usize, &mut wsum, ntree);
                imat[0][jj] -= wsum[1];
                imat[1][jj] -= wsum[0];
                imat[2][jj] -= wsum[2];
                imat[3][jj] += (dwt - wt[jj]) * adjtimewt;

                // walkup(nwt, twt, x[jj], wsum, ntree);
                walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                z2 += wt[jj]
                    * (wsum[0] * (wt[jj] + 2.0 * (wsum[1] + wsum[2]))
                        + wsum[1] * (wt[jj] + 2.0 * (wsum[0] + wsum[2]))
                        + (wsum[0] - wsum[1]) * (wsum[0] - wsum[1]));

                addin(&mut nwt, &mut twt, x[jj] as usize, wt[jj]);
            }

            // count[5] += dwt * adjtimewt* z2/twt[0];
            count[5] += dwt * adjtimewt * z2 / twt[0];

            if doresid {
                if let Some(ref mut resid) = resid_data {
                    for j in i..(i + ndeath) {
                        let jj = sort_stop[j] as usize;
                        walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                        nevent_idx -= 1;
                        resid[0][nevent_idx] = (wsum[0] - wsum[1]) / twt[0];
                        resid[1][nevent_idx] = twt[0] * adjtimewt;
                        resid[2][nevent_idx] = wt[jj];
                    }
                }
            }

            i += ndeath;
        }
    }

    // /* Now finish off the influence for those not yet removed
    // **  Since times flip (looking backwards) the wsum contributions flip too */
    // for (; i2<n; i2++) {
    while i2 < n {
        // ii = sort1[i2];
        let ii = sort_start[i2] as usize;
        // walkup(dnwt, dtwt, x[ii], wsum, ntree);
        walkup(&dnwt, &dtwt, x[ii] as usize, &mut wsum, ntree);
        imat[0][ii] += wsum[1];
        imat[1][ii] += wsum[0];
        imat[2][ii] += wsum[2];
        i2 += 1;
    }

    // count[3] -= count[4];
    count[3] -= count[4];

    Concordance3Result {
        count,
        influence: imat,
        resid: resid_data,
    }
}

/// Right-censored concordance without influence (faster).
///
/// Direct port of concordance5() from concordance5.c lines 9-102.
///
/// # Arguments
/// * `time` - Event/censoring times (length n)
/// * `status` - Event indicator: 1=event, 0=censored (length n)
/// * `x` - Pre-ranked integer indices into the binary tree (length n) (0-based bindex values)
/// * `wt` - Case weights (length n)
/// * `timewt` - Time weights, already reversed (length = number of unique event times)
/// * `sort_stop` - Sort order by decreasing time, then status, then x (0-based indices, length n)
pub fn concordance5(
    time: &[f64],
    status: &[f64],
    x: &[i32],
    wt: &[f64],
    timewt: &[f64],
    sort_stop: &[i32],
) -> Concordance5Result {
    let n = time.len();

    // ntree =0;
    let mut ntree: usize = 0;
    // for (i=0; i<n; i++) {
    //     if (x[i] >= ntree) ntree = x[i] +1;
    // }
    for i in 0..n {
        if x[i] as usize >= ntree {
            ntree = x[i] as usize + 1;
        }
    }

    // nwt = (double *) R_alloc(2*ntree, sizeof(double));
    // twt = nwt + ntree;
    // for (i=0; i< 2*ntree; i++) nwt[i] =0.0;
    let mut nwt = vec![0.0_f64; ntree];
    let mut twt = vec![0.0_f64; ntree];

    // for (i=0; i<5; i++) count[i]=0.0;
    let mut count = [0.0_f64; 5];
    let mut wsum = [0.0_f64; 3];

    // utime=0;
    let mut utime: usize = 0;

    // for (i=0; i<n;) {
    let mut i: usize = 0;
    while i < n {
        // ii = sort2[i];
        let ii = sort_stop[i] as usize;

        // if (status[ii]==0) { /* censored, simply add them into the tree */
        if status[ii] == 0.0 {
            // addin(nwt, twt, x[ii], wt[ii]);
            addin(&mut nwt, &mut twt, x[ii] as usize, wt[ii]);
            // i++;
            i += 1;
        } else {
            // /* process all tied deaths at this point */
            // ndeath=0; dwt=0;
            let mut ndeath: usize = 0;
            let mut dwt: f64 = 0.0;
            // dwt2 =0; xsave=x[ii];
            let mut dwt2: f64 = 0.0;
            let mut xsave: i32 = x[ii];
            // adjtimewt = timewt[utime++];
            let adjtimewt = timewt[utime];
            utime += 1;

            // /* pass 1 */
            // for (j=i; j<n && time[sort2[j]]==time[ii]; j++) {
            let mut j: usize = i;
            while j < n && time[sort_stop[j] as usize] == time[ii] {
                // jj = sort2[j];
                let jj = sort_stop[j] as usize;
                // ndeath++;
                ndeath += 1;
                // count[3] += wt[jj] * dwt * adjtimewt;  /* update tied on y */
                count[3] += wt[jj] * dwt * adjtimewt;
                // dwt += wt[jj];   /* sum of wts at this death time */
                dwt += wt[jj];

                // if (x[jj] != xsave) {  /* restart the tied.xy counts */
                if x[jj] != xsave {
                    // dwt2 =0;
                    dwt2 = 0.0;
                    // xsave = x[jj];
                    xsave = x[jj];
                }

                // count[4] += wt[jj] * dwt2 * adjtimewt; /* tied on xy */
                count[4] += wt[jj] * dwt2 * adjtimewt;
                // dwt2 += wt[jj]; /* sum of tied.xy weights */
                dwt2 += wt[jj];

                // /* Count concordant, discordant, etc. */
                // walkup(nwt, twt, x[jj], wsum, ntree);
                walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                // for (k=0; k<3; k++) {
                //     count[k] += wt[jj]* wsum[k] * adjtimewt;
                // }
                for k in 0..3 {
                    count[k] += wt[jj] * wsum[k] * adjtimewt;
                }

                j += 1;
            }

            // /* pass 2 */
            // for (j=i; j< (i+ndeath); j++) {
            for j in i..(i + ndeath) {
                // jj = sort2[j];
                let jj = sort_stop[j] as usize;
                // addin(nwt, twt, x[jj], wt[jj]);
                addin(&mut nwt, &mut twt, x[jj] as usize, wt[jj]);
            }

            // i += ndeath;
            i += ndeath;
        }
    }

    // count[3] -= count[4];   /* the tied.xy were counted twice, once as tied.y */
    count[3] -= count[4];

    Concordance5Result { count }
}

/// Counting process concordance without influence (faster).
///
/// Direct port of concordance6() from concordance5.c lines 103-214.
///
/// # Arguments
/// * `time1` - Start times (length n)
/// * `time2` - Stop times (length n)
/// * `status` - Event indicator: 1=event, 0=censored (length n)
/// * `x` - Pre-ranked integer indices into the binary tree (length n) (0-based bindex values)
/// * `wt` - Case weights (length n)
/// * `timewt` - Time weights, already reversed (length = number of unique event times)
/// * `sort_start` - Sort order by decreasing start time (0-based indices, length n)
/// * `sort_stop` - Sort order by decreasing stop time, then status, then x (0-based indices, length n)
#[allow(dead_code)]
pub(crate) fn concordance6(
    time1: &[f64],
    time2: &[f64],
    status: &[f64],
    x: &[i32],
    wt: &[f64],
    timewt: &[f64],
    sort_start: &[i32],
    sort_stop: &[i32],
) -> Concordance5Result {
    let n = time1.len();

    // ntree =0;
    let mut ntree: usize = 0;
    for i in 0..n {
        if x[i] as usize >= ntree {
            ntree = x[i] as usize + 1;
        }
    }

    // nwt = (double *) R_alloc(2*ntree, sizeof(double));
    // twt = nwt + ntree;
    // for (i=0; i< 4*ntree; i++) nwt[i] =0.0;
    // NOTE: C code allocates 2*ntree but zeros 4*ntree - this is a bug in C
    // that happens to work because R_alloc guarantees zeroed memory.
    // We just zero 2*ntree correctly.
    let mut nwt = vec![0.0_f64; ntree];
    let mut twt = vec![0.0_f64; ntree];

    let mut count = [0.0_f64; 5];
    let mut wsum = [0.0_f64; 3];

    // utime=0; i2 =0;
    let mut utime: usize = 0;
    let mut i2: usize = 0;

    // for (i=0; i<n;) {
    let mut i: usize = 0;
    while i < n {
        // ii = sort2[i];
        let ii = sort_stop[i] as usize;

        // if (status[ii]==0) {
        if status[ii] == 0.0 {
            // addin(nwt, twt, x[ii], wt[ii]);
            addin(&mut nwt, &mut twt, x[ii] as usize, wt[ii]);
            i += 1;
        } else {
            // /* remove any subjects whose start time has been passed */
            // for (; i2<n && (time1[sort1[i2]] >= time2[ii]); i2++) {
            while i2 < n && time1[sort_start[i2] as usize] >= time2[ii] {
                // jj = sort1[i2];
                let jj = sort_start[i2] as usize;
                // addin(nwt, twt, x[jj], -wt[jj]);
                addin(&mut nwt, &mut twt, x[jj] as usize, -wt[jj]);
                i2 += 1;
            }

            // ndeath=0; dwt=0;
            let mut ndeath: usize = 0;
            let mut dwt: f64 = 0.0;
            // dwt2 =0; xsave=x[ii];
            let mut dwt2: f64 = 0.0;
            let mut xsave: i32 = x[ii];
            // adjtimewt = timewt[utime++];
            let adjtimewt = timewt[utime];
            utime += 1;

            // /* pass 1 */
            // for (j=i; j<n && (time2[sort2[j]]==time2[ii]); j++) {
            let mut j: usize = i;
            while j < n && time2[sort_stop[j] as usize] == time2[ii] {
                // jj = sort2[j];
                let jj = sort_stop[j] as usize;
                ndeath += 1;
                // jj = sort2[j];  (duplicate in C)
                // count[3] += wt[jj] * dwt *adjtimewt;
                count[3] += wt[jj] * dwt * adjtimewt;
                // dwt += wt[jj];
                dwt += wt[jj];

                // if (x[jj] != xsave) {
                if x[jj] != xsave {
                    dwt2 = 0.0;
                    xsave = x[jj];
                }

                // count[4] += wt[jj] * dwt2 * adjtimewt;
                count[4] += wt[jj] * dwt2 * adjtimewt;
                // dwt2 += wt[jj];
                dwt2 += wt[jj];

                // walkup(nwt, twt, x[jj], wsum, ntree);
                walkup(&nwt, &twt, x[jj] as usize, &mut wsum, ntree);
                for k in 0..3 {
                    count[k] += wt[jj] * wsum[k] * adjtimewt;
                }

                j += 1;
            }

            // /* pass 2 */
            for j in i..(i + ndeath) {
                let jj = sort_stop[j] as usize;
                addin(&mut nwt, &mut twt, x[jj] as usize, wt[jj]);
            }

            i += ndeath;
        }
    }

    // count[3] -= count[4];
    count[3] -= count[4];

    Concordance5Result { count }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Helper: port of R's survival:::btree function.
    /// Maps ranks 1..n to balanced binary tree indices (0-based).
    fn btree(n: usize) -> Vec<i32> {
        fn tfun(n: usize, id: i32, power: i32) -> Vec<i32> {
            if n == 1 {
                vec![id]
            } else if n == 2 {
                vec![2 * id + 1, id]
            } else if n == 3 {
                vec![2 * id + 1, id, 2 * id + 2]
            } else {
                let nleft = if n as i32 == power * 2 {
                    power as usize
                } else {
                    std::cmp::min((power - 1) as usize, n - (power / 2) as usize)
                };
                let mut result = tfun(nleft, 2 * id + 1, power / 2);
                result.push(id);
                result.extend(tfun(n - (nleft + 1), 2 * id + 2, power / 2));
                result
            }
        }

        let power = 2_i32.pow((((n - 1) as f64).log2()).floor() as u32);
        tfun(n, 0, power)
    }

    /// Map risk scores to bindex values (like R's docount preprocessing).
    fn compute_bindex(x: &[f64]) -> Vec<i32> {
        let mut sorted_unique: Vec<f64> = x.to_vec();
        sorted_unique.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        sorted_unique.dedup();

        let tree_map = btree(sorted_unique.len());

        x.iter()
            .map(|&val| {
                let rank = sorted_unique
                    .iter()
                    .position(|&u| u == val)
                    .unwrap();
                tree_map[rank]
            })
            .collect()
    }

    #[test]
    fn test_concordance5_simple() {
        // R test data:
        // time <- c(1,2,3,4,5,6,7,8,9,10)
        // status <- c(1,0,1,1,0,1,0,1,0,1)
        // x <- c(5,3,8,2,7,1,9,4,6,10)
        // Expected: count = [18, 10, 0, 0, 0]

        let time = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        let status = [1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
        let x_raw = [5.0, 3.0, 8.0, 2.0, 7.0, 1.0, 9.0, 4.0, 6.0, 10.0];

        let bindex = compute_bindex(&x_raw);
        // R: bindex = [9, 8, 5, 3, 0, 7, 2, 1, 4, 6]
        // (but 0-based tree indices)

        // sort_stop = order(-time, status, x) - 1  (0-based)
        // R: sort_stop = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        let sort_stop: Vec<i32> = vec![9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

        // timewt = rev(rep(1, 6)) = all 1s
        let timewt = vec![1.0; 6];

        let result = concordance5(&time, &status, &bindex, &[1.0; 10], &timewt, &sort_stop);

        assert!(
            (result.count[0] - 18.0).abs() < 1e-6,
            "concordant: expected 18, got {}",
            result.count[0]
        );
        assert!(
            (result.count[1] - 10.0).abs() < 1e-6,
            "discordant: expected 10, got {}",
            result.count[1]
        );
        assert!(
            (result.count[2] - 0.0).abs() < 1e-6,
            "tied_x: expected 0, got {}",
            result.count[2]
        );
        assert!(
            (result.count[3] - 0.0).abs() < 1e-6,
            "tied_y: expected 0, got {}",
            result.count[3]
        );
        assert!(
            (result.count[4] - 0.0).abs() < 1e-6,
            "tied_xy: expected 0, got {}",
            result.count[4]
        );
    }

    #[test]
    fn test_concordance3_simple() {
        // Same data as concordance5 test but with influence
        // Expected: count = [18, 10, 0, 0, 0, 80.66667]
        // Influence col1: [5, 0, 3, 5, 2, 4, 4, 4, 4, 5]
        // Influence col2: [4, 1, 5, 3, 1, 3, 0, 2, 1, 0]

        let time = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        let status = [1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
        let x_raw = [5.0, 3.0, 8.0, 2.0, 7.0, 1.0, 9.0, 4.0, 6.0, 10.0];
        let bindex = compute_bindex(&x_raw);
        let sort_stop: Vec<i32> = vec![9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
        let timewt = vec![1.0; 6];
        let wt = vec![1.0; 10];

        let result = concordance3(&time, &status, &bindex, &wt, &timewt, &sort_stop, false);

        assert!(
            (result.count[0] - 18.0).abs() < 1e-6,
            "concordant: expected 18, got {}",
            result.count[0]
        );
        assert!(
            (result.count[1] - 10.0).abs() < 1e-6,
            "discordant: expected 10, got {}",
            result.count[1]
        );
        assert!(
            (result.count[5] - 80.66667).abs() < 1e-4,
            "variance term: expected 80.66667, got {}",
            result.count[5]
        );

        // Check influence columns
        let expected_inf0 = [5.0, 0.0, 3.0, 5.0, 2.0, 4.0, 4.0, 4.0, 4.0, 5.0];
        let expected_inf1 = [4.0, 1.0, 5.0, 3.0, 1.0, 3.0, 0.0, 2.0, 1.0, 0.0];

        for i in 0..10 {
            assert!(
                (result.influence[0][i] - expected_inf0[i]).abs() < 1e-6,
                "influence[0][{}]: expected {}, got {}",
                i,
                expected_inf0[i],
                result.influence[0][i]
            );
            assert!(
                (result.influence[1][i] - expected_inf1[i]).abs() < 1e-6,
                "influence[1][{}]: expected {}, got {}",
                i,
                expected_inf1[i],
                result.influence[1][i]
            );
        }
    }

    #[test]
    fn test_concordance3_with_residuals() {
        // Same data, with residuals
        // Expected resid col1 (rank): [0.1, -0.375, 0.5714286, 0.8, 0.6666667, 0]
        // Expected resid col2 (timewt): [10, 8, 7, 5, 3, 1]
        // Expected resid col3 (casewt): [1, 1, 1, 1, 1, 1]

        let time = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        let status = [1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 1.0];
        let x_raw = [5.0, 3.0, 8.0, 2.0, 7.0, 1.0, 9.0, 4.0, 6.0, 10.0];
        let bindex = compute_bindex(&x_raw);
        let sort_stop: Vec<i32> = vec![9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
        let timewt = vec![1.0; 6];
        let wt = vec![1.0; 10];

        let result = concordance3(&time, &status, &bindex, &wt, &timewt, &sort_stop, true);

        let resid = result.resid.as_ref().expect("residuals should be present");
        assert_eq!(resid[0].len(), 6, "should have 6 residual rows (one per event)");

        let expected_rank = [0.1, -0.375, 0.5714286, 0.8, 0.6666667, 0.0];
        let expected_timewt = [10.0, 8.0, 7.0, 5.0, 3.0, 1.0];
        let expected_casewt = [1.0, 1.0, 1.0, 1.0, 1.0, 1.0];

        for i in 0..6 {
            assert!(
                (resid[0][i] - expected_rank[i]).abs() < 1e-6,
                "resid rank[{}]: expected {}, got {}",
                i,
                expected_rank[i],
                resid[0][i]
            );
            assert!(
                (resid[1][i] - expected_timewt[i]).abs() < 1e-6,
                "resid timewt[{}]: expected {}, got {}",
                i,
                expected_timewt[i],
                resid[1][i]
            );
            assert!(
                (resid[2][i] - expected_casewt[i]).abs() < 1e-6,
                "resid casewt[{}]: expected {}, got {}",
                i,
                expected_casewt[i],
                resid[2][i]
            );
        }
    }

    #[test]
    fn test_concordance5_with_ties() {
        // R test data with ties:
        // time <- c(1,1,2,3,3,4,5,5)
        // status <- c(1,1,0,1,1,0,1,1)
        // x <- c(3,5,2,4,4,1,6,7)
        // Expected count5: [10, 8, 0, 2, 1]

        let time = [1.0, 1.0, 2.0, 3.0, 3.0, 4.0, 5.0, 5.0];
        let status = [1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0];
        let x_raw = [3.0, 5.0, 2.0, 4.0, 4.0, 1.0, 6.0, 7.0];
        let bindex = compute_bindex(&x_raw);
        // R: sort_stop = [6, 7, 5, 3, 4, 2, 0, 1]
        let sort_stop: Vec<i32> = vec![6, 7, 5, 3, 4, 2, 0, 1];
        let timewt = vec![1.0; 3]; // 3 unique event times

        let result = concordance5(&time, &status, &bindex, &[1.0; 8], &timewt, &sort_stop);

        assert!(
            (result.count[0] - 10.0).abs() < 1e-6,
            "concordant: expected 10, got {}",
            result.count[0]
        );
        assert!(
            (result.count[1] - 8.0).abs() < 1e-6,
            "discordant: expected 8, got {}",
            result.count[1]
        );
        assert!(
            (result.count[2] - 0.0).abs() < 1e-6,
            "tied_x: expected 0, got {}",
            result.count[2]
        );
        assert!(
            (result.count[3] - 2.0).abs() < 1e-6,
            "tied_y: expected 2, got {}",
            result.count[3]
        );
        assert!(
            (result.count[4] - 1.0).abs() < 1e-6,
            "tied_xy: expected 1, got {}",
            result.count[4]
        );
    }

    #[test]
    fn test_concordance3_with_ties() {
        // Same tied data but with influence
        // Expected count3: [10, 8, 0, 2, 1, 58.7]
        // Influence col1: [4, 2, 0, 3, 3, 0, 4, 4]
        // Influence col2: [2, 4, 2, 2, 2, 4, 0, 0]
        // Influence col4: [1, 1, 0, 0, 0, 0, 1, 1]
        // Influence col5: [0, 0, 0, 1, 1, 0, 0, 0]

        let time = [1.0, 1.0, 2.0, 3.0, 3.0, 4.0, 5.0, 5.0];
        let status = [1.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0];
        let x_raw = [3.0, 5.0, 2.0, 4.0, 4.0, 1.0, 6.0, 7.0];
        let bindex = compute_bindex(&x_raw);
        let sort_stop: Vec<i32> = vec![6, 7, 5, 3, 4, 2, 0, 1];
        let timewt = vec![1.0; 3];
        let wt = vec![1.0; 8];

        let result = concordance3(&time, &status, &bindex, &wt, &timewt, &sort_stop, false);

        assert!(
            (result.count[0] - 10.0).abs() < 1e-6,
            "concordant: expected 10, got {}",
            result.count[0]
        );
        assert!(
            (result.count[1] - 8.0).abs() < 1e-6,
            "discordant: expected 8, got {}",
            result.count[1]
        );
        assert!(
            (result.count[3] - 2.0).abs() < 1e-6,
            "tied_y: expected 2, got {}",
            result.count[3]
        );
        assert!(
            (result.count[4] - 1.0).abs() < 1e-6,
            "tied_xy: expected 1, got {}",
            result.count[4]
        );
        assert!(
            (result.count[5] - 58.7).abs() < 1e-4,
            "variance term: expected 58.7, got {}",
            result.count[5]
        );

        let expected_inf0 = [4.0, 2.0, 0.0, 3.0, 3.0, 0.0, 4.0, 4.0];
        let expected_inf1 = [2.0, 4.0, 2.0, 2.0, 2.0, 4.0, 0.0, 0.0];
        let expected_inf3 = [1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0];
        let expected_inf4 = [0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0];

        for i in 0..8 {
            assert!(
                (result.influence[0][i] - expected_inf0[i]).abs() < 1e-6,
                "influence[0][{}]: expected {}, got {}",
                i,
                expected_inf0[i],
                result.influence[0][i]
            );
            assert!(
                (result.influence[1][i] - expected_inf1[i]).abs() < 1e-6,
                "influence[1][{}]: expected {}, got {}",
                i,
                expected_inf1[i],
                result.influence[1][i]
            );
            assert!(
                (result.influence[3][i] - expected_inf3[i]).abs() < 1e-6,
                "influence[3][{}]: expected {}, got {}",
                i,
                expected_inf3[i],
                result.influence[3][i]
            );
            assert!(
                (result.influence[4][i] - expected_inf4[i]).abs() < 1e-6,
                "influence[4][{}]: expected {}, got {}",
                i,
                expected_inf4[i],
                result.influence[4][i]
            );
        }
    }

    #[test]
    fn test_concordance6_counting_process() {
        // R test data:
        // start <- c(0,0,0,2,2,3); stop <- c(2,3,5,4,6,7)
        // status <- c(1,0,1,1,0,1); x <- c(3,1,4,2,5,6)
        // Expected count6: [6, 1, 0, 0, 0]

        let time1 = [0.0, 0.0, 0.0, 2.0, 2.0, 3.0];
        let time2 = [2.0, 3.0, 5.0, 4.0, 6.0, 7.0];
        let status = [1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        let x_raw = [3.0, 1.0, 4.0, 2.0, 5.0, 6.0];
        let bindex = compute_bindex(&x_raw);
        // R: sort_stop = [5, 4, 2, 3, 1, 0]
        let sort_stop: Vec<i32> = vec![5, 4, 2, 3, 1, 0];
        // R: sort_start = [5, 3, 4, 0, 1, 2]
        let sort_start: Vec<i32> = vec![5, 3, 4, 0, 1, 2];
        let timewt = vec![1.0; 4]; // 4 unique event times

        let result = concordance6(
            &time1,
            &time2,
            &status,
            &bindex,
            &[1.0; 6],
            &timewt,
            &sort_start,
            &sort_stop,
        );

        assert!(
            (result.count[0] - 6.0).abs() < 1e-6,
            "concordant: expected 6, got {}",
            result.count[0]
        );
        assert!(
            (result.count[1] - 1.0).abs() < 1e-6,
            "discordant: expected 1, got {}",
            result.count[1]
        );
        assert!(
            (result.count[2] - 0.0).abs() < 1e-6,
            "tied_x: expected 0, got {}",
            result.count[2]
        );
        assert!(
            (result.count[3] - 0.0).abs() < 1e-6,
            "tied_y: expected 0, got {}",
            result.count[3]
        );
        assert!(
            (result.count[4] - 0.0).abs() < 1e-6,
            "tied_xy: expected 0, got {}",
            result.count[4]
        );
    }

    #[test]
    fn test_concordance4_counting_process() {
        // Same counting process data with influence
        // Expected count4: [6, 1, 0, 0, 0, 10.33333]
        // Influence col1: [1, 0, 4, 3, 2, 2]
        // Influence col2: [1, 1, 0, 0, 0, 0]

        let time1 = [0.0, 0.0, 0.0, 2.0, 2.0, 3.0];
        let time2 = [2.0, 3.0, 5.0, 4.0, 6.0, 7.0];
        let status = [1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        let x_raw = [3.0, 1.0, 4.0, 2.0, 5.0, 6.0];
        let bindex = compute_bindex(&x_raw);
        let sort_stop: Vec<i32> = vec![5, 4, 2, 3, 1, 0];
        let sort_start: Vec<i32> = vec![5, 3, 4, 0, 1, 2];
        let timewt = vec![1.0; 4];
        let wt = vec![1.0; 6];

        let result = concordance4(
            &time1,
            &time2,
            &status,
            &bindex,
            &wt,
            &timewt,
            &sort_start,
            &sort_stop,
            false,
        );

        assert!(
            (result.count[0] - 6.0).abs() < 1e-6,
            "concordant: expected 6, got {}",
            result.count[0]
        );
        assert!(
            (result.count[1] - 1.0).abs() < 1e-6,
            "discordant: expected 1, got {}",
            result.count[1]
        );
        assert!(
            (result.count[5] - 10.33333).abs() < 1e-4,
            "variance term: expected 10.33333, got {}",
            result.count[5]
        );

        let expected_inf0 = [1.0, 0.0, 4.0, 3.0, 2.0, 2.0];
        let expected_inf1 = [1.0, 1.0, 0.0, 0.0, 0.0, 0.0];

        for i in 0..6 {
            assert!(
                (result.influence[0][i] - expected_inf0[i]).abs() < 1e-6,
                "influence[0][{}]: expected {}, got {}",
                i,
                expected_inf0[i],
                result.influence[0][i]
            );
            assert!(
                (result.influence[1][i] - expected_inf1[i]).abs() < 1e-6,
                "influence[1][{}]: expected {}, got {}",
                i,
                expected_inf1[i],
                result.influence[1][i]
            );
        }
    }
}
