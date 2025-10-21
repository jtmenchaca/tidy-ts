# OCEL 2.0 Process Mining

Object-Centric Event Log (OCEL) 2.0 analysis using PM4Py and Python.

## Overview

OCEL 2.0 is a standard for storing object-centric event data that overcomes the limitations of traditional case-based event logs. It allows events to be associated with multiple objects of different types, enabling proper representation of complex processes.

## Setup

```bash
cd src/process
poetry install
```

## Running the Demos

### PM4Py Analysis (Recommended)
```bash
poetry run python ocel-pm4py.py
```

Uses PM4Py library for object-centric process mining:
- Load and analyze OCEL files
- Object and temporal summaries
- Filtering by object type and activity
- Flatten to traditional event logs
- Object interaction graphs
- **Object-Centric DFG (OC-DFG)** - Frequency and performance diagrams
- **Object-Centric Petri Net (OC-PN)** - Process model visualization
- Save/export OCEL data

**Visualizations generated:**
- `fixtures/ocdfg_frequency.png` - Event flow with frequencies
- `fixtures/ocdfg_performance.png` - Event flow with performance metrics
- `fixtures/ocpn.png` - Petri net process model

**Visualization notation:**
- **Rectangles** = Events (activities like "Create Order", "Invoice Sent")
- **Circles** = Objects (object types like "order", "delivery", "item")
- **E=X** = Event frequency (number of times an event occurred)
- **Arrows** = Flow between events, colored by which object type connects them

### SQLite Direct Queries
```bash
poetry run python ocel-simple.py
```

Direct SQLite queries on OCEL 2.0 database format.

## OCEL 2.0 Schema

The implementation follows the official OCEL 2.0 SQLite format:

### Core Tables

- **`event`**: Event identifiers and types
- **`event_object`**: Relationships between events and objects
- **`object`**: Object identifiers and types

### Event-Specific Tables

- **`event_CreateOrder`**: Create Order event attributes
- **`event_AddItem`**: Add Item event attributes
- **`event_ConfirmOrder`**: Confirm Order event attributes

### Object-Specific Tables

- **`object_Order`**: Order lifecycle and state changes
- **`object_Item`**: Item attributes and properties

## Example Queries

### Event-Object Relationships
```sql
SELECT
    e.ocel_id,
    e.ocel_type,
    eo.ocel_object_id,
    o.ocel_type as object_type
FROM event e
JOIN event_object eo ON e.ocel_id = eo.ocel_event_id
JOIN object o ON eo.ocel_object_id = o.ocel_id
```

### Objects per Event
```sql
SELECT
    e.ocel_id,
    e.ocel_type,
    COUNT(DISTINCT eo.ocel_object_id) as object_count
FROM event e
JOIN event_object eo ON e.ocel_id = eo.ocel_event_id
GROUP BY e.ocel_id, e.ocel_type
```

### Order Lifecycle
```sql
SELECT
    ocel_id,
    ocel_time,
    status,
    ocel_changed_field
FROM object_Order
ORDER BY ocel_id, ocel_time
```

## Files

- **`ocel-simple.py`**: Main demonstration script
- **`fixtures/ocel.db`**: Generated SQLite database
- **`pyproject.toml`**: Poetry dependencies

## Resources

- [OCEL Standard](https://www.ocel-standard.org/)
- [OCEL 2.0 Specification](https://arxiv.org/abs/2403.01975)
