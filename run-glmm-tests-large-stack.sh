#!/bin/bash
# Run GLMM Poisson tests with larger stack size
export RUST_MIN_STACK=16777216
cargo test test_glmm_poisson
