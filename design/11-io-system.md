# I/O System

## Design Goals and Implementation

| Design Goal | Implementation |
|------------|----------------|
| **Read common file formats** | Support CSV, JSON, Parquet, Arrow, and XLSX. Each format has dedicated reader. |
| **Infer types automatically** | CSV reader infers types from data (string, number, boolean, Date). JSON uses native types. Parquet/Arrow preserves schema. |
| **Handle large files** | CSV parser supports streaming - processes chunks incrementally. Can handle files larger than RAM. |
| **Write files easily** | `toJSON()` and `write_xlsx()` methods. Preserves DataFrame structure and types. |
| **Support Excel files** | Read/write XLSX with multi-sheet support. Can read specific sheets or all sheets. |

## Format Support

| Format | Features | Type Inference |
|--------|----------|----------------|
| **CSV** | Streaming parser, handles quotes/escapes | Infers from data (string, number, boolean, Date) |
| **JSON** | Array of objects or JSONLines | Uses JSON types directly |
| **Parquet** | Columnar format via Apache Arrow | Preserves schema from file |
| **Arrow** | Direct Arrow format | Preserves schema from file |
| **XLSX** | Excel files, multi-sheet | Infers from data, preserves types |

## Streaming

| Goal | Implementation |
|------|----------------|
| **Handle files larger than RAM** | CSV parser processes chunks incrementally. Memory usage stays constant regardless of file size. |
| **Return DataFrame when complete** | Streaming parser accumulates data and returns complete DataFrame when done. |

## Write Operations

| Goal | Implementation |
|------|----------------|
| **Preserve structure** | `toJSON()` and `write_xlsx()` maintain DataFrame structure. Column order and types preserved. |
| **Formatting options** | JSON supports pretty-printing. XLSX supports multi-sheet output. |
