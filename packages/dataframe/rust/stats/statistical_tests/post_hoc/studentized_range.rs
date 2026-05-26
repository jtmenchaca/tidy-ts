//! Studentized range distribution (`ptukey` / `qtukey`).
//!
//! Faithful Rust port of R's nmath/ptukey.c and nmath/qtukey.c
//! (Copyright (C) 1998 Ross Ihaka, (C) 2000-2007 R Core Team), based on:
//!
//!   Copenhaver, Margaret Diponzio & Holland, Burt S.
//!   Multiple comparisons of simple effects in the two-way analysis of
//!   variance with fixed effects.
//!   Journal of Statistical Computation and Simulation, Vol. 30, pp.1-15, 1988.
//!
//! Source: /Users/jtmenchaca/tidy-ts/survival-ref/r-source-trunk/src/nmath/
//! License: GPL (R is GPLv2+).

use crate::stats::distributions::normal::pnorm;
use statrs::function::gamma::ln_gamma;

const M_1_SQRT_2PI: f64 = 0.398942280401432677939946059934; // 1 / sqrt(2 pi)
const M_LN2: f64 = std::f64::consts::LN_2;

/// `wprob` from ptukey.c — probability integral of Hartley's form of the range.
fn wprob(w: f64, rr: f64, cc: f64) -> f64 {
    // Legendre 12-point nodes (symmetric pair, only half listed; see ptukey.c).
    const NLEG: usize = 12;
    const IHALF: usize = 6;
    const C1: f64 = -30.0;
    const C2: f64 = -50.0;
    const C3: f64 = 60.0;
    const BB: f64 = 8.0;
    const WLAR: f64 = 3.0;
    const WINCR1: f64 = 2.0;
    const WINCR2: f64 = 3.0;

    const XLEG: [f64; IHALF] = [
        0.981560634246719250690549090149,
        0.904117256370474856678465866119,
        0.769902674194304687036893833213,
        0.587317954286617447296702418941,
        0.367831498998180193752691536644,
        0.125233408511468915472441369464,
    ];
    const ALEG: [f64; IHALF] = [
        0.047175336386511827194615961485,
        0.106939325995318430960254718194,
        0.160078328543346226334652529543,
        0.203167426723065921749064455810,
        0.233492536538354808760849898925,
        0.249147045813402785000562436043,
    ];

    let qsqz = w * 0.5;

    // if w >= 16 then return 1.
    if qsqz >= BB {
        return 1.0;
    }

    // First term in integral of Hartley's form: (f(w/2) - 1)^cc
    let mut pr_w = 2.0 * pnorm(qsqz, 0.0, 1.0, true, false) - 1.0;
    if pr_w >= (C2 / cc).exp() {
        pr_w = pr_w.powf(cc);
    } else {
        pr_w = 0.0;
    }

    let wincr = if w > WLAR { WINCR1 } else { WINCR2 };

    let mut blb = qsqz;
    let binc = (BB - qsqz) / wincr;
    let mut bub = blb + binc;
    let mut einsum: f64 = 0.0;

    let cc1 = cc - 1.0;
    let wincr_usize = wincr as usize;
    for _wi in 1..=wincr_usize {
        let mut elsum: f64 = 0.0;
        let a = 0.5 * (bub + blb);
        let b = 0.5 * (bub - blb);

        for jj in 1..=NLEG {
            let (xx, j_idx) = if IHALF < jj {
                let j = (NLEG - jj) + 1;
                (XLEG[j - 1], j - 1)
            } else {
                let j = jj;
                (-XLEG[j - 1], j - 1)
            };
            let c = b * xx;
            let ac = a + c;

            let qexpo = ac * ac;
            if qexpo > C3 {
                break;
            }

            let pplus = 2.0 * pnorm(ac, 0.0, 1.0, true, false);
            let pminus = 2.0 * pnorm(ac, w, 1.0, true, false);

            let mut rinsum = (pplus * 0.5) - (pminus * 0.5);
            if rinsum >= (C1 / cc1).exp() {
                rinsum = (ALEG[j_idx] * (-(0.5 * qexpo)).exp()) * rinsum.powf(cc1);
                elsum += rinsum;
            }
        }
        elsum *= ((2.0 * b) * cc) * M_1_SQRT_2PI;
        einsum += elsum;
        blb = bub;
        bub += binc;
    }

    pr_w += einsum;
    if pr_w <= (C1 / rr).exp() {
        return 0.0;
    }

    pr_w = pr_w.powf(rr);
    if pr_w >= 1.0 {
        return 1.0;
    }
    pr_w
}

