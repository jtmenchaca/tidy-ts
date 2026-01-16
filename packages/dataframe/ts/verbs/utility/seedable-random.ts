/**
 * Seedable pseudo-random number generator using a Linear Congruential Generator (LCG)
 * Based on the same algorithm used by many systems for consistent, reproducible randomness.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    // Ensure seed is a positive integer
    this.seed = Math.abs(Math.floor(seed)) % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  /**
   * Generate next random number between 0 and 1 (exclusive of 1)
   */
  next(): number {
    // Linear congruential generator: (a * seed + c) mod m
    // Using parameters from Numerical Recipes: a=16807, c=0, m=2^31-1
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  /**
   * Generate random integer between 0 (inclusive) and max (exclusive)
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Create a random number generator. If seed is provided, uses seeded generator.
 * If no seed, uses Math.random() for better entropy.
 */
export function createRandom(seed?: number): () => number {
  if (seed !== undefined) {
    const seededRandom = new SeededRandom(seed);
    return () => seededRandom.next();
  }
  return () => Math.random();
}

/**
 * Create a random integer generator. If seed is provided, uses seeded generator.
 * If no seed, uses Math.random() for better entropy.
 */
export function createRandomInt(seed?: number): (max: number) => number {
  if (seed !== undefined) {
    const seededRandom = new SeededRandom(seed);
    return (max: number) => seededRandom.nextInt(max);
  }
  return (max: number) => Math.floor(Math.random() * max);
}

/**
 * Fisher-Yates shuffle with optional seeding
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  const randomInt = createRandomInt(seed);

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Sample n elements from array with optional seeding
 */
export function sampleArray<T>(array: T[], n: number, seed?: number): T[] {
  if (n >= array.length) return [...array];

  const shuffled = shuffleArray(array, seed);
  return shuffled.slice(0, n);
}
