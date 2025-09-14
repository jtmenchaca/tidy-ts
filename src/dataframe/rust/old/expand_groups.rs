//! Rust 2024 replacement for dplyr’s `expand_groups()` implementation.

#![deny(unsafe_op_in_unsafe_fn)]

// ---------------------------------------------------------------------------
// Public API – safe Rust version
// ---------------------------------------------------------------------------

/// Kind of grouping variable.
#[derive(Clone, Copy)]
pub enum VarKind {
    Vector,                     // ordinary
    Factor { n_levels: usize }, // 1-based levels, 0 == NA
}

/// A single grouping variable (`positions` length == n_rows).
pub struct Var<'a> {
    pub kind: VarKind,
    pub positions: &'a [usize],
}

/// Port of `dplyr_expand_groups()` – returns `(new_indices, new_rows)`.
pub fn expand_groups(
    vars: &[Var<'_>],
    old_rows: &[&[usize]], // borrow, no clone
    n_rows: usize,
) -> (Vec<Vec<usize>>, Vec<Vec<usize>>) {
    // 1. Build expander tree
    let root = build(vars, 0, 0, n_rows, Vec::new());

    // 2. Allocate output skeletons
    let new_size = root.size();
    let mut new_idx = vec![vec![0usize; new_size]; vars.len()];
    let mut new_rows: Vec<Vec<usize>> = vec![Vec::new(); new_size];

    // 3. Collect
    let mut col = Collector {
        vars,
        out_idx: &mut new_idx,
        out_rows: &mut new_rows,
        old_rows,
        leaf: 0,
    };
    root.collect(&mut col, 0);

    (new_idx, new_rows)
}

// ---------------------------------------------------------------------------
// Internal machinery
// ---------------------------------------------------------------------------

trait Expander {
    fn size(&self) -> usize;
    fn collect(&self, col: &mut Collector<'_>, depth: usize);
}

/// Holds mutable references to the pre-allocated output.
struct Collector<'a> {
    #[allow(dead_code)]
    vars: &'a [Var<'a>],
    out_idx: &'a mut [Vec<usize>],
    out_rows: &'a mut [Vec<usize>],
    old_rows: &'a [&'a [usize]],
    leaf: usize,
}

impl<'a> Collector<'a> {
    fn push(&mut self, codes: &[usize], start: usize, end: usize) {
        let g = self.leaf;
        self.leaf += 1;

        // indices
        for (v, &c) in codes.iter().enumerate() {
            self.out_idx[v][g] = c;
        }

        // rows
        self.out_rows[g] = if start == end {
            Vec::new()
        } else {
            self.old_rows[start].to_vec()
        };
    }
}

// Leaf ----------------------------------------------------------------------

struct Leaf {
    codes: Vec<usize>,
    start: usize,
    end: usize,
}
impl Expander for Leaf {
    fn size(&self) -> usize {
        1
    }
    fn collect(&self, col: &mut Collector<'_>, _d: usize) {
        col.push(&self.codes, self.start, self.end);
    }
}

// Branches ------------------------------------------------------------------

struct Branch {
    children: Vec<Box<dyn Expander>>,
}
impl Expander for Branch {
    fn size(&self) -> usize {
        self.children.iter().map(|c| c.size()).sum()
    }
    fn collect(&self, col: &mut Collector<'_>, d: usize) {
        for c in &self.children {
            c.collect(col, d + 1);
        }
    }
}

// Factory -------------------------------------------------------------------

