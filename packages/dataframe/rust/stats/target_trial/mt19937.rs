//! Mersenne Twister (MT19937) implementation matching R's RNG.
//!
//! Reproduces R's `set.seed()` + `unif_rand()` + `rbinom(n, 1, p)` + `sample()`
//! so that bootstrap resampling and Bernoulli draws produce identical sequences.
//!
//! Reference: `survival-ref/r-source-trunk/src/main/RNG.c`

const N: usize = 624;
const M: usize = 397;
const MATRIX_A: u32 = 0x9908b0df;
const UPPER_MASK: u32 = 0x80000000;
const LOWER_MASK: u32 = 0x7fffffff;

// Tempering parameters
const TEMPERING_MASK_B: u32 = 0x9d2c5680;
const TEMPERING_MASK_C: u32 = 0xefc60000;

const I2_32M1: f64 = 2.328306437080797e-10; // 1/(2^32 - 1)

/// Mersenne Twister state, matching R's internal representation.
pub struct MersenneTwister {
    mt: [u32; N],
    mti: usize,
}

impl MersenneTwister {
    /// Initialize matching R's `set.seed(seed)`.
    ///
    /// R's `RNG_Init(MERSENNE_TWISTER, seed)` in RNG.c:
    /// 1. Scramble seed 50 times: `seed = 69069 * seed + 1` (wrapping u32)
    /// 2. Fill i_seed[0..624] with `seed = 69069 * seed + 1` for each
    /// 3. FixupSeeds sets i_seed[0] = 624 (the mti index)
    ///
    /// i_seed[0] is mti, i_seed[1..624] are the state vector.
    pub fn from_seed(seed: i32) -> Self {
        let mut s = seed as u32;

        // R RNG.c lines 276-277: initial scrambling, 50 rounds
        for _ in 0..50 {
            s = s.wrapping_mul(69069).wrapping_add(1);
        }

        // R RNG.c lines 284-287: fill n_seed = 625 entries
        // i_seed[0] will become mti, i_seed[1..624] become mt state
        let mut i_seed = [0u32; N + 1];
        for j in 0..=N {
            s = s.wrapping_mul(69069).wrapping_add(1);
            i_seed[j] = s;
        }

        // R FixupSeeds for MERSENNE_TWISTER (RNG.c line 219):
        // if(initial) I1 = 624;
        i_seed[0] = N as u32;

        // i_seed[0] is mti, i_seed[1..N] is the state
        let mut mt = [0u32; N];
        mt.copy_from_slice(&i_seed[1..=N]);

        MersenneTwister {
            mt,
            mti: i_seed[0] as usize,
        }
    }

    /// Generate one random u32, matching R's `MT_genrand` (returns the raw integer).
    fn genrand(&mut self) -> u32 {
        let mag01: [u32; 2] = [0x0, MATRIX_A];

        if self.mti >= N {
            // Generate N words at one time
            for kk in 0..(N - M) {
                let y = (self.mt[kk] & UPPER_MASK) | (self.mt[kk + 1] & LOWER_MASK);
                self.mt[kk] = self.mt[kk + M] ^ (y >> 1) ^ mag01[(y & 0x1) as usize];
            }
            for kk in (N - M)..(N - 1) {
                let y = (self.mt[kk] & UPPER_MASK) | (self.mt[kk + 1] & LOWER_MASK);
                self.mt[kk] = self.mt[kk + M - N] ^ (y >> 1) ^ mag01[(y & 0x1) as usize];
            }
            let y = (self.mt[N - 1] & UPPER_MASK) | (self.mt[0] & LOWER_MASK);
            self.mt[N - 1] = self.mt[M - 1] ^ (y >> 1) ^ mag01[(y & 0x1) as usize];

            self.mti = 0;
        }

        let mut y = self.mt[self.mti];
        self.mti += 1;

        // Tempering
        y ^= y >> 11;
        y ^= (y << 7) & TEMPERING_MASK_B;
        y ^= (y << 15) & TEMPERING_MASK_C;
        y ^= y >> 18;

        y
    }

    /// R's `unif_rand()` for Mersenne Twister: `fixup(MT_genrand())`.
    ///
    /// MT_genrand returns `(double)y * 2.3283064365386963e-10` in [0,1).
    /// fixup ensures 0 and 1 are never returned.
    pub fn unif_rand(&mut self) -> f64 {
        let y = self.genrand();
        let x = y as f64 * 2.3283064365386963e-10;
        fixup(x)
    }

    /// R's `rbinom(1, 1, pp)` — single Bernoulli draw.
    ///
    /// Matches R's rbinom.c exactly for n=1 (the np < 30 path):
    /// - p_local = min(pp, 1-pp), q = 1-p_local, qn = q^1 = q
    /// - u = unif_rand()
    /// - ix = 0 if u < qn, else ix = 1
    /// - if pp > 0.5: ix = 1 - ix (the psave > 0.5 flip)
    pub fn rbinom_1(&mut self, pp: f64) -> u32 {
        let u = self.unif_rand();
        if pp <= 0.5 {
            // p_local = pp, q = 1-pp, qn = 1-pp
            // ix=0 if u < 1-pp, else ix=1
            if u >= 1.0 - pp { 1 } else { 0 }
        } else {
            // p_local = 1-pp, q = pp, qn = pp
            // ix=0 if u < pp, else ix=1; then flip: ix = 1-ix
            if u < pp { 1 } else { 0 }
        }
    }

