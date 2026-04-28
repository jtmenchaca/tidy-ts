import * as z from "zod";
declare abstract class Class {
    constructor(..._: unknown[]);
}
/**
 * A Zod validator for a Temporal class which also parses string inputs.
 */
export type ZodTemporal<TClass extends typeof Class & {
    from: (arg: string) => InstanceType<TClass>;
}> = z.ZodType<InstanceType<TClass>, InstanceType<TClass> | string>;
/**
 * Creates Zod validators for a Temporal class.
 *
 * @param cls - The Temporal class to validate.
 * @param extraInputs - Additional Zod schemas to accept as coerce inputs
 *   (e.g. `z.date().transform(...)` for Instant).
 * @returns Two Zod validators for the Temporal class: `coerce` for coercing
 *   strings to the Temporal class, and `instance` for validating that the
 *   value is an instance of the Temporal class.
 */
export declare function temporalValidators<TClass extends typeof Class & {
    from: (arg: string) => InstanceType<TClass>;
}>(cls: TClass, extraInputs?: z.ZodType<InstanceType<TClass>>[]): {
    coerce: ZodTemporal<TClass>;
    instance: z.ZodType<InstanceType<TClass>>;
};
export {};
