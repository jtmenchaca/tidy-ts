#!/usr/bin/env python3
"""
Portal Messages OCEL Analysis - Flexible version with recoding toggle
Run with: cd src/process && poetry run python analyze-portal-messages-flexible.py [--recode]
"""

import pm4py
from pathlib import Path
import sys

# Check for recoding flag
RECODE_RESOURCES = '--recode' in sys.argv

# Setup
fixtures_dir = Path(__file__).parent / "fixtures"
csv_path = fixtures_dir / "portal_messages.csv"

print("\n" + "="*70)
print("PORTAL MESSAGES OBJECT-CENTRIC EVENT LOG ANALYSIS")
if RECODE_RESOURCES:
    print("(WITH RECODING: Individual providers → single role object)")
else:
    print("(NO RECODING: Individual providers preserved)")
print("="*70 + "\n")

# Load OCEL
ocel = pm4py.read_ocel_csv(str(csv_path))

if RECODE_RESOURCES:
    # Recode individual providers as single objects
    import pandas as pd

    # Create mapping for recoding
    recode_map = {}
    for oid in ocel.objects['ocel:oid']:
        obj_type = ocel.objects[ocel.objects['ocel:oid'] == oid].iloc[0]['ocel:type']
        if obj_type == 'Provider':
            recode_map[oid] = 'provider'
        else:
            recode_map[oid] = oid

    # Apply recoding to relations
    ocel.relations = ocel.relations.copy()
    ocel.relations.loc[:, 'ocel:oid'] = ocel.relations['ocel:oid'].map(recode_map)

    # Update objects dataframe - remove individual providers, add single instance
    objects_df = ocel.objects.copy()
    objects_df = objects_df[~objects_df['ocel:type'].isin(['Provider'])].copy()
    new_provider = pd.DataFrame([
        {'ocel:oid': 'provider', 'ocel:type': 'Provider'}
    ])
    objects_df = pd.concat([objects_df, new_provider], ignore_index=True)
    ocel.objects = objects_df

    # Remove duplicate relations (since we collapsed individuals into single objects)
    ocel.relations = ocel.relations.drop_duplicates(subset=['ocel:eid', 'ocel:oid'])

print(f"Dataset Overview:")
print(f"  - Total Events: {len(ocel.events)}")
print(f"  - Total Objects: {len(ocel.objects)}")
print(f"  - Total Relations: {len(ocel.relations)}")

# Create visualizations
print("\n=== Creating Visualizations ===\n")
ocdfg = pm4py.discover_ocdfg(ocel)

suffix = "recoded" if RECODE_RESOURCES else "individual"

try:
    freq_path = fixtures_dir / f"pm_{suffix}_ocdfg_frequency.png"
    pm4py.save_vis_ocdfg(ocdfg, str(freq_path), annotation="frequency")
    print(f"✓ Saved frequency diagram: {freq_path}")
except Exception as e:
    print(f"✗ Frequency diagram failed: {e}")

try:
    perf_path = fixtures_dir / f"pm_{suffix}_ocdfg_performance.png"
    pm4py.save_vis_ocdfg(ocdfg, str(perf_path), annotation="performance")
    print(f"✓ Saved performance diagram: {perf_path}")
except Exception as e:
    print(f"✗ Performance diagram failed: {e}")

try:
    ocpn = pm4py.discover_oc_petri_net(ocel)
    ocpn_path = fixtures_dir / f"pm_{suffix}_ocpn.png"
    pm4py.save_vis_ocpn(ocpn, str(ocpn_path))
    print(f"✓ Saved Petri net: {ocpn_path}")
except Exception as e:
    print(f"✗ Petri net failed: {e}")

# Object types breakdown
print("\n" + "-"*70)
print("OBJECT TYPES")
print("-"*70)
obj_types = pm4py.ocel_get_object_types(ocel)
print(f"Object Types: {obj_types}")

for ot in obj_types:
    count = len(ocel.objects[ocel.objects['ocel:type'] == ot])
    print(f"  - {ot}: {count} individuals")

# Activity breakdown
print("\n" + "-"*70)
print("ACTIVITIES")
print("-"*70)
activities = ocel.events['ocel:activity'].value_counts()
print("\nActivity Frequencies:")
for activity, count in activities.items():
    print(f"  - {activity}: {count} occurrences")

# Objects per activity
print("\n" + "-"*70)
print("OBJECT INTERACTIONS BY ACTIVITY")
print("-"*70)
print("\nWhich object types participate in each activity:\n")

for activity in ocel.events['ocel:activity'].unique():
    # Get events for this activity
    activity_events = ocel.events[ocel.events['ocel:activity'] == activity]
    event_ids = activity_events['ocel:eid'].tolist()

    # Get relations for these events
    activity_relations = ocel.relations[ocel.relations['ocel:eid'].isin(event_ids)]

    # Get object types involved
    object_ids = activity_relations['ocel:oid'].unique()
    objects_involved = ocel.objects[ocel.objects['ocel:oid'].isin(object_ids)]
    object_types = objects_involved['ocel:type'].value_counts().to_dict()

    print(f"{activity}:")
    for ot, count in object_types.items():
        print(f"  - {ot}: {count}")

