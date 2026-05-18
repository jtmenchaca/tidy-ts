export type Prettify<Type> = {
    [Key in keyof Type]: Type[Key];
} & {};
export type PrettifyDeep<T> = T extends object ? {
    [K in keyof T]: PrettifyDeep<T[K]>;
} & {} : T;
export type DataKeys<Row> = Exclude<Extract<keyof Row, string>, "__tidy_row_label__" | "__tidy_row_types__">;
export type DataOnly<Row> = {
    [K in DataKeys<Row>]: Row[K];
};
export type ColumnsFromUnion<Labels extends string, T> = {
    [K in Labels]: T;
};
export type UnionToIntersection<Union> = (Union extends unknown ? (k: Union) => void : never) extends (k: infer Intersection) => void ? Intersection : never;
export type KeyUnion<Type> = Type extends Type ? keyof Type : never;
export type DeepMutable<T> = T extends Function ? T : T extends ReadonlyArray<infer U> ? DeepMutable<U>[] : T extends object ? {
    -readonly [K in keyof T]: DeepMutable<T[K]>;
} : T;
/** Widen primitive types to their most general form */
export type WidenPrimitive<Type> = Type extends string ? string : Type extends number ? number : Type extends boolean ? boolean : Type extends bigint ? bigint : Type extends symbol ? symbol : Type;
/** Widen all properties of an object type */
export type WidenProps<Type> = {
    [Key in keyof Type]: WidenPrimitive<Type[Key]>;
};
/** Keys of any member of a union */
type KeyUnionInternal<Type> = Type extends Type ? keyof Type : never;
/** Value union where missing keys produce undefined */
type ValueUnionOrU<Type, Key extends PropertyKey> = Type extends Record<Key, infer Value> ? Value : undefined;
type DropUndefined<Type> = Exclude<Type, undefined>;
/** Keys that EVERY member has (as key) */
type KeysAll<Type> = {
    [Key in KeyUnionInternal<Type>]: [Type] extends [
        {
            [Property in Key]-?: unknown;
        }
    ] ? Key : never;
}[KeyUnionInternal<Type>];
/** Required keys among those present in every member */
type RequiredKeysFromUnion<Type> = {
    [Key in KeysAll<Type>]: undefined extends ValueUnionOrU<Type, Key> ? never : Key;
}[KeysAll<Type>];
/** Optional keys = everything else that's not required */
type OptionalKeysFromUnion<Type> = Exclude<KeyUnionInternal<Type>, RequiredKeysFromUnion<Type>>;
/** Depth arithmetic (cap recursion) */
type Prev = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
type Dec<Depth extends number> = Prev[Depth] extends number ? Prev[Depth] : 0;
/** Depth-limited deep merge */
export type DeepMergeNestedProps<T, D extends number = 2> = [D] extends [0] ? T : [T] extends [Date] ? T : [T] extends [(...args: any) => any] ? T : [T] extends [ReadonlyArray<infer U>] ? DeepMergeNestedProps<U, Dec<D>>[] : [T] extends [object] ? ([
    OptionalKeysFromUnion<T>
] extends [never] ? {
    [K in RequiredKeysFromUnion<T>]: DeepMergeNestedProps<DropUndefined<ValueUnionOrU<T, K>>, Dec<D>>;
} : [RequiredKeysFromUnion<T>] extends [never] ? {
    [K in OptionalKeysFromUnion<T>]?: DeepMergeNestedProps<DropUndefined<ValueUnionOrU<T, K>>, Dec<D>>;
} : {
    [K in Extract<RequiredKeysFromUnion<T> | OptionalKeysFromUnion<T>, PropertyKey>]: K extends RequiredKeysFromUnion<T> ? DeepMergeNestedProps<DropUndefined<ValueUnionOrU<T, K>>, Dec<D>> : DeepMergeNestedProps<DropUndefined<ValueUnionOrU<T, K>>, Dec<D>> | undefined;
}) : T;
export {};
