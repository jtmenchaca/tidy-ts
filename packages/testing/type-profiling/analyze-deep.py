"""
Deeper analysis of tsc trace — looking for patterns we missed.

Usage:
    python3 packages/testing/type-profiling/analyze-deep.py
"""

import json
from collections import defaultdict

TRACE = "packages/testing/type-profiling/trace-output/trace.json"
TYPES = "packages/testing/type-profiling/trace-output/types.json"
ROOT = "/Users/jtmenchaca/tidy-ts/"


def short(path):
    return path.replace(ROOT, "").replace(ROOT.replace("/Users/", "/users/"), "")


print("Loading trace.json ...")
with open(TRACE) as f:
    events = json.load(f)

print("Loading types.json ...")
with open(TYPES) as f:
    types_list = json.load(f)

type_names = {}
type_display = {}
type_flags = {}
for t in types_list:
    tid = t["id"]
    type_names[tid] = t.get("symbolName") or t.get("intrinsicName") or ""
    type_display[tid] = (t.get("display") or "")[:120]
    if "flags" in t:
        type_flags[tid] = t["flags"]


def tname(tid):
    return type_names.get(tid, str(tid)) or type_display.get(tid, str(tid))[:60] or str(tid)


# ── 1. ALL event types and their total time ──

print("\n" + "=" * 60)
print("1. TOTAL TIME BY EVENT TYPE")
print("=" * 60)

event_time = defaultdict(float)
event_count = defaultdict(int)

for e in events:
    name = e.get("name", "")
    ph = e.get("ph", "")
    if ph == "X":  # complete events with duration
        dur = e.get("dur", 0) / 1000
        event_time[name] += dur
        event_count[name] += 1
    elif ph == "B":  # begin events — we'll match with E later
        pass

# Also compute B/E pair durations for checkSourceFile
check_file_total = 0
check_stack = []
for e in events:
    if e.get("name") == "checkSourceFile":
        if e["ph"] == "B":
            check_stack.append(e["ts"])
        elif e["ph"] == "E" and check_stack:
            check_file_total += (e["ts"] - check_stack.pop()) / 1000

event_time["checkSourceFile (B/E)"] = check_file_total

for name, t in sorted(event_time.items(), key=lambda x: -x[1]):
    if t >= 1:
        c = event_count.get(name, "")
        c_str = f"({c}x)" if c else ""
        print(f"  {t:8.0f}ms  {c_str:>8}  {name}")


# ── 2. checkSourceFile — full breakdown including node_modules ──

print("\n" + "=" * 60)
print("2. FILE CHECK TIME — ALL FILES (including node_modules)")
print("=" * 60)

file_times = defaultdict(float)
fstack = []
for e in events:
    if e.get("cat") == "check" and e.get("name") == "checkSourceFile":
        path = (e.get("args", {}).get("path", ""))
        if e["ph"] == "B":
            fstack.append((path, e["ts"]))
        elif e["ph"] == "E" and fstack:
            p, t = fstack.pop()
            file_times[p] += (e["ts"] - t) / 1000

# Group node_modules by package
pkg_times = defaultdict(float)
own_times = defaultdict(float)
for path, t in file_times.items():
    s = short(path)
    if "node_modules" in s:
        # extract package name
        parts = s.split("node_modules/")[-1].split("/")
        if parts[0].startswith("@"):
            pkg = "/".join(parts[:2])
        else:
            pkg = parts[0]
        pkg_times[f"node_modules: {pkg}"] += t
    else:
        own_times[s] = t

print("\nOwn code:")
for path, t in sorted(own_times.items(), key=lambda x: -x[1])[:20]:
    print(f"  {t:8.0f}ms  {path}")

print("\nnode_modules (by package):")
for pkg, t in sorted(pkg_times.items(), key=lambda x: -x[1])[:10]:
    print(f"  {t:8.0f}ms  {pkg}")


# ── 3. Depth limit hits — what files trigger them ──

print("\n" + "=" * 60)
print("3. DEPTH LIMIT HITS — WHICH FILES TRIGGER THEM")
print("=" * 60)

# Replay events chronologically with a stack to find the innermost
# active checkSourceFile for each event. Previous approach used bisect
# on a flat range list, which misattributed nested checks to outer files.

depth_by_file = defaultdict(int)
comp_by_file = defaultdict(lambda: {"count": 0, "time": 0.0})
check_file_stack = []

for e in events:
    name = e.get("name", "")
    ph = e.get("ph", "")

    if e.get("cat") == "check" and name == "checkSourceFile":
        path = e.get("args", {}).get("path", "")
        if ph == "B":
            check_file_stack.append(path)
        elif ph == "E" and check_file_stack:
            check_file_stack.pop()

    elif name == "recursiveTypeRelatedTo_DepthLimit" and ph == "I":
        if check_file_stack:
            depth_by_file[short(check_file_stack[-1])] += 1

    elif name == "structuredTypeRelatedTo" and ph == "X":
        if check_file_stack:
            f = short(check_file_stack[-1])
            dur = e.get("dur", 0) / 1000
            comp_by_file[f]["count"] += 1
            comp_by_file[f]["time"] += dur

print("\nDepth-limit hits by active file:")
for path, c in sorted(depth_by_file.items(), key=lambda x: -x[1])[:20]:
    print(f"  {c:>6}x  {path}")


# ── 4. structuredTypeRelatedTo — which files trigger them ──

print("\n" + "=" * 60)
print("4. EXPENSIVE COMPARISONS — WHICH FILES TRIGGER THEM")
print("=" * 60)

print("\nBy total comparison time:")
for path, d in sorted(comp_by_file.items(), key=lambda x: -x[1]["time"])[:20]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>4}x)  {path}")


# ── 5. types.json analysis — type count by symbolName ──

print("\n" + "=" * 60)
print("5. TYPES.JSON — MOST INSTANTIATED TYPE NAMES")
print("=" * 60)

name_counts = defaultdict(int)
for t in type_names.values():
    if t:
        name_counts[t] += 1

print(f"\nTotal named types: {len(type_names)}")
print(f"Unique names: {len(name_counts)}")
print("\nMost instantiated type names:")
for name, c in sorted(name_counts.items(), key=lambda x: -x[1])[:30]:
    print(f"  {c:>6}x  {name}")


# ── 6. types.json — types with largest display strings (complex types) ──

print("\n" + "=" * 60)
print("6. MOST COMPLEX TYPES (by display string length)")
print("=" * 60)

complex_types = []
for tid, display in type_display.items():
    if display:
        name = type_names.get(tid, "")
        complex_types.append((len(display), name or display[:80], tid))

complex_types.sort(reverse=True)
for length, name, tid in complex_types[:20]:
    print(f"  {length:>5} chars  id={tid:>7}  {name}")


# ── 7. Parse time breakdown ──

print("\n" + "=" * 60)
print("7. PARSE TIME BY FILE (top 10)")
print("=" * 60)

parse_times = defaultdict(float)
pstack = []
for e in events:
    if e.get("cat") == "parse" and e.get("name") == "createSourceFile":
        path = e.get("args", {}).get("path", "")
        if e["ph"] == "B":
            pstack.append((path, e["ts"]))
        elif e["ph"] == "E" and pstack:
            p, t = pstack.pop()
            parse_times[short(p)] += (e["ts"] - t) / 1000

for path, t in sorted(parse_times.items(), key=lambda x: -x[1])[:10]:
    print(f"  {t:8.0f}ms  {path}")
