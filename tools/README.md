# YVON Engine — Tools Reference

Each tool can be run via the YVON CLI or directly from this directory.

## CLI Commands (recommended)

```bash
npx yvon doctor         # Full health check
npx yvon integrate      # Wire engine into project (safe, non-destructive)
npx yvon graph          # Rebuild knowledge graphs
npx yvon init           # Initialize new project structure
npx yvon dashboard      # Open live dashboard (port 4200)
```

## Bash Tools (direct execution)

| Tool | Purpose | When to use |
|------|---------|-------------|
| `yvon-doctor` | Full health check: engine, .toon/, v3, schemas, graphs, CIE wiring, build | Any time you want to verify system health |
| `yvon-graph` | Detect graph tools → run them → absorb output into `.toon/graphs/` | After `npm update graphify` or new code |
| `yvon-absorb` | Safe migration: compress originals → `.toon/`, archive originals | When ready to switch to `.toon/` as source of truth |
| `yvon-rollback` | Restore originals from `.toon/.archive/<timestamp>/` | If absorption caused issues |
| `yvon-sync` | Bidirectional sync: keep originals ↔ `.toon/` in sync | During development when both sources are needed |
| `yvon-clean` | Remove empty dirs, deduplicate agent folders, rebuild engine.bin | Periodic maintenance |
| `yvon-reindex` | Recompile `.toon/v3/engine.bin` from current `.toon/` tree | After syncing new content |

## Common Workflows

### Fresh install
```bash
npm install yvon-engine          # auto-runs postinstall (integrate + init)
npx yvon doctor                  # verify
bash tools/yvon-graph            # build graphs
bash tools/yvon-sync --once      # initial sync
```

### Update graph tools
```bash
npm update graphify
pip install --upgrade code-review-graph
bash tools/yvon-graph --rebuild
bash tools/yvon-reindex
```

### Migrate to .toon/ as source of truth
```bash
bash tools/yvon-absorb --dry-run  # preview
bash tools/yvon-absorb             # apply
npm run build                      # verify
bash tools/yvon-doctor             # health check
```

### Rollback migration
```bash
bash tools/yvon-rollback           # list available snapshots
bash tools/yvon-rollback 2026-06-12_143000  # restore specific snapshot
npm run build                      # verify
```

### Development (keep both in sync)
```bash
bash tools/yvon-sync --watch &     # auto-sync originals → .toon/ every 30s
npm run dev                        # develop normally
# ... make changes to agent-department/ docs/ etc ...
# sync keeps .toon/ updated automatically
```
