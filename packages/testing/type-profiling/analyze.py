"""
Deep analysis of tsc trace data to find repeated expensive type patterns.

Usage:
    python3 packages/testing/type-profiling/analyze.py
"""

import json
from collections import defaultdict

TRACE = "packages/testing/type-profiling/trace-output/trace.json"
TYPES = "packages/testing/type-profiling/trace-output/types.json"
ROOT = "/Users/jtmenchaca/tidy-ts/"


def short(path):
    return path.replace(ROOT, "").replace(ROOT.replace("/Users/", "/users/"), "")


# ── Load data ────────────────────────────────────────────────────

print("Loading trace.json ...")
with open(TRACE) as f:
    events = json.load(f)

print("Loading types.json ...")
with open(TYPES) as f:
    types_list = json.load(f)

type_names = {}
for t in types_list:
    type_names[t["id"]] = t.get("symbolName") or t.get("intrinsicName") or (t.get("display", "")[:80]) or "???"

del types_list  # free memory


def tname(tid):
    return type_names.get(tid, str(tid))


# ── 1. structuredTypeRelatedTo: accumulated time & count by type pair ──

print("\n" + "=" * 60)
print("1. TYPE COMPARISON PATTERNS (structuredTypeRelatedTo)")
print("=" * 60)

pair_time = defaultdict(float)
pair_count = defaultdict(int)

for e in events:
    if e.get("name") == "structuredTypeRelatedTo" and e.get("ph") == "X":
        dur = (e.get("dur", 0)) / 1000  # ms
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        key = f"{src} vs {tgt}"
        pair_time[key] += dur
        pair_count[key] += 1

print(f"\nTotal comparisons: {sum(pair_count.values())}")
print(f"Total time: {sum(pair_time.values()):.0f}ms")

print("\nBy accumulated time:")
for key, t in sorted(pair_time.items(), key=lambda x: -x[1])[:20]:
    c = pair_count[key]
    print(f"  {t:8.0f}ms  ({c:>4}x)  {key}")

print("\nBy count:")
for key, c in sorted(pair_count.items(), key=lambda x: -x[1])[:20]:
    t = pair_time[key]
    print(f"  {c:>6}x  ({t:6.0f}ms)  {key}")


# ── 2. recursiveTypeRelatedTo_DepthLimit ──

print("\n" + "=" * 60)
print("2. RECURSIVE TYPE DEPTH LIMIT HITS")
print("=" * 60)

depth_counts = defaultdict(int)
depth_by_source = defaultdict(int)
depth_by_target = defaultdict(int)

for e in events:
    if e.get("name") == "recursiveTypeRelatedTo_DepthLimit" and e.get("ph") == "I":
        args = e.get("args", {})
        src = tname(args.get("sourceId"))
        tgt = tname(args.get("targetId"))
        depth = args.get("depth", "?")
        key = f"{src} vs {tgt} (depth={depth})"
        depth_counts[key] += 1
        depth_by_source[src] += 1
        depth_by_target[tgt] += 1

print(f"\nTotal depth-limit hits: {sum(depth_counts.values())}")

print("\nBy specific comparison:")
for key, c in sorted(depth_counts.items(), key=lambda x: -x[1])[:20]:
    print(f"  {c:>6}x  {key}")

print("\nBy source type (most often on the left side):")
for key, c in sorted(depth_by_source.items(), key=lambda x: -x[1])[:15]:
    print(f"  {c:>6}x  {key}")

print("\nBy target type (most often on the right side):")
for key, c in sorted(depth_by_target.items(), key=lambda x: -x[1])[:15]:
    print(f"  {c:>6}x  {key}")


# ── 3. checkExpression: accumulated time per file ──

print("\n" + "=" * 60)
print("3. EXPRESSION CHECK TIME BY FILE")
print("=" * 60)

file_time = defaultdict(float)
file_count = defaultdict(int)

for e in events:
    if e.get("name") == "checkExpression" and e.get("ph") == "X":
        dur = (e.get("dur", 0)) / 1000
        path = short(e.get("args", {}).get("path", ""))
        if path and "node_modules" not in path:
            file_time[path] += dur
            file_count[path] += 1

print("\nBy accumulated expression check time:")
for path, t in sorted(file_time.items(), key=lambda x: -x[1])[:20]:
    c = file_count[path]
    print(f"  {t:8.0f}ms  ({c:>4} exprs)  {path}")


# ── 4. getVariancesWorker: which types need variance computation ──

print("\n" + "=" * 60)
print("4. VARIANCE COMPUTATION (getVariancesWorker)")
print("=" * 60)

variance_time = defaultdict(float)
variance_count = defaultdict(int)

for e in events:
    if e.get("name") == "getVariancesWorker" and e.get("ph") == "X":
        dur = (e.get("dur", 0)) / 1000
        args = e.get("args", {})
        name = tname(args.get("id")) if "id" in args else str(args)
        variance_time[name] += dur
        variance_count[name] += 1

print(f"\nTotal variance computations: {sum(variance_count.values())}")

print("\nBy time:")
for key, t in sorted(variance_time.items(), key=lambda x: -x[1])[:15]:
    c = variance_count[key]
    print(f"  {t:8.0f}ms  ({c:>3}x)  {key}")