fn build(
    vars: &[Var<'_>],
    depth: usize,
    start: usize,
    end: usize,
    codes: Vec<usize>,
) -> Box<dyn Expander> {
    if depth == vars.len() {
        return Box::new(Leaf { codes, start, end });
    }

    let Var { kind, positions } = vars[depth];
    match kind {
        VarKind::Factor { n_levels } => {
            let mut children = Vec::<Box<dyn Expander>>::with_capacity(n_levels + 1);
            // explicit levels 1..=n_levels
            for lvl in 1..=n_levels {
                let (s, e) = slice_run(positions, start, end, lvl);
                let mut c = codes.clone();
                c.push(lvl);
                children.push(build(vars, depth + 1, s, e, c));
            }
            // NA branch (code 0)
            let (s_na, e_na) = slice_run(positions, start, end, 0);
            let mut c_na = codes;
            c_na.push(0);
            children.push(build(vars, depth + 1, s_na, e_na, c_na));

            Box::new(Branch { children })
        }
        VarKind::Vector => {
            let mut children = Vec::<Box<dyn Expander>>::new();
            if start == end {
                // empty range – single NA branch
                let mut c = codes;
                c.push(0);
                children.push(build(vars, depth + 1, start, end, c));
            } else {
                let mut i = start;
                while i < end {
                    let code = positions[i];
                    let j = advance(positions, i, end, code);
                    let mut c = codes.clone();
                    c.push(code);
                    children.push(build(vars, depth + 1, i, j, c));
                    i = j;
                }
            }
            Box::new(Branch { children })
        }
    }
}

// helpers
#[inline]
fn slice_run(pos: &[usize], mut i: usize, end: usize, code: usize) -> (usize, usize) {
    while i < end && pos[i] != code {
        i += 1;
    }
    let mut j = i;
    while j < end && pos[j] == code {
        j += 1;
    }
    (i, j)
}
#[inline]
fn advance(pos: &[usize], mut i: usize, end: usize, code: usize) -> usize {
    while i < end && pos[i] == code {
        i += 1;
    }
    i
}

// ---------------------------------------------------------------------------
//                       Minimal C-ABI shim (Deno / C / R)
// ---------------------------------------------------------------------------

#[unsafe(no_mangle)]
pub unsafe extern "C" fn dplyr_rs_expand_groups(
    n_vars: usize,
    n_rows: usize,
    kinds: *const u8,
    positions: *const usize,            // flat buffer: n_vars × n_rows
    old_rows_ptrs: *const *const usize, // each pointer => row vector (1-based)
    old_rows_n: *const usize,           // lengths of each old row-vector
    old_groups: usize,
) -> *mut usize {
    // reconstruct slices ----------------------------------------------------
    let kind_slice = unsafe { std::slice::from_raw_parts(kinds, n_vars) };
    let pos_slice = unsafe { std::slice::from_raw_parts(positions, n_vars * n_rows) };

    let mut vars: Vec<Var<'_>> = Vec::with_capacity(n_vars);
    for v in 0..n_vars {
        let p = &pos_slice[v * n_rows..(v + 1) * n_rows];
        let kind = match kind_slice[v] {
            0 => VarKind::Vector,
            k => VarKind::Factor {
                n_levels: k as usize,
            },
        };
        vars.push(Var { kind, positions: p });
    }

    // old rows – borrow existing buffers
    let ptrs = unsafe { std::slice::from_raw_parts(old_rows_ptrs, old_groups) };
    let lens = unsafe { std::slice::from_raw_parts(old_rows_n, old_groups) };
    let mut old_rows: Vec<&[usize]> = Vec::with_capacity(old_groups);
    for g in 0..old_groups {
        old_rows.push(unsafe { std::slice::from_raw_parts(ptrs[g], lens[g]) });
    }

    // run algorithm ---------------------------------------------------------
    let (indices, rows) = expand_groups(&vars, &old_rows, n_rows);

    // pack result:  [groups][vars][groups] => malloc-ed buffer
    let groups = rows.len();
    // header: groups, vars, rows_flat_len
    let rows_flat_len: usize = rows.iter().map(|r| r.len()).sum();
    let header = [groups, n_vars, rows_flat_len];

    // layout: [header(3)] [idx flat] [rows flat] [row_lengths]
    let idx_flat_len = groups * n_vars;
    let len_total = 3 + idx_flat_len + rows_flat_len + groups;
    let mut buf = Vec::<usize>::with_capacity(len_total);
    buf.extend(&header);

    // indices
    for v in 0..n_vars {
        buf.extend(&indices[v]);
    }

    // rows
    for r in &rows {
        buf.extend(r);
    }

    // per-group row length
    for r in &rows {
        buf.push(r.len());
    }

    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}
