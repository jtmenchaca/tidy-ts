#![deny(unsafe_op_in_unsafe_fn)]

#[cfg(feature = "wasm")]
use core::hash::{BuildHasherDefault, Hasher};
#[cfg(feature = "wasm")]
use hashbrown::{HashMap as FastHashMap, hash_map::RawEntryMut};
#[cfg(feature = "wasm")]
use js_sys::Uint32Array;
#[cfg(feature = "wasm")]
use std::collections::HashMap;

#[cfg(not(feature = "wasm"))]
use std::collections::HashMap;

// ---------------------------------------------------------------------------
//                             WASM-specific utilities
// ---------------------------------------------------------------------------

#[cfg(feature = "wasm")]
pub type IdxSize = u32;
#[cfg(feature = "wasm")]
pub const SENTINEL: u32 = u32::MAX;

/// Bulk copy Uint32Array columns to Vec<Vec<u32>> for efficient WASM processing
#[cfg(feature = "wasm")]
#[inline]
pub fn bulk_copy_u32(cols: &[Uint32Array]) -> Vec<Vec<u32>> {
    cols.iter()
        .map(|c| {
            let mut v = vec![0u32; c.length() as usize];
            c.copy_to(&mut v);
            v
        })
        .collect()
}

/// Bulk copy Float64Array to Vec<f64> for efficient WASM processing
#[cfg(feature = "wasm")]
#[inline]
pub fn bulk_copy_f64(arr: &js_sys::Float64Array) -> Vec<f64> {
    let mut v = vec![0f64; arr.length() as usize];
    arr.copy_to(&mut v);
    v
}

/// Bulk copy Uint8Array to Vec<u8> for efficient WASM processing
#[cfg(feature = "wasm")]
#[inline]
pub fn bulk_copy_u8(arr: &js_sys::Uint8Array) -> Vec<u8> {
    let mut v = vec![0u8; arr.length() as usize];
    arr.copy_to(&mut v);
    v
}

/// Pack two u32 values into a single u64 for efficient 2-column joins
#[cfg(feature = "wasm")]
#[inline]
pub fn pack2_u64(a: u32, b: u32) -> u64 {
    ((a as u64) << 32) | (b as u64)
}

/// Check if multiple columns are equal at given row indices
#[cfg(feature = "wasm")]
#[inline]
pub fn rows_equal_multi(left: &[&[u32]], right: &[&[u32]], li: usize, rj: usize) -> bool {
    let cols = left.len().min(right.len());
    for c in 0..cols {
        if left[c][li] != right[c][rj] {
            return false;
        }
    }
    true
}

// splitmix64-ish mixer for hash functions
#[cfg(feature = "wasm")]
#[inline]
pub fn mix64(mut x: u64) -> u64 {
    x = x.wrapping_add(0x9E3779B97F4A7C15);
    x ^= x >> 30;
    x = x.wrapping_mul(0xBF58476D1CE4E5B9);
    x ^= x >> 27;
    x = x.wrapping_mul(0x94D049BB133111EB);
    x ^ (x >> 31)
}

/// Hash multiple columns into a single u64
#[cfg(feature = "wasm")]
#[inline]
pub fn hash_row_multi(cols: &[&[u32]], i: usize) -> u64 {
    let mut h = 0x9E3779B97F4A7C15u64;
    for col in cols {
        h = mix64(h ^ (col[i] as u64));
    }
    h
}

// ---------------------------------------------------------------------------
//                             Identity hasher for u32/u64 keys
// ---------------------------------------------------------------------------

#[cfg(feature = "wasm")]
#[derive(Default)]
pub struct IdentityHasher(u64);

#[cfg(feature = "wasm")]
impl Hasher for IdentityHasher {
    #[inline]
    fn write(&mut self, bytes: &[u8]) {
        // Fallback: simple mix if someone calls write(bytes)
        let mut h = 0xcbf29ce484222325u64;
        for b in bytes {
            h ^= *b as u64;
            h = h.wrapping_mul(0x100000001b3);
        }
        self.0 = h;
    }
    #[inline]
    fn write_u32(&mut self, i: u32) {
        self.0 = i as u64;
    }
    #[inline]
    fn write_u64(&mut self, i: u64) {
        self.0 = i;
    }
    #[inline]
    fn finish(&self) -> u64 {
        self.0
    }
}

