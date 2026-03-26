#!/usr/bin/env python3
"""
Connection Fixer for hallway navigation graph.

Applies targeted fixes to p1.csv, p2.csv, p3.csv (broken references,
duplicate node IDs, self-references), then regenerates finalFilter.json
using Dijkstra shortest-path from the entrance on each floor.

Usage:
    python connection_fixer.py
Run from the repository root directory.
"""

import csv
import heapq
import json
import os
from math import sqrt

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(_HERE, "..", "public")
REPO_ROOT = os.path.join(_HERE, "..", "..")

P1_CSV = os.path.join(PUBLIC_DIR, "p1.csv")
P2_CSV = os.path.join(PUBLIC_DIR, "p2.csv")
P3_CSV = os.path.join(PUBLIC_DIR, "p3.csv")
FILTER_JSON = os.path.join(PUBLIC_DIR, "finalFilter.json")
CLASSES_JSON = os.path.join(REPO_ROOT, "classes.json")


# ---------------------------------------------------------------------------
# CSV helpers
# ---------------------------------------------------------------------------

def _read_rows(filepath):
    """Return (header_row, data_rows) as lists of string lists."""
    with open(filepath, "r", newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows:
        return [], []
    return rows[0], rows[1:]


def _write_rows(filepath, header, data_rows):
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for row in data_rows:
            writer.writerow(row)


def _replace_conn(row, old_id, new_id):
    """Replace *old_id* with *new_id* inside a node row's connection fields."""
    try:
        count = int(row[4])
    except (IndexError, ValueError):
        return row
    new_row = list(row)
    for i in range(5, 5 + count):
        if i < len(new_row) and new_row[i].strip() == old_id:
            new_row[i] = new_id
    return new_row


def _remove_self_ref(row):
    """Remove any connection that points to the row's own node ID."""
    node_id = row[0].strip()
    try:
        count = int(row[4])
    except (IndexError, ValueError):
        return row
    conns = [row[i] for i in range(5, 5 + count) if i < len(row)]
    filtered = [c for c in conns if c.strip() != node_id]
    new_row = list(row[:5]) + filtered
    new_row[4] = str(len(filtered))
    return new_row


# ---------------------------------------------------------------------------
# Fix p1.csv
# ---------------------------------------------------------------------------

def fix_p1(filepath):
    """
    Known issues in p1.csv
    ──────────────────────
    1. Duplicate node '032': rename PL-type occurrence to '032A';
       update node 65's connection list accordingly.
    2. Duplicate node '040': rename the second occurrence (C-type for node 82)
       to '040B'; update node 82's connection list to reference '040B'.
    2c. Malformed '082B' line: 'C585.9' in field 1 → split into type='C', x='585.9'.
    3. Node 45 references '047'  → correct to '47'
    4. Node 47 references '015'  → correct to '015A'
    5. Node 52 references '0AA'  → correct to '0AO'
    6. Node 65 references '0027' → correct to '0027A'
    7. Node 92 references '051A' → correct to '051'
       (node 92's connector is '051', not '051A' which belongs to node 89)
    8. Node 98 references '065'  → correct to '065/64'
    9. Node 126 references '81E-H' → correct to '081E-H'
    10. Node 142 references '3'  → correct to '144'
        (count is 3: connections are '3','124','071'; fix first entry)
    11. Node 102 has self-reference → remove it, decrement count.
    """
    header, rows = _read_rows(filepath)
    fixed = []

    # Track whether we have already seen the '032' PL node
    first_032_seen = False
    # Track whether we have already seen the '040' C node
    first_040_seen = False

    for row in rows:
        if not row:
            fixed.append(row)
            continue

        node_id = row[0].strip()

        # ── Fix 1: duplicate '032' ────────────────────────────────────────
        if node_id == "032":
            node_type = row[1].strip() if len(row) > 1 else ""
            if node_type == "PL":
                # Rename PL occurrence to '032A'
                row = ["032A"] + list(row[1:])
                node_id = "032A"
            # The C-type connector (for node 56) keeps the id '032'.

        # ── Fix 2: duplicate '040' ────────────────────────────────────────
        if node_id == "040":
            if not first_040_seen:
                first_040_seen = True
                # First occurrence belongs to node 77 — keep as '040'
            else:
                # Second occurrence belongs to node 82 — rename to '040B'
                row = ["040B"] + list(row[1:])
                node_id = "040B"

        # ── Fix 2b: node 82 update '040' reference to '040B' ────────────
        # Node 82's own connector was renamed from '040' to '040B'; its
        # connection list must be updated to point to the new ID.
        if node_id == "82":
            row = _replace_conn(row, "040", "040B")

        # ── Fix 2c: malformed '082B' line (missing comma after type) ─────
        # Raw CSV line: "082B,C585.9,942.2,1,126"
        # row[1] == 'C585.9'  →  split into type='C', x='585.9'
        if node_id == "082B":
            if len(row) > 1 and row[1].strip().startswith("C") and len(row[1].strip()) > 1:
                type_x = row[1].strip()
                row = [row[0], "C", type_x[1:]] + list(row[2:])

        # ── Fix 3: node 45 '047' → '47' ──────────────────────────────────
        if node_id == "45":
            row = _replace_conn(row, "047", "47")

        # ── Fix 4: node 47 '015' → '015A' ────────────────────────────────
        if node_id == "47":
            row = _replace_conn(row, "015", "015A")

        # ── Fix 5: node 52 '0AA' → '0AO' ─────────────────────────────────
        if node_id == "52":
            row = _replace_conn(row, "0AA", "0AO")

        # ── Fix 6: node 65 '0027' → '0027A', and '032' → '032A' ──────────
        if node_id == "65":
            row = _replace_conn(row, "0027", "0027A")
            row = _replace_conn(row, "032", "032A")

        # ── Fix 7: node 92 '051A' → '051' ────────────────────────────────
        if node_id == "92":
            row = _replace_conn(row, "051A", "051")

        # ── Fix 8: node 98 '065' → '065/64' ──────────────────────────────
        if node_id == "98":
            row = _replace_conn(row, "065", "065/64")

        # ── Fix 9: node 126 '81E-H' → '081E-H' ───────────────────────────
        if node_id == "126":
            row = _replace_conn(row, "81E-H", "081E-H")

        # ── Fix 10: node 142 '3' → '144' ─────────────────────────────────
        if node_id == "142":
            row = _replace_conn(row, "3", "144")

        # ── Fix 11: node 102 self-reference ──────────────────────────────
        if node_id == "102":
            row = _remove_self_ref(row)

        fixed.append(row)

    _write_rows(filepath, header, fixed)
    print(f"[p1] Wrote {len(fixed)} rows to {filepath}")


# ---------------------------------------------------------------------------
# Fix p2.csv
# ---------------------------------------------------------------------------

def fix_p2(filepath):
    """
    Known issues in p2.csv
    ──────────────────────
    1. Nodes '0223' and '0224' are missing the Type field — their rows have
       the form:  0223,1475,256,1,20
       Should be: 0223,C,1475,256,1,20
    """
    header, rows = _read_rows(filepath)
    fixed = []

    for row in rows:
        if not row:
            fixed.append(row)
            continue

        node_id = row[0].strip()

        # Detect rows with missing Type (only 5 fields instead of 6+)
        # Pattern: second field looks like a coordinate (numeric, > 100)
        if node_id in ("0223", "0224"):
            if len(row) >= 2:
                try:
                    float(row[1])
                    # row[1] is a number → Type field is missing; insert 'C'
                    row = [row[0], "C"] + row[1:]
                except ValueError:
                    pass  # Type field already present

        fixed.append(row)

    _write_rows(filepath, header, fixed)
    print(f"[p2] Wrote {len(fixed)} rows to {filepath}")


# ---------------------------------------------------------------------------
# Fix p3.csv
# ---------------------------------------------------------------------------

def fix_p3(filepath):
    """
    Known issues in p3.csv
    ──────────────────────
    1. Node 26 references non-existent node '28'. Node 29 already connects
       to 26 bidirectionally; updating 26's broken '28' reference to '29'
       restores the correct two-way link.
    """
    header, rows = _read_rows(filepath)
    fixed = []

    for row in rows:
        if not row:
            fixed.append(row)
            continue

        node_id = row[0].strip()

        # Fix: node 26 '28' → '29'
        if node_id == "26":
            row = _replace_conn(row, "28", "29")

        fixed.append(row)

    _write_rows(filepath, header, fixed)
    print(f"[p3] Wrote {len(fixed)} rows to {filepath}")


# ---------------------------------------------------------------------------
# Graph builder (post-fix)
# ---------------------------------------------------------------------------

def build_graph(filepath):
    """
    Parse a (fixed) CSV and return (node_map, adjacency).
    node_map : node_id -> [id, type, x_str, y_str, count_str, ...]
    adjacency: node_id -> list[neighbor_id]
    """
    node_map = {}
    adjacency = {}

    with open(filepath, "r", newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if not row or not row[0].strip():
                continue
            nid = row[0].strip()
            try:
                count = int(row[4].strip())
            except (IndexError, ValueError):
                count = 0
            conns = [c.strip() for c in row[5 : 5 + count] if c.strip()]
            node_map[nid] = [v.strip() for v in row]
            adjacency[nid] = conns

    return node_map, adjacency


# ---------------------------------------------------------------------------
# Dijkstra shortest path
# ---------------------------------------------------------------------------

def _edge_weight(node_map, u, v):
    try:
        ux, uy = float(node_map[u][2]), float(node_map[u][3])
        vx, vy = float(node_map[v][2]), float(node_map[v][3])
        return sqrt((vx - ux) ** 2 + (vy - uy) ** 2)
    except (IndexError, ValueError):
        return 1.0


def dijkstra(adjacency, node_map, start="0"):
    """Return (dist, prev) dicts from *start* using Euclidean edge weights."""
    inf = float("inf")
    dist = {start: 0.0}
    prev = {start: None}
    pq = [(0.0, start)]

    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, inf):
            continue
        for v in adjacency.get(u, []):
            if v not in node_map:
                continue
            nd = d + _edge_weight(node_map, u, v)
            if nd < dist.get(v, inf):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(pq, (nd, v))

    return dist, prev


def shortest_path(prev, start, end):
    """Reconstruct the path list from *start* to *end* using *prev*."""
    if end not in prev:
        return None
    path = []
    cur = end
    while cur is not None:
        path.append(cur)
        cur = prev.get(cur)
    path.reverse()
    if path[0] != start:
        return None
    return path


# ---------------------------------------------------------------------------
# Regenerate finalFilter.json
# ---------------------------------------------------------------------------

def regenerate_filter(p1_csv, p2_csv, p3_csv, classes_json, out_json):
    """
    Build shortest-path arrays for every destination in classes.json and
    write the result to *out_json*.

    classes.json is a list of three lists, one per floor, each containing
    the destination node IDs for that floor.
    """
    with open(classes_json, "r", encoding="utf-8") as f:
        all_floors = json.load(f)

    csvs = [p1_csv, p2_csv, p3_csv]
    all_connections = []

    for floor_idx, (csv_path, dest_ids) in enumerate(zip(csvs, all_floors)):
        node_map, adjacency = build_graph(csv_path)
        _, prev = dijkstra(adjacency, node_map, start="0")

        floor_paths = []
        skipped = []

        for dest in dest_ids:
            path = shortest_path(prev, "0", dest)
            if path:
                floor_paths.append(path)
            else:
                skipped.append(dest)

        if skipped:
            print(
                f"[Floor {floor_idx + 1}] Could not find paths to "
                f"{len(skipped)} destination(s): {skipped}"
            )

        print(
            f"[Floor {floor_idx + 1}] Generated {len(floor_paths)} paths "
            f"(skipped {len(skipped)})"
        )
        all_connections.append(floor_paths)

    output = {"connections": all_connections}
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote regenerated finalFilter.json → {out_json}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Applying CSV fixes …\n")

    fix_p1(P1_CSV)
    fix_p2(P2_CSV)
    fix_p3(P3_CSV)

    print("\nRegenerating finalFilter.json …\n")
    regenerate_filter(P1_CSV, P2_CSV, P3_CSV, CLASSES_JSON, FILTER_JSON)

    print("\nDone.  Run bfs_validator.py to confirm all issues are resolved.")


if __name__ == "__main__":
    main()
