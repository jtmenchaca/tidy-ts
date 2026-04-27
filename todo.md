- Add ev1
- Add zipf
- [x] Add pareto
- Add dirac delta


[ ] We need to make sure that the sum documentation (and similar) show very clear examples of how type inference works with removeNull, removeUndefined, etc.  I don't know if our documentation in packages/mcp (and elsewhere) accurately reflects this.  We'll need to make be diligent here and see if the other stats functions need to be updated as well. 
[ ] We need to consider making a "peekXLSX" function that is in tidy-ts/dataframe that does what the tool in the packages/mcp for get-file-structure.ts was. Something that makes it easy for other AI to see the strucutre of the XLSX without needing the MCP installed.  I'd like to consider what it looks have an npx style command to do this too. 




Steps to napi-rs native
Publish this wrapper now — claims @tidy-ts/dataframe on npm. Users can start using it immediately with WASM.

Add napi-rs to the Rust codebase — add napi/napi-derive as dependencies alongside wasm-bindgen. Use #[cfg] feature flags so the same Rust code compiles to both WASM (existing) and native (new).

Start with a subset — annotate the hot-path functions with #[napi] (GLM fitting, bootstrap, aggregates). Don't need to port all 158 functions at once.

Set up cross-compilation CI — GitHub Actions builds .node binaries for darwin-arm64, darwin-x64, linux-x64-gnu, linux-arm64-gnu, win32-x64-msvc. napi-rs has a template for this.

Publish platform packages — @tidy-ts/dataframe-darwin-arm64, etc. on npm.

Replace the wrapper with the real package — @tidy-ts/dataframe on npm becomes the napi-rs package. It lists the platform binaries as optionalDependencies, bundles the WASM as fallback, includes the compiled TS API. The loader tries native first, falls back to WASM.

JSR continues unchanged — Deno users can still import from "jsr:@tidy-ts/dataframe" and get the WASM version. Or they can import from "npm:@tidy-ts/dataframe" and get native speed with --allow-ffi.

The npm package name stays @tidy-ts/dataframe throughout. The internals evolve from "thin JSR re-export" to "native addon with WASM fallback" without users changing their import.