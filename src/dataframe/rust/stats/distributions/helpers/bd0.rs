/// Binomial deviance function
///
/// Evaluates the "deviance part"
/// bd0(x,M) := M * D0(x/M) = M*[ x/M * log(x/M) + 1 - (x/M) ] = x * log(x/M) + M - x
/// where M = E[X] = n*p (or = lambda), for x, M > 0
///
/// Source: R-4.5.1/nmath/bd0.c
#[inline]
pub fn bd0(x: f64, np: f64) -> f64 {
    if !x.is_finite() || !np.is_finite() || np == 0.0 {
        return f64::NAN;
    }

    if (x - np).abs() < 0.1 * (x + np) {
        let d = x - np;
        let mut v = d / (x + np);

        if d != 0.0 && v == 0.0 {
            // v has underflown to 0 (as x+np = inf)
            let x_ = x * 0.25; // ldexp(x, -2)
            let n_ = np * 0.25; // ldexp(np, -2)
            v = (x_ - n_) / (x_ + n_);
        }

        let mut s = d * 0.5 * v; // was d * v
        if (s * 2.0).abs() < f64::MIN_POSITIVE {
            return s * 2.0;
        }

        let mut ej = x * v; // as 2*x*v could overflow: v > 1/2 <==> ej = 2xv > x
        v *= v; // "v = v^2"

        for j in 1..1000 {
            // Taylor series; 1000: no infinite loop as |v| < .1, v^2000 is "zero"
            ej *= v; // = x v^(2j+1)
            let s_ = s;
            s += ej / ((j << 1) + 1) as f64;
            if s == s_ {
                // last term was effectively 0
                return s * 2.0; // 2*s ; as we dropped '2 *' above
            }
        }

        // This should never happen
        return s * 2.0;
    }

    // else: | x - np | is not too small
    let lg_x_n = if (x / np).is_finite() {
        (x / np).ln()
    } else {
        x.ln() - np.ln()
    };

    if x > np {
        x * (lg_x_n - 1.0) + np
    } else {
        x * lg_x_n + np - x
    }
}
