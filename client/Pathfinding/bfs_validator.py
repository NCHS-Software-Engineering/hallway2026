#!/usr/bin/env python3
"""
BFS Validator for hallway navigation graph.

Validates p1.csv, p2.csv, and p3.csv for connectivity issues:
  - Broken connection references (point to non-existent nodes)
  - Duplicate node IDs
  - Self-referencing nodes
  - Unreachable rooms (not reachable via BFS from entrance node "0")
  - Missing bidirectional connections

Usage:
    python bfs_validator.py
Run from the repository root directory.
"""

import csv
import json
import os
from collections import deque, defaultdict


def parse_csv(filepath):
    """Parse a floor CSV and return (node_map, adjacency, parse_warnings)."""
    node_map = {}      # node_id -> list of all CSV fields
    adjacency = {}     # node_id -> list of connected node IDs
    warnings = []

    try:
        with open(filepath, "r", newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader)  # skip header row
            for lineno, row in enumerate(reader, start=2):
                if not row or not row[0].strip():
                    continue

                node_id = row[0].strip()

                if len(row) < 5:
                    warnings.append(
                        f"Line {lineno}: too few fields ({len(row)}): {row}"
                    )
                    continue

                try:
                    num_conns = int(row[4].strip())
                except ValueError:
                    warnings.append(
                        f"Line {lineno}: node '{node_id}' has non-integer "
                        f"connection count '{row[4].strip()}'"
                    )
                    num_conns = 0

                conns = [c.strip() for c in row[5 : 5 + num_conns] if c.strip()]

                if node_id in node_map:
                    warnings.append(
                        f"Line {lineno}: duplicate node ID '{node_id}' — "
                        f"previous entry will be overwritten"
                    )

                node_map[node_id] = [v.strip() for v in row]
                adjacency[node_id] = conns

    except FileNotFoundError:
        warnings.append(f"File not found: {filepath}")
    except Exception as exc:
        warnings.append(f"Error parsing {filepath}: {exc}")

    return node_map, adjacency, warnings


def bfs(adjacency, node_map, start="0"):
    """BFS from *start*; only traverse edges that lead to known nodes."""
    if start not in node_map:
        return set(), {}

    visited = {start}
    parent = {start: None}
    queue = deque([start])

    while queue:
        cur = queue.popleft()
        for nbr in adjacency.get(cur, []):
            if nbr in node_map and nbr not in visited:
                visited.add(nbr)
                parent[nbr] = cur
                queue.append(nbr)

    return visited, parent


def find_duplicate_ids(filepath):
    """Scan the raw file and return a list of duplicate node IDs."""
    seen = []
    duplicates = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if not row or not row[0].strip():
                continue
            nid = row[0].strip()
            if nid in seen:
                duplicates.append(nid)
            else:
                seen.append(nid)
    return duplicates


def validate(filepath, floor_name):
    """Validate one floor's graph and return a result dict."""
    node_map, adjacency, parse_warnings = parse_csv(filepath)
    all_nodes = set(node_map.keys())

    # Duplicate IDs
    duplicates = find_duplicate_ids(filepath)

    # Broken references: connection points to non-existent node
    broken_refs = []
    for nid, conns in adjacency.items():
        for c in conns:
            if c not in all_nodes:
                broken_refs.append((nid, c))

    # Self-references
    self_refs = [nid for nid, conns in adjacency.items() if nid in conns]

    # Missing bidirectional connections
    missing_bidi = []
    for nid, conns in adjacency.items():
        for c in conns:
            if c in all_nodes and nid not in adjacency.get(c, []):
                missing_bidi.append((nid, c))

    # BFS reachability from entrance "0"
    reachable, parent = bfs(adjacency, node_map, start="0")
    unreachable = all_nodes - reachable

    return {
        "floor": floor_name,
        "filepath": filepath,
        "node_map": node_map,
        "adjacency": adjacency,
        "all_nodes": all_nodes,
        "reachable": reachable,
        "unreachable": unreachable,
        "broken_refs": broken_refs,
        "self_refs": self_refs,
        "missing_bidi": missing_bidi,
        "duplicates": duplicates,
        "parse_warnings": parse_warnings,
    }


def print_result(res):
    """Pretty-print a validation result."""
    print(f"\n{'=' * 62}")
    print(f"  {res['floor']}  ({res['filepath']})")
    print(f"{'=' * 62}")
    print(f"  Total nodes    : {len(res['all_nodes'])}")
    print(f"  Reachable      : {len(res['reachable'])}")
    print(f"  Unreachable    : {len(res['unreachable'])}")

    if res["parse_warnings"]:
        print(f"\n  [PARSE WARNINGS] ({len(res['parse_warnings'])})")
        for w in res["parse_warnings"]:
            print(f"    {w}")

    if res["duplicates"]:
        print(f"\n  [DUPLICATE NODE IDs] ({len(res['duplicates'])})")
        for d in res["duplicates"]:
            print(f"    '{d}'")

    if res["broken_refs"]:
        print(f"\n  [BROKEN REFERENCES] ({len(res['broken_refs'])})")
        for nid, bad in res["broken_refs"]:
            print(f"    node '{nid}'  ->  '{bad}'  (does not exist)")

    if res["self_refs"]:
        print(f"\n  [SELF-REFERENCES] ({len(res['self_refs'])})")
        for nid in res["self_refs"]:
            print(f"    node '{nid}' lists itself as a neighbour")

    if res["unreachable"]:
        print(f"\n  [UNREACHABLE NODES] ({len(res['unreachable'])})")
        for nid in sorted(res["unreachable"], key=lambda x: (len(x), x)):
            t = (
                res["node_map"][nid][1]
                if len(res["node_map"][nid]) > 1
                else "?"
            )
            print(f"    '{nid}'  (type={t})")

    if res["missing_bidi"]:
        shown = res["missing_bidi"][:20]
        extra = len(res["missing_bidi"]) - len(shown)
        print(
            f"\n  [MISSING BIDIRECTIONAL CONNECTIONS] "
            f"({len(res['missing_bidi'])})"
        )
        for a, b in shown:
            print(f"    '{a}' -> '{b}' but '{b}' does not list '{a}'")
        if extra > 0:
            print(f"    ... and {extra} more")


def main():
    base = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public"
    )
    floors = [
        ("Floor 1 (p1)", "p1.csv"),
        ("Floor 2 (p2)", "p2.csv"),
        ("Floor 3 (p3)", "p3.csv"),
    ]

    all_results = []
    for floor_name, fname in floors:
        fpath = os.path.join(base, fname)
        res = validate(fpath, floor_name)
        print_result(res)
        all_results.append(res)

    # Summary
    print(f"\n{'=' * 62}")
    print("  SUMMARY")
    print(f"{'=' * 62}")
    for res in all_results:
        total_issues = (
            len(res["duplicates"])
            + len(res["broken_refs"])
            + len(res["self_refs"])
            + len(res["unreachable"])
        )
        print(
            f"  {res['floor']:20s}  "
            f"unreachable={len(res['unreachable']):3d}  "
            f"broken_refs={len(res['broken_refs']):3d}  "
            f"duplicates={len(res['duplicates']):2d}  "
            f"total_issues={total_issues}"
        )

    return all_results


if __name__ == "__main__":
    main()
