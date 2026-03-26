# Pathfinding Graph Validation Report

## Executive Summary

A BFS (Breadth-First Search) analysis was conducted on all three floor graphs
(`p1.csv`, `p2.csv`, `p3.csv`). The analysis found **15 issues on Floor 1** and
**1 issue on Floor 3**, causing 5 rooms to be completely unreachable from the main
entrance. All issues have been corrected and `finalFilter.json` has been regenerated
with valid shortest paths for every destination.

---

## Pre-Fix State

| Floor | Total Nodes | Reachable | **Unreachable** | Broken Refs | Duplicate IDs | Self-Refs |
|-------|-------------|-----------|-----------------|-------------|---------------|-----------|
| Floor 1 (p1) | 174 | 169 | **5** | 7 | 2 | 1 |
| Floor 2 (p2) | 69  | 69  | 0               | 0           | 0             | 0         |
| Floor 3 (p3) | 61  | 61  | 0               | 1           | 0             | 0         |

---

## Issues Found and Fixed

### Floor 1 — `p1.csv`

#### 1. Duplicate node ID `032`
- **Problem**: Two distinct nodes shared the ID `032`:
  - `032,C,1159.9,310.1,1,56` (corridor connector for node 56)
  - `032,PL,809.9,310.1,1,65` (parking-lot node near node 65)
  - Python's dict kept only the **last** entry, silently dropping one node.
- **Fix**: Renamed the PL-type node from `032` to `032A`; updated node 65's connection
  list from `032` → `032A`.

#### 2. Duplicate node ID `040`
- **Problem**: Two connector nodes shared the ID `040`:
  - `040,C,679.7,716.1,1,77` (connector for node 77)
  - `040,C,632.8,713.3,1,82` (connector for node 82)
  - The second definition overwrote the first in any dict-based graph, making
    node 82's connector unreachable.
- **Fix**: Renamed the second occurrence to `040B`; updated node 82's connection
  list from `040` → `040B`.

#### 3. Malformed line for node `082B`
- **Problem**: Missing comma between the Type and X fields:
  `082B,C585.9,942.2,1,126` — field 1 was `C585.9` instead of `C`.
- **Fix**: Split field 1 into type `C` and x-coordinate `585.9`.

#### 4. Node `45` → broken reference `047`
- **Problem**: Node 45's connection list included `047`, but the actual node ID
  is `47` (no leading zero).
- **Fix**: Replaced `047` with `47` in node 45's connection list.
- **Impact**: Without this fix, the link from the corridor (45) to the library
  wing (47) was invisible to BFS.

#### 5. Node `47` → broken reference `015`
- **Problem**: Node 47 referenced `015` but the library node ID is `015A`.
- **Fix**: Replaced `015` with `015A` in node 47's connection list.
- **Impact**: `015A` (Library) was **unreachable**; fixed by this change.

#### 6. Node `52` → broken reference `0AA`
- **Problem**: Node 52 referenced `0AA` but the node ID is `0AO`.
- **Fix**: Replaced `0AA` with `0AO` in node 52's connection list.
- **Impact**: `0AO` (AO-type room) was **unreachable**; fixed by this change.

#### 7. Node `65` → broken reference `0027`
- **Problem**: Node 65 referenced `0027` but the nodes are named `0027A` and `0027B`.
- **Fix**: Replaced `0027` with `0027A` in node 65's connection list.

#### 8. Node `92` → broken reference `051A`
- **Problem**: Node 92's connection list contained `051A`. However, `051A` is the
  connector for node 89/87 (a different corridor branch). The correct connector
  for node 92 is `051`.
- **Fix**: Replaced `051A` with `051` in node 92's connection list.
- **Impact**: `051` (connector for node 92) was **unreachable**; fixed.

#### 9. Node `98` → broken reference `065`
- **Problem**: Node 98 referenced `065`, but the node ID contains a slash: `065/64`.
- **Fix**: Replaced `065` with `065/64` in node 98's connection list.
- **Impact**: `065/64` was **unreachable**; fixed.

#### 10. Node `126` → broken reference `81E-H`
- **Problem**: Node 126 referenced `81E-H`; the correct node ID is `081E-H`
  (with a leading zero).
- **Fix**: Replaced `81E-H` with `081E-H` in node 126's connection list.
- **Impact**: `081E-H` was **unreachable**; fixed.

#### 11. Node `142` → broken reference `3`
- **Problem**: Node 142's connection list was `3,3,124,071,144` (connection count=3,
  connections=`3`,`124`,`071`). The node ID `3` does not exist in p1.csv. The
  fourth entry `144` (which does exist and references 142 bidirectionally) was
  silently ignored because the count field said only 3 connections.