/// `ptukey(q, rr, cc, df)` — CDF of the studentized range distribution.
///
/// Returns the probability that the maximum of `rr` studentized ranges, each
/// based on `cc` means and `df` error degrees of freedom, is less than `q`.
/// For one-way ANOVA post-hoc, `rr = 1`.
pub fn ptukey(q: f64, rr: f64, cc: f64, df: f64) -> f64 {
    const NLEGQ: usize = 16;
    const IHALFQ: usize = 8;
    const EPS1: f64 = -30.0;
    const EPS2: f64 = 1.0e-14;
    const DHAF: f64 = 100.0;
    const DQUAR: f64 = 800.0;
    const DEIGH: f64 = 5000.0;
    const DLARG: f64 = 25000.0;
    const ULEN1: f64 = 1.0;
    const ULEN2: f64 = 0.5;
    const ULEN3: f64 = 0.25;
    const ULEN4: f64 = 0.125;

    const XLEGQ: [f64; IHALFQ] = [
        0.989400934991649932596154173450,
        0.944575023073232576077988415535,
        0.865631202387831743880467897712,
        0.755404408355003033895101194847,
        0.617876244402643748446671764049,
        0.458016777657227386342419442984,
        0.281603550779258913230460501460,
        0.0950125098376374401853193354250,
    ];
    const ALEGQ: [f64; IHALFQ] = [
        0.0271524594117540948517805724560,
        0.0622535239386478928628438369944,
        0.0951585116824927848099251076022,
        0.124628971255533872052476282192,
        0.149595988816576732081501730547,
        0.169156519395002538189312079030,
        0.182603415044923588866763667969,
        0.189450610455068496285396723208,
    ];

    if q <= 0.0 {
        return 0.0;
    }
    if df < 2.0 || rr < 1.0 || cc < 2.0 {
        return f64::NAN;
    }
    if !q.is_finite() {
        return 1.0;
    }

    if df > DLARG {
        return wprob(q, rr, cc);
    }

    let f2 = df * 0.5;
    let mut f2lf = (f2 * df.ln()) - (df * M_LN2) - ln_gamma(f2);
    let f21 = f2 - 1.0;

    let ff4 = df * 0.25;
    let ulen = if df <= DHAF {
        ULEN1
    } else if df <= DQUAR {
        ULEN2
    } else if df <= DEIGH {
        ULEN3
    } else {
        ULEN4
    };

    f2lf += ulen.ln();

    let mut ans: f64 = 0.0;
    let mut otsum: f64 = 0.0;

    for i in 1..=50 {
        otsum = 0.0;
        let twa1 = ((2 * i - 1) as f64) * ulen;

        for jj in 1..=NLEGQ {
            let (t1, j_idx, take_pos) = if IHALFQ < jj {
                let j = jj - IHALFQ - 1;
                let t = (f2lf + (f21 * (twa1 + (XLEGQ[j] * ulen)).ln()))
                    - (((XLEGQ[j] * ulen) + twa1) * ff4);
                (t, j, true)
            } else {
                let j = jj - 1;
                let t = (f2lf + (f21 * (twa1 - (XLEGQ[j] * ulen)).ln()))
                    + (((XLEGQ[j] * ulen) - twa1) * ff4);
                (t, j, false)
            };

            if t1 >= EPS1 {
                let inner = if take_pos {
                    twa1 + XLEGQ[j_idx] * ulen
                } else {
                    twa1 - XLEGQ[j_idx] * ulen
                };
                let qsqz = q * (inner * 0.5).sqrt();
                let wprb = wprob(qsqz, rr, cc);
                let rotsum = (wprb * ALEGQ[j_idx]) * t1.exp();
                otsum += rotsum;
            }
        }

        // If integral for interval i < 1e-14, stop. But ensure at least 1/ulen
        // intervals are calculated to avoid clipping the left tail.
        if (i as f64) * ulen >= 1.0 && otsum <= EPS2 {
            break;
        }

        ans += otsum;
    }

    if otsum > EPS2 {
        // not converged — R issues ME_PRECISION warning; we just return.
    }
    if ans > 1.0 {
        return 1.0;
    }
    ans
}

