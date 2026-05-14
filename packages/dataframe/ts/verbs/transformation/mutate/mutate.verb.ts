/* =================================================================================
   Modularized mutate.verb.ts - Main entry point

   This file now serves as the main entry point that imports and re-exports
   functionality from the modularized components:
   - mutate.overloads.ts: Function signature overloads and implementation
   - mutate-group.ts: Group-level mutate functionality
   - mutate-helpers.ts: Utility functions and RowView class
   ================================================================================= */

// Re-export main mutate function (overloads + implementation)
export { mutate, mutateAsync } from "./mutate.overloads.ts";

// Re-export group-level functionality

// Re-export types
export type {
  ColumnValue,
  MutateAssignments,
  MutateAsyncMethod,
  MutateMethod,
} from "./mutate.types.ts";
