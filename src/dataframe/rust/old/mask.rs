//! Extremely trimmed-down "mask" just to enable .data\[\[col\]\] lookups.
//! In the original C++ this relied on rlang; here we just store a slice
//! map inside a struct and expose getters.
//

#![deny(unsafe_op_in_unsafe_fn)]

use std::collections::HashMap;

#[derive(Default)]
pub struct DataMask<'a> {
    #[allow(dead_code)]
    columns: HashMap<&'a str, &'a [u8]>,
}

impl<'a> DataMask<'a> {
    #[allow(dead_code)]
    pub fn new() -> Self { Self::default() }

    #[allow(dead_code)]
    pub fn insert(&mut self, name: &'a str, col: &'a [u8]) {
        self.columns.insert(name, col);
    }

    #[allow(dead_code)]
    pub fn get(&self, name: &str) -> Option<&[u8]> {
        self.columns.get(name).copied()
    }
}