/// `qinv` from qtukey.c — initial estimate for the secant method (AS70 1974).
fn qinv(p: f64, c: f64, v: f64) -> f64 {
    const P0: f64 = 0.322232421088;
    const Q0: f64 = 0.0993484626060;
    const P1: f64 = -1.0;
    const Q1: f64 = 0.588581570495;
    const P2: f64 = -0.342242088547;
    const Q2: f64 = 0.531103462366;
    const P3: f64 = -0.204231210125;
    const Q3: f64 = 0.103537752850;
    const P4: f64 = -0.453642210148e-04;
    const Q4: f64 = 0.38560700634e-02;
    const C1: f64 = 0.8832;
    const C2: f64 = 0.2368;
    const C3: f64 = 1.214;
    const C4: f64 = 1.208;
    const C5: f64 = 1.4142;
    const VMAX: f64 = 120.0;

    let ps = 0.5 - 0.5 * p;
    let yi = (1.0 / (ps * ps)).ln().sqrt();
    let mut t = yi
        + ((((yi * P4 + P3) * yi + P2) * yi + P1) * yi + P0)
            / ((((yi * Q4 + Q3) * yi + Q2) * yi + Q1) * yi + Q0);
    if v < VMAX {
        t += (t * t * t + t) / v / 4.0;
    }
    let mut q = C1 - C2 * t;
    if v < VMAX {
        q += -C3 / v + C4 * t / v;
    }
    t * (q * (c - 1.0).ln() + C5)
}

/// `qtukey(p, rr, cc, df)` — inverse CDF of the studentized range.
///
/// Returns the critical value `q` such that `ptukey(q, rr, cc, df) = p`.
/// Uses the secant method seeded by `qinv` (Copenhaver-Holland 1988).
pub fn qtukey(p: f64, rr: f64, cc: f64, df: f64) -> f64 {
    const EPS: f64 = 0.0001;
    const MAXITER: usize = 50;

    if df < 2.0 || rr < 1.0 || cc < 2.0 {
        return f64::NAN;
    }
    if p <= 0.0 {
        return 0.0;
    }
    if p >= 1.0 {
        return f64::INFINITY;
    }

    // Initial value
    let mut x0 = qinv(p, cc, df);
    let mut valx0 = ptukey(x0, rr, cc, df) - p;

    // Second iterate
    let mut x1 = if valx0 > 0.0 {
        (x0 - 1.0).max(0.0)
    } else {
        x0 + 1.0
    };
    let mut valx1 = ptukey(x1, rr, cc, df) - p;

    let mut ans = 0.0;
    for _iter in 1..MAXITER {
        ans = x1 - ((valx1 * (x1 - x0)) / (valx1 - valx0));
        valx0 = valx1;

        x0 = x1;
        if ans < 0.0 {
            ans = 0.0;
            valx1 = -p;
        }
        valx1 = ptukey(ans, rr, cc, df) - p;
        x1 = ans;

        let xabs = (x1 - x0).abs();
        if xabs < EPS {
            return ans;
        }
    }

    // Did not converge in 50 iterations — return last estimate.
    ans
}