#[cfg(feature = "wasm")]
pub type FastState = BuildHasherDefault<IdentityHasher>;

// ---------------------------------------------------------------------------
//                             CSR index structures
// ---------------------------------------------------------------------------

#[cfg(feature = "wasm")]
#[derive(Clone, Copy)]
pub struct Off {
    pub start: u32,
    pub len: u32,
    pub next: u32, // write cursor during fill
}

/// Build CSR from precomputed u32 keys
#[cfg(feature = "wasm")]
pub fn build_csr_from_keys_u32(keys: &[u32]) -> (FastHashMap<u32, Off, FastState>, Vec<u32>) {
    let mut map: FastHashMap<u32, Off, FastState> =
        FastHashMap::with_capacity_and_hasher(keys.len(), FastState::default());

    // Pass 1: counts
    for &k in keys {
        match map.raw_entry_mut().from_key(&k) {
            RawEntryMut::Occupied(mut occ) => {
                occ.get_mut().len = occ.get().len.saturating_add(1);
            }
            RawEntryMut::Vacant(vac) => {
                vac.insert(
                    k,
                    Off {
                        start: 0,
                        len: 1,
                        next: 0,
                    },
                );
            }
        }
    }

    // Pass 2: prefix
    let mut adj = vec![0u32; keys.len()];
    let mut acc: u32 = 0;
    for (_, off) in map.iter_mut() {
        off.start = acc;
        acc = acc.saturating_add(off.len);
        off.next = off.start;
    }

    // Pass 3: fill
    for (i, &k) in keys.iter().enumerate() {
        let off = map.get_mut(&k).unwrap();
        let pos = off.next as usize;
        adj[pos] = i as u32;
        off.next = off.next.saturating_add(1);
    }

    (map, adj)
}

/// Build CSR from precomputed u64 keys
#[cfg(feature = "wasm")]
pub fn build_csr_from_keys_u64(keys: &[u64]) -> (FastHashMap<u64, Off, FastState>, Vec<u32>) {
    let mut map: FastHashMap<u64, Off, FastState> =
        FastHashMap::with_capacity_and_hasher(keys.len(), FastState::default());

    // Pass 1: counts
    for &k in keys {
        match map.raw_entry_mut().from_key(&k) {
            RawEntryMut::Occupied(mut occ) => {
                occ.get_mut().len = occ.get().len.saturating_add(1);
            }
            RawEntryMut::Vacant(vac) => {
                vac.insert(
                    k,
                    Off {
                        start: 0,
                        len: 1,
                        next: 0,
                    },
                );
            }
        }
    }

    // Pass 2: prefix
    let mut adj = vec![0u32; keys.len()];
    let mut acc: u32 = 0;
    for (_, off) in map.iter_mut() {
        off.start = acc;
        acc = acc.saturating_add(off.len);
        off.next = off.start;
    }

    // Pass 3: fill
    for (i, &k) in keys.iter().enumerate() {
        let off = map.get_mut(&k).unwrap();
        let pos = off.next as usize;
        adj[pos] = i as u32;
        off.next = off.next.saturating_add(1);
    }

    (map, adj)
}

// ---------------------------------------------------------------------------
//                             Generic helpers (non-WASM)
// ---------------------------------------------------------------------------

/// Build a hash-map from key → Vec<row_idx>.
pub fn build_index<K: Eq + std::hash::Hash + Copy>(keys: &[K]) -> HashMap<K, Vec<usize>> {
    let mut map: HashMap<K, Vec<usize>> = HashMap::with_capacity(keys.len());
    for (row, &k) in keys.iter().enumerate() {
        map.entry(k).or_default().push(row);
    }
    map
}

/// Estimate total output length for inner joins
pub fn est_len<K: Eq + std::hash::Hash>(
    left_keys: &[K],
    right_map: &HashMap<K, Vec<usize>>,
) -> usize {
    left_keys
        .iter()
        .map(|k| right_map.get(k).map_or(0, |v| v.len()))
        .sum()
}

/// Estimate total output length for left joins (includes unmatched left rows)
pub fn est_len_left<K: Eq + std::hash::Hash>(
    left_keys: &[K],
    right_map: &HashMap<K, Vec<usize>>,
) -> usize {
    left_keys
        .iter()
        .map(|k| right_map.get(k).map_or(1, |v| v.len().max(1)))
        .sum()
}