    /// R's `sample.int(n, size, replace=TRUE)` using rejection sampling.
    ///
    /// R (with default `sample.kind = "Rejection"`):
    /// `R_unif_index(dn)` uses `rbits(ceil(log2(dn)))` then rejects if >= dn.
    /// `rbits(bits)` generates in 16-bit chunks using `floor(unif_rand() * 65536)`.
    pub fn sample_int_replace(&mut self, n: usize, size: usize) -> Vec<usize> {
        let mut result = Vec::with_capacity(size);
        let dn = n as f64;
        let bits = (dn.log2().ceil()) as u32;

        for _ in 0..size {
            loop {
                let dv = self.rbits(bits);
                if dv < dn {
                    result.push(dv as usize);
                    break;
                }
            }
        }
        result
    }

    /// R's `rbits(bits)` — generate random non-negative integer < 2^bits in 16-bit chunks.
    ///
    /// From RNG.c lines 878-888.
    fn rbits(&mut self, bits: u32) -> f64 {
        let mut v: u64 = 0;
        let mut n = 0u32;
        while n <= bits {
            let v1 = (self.unif_rand() * 65536.0).floor() as u64;
            v = 65536 * v + v1;
            n += 16;
        }
        let mask = (1u64 << bits) - 1;
        (v & mask) as f64
    }
}

/// R's fixup: ensure 0 and 1 are never returned.
fn fixup(x: f64) -> f64 {
    if x <= 0.0 {
        0.5 * I2_32M1
    } else if (1.0 - x) <= 0.0 {
        1.0 - 0.5 * I2_32M1
    } else {
        x
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_r_set_seed_42_first_values() {
        // Verify against R:
        // set.seed(42); cat(sprintf("%.18f\n", runif(5)))
        // 0.914806043496355414
        // 0.937075413297861814
        // 0.286139534786343575
        // 0.830447626067325473
        // 0.641745518893003464
        let mut rng = MersenneTwister::from_seed(42);
        let v: Vec<f64> = (0..5).map(|_| rng.unif_rand()).collect();

        assert!((v[0] - 0.914806043496355414).abs() < 1e-15, "v[0]={}", v[0]);
        assert!((v[1] - 0.937075413297861814).abs() < 1e-15, "v[1]={}", v[1]);
        assert!((v[2] - 0.286139534786343575).abs() < 1e-15, "v[2]={}", v[2]);
        assert!((v[3] - 0.830447626067325473).abs() < 1e-15, "v[3]={}", v[3]);
        assert!((v[4] - 0.641745518893003464).abs() < 1e-15, "v[4]={}", v[4]);
    }

    #[test]
    fn test_r_set_seed_123_first_values() {
        // set.seed(123); cat(sprintf("%.18f\n", runif(5)))
        // 0.287577520124614239
        // 0.788305135443806648
        // 0.408976921811699867
        // 0.883017404004931450
        // 0.940467284293845296
        let mut rng = MersenneTwister::from_seed(123);
        let v: Vec<f64> = (0..5).map(|_| rng.unif_rand()).collect();

        assert!((v[0] - 0.287577520124614239).abs() < 1e-15, "v[0]={}", v[0]);
        assert!((v[1] - 0.788305135443806648).abs() < 1e-15, "v[1]={}", v[1]);
        assert!((v[2] - 0.408976921811699867).abs() < 1e-15, "v[2]={}", v[2]);
        assert!((v[3] - 0.883017404004931450).abs() < 1e-15, "v[3]={}", v[3]);
        assert!((v[4] - 0.940467284293845296).abs() < 1e-15, "v[4]={}", v[4]);
    }

    #[test]
    fn test_rbinom_1() {
        // set.seed(42); rbinom(10, 1, 0.3)
        // [1] 1 1 0 1 0 0 1 0 0 1
        let mut rng = MersenneTwister::from_seed(42);
        let draws: Vec<u32> = (0..10).map(|_| rng.rbinom_1(0.3)).collect();
        assert_eq!(draws, vec![1, 1, 0, 1, 0, 0, 1, 0, 0, 1]);
    }

    #[test]
    fn test_sample_int_replace() {
        // set.seed(42); sample.int(10, 5, replace=TRUE)
        // [1] 1 5 1 9 10
        // R is 1-indexed → 0-indexed: 0, 4, 0, 8, 9
        let mut rng = MersenneTwister::from_seed(42);
        let s = rng.sample_int_replace(10, 5);
        assert_eq!(s, vec![0, 4, 0, 8, 9]);
    }
}
