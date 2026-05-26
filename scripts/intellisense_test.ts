// Probe types for verifying the intellisense script's expanded-type output.
//
// Run:
//   pnpm intellisense scripts/intellisense_test.ts WideObject DeepObject UnionType IntersectionType
//
// QuickInfo truncates at ~160 chars (prints `...` / `N more`); the script's
// `--- expanded ---` block uses TypeFormatFlags.NoTruncation via the checker.

type WideObject = {
  a1: string;
  a2: number;
  a3: boolean;
  a4: string[];
  a5: number[];
  a6: Record<string, unknown>;
  a7: { nested1: string; nested2: number; nested3: boolean };
  a8: Array<{ id: string; value: number }>;
  a9: Map<string, number>;
  a10: Set<string>;
  a11: Date;
  a12: { ok: true } | { ok: false; reason: string };
};

type DeepObject = {
  level1: {
    level2: {
      level3: {
        level4: {
          payload: { id: string; createdAt: Date; tags: string[] };
        };
      };
    };
  };
};

type UnionType =
  | { kind: "alpha"; alphaField: string; sharedCount: number }
  | { kind: "beta"; betaPayload: { x: number; y: number }; sharedCount: number }
  | { kind: "gamma"; gammaList: Array<{ id: string; weight: number }>; sharedCount: number };

type IntersectionType =
  & { name: string; id: string }
  & { createdAt: Date; updatedAt: Date }
  & { metadata: Record<string, unknown>; tags: string[] }
  & { permissions: { read: boolean; write: boolean; admin: boolean } };

// Wide enough that QuickInfo prints `... N more ...` but the checker-based
// expansion shows every field. This is the case that motivated the fix.
type ManyFields = {
  field01: string; field02: string; field03: string; field04: string;
  field05: string; field06: string; field07: string; field08: string;
  field09: string; field10: string; field11: string; field12: string;
  field13: string; field14: string; field15: string; field16: string;
  field17: string; field18: string; field19: string; field20: string;
  field21: string; field22: string; field23: string; field24: string;
  field25: string; field26: string; field27: string; field28: string;
  field29: string; field30: string;
};
