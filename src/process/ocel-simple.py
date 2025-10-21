#!/usr/bin/env python3
"""
Simple OCEL 2.0 SQLite Database Example
Creates and queries an object-centric event log following OCEL 2.0 spec

Run with: poetry run python src/process/ocel-simple.py
"""

import sqlite3
from pathlib import Path

# Setup
fixtures_dir = Path(__file__).parent / "fixtures"
fixtures_dir.mkdir(exist_ok=True)
db_path = fixtures_dir / "ocel.db"

# Remove old database
if db_path.exists():
    db_path.unlink()

print("\n=== Creating OCEL 2.0 Database ===\n")

# Create database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create OCEL 2.0 schema
cursor.executescript("""
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS "event" (
  "ocel_id" TEXT,
  "ocel_type" TEXT
);

CREATE TABLE IF NOT EXISTS "event_object" (
  "ocel_event_id" TEXT,
  "ocel_object_id" TEXT,
  "ocel_qualifier" TEXT
);

CREATE TABLE IF NOT EXISTS "object" (
  "ocel_id" TEXT,
  "ocel_type" TEXT
);

CREATE TABLE IF NOT EXISTS "event_CreateOrder" (
  "ocel_id" TEXT,
  "ocel_time" TEXT,
  "total_items" INTEGER
);

CREATE TABLE IF NOT EXISTS "event_AddItem" (
  "ocel_id" TEXT,
  "ocel_time" TEXT,
  "item_name" TEXT,
  "quantity" INTEGER
);

CREATE TABLE IF NOT EXISTS "event_ConfirmOrder" (
  "ocel_id" TEXT,
  "ocel_time" TEXT
);

CREATE TABLE IF NOT EXISTS "object_Order" (
  "ocel_id" TEXT,
  "ocel_time" TEXT,
  "ocel_changed_field" TEXT,
  "status" TEXT
);

CREATE TABLE IF NOT EXISTS "object_Item" (
  "ocel_id" TEXT,
  "ocel_time" TEXT,
  "ocel_changed_field" TEXT,
  "name" TEXT,
  "quantity" INTEGER
);

-- Insert events
INSERT INTO event VALUES
  ('e1', 'Create Order'),
  ('e2', 'Add Item'),
  ('e3', 'Add Item'),
  ('e4', 'Confirm Order'),
  ('e5', 'Create Order'),
  ('e6', 'Add Item'),
  ('e7', 'Confirm Order');

-- Insert objects
INSERT INTO object VALUES
  ('o1', 'Order'),
  ('o2', 'Order'),
  ('i1', 'Item'),
  ('i2', 'Item'),
  ('i3', 'Item');

-- Insert event-object relationships
INSERT INTO event_object VALUES
  ('e1', 'o1', 'order'),
  ('e2', 'o1', 'order'),
  ('e2', 'i1', 'item'),
  ('e3', 'o1', 'order'),
  ('e3', 'i2', 'item'),
  ('e4', 'o1', 'order'),
  ('e5', 'o2', 'order'),
  ('e6', 'o2', 'order'),
  ('e6', 'i3', 'item'),
  ('e7', 'o2', 'order');

-- Insert event details
INSERT INTO event_CreateOrder VALUES
  ('e1', '2024-01-15 09:00:00', 0),
  ('e5', '2024-01-15 10:00:00', 0);

INSERT INTO event_AddItem VALUES
  ('e2', '2024-01-15 09:15:00', 'Widget', 5),
  ('e3', '2024-01-15 09:20:00', 'Gadget', 3),
  ('e6', '2024-01-15 10:10:00', 'Doohickey', 10);

INSERT INTO event_ConfirmOrder VALUES
  ('e4', '2024-01-15 09:30:00'),
  ('e7', '2024-01-15 10:20:00');

-- Insert object lifecycle
INSERT INTO object_Order VALUES
  ('o1', '2024-01-15 09:00:00', NULL, 'created'),
  ('o1', '2024-01-15 09:30:00', 'status', 'confirmed'),
  ('o2', '2024-01-15 10:00:00', NULL, 'created'),
  ('o2', '2024-01-15 10:20:00', 'status', 'confirmed');

INSERT INTO object_Item VALUES
  ('i1', '2024-01-15 09:15:00', NULL, 'Widget', 5),
  ('i2', '2024-01-15 09:20:00', NULL, 'Gadget', 3),
  ('i3', '2024-01-15 10:10:00', NULL, 'Doohickey', 10);

COMMIT;
""")

