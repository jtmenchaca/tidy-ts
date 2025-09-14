// src/dataframe/ts/core/errors.ts
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
