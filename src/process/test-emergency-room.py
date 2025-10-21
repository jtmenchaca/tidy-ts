#!/usr/bin/env python3
"""
Emergency Room OCEL Analysis with PM4Py
Run with: cd src/process && poetry run python test-emergency-room.py
"""

import pm4py
from pathlib import Path

# Setup
fixtures_dir = Path(__file__).parent / "fixtures"
csv_path = fixtures_dir / "emergency_room.csv"

print(f"\n=== Loading Emergency Room OCEL from {csv_path} ===\n")

# Load OCEL
ocel = pm4py.read_ocel_csv(str(csv_path))

print(f"✓ Loaded OCEL with:")
print(f"  - {len(ocel.events)} events")
print(f"  - {len(ocel.objects)} objects")
print(f"  - {len(ocel.relations)} relations")

# Discover OC-DFG
print("\n=== Discovering OC-DFG ===\n")
ocdfg = pm4py.discover_ocdfg(ocel)
print("✓ Discovered OC-DFG")

# Save visualizations
print("\n=== Creating Visualizations ===\n")

try:
    freq_path = fixtures_dir / "er_ocdfg_frequency.png"
    pm4py.save_vis_ocdfg(ocdfg, str(freq_path), annotation="frequency")
    print(f"✓ Saved frequency diagram: {freq_path}")
except Exception as e:
    print(f"✗ Frequency diagram failed: {e}")

try:
    perf_path = fixtures_dir / "er_ocdfg_performance.png"
    pm4py.save_vis_ocdfg(ocdfg, str(perf_path), annotation="performance")
    print(f"✓ Saved performance diagram: {perf_path}")
except Exception as e:
    print(f"✗ Performance diagram failed: {e}")

try:
    ocpn = pm4py.discover_oc_petri_net(ocel)
    ocpn_path = fixtures_dir / "er_ocpn.png"
    pm4py.save_vis_ocpn(ocpn, str(ocpn_path))
    print(f"✓ Saved Petri net: {ocpn_path}")
except Exception as e:
    print(f"✗ Petri net failed: {e}")

print("\n✓ Complete!\n")
