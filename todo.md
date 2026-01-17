- Add ev1
- Add zipf
- [x] Add pareto
- Add dirac delta


[ ] We need to make sure that the sum documentation (and similar) show very clear examples of how type inference works with removeNull, removeUndefined, etc.  I don't know if our documentation in packages/mcp (and elsewhere) accurately reflects this.  We'll need to make be diligent here and see if the other stats functions need to be updated as well. 
[ ] We need to consider making a "peekXLSX" function that is in tidy-ts/dataframe that does what the tool in the packages/mcp for get-file-structure.ts was. Something that makes it easy for other AI to see the strucutre of the XLSX without needing the MCP installed.  I'd like to consider what it looks have an npx style command to do this too. 