"""
Dig deeper into specific patterns found in first analysis.

Usage:
    python3 packages/testing/type-profiling/analyze-deep2.py
"""

import json
from collections import defaultdict

TRACE = "packages/testing/type-profiling/trace-output/trace.json"
TYPES = "packages/testing/type-profiling/trace-output/types.json"
ROOT = "/Users/jtmenchaca/tidy-ts/"


def short(path):
    return path.replace(ROOT, "").replace(ROOT.replace("/Users/", "/users/"), "")


print("Loading data ...")
with open(TRACE) as f:
    events = json.load(f)
with open(TYPES) as f:
    types_list = json.load(f)

type_names = {}
type_display = {}
type_firstpos = {}  # first file position where a type appears
for t in types_list:
    tid = t["id"]
    type_names[tid] = t.get("symbolName") or t.get("intrinsicName") or ""
    type_display[tid] = (t.get("display") or "")[:200]
    if "firstDeclaration" in t:
        fd = t["firstDeclaration"]
        type_firstpos[tid] = f"{short(fd.get('path',''))}:{fd.get('start',{}).get('line','?')}"


def tname(tid):
    return type_names.get(tid, str(tid)) or str(tid)


# Build file check ranges for attribution
check_ranges = []
cstack = []
for e in events:
    if e.get("cat") == "check" and e.get("name") == "checkSourceFile":
        path = e.get("args", {}).get("path", "")
        if e["ph"] == "B":
            cstack.append((path, e["ts"]))
        elif e["ph"] == "E" and cstack:
            p, t = cstack.pop()
            check_ranges.append((t, e["ts"], p))
check_ranges.sort()

import bisect
starts = [r[0] for r in check_ranges]

def file_at(ts):
    idx = bisect.bisect_right(starts, ts) - 1
    if 0 <= idx < len(check_ranges):
        s, end, path = check_ranges[idx]
        if s <= ts <= end:
            return short(path)
    return "???"


# ── 1. What types are being compared in distribution files? ──

print("\n" + "=" * 60)
print("1. DISTRIBUTION FILES — WHAT TYPE COMPARISONS HAPPEN")
print("=" * 60)

dist_comparisons = defaultdict(lambda: {"count": 0, "time": 0.0})
for e in events:
    if e.get("name") == "structuredTypeRelatedTo" and e.get("ph") == "X":
        f = file_at(e["ts"])
        if "distributions/" in f:
            args = e.get("args", {})
            src = tname(args.get("sourceId"))
            tgt = tname(args.get("targetId"))
            dur = e.get("dur", 0) / 1000
            key = f"{src} vs {tgt}"
            dist_comparisons[key]["count"] += 1
            dist_comparisons[key]["time"] += dur

for key, d in sorted(dist_comparisons.items(), key=lambda x: -x[1]["time"])[:15]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>3}x)  {key}")


# What depth-limit types hit in distribution files?
dist_depth = defaultdict(int)
for e in events:
    if e.get("name") == "recursiveTypeRelatedTo_DepthLimit" and e.get("ph") == "I":
        f = file_at(e["ts"])
        if "distributions/" in f:
            args = e.get("args", {})
            src = tname(args.get("sourceId"))
            tgt = tname(args.get("targetId"))
            depth = args.get("depth", "?")
            key = f"{src} vs {tgt} (depth={depth})"
            dist_depth[key] += 1

print("\nDepth-limit patterns in distribution files:")
for key, c in sorted(dist_depth.items(), key=lambda x: -x[1])[:15]:
    print(f"  {c:>5}x  {key}")


# ── 2. create-dataframe.ts — what's driving 679 depth hits? ──

print("\n" + "=" * 60)
print("2. CREATE-DATAFRAME.TS — DEPTH LIMIT BREAKDOWN")
print("=" * 60)

