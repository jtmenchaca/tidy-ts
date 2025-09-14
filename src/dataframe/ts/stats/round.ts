/**
 * Round a number to a specified number of decimal places
 *
 * @param value - Number to round
 * @param digits - Number of decimal places (default: 0)
 * @returns Rounded number
 *
 * @example
 * ```ts
 * round(3.14159); // 3
 * round(3.14159, 2); // 3.14
 * round(123.456, 1); // 123.5
 * round(123.456, -1); // 120
 * ```
 */
export function round(value: number, digits?: number): number;

/**
 * Round all values in an array to a specified number of decimal places
 *
 * @param values - Array of numbers to round
 * @param digits - Number of decimal places (default: 0)
 * @returns Array of rounded numbers
 *
 * @example
 * ```ts
 * round([1.234, 2.567, 3.891]); // [1, 3, 4]
 * round([1.234, 2.567, 3.891], 2); // [1.23, 2.57, 3.89]
 * ```
 */
export function round(values: number[], digits?: number): number[];
export function round(values: Iterable<number>, digits?: number): number[];

export function round(
  value: number | number[] | Iterable<number>,
  digits: number = 0,
): number | number[] {
  // Handle null/undefined values
  if (value == null) {
    return null as unknown as number;
  }

  if (typeof value === "number") {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  } else {
    // Handle arrays and iterables
    const processArray = Array.isArray(value) ? value : Array.from(value);
    return processArray.map((num) => {
      const factor = Math.pow(10, digits);
      return Math.round(num * factor) / factor;
    });
  }
}
