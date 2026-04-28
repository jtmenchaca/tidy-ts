import { Overflow } from './options.ts';
export type Callable = (...args: any[]) => any;
export type Classlike = any;
export declare function clampProp<P>(props: P, propName: keyof FilterPropValues<P, number> & string, min: number, max: number, overflow?: Overflow): number;
export declare function clampEntity(entityName: string, num: number, min: number, max: number, overflow?: Overflow, choices?: string[]): number;
export declare function getDefinedProp(props: any, propName: string): any;
export declare function isObjectLike(arg: unknown): arg is {};
export declare function memoize<K, V, A extends any[]>(generator: (key: K, ...otherArgs: A) => V, MapClass?: {
    new (): any;
}): (key: K, ...otherArgs: A) => V;
export declare function createNameDescriptors(name: string): PropertyDescriptorMap;
export declare function createPropDescriptors(propVals: {
    [propName: string]: unknown;
}, readonly?: boolean): PropertyDescriptorMap;
export declare function createGetterDescriptors(getters: {
    [propName: string]: () => unknown;
}): PropertyDescriptorMap;
export declare function createStringTagDescriptors(value: string): {
    [Symbol.toStringTag]: {
        value: string;
        configurable: true;
    };
};
export type FilterPropValues<P, F> = {
    [K in keyof P as P[K] extends F ? K : never]: P[K];
};
export declare function zipProps<P>(propNamesRev: (keyof P)[], args: P[keyof P][]): P;
export declare function mapProps<P, R, E = undefined>(transformer: (propVal: P[keyof P], propName: keyof P, extraArg?: E) => R, props: P, extraArg?: E): {
    [K in keyof P]: R;
};
export declare function mapPropNames<P, R, E = undefined>(generator: (propName: keyof P, i: number, extraArg?: E) => R, propNames: (keyof P)[], extraArg?: E): {
    [K in keyof P]: R;
};
export declare const mapPropNamesToIndex: <P>(propNames: (keyof P)[]) => { [K in keyof P]: number; };
export declare const mapPropNamesToConstant: <P, C>(propNames: (keyof P)[], c: C) => { [K in keyof P]: C; };
export declare function remapProps<O, N>(oldNames: (keyof O)[], newNames: (keyof N)[], oldProps: O): N;
export declare function pluckProps<P>(propNames: (keyof P)[], props: P): P;
export declare function excludePropsByName<P, K extends keyof P>(propNames: Set<string>, props: P): Omit<P, K>;
export declare function excludeUndefinedProps<P extends {}>(props: P): Partial<P>;
export declare function hasAnyPropsByName<P extends {}>(props: P, names: (keyof P)[]): boolean;
export declare function hasAllPropsByName<P extends {}>(props: P, names: (keyof P)[]): boolean;
export declare function allPropsEqual(propNames: string[], props0: any, props1: any): boolean;
export declare function zeroOutProps(propNames: string[], clearUntilI: number, props: Record<string, number>): Record<string, number>;
export declare function bindArgs<BA extends any[], DA extends any[], R>(f: (...args: [...BA, ...DA]) => R, ...boundArgs: BA): (...dynamicArgs: DA) => R;
export declare function identity<T>(arg: T): T;
export declare function noop(): void;
export declare function capitalize(s: string): string;
export declare function sortStrings<T extends string>(strs: T[]): T[];
export declare function padNumber(digits: number, num: number): string;
export declare const padNumber2: (num: number) => string;
export type NumberSign = -1 | 0 | 1;
export declare function compareNumbers(a: number, b: number): NumberSign;
export declare function clampNumber(num: number, min: number, max: number): number;
export declare function divModFloor(num: number, divisor: number): [number, number];
export declare function modFloor(num: number, divisor: number): number;
export declare function divModTrunc(num: number, divisor: number): [number, number];
export declare function divTrunc(num: number, divisor: number): number;
export declare function modTrunc(num: number, divisor: number): number;
export declare function roundExpand(num: number): number;
export declare function roundHalfExpand(num: number): number;
export declare function roundHalfFloor(num: number): number;
export declare function roundHalfCeil(num: number): number;
export declare function roundHalfTrunc(num: number): number;
export declare function roundHalfEven(num: number): number;
