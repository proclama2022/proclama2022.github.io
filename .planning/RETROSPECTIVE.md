# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v3.1 — Gap Closure

**Shipped:** 2026-03-16
**Phases:** 2 | **Plans:** 3 | **Sessions:** 3

### What Was Built
- Green Thumb Badge Progress — Dual-layer alias mapping fixing frontend/DB badge key mismatch
- Weekend Warrior Badge — Full-stack: migration, RPC, UI, i18n, auto-awarding
- Badge System Patterns — Reusable RPC patterns for future badge work

### What Worked
- Dual-layer approach (frontend + DB) for aliasing provides defense in depth
- Non-blocking badge checks on app open — good UX, no perceived latency
- Phase 22 was verification-only since requirements were pre-existing from v3.0 — efficient

### What Was Inefficient
- Phase 22 had 0 code changes (requirements pre-existing) — could have been merged into Phase 23 or skipped
- MILESTONES.md entry was incomplete on first archival pass (no accomplishments) — required second pass

### Patterns Established
- Badge key alias mapping: `BADGE_KEY_ALIASES` constant in BadgeGrid for display key → DB key translation
- RPC pattern: `check_*_eligibility()` returns BOOLEAN, `get_badge_progress()` returns current/target
- ISO week calculation for weekend logic: `date_trunc('week', date) + 5 (Sat) / + 6 (Sun)`

### Key Lessons
1. Badge key naming consistency matters — mismatch between DB keys and frontend display keys causes invisible bugs (no crash, just missing data)
2. Small milestones (2 phases) are fast to ship but the overhead-to-value ratio is higher
3. Pre-existing requirements should be verified before creating a separate phase

### Cost Observations
- Model mix: ~67% sonnet, ~33% haiku (balanced profile)
- Sessions: 3
- Notable: Very efficient milestone — total ~10 min of active coding

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 MVP | ~10 | 3 | Initial project setup |
| v1.1 Enhanced Plant Detail | ~5 | 1 | Faster phase execution |
| v1.2 Multi-Photo + Reminders | ~6 | 2 | Multi-phase coordination |
| v1.3 Enhanced UX | ~4 | 4 | Direct execution without formal planning |
| v2.0 Community | ~5 | 1 | Supabase integration |
| v2.1 Smart Features | ~8 | 4 | Complex multi-feature |
| v3.0 Gamification 2.0 | ~12 | 5 | Largest milestone, system design |
| v3.1 Gap Closure | 3 | 2 | Small targeted gap fix |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v3.1 | 0 | N/A | 0 |

### Top Lessons (Verified Across Milestones)

1. Small, targeted milestones ship faster — v3.1 (2 phases) completed in 3 sessions vs v3.0 (5 phases) in 12
2. Verification-only phases are efficient when requirements pre-exist — avoid unnecessary rework
3. RPC-based badge pattern is reusable for future badge additions
