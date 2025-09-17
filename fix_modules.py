#!/usr/bin/env python3
"""
Script to fix module declaration conflicts in the regression module.
This script converts module declarations to imports for files that are already
declared in the parent mod.rs file.
"""

import os
import re
import glob

def fix_module_declarations(file_path):
    """Fix module declarations in a single file."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern to match module declarations
    module_pattern = r'^pub mod (\w+);\s*$'
    
    # Find all module declarations
    modules = re.findall(module_pattern, content, re.MULTILINE)
    
    if not modules:
        return False  # No changes needed
    
    # Remove module declarations
    content = re.sub(module_pattern, '', content, flags=re.MULTILINE)
    
    # Convert pub use statements to use super:: statements
    for module in modules:
        # Pattern to match pub use statements for this module
        use_pattern = rf'^pub use {module}::(.*?);\s*$'
        
        def replace_use(match):
            use_content = match.group(1)
            return f'pub use super::{module}::{use_content};'
        
        content = re.sub(use_pattern, replace_use, content, flags=re.MULTILINE)
    
    # Clean up extra blank lines
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    
    return False

def main():
    """Fix all module declaration conflicts."""
    # Get all Rust files in the glm directory
    glm_dir = "src/dataframe/rust/stats/regression/glm"
    rust_files = glob.glob(f"{glm_dir}/*.rs")
    
    # Files to skip (already fixed or special cases)
    skip_files = {
        "mod.rs",  # This is the parent module file
        "glm.rs",  # Already fixed
        "glm_utils.rs",  # Already fixed
        "glm_profile.rs",  # Already fixed
        "types.rs",  # Already fixed
        "glm_summary.rs",  # Already fixed
        "glm_print.rs",  # Already fixed
        "glm_main.rs",  # Already fixed
        "glm_anova.rs",  # Already fixed
        "glm_anova_core.rs",  # Already fixed
        "glm_fit.rs",  # Already fixed
        "glm_fit_core.rs",  # Already fixed
    }
    
    fixed_count = 0
    
    for file_path in rust_files:
        filename = os.path.basename(file_path)
        if filename in skip_files:
            continue
            
        print(f"Processing {filename}...")
        if fix_module_declarations(file_path):
            print(f"  Fixed {filename}")
            fixed_count += 1
        else:
            print(f"  No changes needed for {filename}")
    
    print(f"\nFixed {fixed_count} files")

if __name__ == "__main__":
    main()
