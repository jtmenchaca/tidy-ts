/**
 * Create a random integer generator. If seed is provided, uses seeded generator.
 * If no seed, uses Math.random() for better entropy.
 */
export declare function createRandomInt(seed?: number): (max: number) => number;
/**
 * Fisher-Yates shuffle with optional seeding
 */
export declare function shuffleArray<T>(array: T[], seed?: number): T[];
/**
 * Sample n elements from array with optional seeding
 */
export declare function sampleArray<T>(array: T[], n: number, seed?: number): T[];