cdf_depth = defaultdict(int)
cdf_comp = defaultdict(lambda: {"count": 0, "time": 0.0})
for e in events:
    f = file_at(e["ts"])
    if "create-dataframe.ts" not in f:
        continue
    if e.get("name") == "recursiveTypeRelatedTo_DepthLimit" and e.get("ph") == "I":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        depth = args.get("depth", "?")
        cdf_depth[f"{src} vs {tgt} (depth={depth})"] += 1
    if e.get("name") == "structuredTypeRelatedTo" and e.get("ph") == "X":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        dur = e.get("dur", 0) / 1000
        key = f"{src} vs {tgt}"
        cdf_comp[key]["count"] += 1
        cdf_comp[key]["time"] += dur

print("\nDepth-limit patterns:")
for key, c in sorted(cdf_depth.items(), key=lambda x: -x[1])[:15]:
    print(f"  {c:>5}x  {key}")

print("\nExpensive comparisons:")
for key, d in sorted(cdf_comp.items(), key=lambda x: -x[1]["time"])[:10]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>3}x)  {key}")


# ── 3. ColName — where is it instantiated? ──

print("\n" + "=" * 60)
print("3. ColName — DECLARATION AND USAGE PATTERN")
print("=" * 60)

colname_ids = [tid for tid, name in type_names.items() if name == "ColName"]
print(f"Total ColName type instances: {len(colname_ids)}")

# Check where ColName is declared
for tid in colname_ids[:5]:
    pos = type_firstpos.get(tid, "???")
    display = type_display.get(tid, "")[:100]
    print(f"  id={tid}  declared={pos}  display={display}")


# ── 4. RestrictEmptyDataFrame — what is it and where? ──

print("\n" + "=" * 60)
print("4. RestrictEmptyDataFrame — DECLARATION AND USAGE")
print("=" * 60)

redf_ids = [tid for tid, name in type_names.items() if name == "RestrictEmptyDataFrame"]
print(f"Total instances: {len(redf_ids)}")
for tid in redf_ids[:5]:
    pos = type_firstpos.get(tid, "???")
    display = type_display.get(tid, "")[:120]
    print(f"  id={tid}  declared={pos}  display={display}")


# ── 5. graph.ts — detailed breakdown of 426 depth hits ──

print("\n" + "=" * 60)
print("5. GRAPH.TS — DEPTH LIMIT AND COMPARISON BREAKDOWN")
print("=" * 60)

graph_depth = defaultdict(int)
graph_comp = defaultdict(lambda: {"count": 0, "time": 0.0})
for e in events:
    f = file_at(e["ts"])
    if "graph/graph.ts" not in f:
        continue
    if e.get("name") == "recursiveTypeRelatedTo_DepthLimit" and e.get("ph") == "I":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        depth = args.get("depth", "?")
        graph_depth[f"{src} vs {tgt} (depth={depth})"] += 1
    if e.get("name") == "structuredTypeRelatedTo" and e.get("ph") == "X":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        dur = e.get("dur", 0) / 1000
        key = f"{src} vs {tgt}"
        graph_comp[key]["count"] += 1
        graph_comp[key]["time"] += dur

print("\nDepth-limit patterns:")
for key, c in sorted(graph_depth.items(), key=lambda x: -x[1])[:10]:
    print(f"  {c:>5}x  {key}")

print("\nExpensive comparisons:")
for key, d in sorted(graph_comp.items(), key=lambda x: -x[1]["time"])[:10]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>3}x)  {key}")


# ── 6. slice.verb.ts — 289 depth hits, why? ──

print("\n" + "=" * 60)
print("6. SLICE.VERB.TS — DEPTH LIMIT BREAKDOWN")
print("=" * 60)

slice_depth = defaultdict(int)
slice_comp = defaultdict(lambda: {"count": 0, "time": 0.0})
for e in events:
    f = file_at(e["ts"])
    if "slice.verb.ts" not in f:
        continue
    if e.get("name") == "recursiveTypeRelatedTo_DepthLimit" and e.get("ph") == "I":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        depth = args.get("depth", "?")
        slice_depth[f"{src} vs {tgt} (depth={depth})"] += 1
    if e.get("name") == "structuredTypeRelatedTo" and e.get("ph") == "X":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        dur = e.get("dur", 0) / 1000
        key = f"{src} vs {tgt}"
        slice_comp[key]["count"] += 1
        slice_comp[key]["time"] += dur

