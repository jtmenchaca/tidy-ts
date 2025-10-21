#!/usr/bin/env python3
"""
OCEL Analysis with PM4Py
Demonstrates object-centric process mining using PM4Py library

Run with: poetry run python src/process/ocel-pm4py.py
"""

import pm4py
from pathlib import Path

# Setup
fixtures_dir = Path(__file__).parent / "fixtures"
fixtures_dir.mkdir(exist_ok=True)

print("\n=== Loading OCEL from CSV ===\n")

# Use existing example CSV
csv_path = fixtures_dir / "example_log.csv"
ocel = pm4py.read_ocel_csv(str(csv_path))
print(f"✓ Loaded from: {csv_path}")

print(f"✓ Loaded OCEL with:")
print(f"  - {len(ocel.events)} events")
print(f"  - {len(ocel.objects)} objects")
print(f"  - {len(ocel.relations)} relations")

print("\n=== Basic Statistics ===\n")

# Get attribute names
attrs = pm4py.ocel_get_attribute_names(ocel)
print(f"Attributes: {attrs}")

# Get object types
obj_types = pm4py.ocel_get_object_types(ocel)
print(f"Object types: {obj_types}")

print("\n=== Objects Summary ===\n")
objects_summary = pm4py.ocel_objects_summary(ocel)
print(objects_summary.head(10).to_string())

print("\n=== Temporal Summary ===\n")
temporal_summary = pm4py.ocel_temporal_summary(ocel)
print(temporal_summary.head(10).to_string())

print("\n=== Filter by Object Type ===\n")
filtered = pm4py.filter_ocel_object_attribute(ocel, "ocel:type", ["order"], positive=True)
print(f"Filtered to 'order' objects: {len(filtered.events)} events")

print("\n=== Filter by Activity ===\n")
filtered = pm4py.filter_ocel_event_attribute(ocel, "ocel:activity", ["place order"], positive=True)
print(f"Filtered to 'place order' activity: {len(filtered.events)} events")

print("\n=== Flatten to Traditional Log ===\n")
flat_log = pm4py.ocel_flattening(ocel, "order")
print(f"Flattened log: {len(flat_log)} cases")

print("\n=== Object Interaction Graph ===\n")
from pm4py.algo.transformation.ocel.graphs import object_interaction_graph
graph = object_interaction_graph.apply(ocel)
print(f"Interaction graph: {len(graph)} object pairs")
print("Sample interactions:")
for i, (o1, o2) in enumerate(list(graph)[:5]):
    print(f"  {o1} <-> {o2}")

print("\n=== Object-Centric DFG (OC-DFG) ===\n")
print("Visualization notation:")
print("  - Rectangles = Events (activities)")
print("  - Circles = Objects (object types)")
print("  - E=X = Event frequency (how many times an event occurred)")
print("  - Arrows = Flow between events, colored by object type\n")

ocdfg = pm4py.discover_ocdfg(ocel)
print("✓ Discovered OC-DFG")

# Save OC-DFG visualization
try:
    ocdfg_path = fixtures_dir / "ocdfg_frequency.png"
    pm4py.save_vis_ocdfg(ocdfg, str(ocdfg_path), annotation="frequency")
    print(f"✓ Saved frequency diagram: {ocdfg_path}")
    print(f"  - Rectangles show events with frequencies (E=X)")
    print(f"  - Circles show object types")
    print(f"  - Edge colors show which object type connects the events")
except Exception as e:
    print(f"  (Visualization requires graphviz: {e})")

try:
    ocdfg_perf_path = fixtures_dir / "ocdfg_performance.png"
    pm4py.save_vis_ocdfg(ocdfg, str(ocdfg_perf_path), annotation="performance")
    print(f"\n✓ Saved performance diagram: {ocdfg_perf_path}")
    print(f"  - Rectangles show events with average duration")
    print(f"  - Circles show object types")
    print(f"  - Edge colors show which object type connects the events")
except Exception as e:
    print(f"  (Visualization requires graphviz: {e})")

print("\n=== Object-Centric Petri Net (OC-PN) ===\n")
try:
    ocpn = pm4py.discover_oc_petri_net(ocel)
    print("✓ Discovered OC-PN")

    ocpn_path = fixtures_dir / "ocpn.png"
    pm4py.save_vis_ocpn(ocpn, str(ocpn_path))
    print(f"✓ Saved Petri net: {ocpn_path}")
except Exception as e:
    print(f"  (Visualization requires graphviz: {e})")

print("\n=== Save OCEL to File ===\n")
output_path = fixtures_dir / "example.jsonocel"
pm4py.write_ocel(ocel, str(output_path))
print(f"✓ Saved to: {output_path}")

print("\n=== Visualizations ===\n")
print("Generated visualizations (if graphviz installed):")
print(f"  - {fixtures_dir / 'ocdfg_frequency.png'}")
print(f"  - {fixtures_dir / 'ocdfg_performance.png'}")
print(f"  - {fixtures_dir / 'ocpn.png'}")

print("\n✓ Complete!\n")
print("To install graphviz for visualizations:")
print("  brew install graphviz  # macOS")
print("  or")
print("  poetry add graphviz")
