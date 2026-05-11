// packages/dataframe/ts/core/errors.ts
// Library error classes

export class TidyError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "TidyError";
  }
}

export class DataFrameError extends TidyError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "DataFrameError";
  }
}

export class GroupedDataFrameError extends TidyError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "GroupedDataFrameError";
  }
}

export class VerbError extends TidyError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "VerbError";
  }
}

export class JoinError extends TidyError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "JoinError";
  }
}

/**
 * Issue a tidy-ts warning (like R's warning()).
 * Emits via console.warn so callers can intercept.
 */
export function tidyWarn(message: string): void {
  console.warn(`[tidy-ts] ${message}`);
}

/**
 * Throw a standardized "column not found" error.
 */
export function throwColumnNotFound(
  column: string,
  availableColumns: string[],
): never {
  throw new ReferenceError(
    `Column "${column}" not found. Available columns: [${availableColumns.join(", ")}]`,
  );
}

/**
 * Validate that all requested columns exist, throwing if any are missing.
 */
export function validateColumnsExist(
  requested: string[],
  availableColumns: string[],
): void {
  const missing = requested.filter((col) => !availableColumns.includes(col));
  if (missing.length === 1) {
    throwColumnNotFound(missing[0], availableColumns);
  }
  if (missing.length > 1) {
    throw new ReferenceError(
      `Columns [${missing.join(", ")}] not found. Available columns: [${availableColumns.join(", ")}]`,
    );
  }
}