- **Fix**: Replaced the erroneous first entry `3` with `144`, giving correct
  connections `144`, `124`, `071`.

#### 12. Node `102` → self-reference
- **Problem**: `102,A,452.9,884.8,5,102,103,084A,084B,119` — node 102 listed
  itself as a neighbour.
- **Fix**: Removed the self-reference and decremented the count from 5 to 4.

---

### Floor 2 — `p2.csv`

#### 13. Nodes `0223` and `0224` — missing Type field
- **Problem**: Rows for `0223` and `0224` were missing the Type column:
  `0223,1475,256,1,20` instead of `0223,C,1475,256,1,20`.
  CSV parsers would interpret the x-coordinate as the type, shifting all
  subsequent fields and producing incorrect coordinate data.
- **Fix**: Inserted the `C` (connector) type in the second field for both nodes.
- **Note**: Connectivity was not broken (the parser happened to read the correct
  connection IDs from the shifted fields), but coordinate data was wrong.

---

### Floor 3 — `p3.csv`

#### 14. Node `26` → broken reference `28`
- **Problem**: Node 26 referenced non-existent node `28`. The intended connection
  is to node `29` (which already connects back to node 26 bidirectionally).
- **Fix**: Replaced `28` with `29` in node 26's connection list.
- **Note**: Because node 29 already listed node 26 as a neighbour, BFS could
  reach node 26 via node 29 even before this fix. The broken `28` reference was
  nonetheless corrected for graph consistency.

---

### `classes.json` — ID Mismatches (Floor 1 Destinations)

Four destination IDs in `classes.json` did not match the actual node IDs in `p1.csv`,
causing those rooms to be silently skipped when regenerating `finalFilter.json`:

| Incorrect ID in classes.json | Correct node ID in p1.csv |
|------------------------------|---------------------------|
| `27`   | `027`   |
| `0127` | `01027` |
| `027A` | `0027A` |
| `027B` | `0027B` |

**Fix**: Updated the four entries in `classes.json` floor-1 array to match the
CSV node IDs.

---

## Post-Fix State

| Floor | Total Nodes | Reachable | Unreachable | Broken Refs | Duplicate IDs | Self-Refs |
|-------|-------------|-----------|-------------|-------------|---------------|-----------|
| Floor 1 (p1) | 176 | **176** | **0** | **0** | **0** | **0** |
| Floor 2 (p2) | 69  | 69  | 0 | 0 | 0 | 0 |
| Floor 3 (p3) | 61  | 61  | 0 | 0 | 0 | 0 |

All 306 nodes across the three floors are now reachable from their respective
entrance node `"0"`.

---

## `finalFilter.json` Regeneration

`finalFilter.json` was regenerated using **Dijkstra's algorithm** (Euclidean distance
as edge weight), guaranteeing true shortest paths rather than arbitrary BFS paths.

| Floor | Paths Generated | Paths Skipped |
|-------|-----------------|---------------|
| Floor 1 | 106 | 0 |
| Floor 2 | 42  | 0 |
| Floor 3 | 41  | 0 |

**Total: 189 paths** (all destinations reachable).

---

## Remaining Non-Critical Notes

The following **missing bidirectional connections** were detected after fixes.
These do **not** prevent any node from being reached (BFS can still traverse to
every node), but they represent inconsistencies in the original data that could
cause one-way corridor behaviour in certain graph-traversal scenarios:

- **Floor 1**: `22↔23`, `36↔0123`, `43↔44`, `44↔33`, `0027B↔0027A`,
  `97↔102`, `119↔084B`, `170↔168`
- **Floor 2**: `3↔1`, `18↔17`
- **Floor 3**: `4↔0304`, `26↔24`, `34↔29`

These were left as-is to minimise data changes; Dijkstra's algorithm and the
frontend's fallback search handle one-way edges correctly.

---

## Deliverables

| File | Description |
|------|-------------|
| `client/Pathfinding/bfs_validator.py` | Validates all floor graphs; reports broken refs, duplicates, unreachable nodes |
| `client/Pathfinding/connection_fixer.py` | Applies all fixes to CSVs and regenerates `finalFilter.json` |
| `client/public/p1.csv` | Corrected Floor 1 graph (13 fixes applied) |
| `client/public/p2.csv` | Corrected Floor 2 graph (missing Type fields added) |
| `client/public/p3.csv` | Corrected Floor 3 graph (broken reference fixed) |
| `client/public/finalFilter.json` | Regenerated shortest paths (189 total, 0 skipped) |
| `classes.json` | Fixed 4 destination ID mismatches for Floor 1 |
| `validation_report.md` | This document |