print("\nDepth-limit patterns:")
for key, c in sorted(slice_depth.items(), key=lambda x: -x[1])[:10]:
    print(f"  {c:>5}x  {key}")

print("\nExpensive comparisons:")
for key, d in sorted(slice_comp.items(), key=lambda x: -x[1]["time"])[:10]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>3}x)  {key}")


# ── 7. filter.verb.ts — what's the FilterRowsMethod cost about? ──

print("\n" + "=" * 60)
print("7. FILTER.VERB.TS — DEPTH LIMIT BREAKDOWN")
print("=" * 60)

filter_depth = defaultdict(int)
filter_comp = defaultdict(lambda: {"count": 0, "time": 0.0})
for e in events:
    f = file_at(e["ts"])
    if "filter.verb.ts" not in f:
        continue
    if e.get("name") == "recursiveTypeRelatedTo_DepthLimit" and e.get("ph") == "I":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        depth = args.get("depth", "?")
        filter_depth[f"{src} vs {tgt} (depth={depth})"] += 1
    if e.get("name") == "structuredTypeRelatedTo" and e.get("ph") == "X":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        dur = e.get("dur", 0) / 1000
        key = f"{src} vs {tgt}"
        filter_comp[key]["count"] += 1
        filter_comp[key]["time"] += dur

print("\nDepth-limit patterns:")
for key, c in sorted(filter_depth.items(), key=lambda x: -x[1])[:10]:
    print(f"  {c:>5}x  {key}")

print("\nExpensive comparisons:")
for key, d in sorted(filter_comp.items(), key=lambda x: -x[1]["time"])[:10]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>3}x)  {key}")


# ── 8. Variance computations — full list with source locations ──

print("\n" + "=" * 60)
print("8. VARIANCE COMPUTATIONS — WITH SOURCE LOCATIONS")
print("=" * 60)

for e in events:
    if e.get("name") == "getVariancesWorker" and e.get("ph") == "X":
        dur = e.get("dur", 0) / 1000
        args = e.get("args", {})
        tid = args.get("id")
        name = tname(tid) if tid else str(args)
        pos = type_firstpos.get(tid, "???") if tid else "???"
        print(f"  {dur:8.0f}ms  {name:40s}  {pos}")


# ── 9. __type (39k instances) — where do they come from? ──

print("\n" + "=" * 60)
print("9. __type (anonymous types) — SOURCE FILE DISTRIBUTION")
print("=" * 60)

anon_by_file = defaultdict(int)
for t in [tid for tid, name in type_names.items() if name == "__type"]:
    pos = type_firstpos.get(t, "???")
    f = pos.split(":")[0] if ":" in pos else pos
    anon_by_file[f] += 1

for f, c in sorted(anon_by_file.items(), key=lambda x: -x[1])[:20]:
    print(f"  {c:>6}x  {f}")


# ── 10. Per-type instantiation by source file for key types ──

print("\n" + "=" * 60)
print("10. KEY TYPE INSTANTIATIONS BY SOURCE FILE")
print("=" * 60)

for target_name in ["DataFrame", "DataFrameBase", "DataFrameColumns",
                     "GroupedDataFrame", "PromisedDataFrame",
                     "FilterRowsMethod", "MutateMethod",
                     "ColName", "RestrictEmptyDataFrame",
                     "PreserveGrouping"]:
    by_file = defaultdict(int)
    total = 0
    for tid, name in type_names.items():
        if name == target_name:
            total += 1
            pos = type_firstpos.get(tid, "???")
            f = pos.split(":")[0] if ":" in pos else pos
            by_file[f] += 1

    print(f"\n{target_name} ({total} total):")
    for f, c in sorted(by_file.items(), key=lambda x: -x[1])[:10]:
        print(f"  {c:>5}x  {f}")
