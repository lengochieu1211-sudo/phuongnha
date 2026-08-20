# VALIDATION V5.36

- Version: 5.36.0
- Syntax transpile: PASS (82 files, 0 syntax errors)
- Relative import resolver: PASS (0 missing)
- Static public asset refs: PASS (52 refs, 0 missing)
- Character mapping: PASS (9/9 icon + display label)
- Car catalog: PASS (23 unique IDs)
- Track waypoint finite check: PASS (6 tracks × 72 points)
- Ground occlusion check: PASS (decorative terrain is below minimum road height on each non-floating map)
- RaceEngine smoke 1P: PASS
- RaceEngine smoke 2P + local second player: PASS
- Public assets: no individual file > 25 MiB
- GitHub Pages workflow retains `--base=/phuongnha/`
- `assets-source-heavy/` remains gitignored and is excluded from GitHub-ready ZIP.

Build note: node_modules is not present in this container, so the full Vite build cannot be completed here without dependency installation. `tsc --noEmit` diagnostics are exclusively missing external dependencies/types; no non-environment diagnostics were found.
