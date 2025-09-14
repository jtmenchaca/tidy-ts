//! Cumulative helpers (cumall, cumany, cummean) – 1 : 1 port from the
//! original C++ implementation, but expressed in safe Rust 2024.
//!
//! Encodings:
//!   * `0` → FALSE
//!   * `1` → TRUE
//!   * `2` → NA  (matches R’s internal representation after `as.logical`)

#![deny(unsafe_op_in_unsafe_fn)]

#[inline(always)]
#[allow(dead_code)]
const fn and3(a: u8, b: u8) -> u8 {
    match (a, b) {
        (0, _) | (_, 0) => 0, // any FALSE → FALSE
        (1, 1) => 1,          // both TRUE  → TRUE
        _ => 2,               // otherwise  → NA
    }
}

#[inline(always)]
#[allow(dead_code)]
const fn or3(a: u8, b: u8) -> u8 {
    match (a, b) {
        (1, _) | (_, 1) => 1, // any TRUE  → TRUE
        (0, 0) => 0,          // both FALSE → FALSE
        _ => 2,               // otherwise  → NA
    }
}

#[allow(dead_code)]
pub fn cumall(input: &[u8], output: &mut [u8]) {
    debug_assert_eq!(input.len(), output.len());
    let mut acc = 1u8; // start with TRUE
    for (inp, out) in input.iter().copied().zip(output.iter_mut()) {
        acc = and3(acc, inp);
        *out = acc;
    }
}

#[allow(dead_code)]
pub fn cumany(input: &[u8], output: &mut [u8]) {
    debug_assert_eq!(input.len(), output.len());
    let mut acc = 0u8; // start with FALSE
    for (inp, out) in input.iter().copied().zip(output.iter_mut()) {
        acc = or3(acc, inp);
        *out = acc;
    }
}

pub fn cummean(input: &[f64], output: &mut [f64]) {
    debug_assert_eq!(input.len(), output.len());
    let mut sum = 0.0;
    let mut n = 0usize;

    for (&val, out) in input.iter().zip(output.iter_mut()) {
        if val.is_nan() {
            // first NA turns the rest into NA – same as C++/R
            *out = f64::NAN;
        } else {
            sum += val;
            n += 1;
            *out = sum / n as f64;
        }
    }
}
