// Shared types for I/O operations

export type NAOpts = {
  naValues?: readonly string[];
  trim?: boolean;
  /** When true, returns DataFrame<any> instead of typed DataFrame */
  no_types?: boolean;
};
