// // deno-lint-ignore-file no-explicit-any
// import type { DataFrame } from "../dataframe/index.ts";
// import type { GraphOptions } from "./graph.ts";
// import { graph } from "./graph.ts";

// /**
//  * Export a graph as PNG image data URL or save to file
//  * This function creates the graph and exports it as a PNG
//  */
// export async function graphToPng<T extends Record<string, unknown>>(
//   df: DataFrame<T>,
//   spec: GraphOptions<T>,
//   options?: {
//     scale?: number; // Scale factor for higher resolution (default: 2)
//     background?: string; // Background color (default: "white")
//   }
// ): Promise<string> {
//   // For server-side rendering, we'll need to use vega-cli or canvas
//   // For now, let's create a function that generates the Vega-Lite spec
//   // that can be used with vega-cli to generate PNGs

//   const graphFunc = graph(spec);
//   const widget = graphFunc(df);

//   // Get the spec and data from the widget
//   const widgetState = (widget as any)._state;
//   const vlSpec = JSON.parse(widgetState.spec);
//   const data = JSON.parse(widgetState.data);

//   // Add data back to spec for standalone rendering
//   vlSpec.data = { values: data };

//   // Set default options
//   vlSpec.background = options?.background || "white";

//   return JSON.stringify(vlSpec, null, 2);
// }

// /**
//  * Save graph as PNG file using vega-cli
//  * Requires vega-cli to be installed: npm install -g vega-cli
//  */
// export async function saveGraphAsPng<T extends Record<string, unknown>>(
//   df: DataFrame<T>,
//   spec: GraphOptions<T>,
//   outputPath: string,
//   options?: {
//     scale?: number;
//     background?: string;
//   }
// ): Promise<void> {
//   const vlSpec = await graphToPng(df, spec, options);

//   // Write spec to temp file
//   const tempSpecFile = `/tmp/vega-spec-${Date.now()}.json`;
//   await Deno.writeTextFile(tempSpecFile, vlSpec);

//   // Use vega-cli to convert to PNG
//   const scale = options?.scale || 2;
//   const command = new Deno.Command("vl2png", {
//     args: [tempSpecFile, outputPath, "-s", scale.toString()],
//   });

//   const { success, stderr } = await command.output();

//   // Clean up temp file
//   await Deno.remove(tempSpecFile);

//   if (!success) {
//     const errorText = new TextDecoder().decode(stderr);
//     throw new Error(`Failed to save graph as PNG: ${errorText}`);
//   }
// }

// /**
//  * Alternative: Export using a headless browser (puppeteer/playwright)
//  * This is more reliable but requires additional dependencies
//  */
// export async function saveGraphAsPngBrowser<T extends Record<string, unknown>>(
//   df: DataFrame<T>,
//   spec: GraphOptions<T>,
//   outputPath: string,
//   options?: {
//     width?: number;
//     height?: number;
//     scale?: number;
//   }
// ): Promise<void> {
//   const vlSpec = await graphToPng(df, spec, options);

//   // Create HTML with embedded Vega-Lite
//   const html = `
// <!DOCTYPE html>
// <html>
// <head>
//   <script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
//   <script src="https://cdn.jsdelivr.net/npm/vega-lite@5"></script>
//   <script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
//   <style>
//     body { margin: 0; padding: 20px; background: white; }
//     #vis { width: 100%; }
//   </style>
// </head>
// <body>
//   <div id="vis"></div>
//   <script type="text/javascript">
//     const spec = ${vlSpec};
//     vegaEmbed('#vis', spec, { actions: false }).then(result => {
//       // Signal to puppeteer that rendering is complete
//       window.VEGA_READY = true;
//     });
//   </script>
// </body>
// </html>`;

//   // Write HTML to temp file
//   const tempHtmlFile = `/tmp/vega-html-${Date.now()}.html`;
//   await Deno.writeTextFile(tempHtmlFile, html);

//   console.log(`HTML file created at: ${tempHtmlFile}`);
//   console.log(`To convert to PNG, use:`);
//   console.log(`  1. Install vega-cli: npm install -g vega-cli`);
//   console.log(`  2. Run: vl2png ${tempHtmlFile} ${outputPath}`);
//   console.log(`  OR`);
//   console.log(`  Use puppeteer/playwright to capture screenshot`);
// }
