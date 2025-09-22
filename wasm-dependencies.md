# WASM Dependencies

## WASM Functions
```
wasm.rs
├── glm_fit_wasm() - main WASM export
├── update_formula_with_dummy_names() - local helper
├── generate_interaction_combinations() - local helper  
├── parse_data_json() - local helper
├── parse_options_json() - local helper
├── create_family() - local helper
├── format_glm_result() - local helper
├── format_error() - local helper
└── format_json_number() - local helper
```

## Function Call Chain

### glm_fit_wasm() calls:
```
glm_fit_wasm()
├── parse_formula() - from shared formula parser
├── create_family() - local function
├── glm_control() - from glm_control module
├── glm() - from glm_main_core module
└── format_glm_result() - local function
```

### glm() calls:
```
glm()
├── glm_control() - from glm_control module
├── parse_formula_shared() - from shared formula parser
├── build_design_matrix() - from shared formula parser
└── glm_fit() - from glm_fit_core module
```

### glm_fit() calls:
```
glm_fit()
├── validate_control() - from glm_fit_core_validation
├── validate_weights() - from glm_fit_core_validation
├── validate_offset() - from glm_fit_core_validation
├── initialize_starting_values() - from glm_fit_core_initialization
├── validate_family_start_values() - from glm_fit_core_validation
├── calculate_initial_deviance() - from glm_fit_core_initialization
├── run_irls_iteration() - from glm_fit_irls_core
├── calculate_residuals() - from glm_fit_core_calculation
├── calculate_working_weights() - from glm_fit_core_calculation
├── calculate_null_deviance() - from glm_fit_core_calculation
├── calculate_degrees_of_freedom() - from glm_fit_core_calculation
├── calculate_aic() - from glm_aic
└── create_final_working_weights() - from glm_fit_core_calculation
```

### run_irls_iteration() calls:
```
run_irls_iteration()
└── cdqrls() - from qr_decomposition
```

## Files Actually Used by WASM

**Required files (16):**
1. wasm.rs
2. glm_main_core.rs
3. glm_control.rs
4. glm_fit_core.rs
5. glm_fit_irls_core.rs
6. glm_aic.rs
7. qr_decomposition.rs
8. glm_fit_core_calculation.rs
9. glm_fit_core_initialization.rs
10. glm_fit_core_validation.rs
11. glm_fit_core_warnings.rs
12. types.rs
13. types_control.rs
14. types_results.rs
15. types_anova.rs
16. types_profile.rs

**NOT used by WASM (7 files):**
- glm_fit_utils_linear.rs
- glm_fit_utils_qr.rs
- glm_fit_utils_weights.rs
- glm_utils_extractors.rs
- glm_utils_weights.rs
- glm_main_convenience.rs
- model_impl.rs