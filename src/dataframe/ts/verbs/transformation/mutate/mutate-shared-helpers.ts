/* =================================================================================
   Shared helper functions and utilities for mutate operations
   ================================================================================= */

/**
 * RowView class for efficient row access during mutations
 */
export class RowView {
  private _i = 0;
  constructor(
    private cols: Record<string, unknown[]>,
    private names: string[],
  ) {
    // Create getters for each column
    for (const name of names) {
      Object.defineProperty(this, name, {
        get: () => this.cols[name][this._i],
        enumerable: true,
        configurable: true,
      });
    }
  }
  setCursor(i: number) {
    this._i = i;
  }
}
