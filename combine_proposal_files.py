#!/usr/bin/env python3
"""
Script to combine all markdown files from numbered subfolders in z-proposal,
excluding files in the 'examples' subfolders.
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

def get_numbered_folders(base_path: str) -> List[Tuple[str, str]]:
    """
    Get all folders that start with digits followed by a dash.
    Returns list of tuples: (folder_name, folder_path)
    """
    folders = []
    base = Path(base_path)
    
    if not base.exists():
        print(f"Error: Base path {base_path} does not exist")
        return folders
    
    for item in base.iterdir():
        if item.is_dir() and re.match(r'^\d+-', item.name):
            folders.append((item.name, str(item)))
    
    # Sort by the numeric prefix
    folders.sort(key=lambda x: int(x[0].split('-')[0]))
    return folders

def get_markdown_files(folder_path: str) -> List[str]:
    """
    Get all markdown files in a folder, excluding those in 'examples' subfolder.
    Returns list of file paths.
    """
    md_files = []
    folder = Path(folder_path)
    
    if not folder.exists():
        return md_files
    
    for item in folder.iterdir():
        if item.is_file() and item.suffix.lower() == '.md':
            # Skip files in examples subfolder
            if 'examples' not in str(item):
                md_files.append(str(item))
    
    # Sort files alphabetically
    md_files.sort()
    return md_files

def read_file_content(file_path: str) -> str:
    """Read file content and return as string."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return f"<!-- Error reading {file_path}: {e} -->\n"

def combine_files(base_path: str, output_file: str = None) -> str:
    """
    Combine all markdown files from numbered subfolders.
    Returns the combined content as a string.
    """
    if output_file is None:
        output_file = os.path.join(base_path, "combined_proposal.md")
    
    numbered_folders = get_numbered_folders(base_path)
    
    if not numbered_folders:
        print("No numbered folders found")
        return ""
    
    combined_content = []
    
    for folder_name, folder_path in numbered_folders:
        print(f"Processing folder: {folder_name}")
        
        md_files = get_markdown_files(folder_path)
        
        if not md_files:
            continue
        
        for md_file in md_files:
            file_name = Path(md_file).name
            print(f"  Adding file: {file_name}")
            
            # Add file content directly without filename headers
            content = read_file_content(md_file)
            combined_content.append(content)
            
            # Add a single newline between files for separation
            combined_content.append("\n")
    
    # Write to output file
    final_content = "".join(combined_content)
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(final_content)
        print(f"\nCombined content written to: {output_file}")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")
    
    return final_content

def main():
    """Main function to run the script."""
    base_path = "/Users/jtmenchaca/tidy-ts/z-proposal"
    
    print("Combining markdown files from numbered folders...")
    print(f"Base path: {base_path}")
    
    combined_content = combine_files(base_path)
    
    if combined_content:
        print(f"\nSuccessfully combined {len(combined_content)} characters")
        print("Files processed:")
        
        numbered_folders = get_numbered_folders(base_path)
        for folder_name, folder_path in numbered_folders:
            md_files = get_markdown_files(folder_path)
            print(f"  {folder_name}: {len(md_files)} files")
    else:
        print("No content was combined")

if __name__ == "__main__":
    main()
