# Attribution

## Data I/O Dependencies

This data I/O functionality is built on top of excellent open-source libraries:

### CSV and XLSX Support
- CSV parsing and writing uses Deno's standard library `@std/csv`
- XLSX support uses native implementations

### Parquet and Arrow Support
Parquet and Arrow I/O have been moved to separate packages:
- **@tidy-ts/parquet** - Uses hyparquet and hyparquet-compressors for Parquet file support
- **@tidy-ts/arrow** - Uses flechette for Apache Arrow IPC file support

For attribution details on Parquet and Arrow dependencies, see:
- `packages/parquet/` for Parquet library attributions
- `packages/arrow/` for Arrow library attributions

Special thanks to the developers and contributors who have made these essential data processing tools possible.
