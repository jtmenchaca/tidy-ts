//! Attributes copy for `dplyr_reconstruct` – in Rust we just
//! give back a shallow clone that carries `names` + `row_names`
//! in a small map.
//
//! If you later need ALTREP-style de-duplication you can hook it
//! into this layer.
//

#![deny(unsafe_op_in_unsafe_fn)]

use std::collections::BTreeMap;

#[derive(Clone)]
#[allow(dead_code)]
pub struct DataFrame<T> {
    pub cols:  Vec<Vec<T>>,
    pub attrs: BTreeMap<&'static str, Vec<String>>,
}

impl<T: Clone> DataFrame<T> {
    #[allow(dead_code)]
    pub fn reconstruct_from(template: &Self, data: &Self) -> Self {
        let mut out = data.clone();
        out.attrs
            .insert("names", data.attrs["names"].clone());
        out.attrs
            .insert("row.names", data.attrs["row.names"].clone());
        // copy remaining template attrs that aren’t names/row.names
        for (k, v) in &template.attrs {
            if *k != "names" && *k != "row.names" {
                out.attrs.insert(k, v.clone());
            }
        }
        out
    }
}
