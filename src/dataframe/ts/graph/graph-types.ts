import type { Model } from "./anywidget-minimal.ts";

// deno-lint-ignore no-explicit-any
export type TidyGraphWidget = Model<any> & {
  // Server-side, file-writes (work with or without Jupyter)
  saveSVG: ({
    filename,
    width,
    height,
    background,
  }: {
    filename: string;
    width?: number;
    height?: number;
    background?: string;
  }) => Promise<void>;
  savePNG: ({
    filename,
    width,
    height,
    background,
    scale,
  }: {
    filename: string;
    width?: number;
    height?: number;
    background?: string;
    scale?: number;
  }) => Promise<void>;
};
