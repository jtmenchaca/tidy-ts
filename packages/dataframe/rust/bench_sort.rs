use std::cmp::Ordering;
use std::time::Instant;
use rayon::prelude::*;

const N: usize = 500_000;
const WARMUP: usize = 3;
const TRIALS: usize = 10;

#[inline(always)]
fn tot_cmp(a: f64, b: f64) -> Ordering {
    #[inline(always)]
    fn to_sortable(v: f64) -> i64 {
        let bits = v.to_bits() as i64;
        if bits < 0 { !bits } else { bits ^ (1_i64 << 63) }
    }
    to_sortable(a).cmp(&to_sortable(b))
}

#[inline]
fn cmp_nan_last(a: f64, b: f64) -> Ordering {
    let an = a.is_nan();
    let bn = b.is_nan();
    match (an, bn) {
        (true, true) => Ordering::Equal,
        (true, false) => Ordering::Greater,
        (false, true) => Ordering::Less,
        (false, false) => a.partial_cmp(&b).unwrap_or(Ordering::Equal),
    }
}

fn partition_nans(pairs: &mut [(u32, f64)]) -> usize {
    let mut lo = 0;
    let mut hi = pairs.len();
    while lo < hi {
        if pairs[lo].1.is_nan() {
            hi -= 1;
            pairs.swap(lo, hi);
        } else {
            lo += 1;
        }
    }
    lo
}

fn measure(name: &str, f: impl Fn()) {
    for _ in 0..WARMUP { f(); }
    let mut times = Vec::with_capacity(TRIALS);
    for _ in 0..TRIALS {
        let t = Instant::now();
        f();
        times.push(t.elapsed().as_secs_f64() * 1000.0);
    }
    times.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let median = times[TRIALS / 2];
    let min = times[0];
    println!("  {name:40} median={median:.2}ms  min={min:.2}ms");
}

fn main() {
    println!("\nRust sort benchmark — {N} rows\n");

    // Build random data
    let data: Vec<f64> = (0..N).map(|i| {
        let x = ((i as f64 * 2654435761.0) % (1u64 << 32) as f64) / (1u64 << 32) as f64;
        x * 1000.0
    }).collect();

    // 1. Old approach: sort Vec<usize> with indirect comparisons
    measure("Old: sort indices (indirect)", || {
        let mut idx: Vec<usize> = (0..N).collect();
        idx.sort_unstable_by(|&a, &b| cmp_nan_last(data[a], data[b]));
        std::hint::black_box(&idx);
    });

    // 2. Old approach + rayon
    measure("Old: sort indices (indirect, rayon)", || {
        let mut idx: Vec<usize> = (0..N).collect();
        idx.par_sort_unstable_by(|&a, &b| cmp_nan_last(data[a], data[b]));
        std::hint::black_box(&idx);
    });

    // 3. New: tuple sort with tot_cmp (no NaN partition)
    measure("New: tuple sort, tot_cmp", || {
        let mut pairs: Vec<(u32, f64)> = data.iter().enumerate()
            .map(|(i, &v)| (i as u32, v)).collect();
        pairs.sort_unstable_by(|a, b| tot_cmp(a.1, b.1));
        std::hint::black_box(&pairs);
    });

    // 4. New: tuple sort + NaN partition + tot_cmp
    measure("New: tuple + NaN partition + tot_cmp", || {
        let mut pairs: Vec<(u32, f64)> = data.iter().enumerate()
            .map(|(i, &v)| (i as u32, v)).collect();
        let valid = partition_nans(&mut pairs);
        let slice = &mut pairs[..valid];
        slice.sort_unstable_by(|a, b| tot_cmp(a.1, b.1));
        std::hint::black_box(&pairs);
    });

    // 5. New: tuple + NaN partition + rayon
    measure("New: tuple + NaN partition + rayon", || {
        let mut pairs: Vec<(u32, f64)> = data.iter().enumerate()
            .map(|(i, &v)| (i as u32, v)).collect();
        let valid = partition_nans(&mut pairs);
        let slice = &mut pairs[..valid];
        slice.par_sort_unstable_by(|a, b| tot_cmp(a.1, b.1));
        std::hint::black_box(&pairs);
    });

    // 6. Polars-style: sort dense Vec<f64> in place (best case, no indices)
    measure("Polars-style: sort dense f64 in place", || {
        let mut vals = data.clone();
        vals.sort_unstable_by(|a, b| tot_cmp(*a, *b));
        std::hint::black_box(&vals);
    });

    // 7. Polars-style: sort dense f64 + rayon
    measure("Polars-style: sort dense f64 + rayon", || {
        let mut vals = data.clone();
        vals.par_sort_unstable_by(|a, b| tot_cmp(*a, *b));
        std::hint::black_box(&vals);
    });
}