# Resource utilization
print("\n" + "-"*70)
print("RESOURCE UTILIZATION")
print("-"*70)

providers = ocel.objects[ocel.objects['ocel:type'] == 'Provider']['ocel:oid'].tolist()

print("\nProvider Workload:")
for provider in providers:
    prov_relations = ocel.relations[ocel.relations['ocel:oid'] == provider]
    num_events = len(prov_relations)
    print(f"  {provider}: involved in {num_events} events")

# Computed insights
print("\n" + "="*70)
print("COMPUTED INSIGHTS")
print("="*70)

# 1. Events with multiple object types
multi_object_events = ocel.relations.groupby('ocel:eid').size()
events_with_multiple = (multi_object_events > 1).sum()
print(f"\n1. Events with multiple objects: {events_with_multiple}/{len(ocel.events)} ({100*events_with_multiple/len(ocel.events):.1f}%)")

# 2. Object type diversity per event
import pandas as pd
relations_with_types = ocel.relations.merge(ocel.objects[['ocel:oid', 'ocel:type']], on='ocel:oid', how='left')
type_diversity = relations_with_types.groupby('ocel:eid')['ocel:type_y'].nunique()
avg_types_per_event = type_diversity.mean()
max_types_per_event = type_diversity.max()
print(f"   - Average object types per event: {avg_types_per_event:.2f}")
print(f"   - Maximum object types in single event: {max_types_per_event}")

# 3. Resource sharing across patients
print(f"\n2. Resource Sharing:")
for resource_type in ['Provider']:
    resources = ocel.objects[ocel.objects['ocel:type'] == resource_type]['ocel:oid'].tolist()
    for resource in resources:
        resource_rels = ocel.relations[ocel.relations['ocel:oid'] == resource]
        event_ids = resource_rels['ocel:eid'].tolist()

        # Find all objects in those events
        all_event_rels = ocel.relations[ocel.relations['ocel:eid'].isin(event_ids)]

        # Get patient objects
        patient_ids = []
        for oid in all_event_rels['ocel:oid'].unique():
            obj_row = ocel.objects[ocel.objects['ocel:oid'] == oid]
            if not obj_row.empty and obj_row.iloc[0]['ocel:type'] == 'Patient':
                patient_ids.append(oid)

        patients_served = len(set(patient_ids))
        print(f"   - {resource} served {patients_served} different patients in {len(resource_rels)} events")

# 4. Patient journey complexity
print(f"\n3. Patient Journey Complexity:")
patients = ocel.objects[ocel.objects['ocel:type'] == 'Patient']['ocel:oid'].tolist()
for patient in patients:
    patient_rels = ocel.relations[ocel.relations['ocel:oid'] == patient]
    event_ids = patient_rels['ocel:eid'].tolist()

    # Count unique resource types involved
    all_rels = ocel.relations[ocel.relations['ocel:eid'].isin(event_ids)]

    resource_ids = []
    resource_types_set = set()
    for oid in all_rels['ocel:oid'].unique():
        if oid == patient:
            continue
        obj_row = ocel.objects[ocel.objects['ocel:oid'] == oid]
        if not obj_row.empty:
            resource_ids.append(oid)
            resource_types_set.add(obj_row.iloc[0]['ocel:type'])

    unique_resources = len(set(resource_ids))
    resource_types = ', '.join(sorted(resource_types_set))

    print(f"   - {patient}: {len(event_ids)} events, {unique_resources} different resources ({resource_types})")

# 5. Workload imbalance
print(f"\n4. Workload Distribution:")
for obj_type in ['Provider']:
    objects = ocel.objects[ocel.objects['ocel:type'] == obj_type]['ocel:oid'].tolist()
    workloads = []
    for obj in objects:
        obj_rels = ocel.relations[ocel.relations['ocel:oid'] == obj]
        workloads.append(len(obj_rels))

    if workloads:
        avg_workload = sum(workloads) / len(workloads)
        min_workload = min(workloads)
        max_workload = max(workloads)
        imbalance = max_workload - min_workload
        print(f"   - {obj_type}s: avg={avg_workload:.1f} events, range=[{min_workload}-{max_workload}], imbalance={imbalance}")

# 6. Appointment lifecycle analysis
print(f"\n5. Appointment Lifecycle:")
appointments = ocel.objects[ocel.objects['ocel:type'] == 'Appointment']['ocel:oid'].tolist()
print(f"   - Total appointments tracked: {len(appointments)}")

# Analyze appointment events
for appointment in appointments:
    appt_rels = ocel.relations[ocel.relations['ocel:oid'] == appointment]
    event_ids = appt_rels['ocel:eid'].tolist()
    
    # Get activities for this appointment
    appointment_events = ocel.events[ocel.events['ocel:eid'].isin(event_ids)]
    activities = appointment_events['ocel:activity'].tolist()
    
    print(f"   - {appointment}: {len(event_ids)} events ({', '.join(activities)})")

print("\n" + "="*70 + "\n")
