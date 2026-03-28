"""
Deep analysis of create-dataframe.ts type-checking costs.

Investigates:
- What structural comparisons cause 1,517 depth-limit hits
- Which type IDs are involved and where they're declared
- The comparison cascade chain (what triggers DataFrame vs DataFrame)
- Whether overload resolution is the main driver

Usage:
    python3 packages/testing/type-profiling/analyze-create-df.py
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
type_firstpos = {}
for t in types_list:
    tid = t["id"]
    type_names[tid] = t.get("symbolName") or t.get("intrinsicName") or ""
    type_display[tid] = (t.get("display") or "")[:300]
    if "firstDeclaration" in t:
        fd = t["firstDeclaration"]
        type_firstpos[tid] = f"{short(fd.get('path',''))}:{fd.get('start',{}).get('line','?')}"


def tname(tid):
    return type_names.get(tid, str(tid)) or str(tid)


def tpos(tid):
    return type_firstpos.get(tid, "???")


# Build file check ranges for attribution
import bisect

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
starts = [r[0] for r in check_ranges]


def file_at(ts):
    idx = bisect.bisect_right(starts, ts) - 1
    if 0 <= idx < len(check_ranges):
        s, end, path = check_ranges[idx]
        if s <= ts <= end:
            return short(path)
    return "???"


# Filter to create-dataframe.ts events
def is_cdf(ts):
    return "create-dataframe.ts" in file_at(ts)


# ── 1. Depth-limit hits: full breakdown with type IDs and declarations ──

print("\n" + "=" * 70)
print("1. DEPTH-LIMIT HITS — FULL BREAKDOWN WITH TYPE DECLARATIONS")
print("=" * 70)

depth_hits = []
for e in events:
    if (e.get("name") == "recursiveTypeRelatedTo_DepthLimit"
            and e.get("ph") == "I" and is_cdf(e["ts"])):
        args = e.get("args", {})
        depth_hits.append({
            "src_id": args.get("sourceId"),
            "tgt_id": args.get("targetId"),
            "depth": args.get("depth", "?"),
            "ts": e["ts"],
        })

print(f"\nTotal depth-limit hits: {len(depth_hits)}")

# Group by source/target name + depth
by_pattern = defaultdict(lambda: {"count": 0, "src_ids": set(), "tgt_ids": set()})
for h in depth_hits:
    key = f"{tname(h['src_id'])} vs {tname(h['tgt_id'])} (depth={h['depth']})"
    by_pattern[key]["count"] += 1
    by_pattern[key]["src_ids"].add(h["src_id"])
    by_pattern[key]["tgt_ids"].add(h["tgt_id"])

print("\nPatterns (name, depth, count, unique source IDs, unique target IDs):")
for key, d in sorted(by_pattern.items(), key=lambda x: -x[1]["count"])[:25]:
    print(f"  {d['count']:>5}x  {key}")
    # Show first few unique type IDs with their declarations
    for sid in sorted(d["src_ids"])[:3]:
        print(f"         src id={sid}  declared={tpos(sid)}")
        print(f"                display={type_display.get(sid, '')[:150]}")
    for tid in sorted(d["tgt_ids"])[:3]:
        print(f"         tgt id={tid}  declared={tpos(tid)}")
        print(f"                display={type_display.get(tid, '')[:150]}")


# ── 2. Expensive comparisons with type declarations ──

print("\n" + "=" * 70)
print("2. EXPENSIVE COMPARISONS — WITH TYPE ID DETAILS")
print("=" * 70)

comp_data = defaultdict(lambda: {"count": 0, "time": 0.0, "src_ids": set(), "tgt_ids": set()})
for e in events:
    if (e.get("name") == "structuredTypeRelatedTo"
            and e.get("ph") == "X" and is_cdf(e["ts"])):
        args = e.get("args", {})
        sid = args.get("sourceId")
        tid = args.get("targetId")
        dur = e.get("dur", 0) / 1000
        key = f"{tname(sid)} vs {tname(tid)}"
        comp_data[key]["count"] += 1
        comp_data[key]["time"] += dur
        comp_data[key]["src_ids"].add(sid)
        comp_data[key]["tgt_ids"].add(tid)

print("\nTop comparisons by time:")
for key, d in sorted(comp_data.items(), key=lambda x: -x[1]["time"])[:15]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>3}x)  {key}")
    for sid in sorted(d["src_ids"])[:2]:
        print(f"         src id={sid}  declared={tpos(sid)}")
    for tid in sorted(d["tgt_ids"])[:2]:
        print(f"         tgt id={tid}  declared={tpos(tid)}")


# ── 3. Overload resolution events ──

print("\n" + "=" * 70)
print("3. OVERLOAD RESOLUTION EVENTS IN CREATE-DATAFRAME.TS")
print("=" * 70)

overload_events = []
for e in events:
    if (e.get("name") in ("resolveOverloadExpression", "chooseOverload",
                           "checkCallExpression")
            and e.get("ph") == "X" and is_cdf(e["ts"])):
        dur = e.get("dur", 0) / 1000
        overload_events.append({
            "name": e["name"],
            "dur": dur,
            "args": e.get("args", {}),
        })

print(f"\nTotal overload-related events: {len(overload_events)}")
for ev in sorted(overload_events, key=lambda x: -x["dur"])[:20]:
    print(f"  {ev['dur']:8.0f}ms  {ev['name']:35s}  {ev['args']}")


# ── 4. What are the distinct DataFrame type IDs being compared? ──

print("\n" + "=" * 70)
print("4. DISTINCT DATAFRAME TYPE IDs IN COMPARISONS")
print("=" * 70)

df_src_ids = set()
df_tgt_ids = set()
for h in depth_hits:
    if tname(h["src_id"]) == "DataFrame":
        df_src_ids.add(h["src_id"])
    if tname(h["tgt_id"]) == "DataFrame":
        df_tgt_ids.add(h["tgt_id"])

print(f"\nUnique DataFrame source IDs: {len(df_src_ids)}")
for sid in sorted(df_src_ids):
    print(f"  id={sid}  declared={tpos(sid)}  display={type_display.get(sid, '')[:200]}")

print(f"\nUnique DataFrame target IDs: {len(df_tgt_ids)}")
for tid in sorted(df_tgt_ids):
    print(f"  id={tid}  declared={tpos(tid)}  display={type_display.get(tid, '')[:200]}")


# ── 5. checkExpression events (what expressions trigger the cascade?) ──

print("\n" + "=" * 70)
print("5. CHECK EXPRESSION EVENTS IN CREATE-DATAFRAME.TS")
print("=" * 70)

check_expr_events = []
for e in events:
    if (e.get("name") == "checkExpression"
            and e.get("ph") == "X" and is_cdf(e["ts"])):
        dur = e.get("dur", 0) / 1000
        if dur >= 50:  # Only show expensive ones (50ms+)
            check_expr_events.append({
                "dur": dur,
                "args": e.get("args", {}),
            })

print(f"\nExpensive checkExpression events (>50ms): {len(check_expr_events)}")
for ev in sorted(check_expr_events, key=lambda x: -x["dur"])[:20]:
    print(f"  {ev['dur']:8.0f}ms  {ev['args']}")


# ── 6. Time distribution across event types ──

print("\n" + "=" * 70)
print("6. TIME DISTRIBUTION BY EVENT TYPE")
print("=" * 70)

time_by_event = defaultdict(lambda: {"count": 0, "time": 0.0})
for e in events:
    if e.get("ph") == "X" and is_cdf(e["ts"]):
        dur = e.get("dur", 0) / 1000
        time_by_event[e["name"]]["count"] += 1
        time_by_event[e["name"]]["time"] += dur

print("\nEvent types by total time:")
for name, d in sorted(time_by_event.items(), key=lambda x: -x[1]["time"])[:20]:
    print(f"  {d['time']:8.0f}ms  ({d['count']:>5}x)  {name}")


# ── 7. Are overloads the root cause? Check return type assignability ──

print("\n" + "=" * 70)
print("7. RETURN TYPE COMPARISONS (DataFrame assignability checks)")
print("=" * 70)

# Look for isTypeRelatedTo events that compare DataFrame variants
type_related = []
for e in events:
    if (e.get("name") in ("isTypeAssignableTo", "isTypeRelatedTo")
            and e.get("ph") == "X" and is_cdf(e["ts"])):
        dur = e.get("dur", 0) / 1000
        if dur >= 10:
            args = e.get("args", {})
            type_related.append({
                "name": e["name"],
                "dur": dur,
                "src": tname(args.get("sourceId", 0)),
                "tgt": tname(args.get("targetId", 0)),
                "src_id": args.get("sourceId"),
                "tgt_id": args.get("targetId"),
            })

print(f"\nExpensive type-assignability checks (>10ms): {len(type_related)}")
for ev in sorted(type_related, key=lambda x: -x["dur"])[:20]:
    print(f"  {ev['dur']:8.0f}ms  {ev['name']:25s}  {ev['src']} → {ev['tgt']}")
    if ev["src_id"]:
        print(f"         src id={ev['src_id']}  display={type_display.get(ev['src_id'], '')[:150]}")
    if ev["tgt_id"]:
        print(f"         tgt id={ev['tgt_id']}  display={type_display.get(ev['tgt_id'], '')[:150]}")


# ── 8. Depth-limit timeline (are they clustered or spread out?) ──

print("\n" + "=" * 70)
print("8. DEPTH-LIMIT HIT TIMELINE (clustered vs spread)")
print("=" * 70)

if depth_hits:
    sorted_hits = sorted(depth_hits, key=lambda x: x["ts"])
    first_ts = sorted_hits[0]["ts"]
    last_ts = sorted_hits[-1]["ts"]
    total_span = (last_ts - first_ts) / 1000  # ms

    # Bucket into 10 time slices
    n_buckets = 10
    bucket_size = (last_ts - first_ts) / n_buckets if last_ts > first_ts else 1
    buckets = defaultdict(int)
    for h in sorted_hits:
        b = int((h["ts"] - first_ts) / bucket_size)
        b = min(b, n_buckets - 1)
        buckets[b] += 1

    print(f"\nSpan: {total_span:.0f}ms, {len(depth_hits)} hits")
    for i in range(n_buckets):
        bar = "#" * (buckets[i] // 5)
        pct = buckets[i] / len(depth_hits) * 100
        print(f"  slice {i}: {buckets[i]:>5} hits ({pct:5.1f}%)  {bar}")

print("\nDone.")