print(f"✓ Database created at: {db_path}")

print("\n=== Query 1: All Events ===\n")
results = cursor.execute("SELECT * FROM event").fetchall()
for row in results:
    print(f"  {row[0]}: {row[1]}")

print("\n=== Query 2: Event-Object Relationships ===\n")
results = cursor.execute("""
    SELECT
        e.ocel_id,
        e.ocel_type,
        eo.ocel_object_id,
        o.ocel_type as object_type
    FROM event e
    JOIN event_object eo ON e.ocel_id = eo.ocel_event_id
    JOIN object o ON eo.ocel_object_id = o.ocel_id
    ORDER BY e.ocel_id
""").fetchall()
print(f"  {'Event':<8} {'Event Type':<15} {'Object':<8} {'Object Type':<10}")
print("  " + "-" * 50)
for row in results:
    print(f"  {row[0]:<8} {row[1]:<15} {row[2]:<8} {row[3]:<10}")

print("\n=== Query 3: Objects per Event ===\n")
results = cursor.execute("""
    SELECT
        e.ocel_id,
        e.ocel_type,
        COUNT(DISTINCT eo.ocel_object_id) as object_count
    FROM event e
    JOIN event_object eo ON e.ocel_id = eo.ocel_event_id
    GROUP BY e.ocel_id, e.ocel_type
    ORDER BY object_count DESC
""").fetchall()
print(f"  {'Event':<8} {'Type':<15} {'Object Count':<12}")
print("  " + "-" * 40)
for row in results:
    print(f"  {row[0]:<8} {row[1]:<15} {row[2]:<12}")

print("\n=== Query 4: Order Lifecycle ===\n")
results = cursor.execute("""
    SELECT
        o.ocel_id,
        o.ocel_time,
        o.status,
        o.ocel_changed_field
    FROM object_Order o
    ORDER BY o.ocel_id, o.ocel_time
""").fetchall()
print(f"  {'Order':<8} {'Time':<20} {'Status':<12} {'Changed Field':<15}")
print("  " + "-" * 60)
for row in results:
    print(f"  {row[0]:<8} {row[1]:<20} {row[2]:<12} {row[3] or 'N/A':<15}")

print("\n=== Query 5: Complete Order Details ===\n")
results = cursor.execute("""
    SELECT
        o.ocel_id,
        GROUP_CONCAT(DISTINCT e.ocel_type) as activities,
        COUNT(DISTINCT CASE WHEN obj.ocel_type = 'Item' THEN obj.ocel_id END) as item_count,
        oo.status
    FROM object o
    JOIN event_object eo ON o.ocel_id = eo.ocel_object_id
    JOIN event e ON eo.ocel_event_id = e.ocel_id
    LEFT JOIN event_object eo2 ON e.ocel_id = eo2.ocel_event_id
    LEFT JOIN object obj ON eo2.ocel_object_id = obj.ocel_id AND obj.ocel_type = 'Item'
    LEFT JOIN (
        SELECT ocel_id, status
        FROM object_Order
        WHERE ocel_changed_field = 'status' OR ocel_changed_field IS NULL
        GROUP BY ocel_id HAVING MAX(ocel_time)
    ) oo ON o.ocel_id = oo.ocel_id
    WHERE o.ocel_type = 'Order'
    GROUP BY o.ocel_id
""").fetchall()
print(f"  {'Order':<8} {'Activities':<40} {'Items':<8} {'Status':<10}")
print("  " + "-" * 70)
for row in results:
    print(f"  {row[0]:<8} {row[1]:<40} {row[2]:<8} {row[3]:<10}")

print("\n=== Query 6: Item Details ===\n")
results = cursor.execute("""
    SELECT
        i.ocel_id,
        i.name,
        i.quantity,
        COUNT(DISTINCT eo.ocel_event_id) as events_involved
    FROM object_Item i
    LEFT JOIN event_object eo ON i.ocel_id = eo.ocel_object_id
    GROUP BY i.ocel_id, i.name, i.quantity
    ORDER BY i.quantity DESC
""").fetchall()
print(f"  {'Item':<8} {'Name':<15} {'Quantity':<10} {'Events':<8}")
print("  " + "-" * 45)
for row in results:
    print(f"  {row[0]:<8} {row[1]:<15} {row[2]:<10} {row[3]:<8}")

conn.close()

print("\n✓ Analysis complete!\n")
