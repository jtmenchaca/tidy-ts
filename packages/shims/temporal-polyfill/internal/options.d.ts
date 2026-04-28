export declare const enum Overflow {
    Constrain = 0,
    Reject = 1
}
export declare const enum EpochDisambig {
    Compat = 0,
    Reject = 1,
    Earlier = 2,
    Later = 3
}
export declare const enum OffsetDisambig {
    Reject = 0,
    Use = 1,
    Prefer = 2,
    Ignore = 3
}
export declare const enum CalendarDisplay {
    Auto = 0,
    Never = 1,
    Critical = 2,
    Always = 3
}
export declare const enum TimeZoneDisplay {
    Auto = 0,
    Never = 1,
    Critical = 2
}
export declare const enum OffsetDisplay {
    Auto = 0,
    Never = 1
}
export declare const enum RoundingMode {
    Floor = 0,
    HalfFloor = 1,
    Ceil = 2,
    HalfCeil = 3,
    Trunc = 4,
    HalfTrunc = 5,
    Expand = 6,
    HalfExpand = 7,
    HalfEven = 8
}
export declare const roundingModeFuncs: ((x: number) => number)[];
export type SubsecDigits = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export declare const enum Direction {
    Previous = -1,// compatible with internal getTransition
    Next = 1
}
