# Roadmap: Plantid v3.1 Gap Closure

**Created:** 2026-03-13
**Milestone:** v3.1 Gap Closure
**Granularity:** standard

## Overview

Chiudere tutti i gap rimanenti da v3.0 Gamification 2.0: Level Titles, XP Progress Bar, e due badge estesi (Green Thumb, Weekend Warrior).

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-02-20)
- ✅ **v1.1 Enhanced Plant Detail** - Phase 4 (shipped 2026-02-24)
- ✅ **v1.2 Multi-Photo Gallery + Custom Reminders** - Phases 5-6 (shipped 2026-02-25)
- ✅ **v1.3 Enhanced UX** - Phases 7-10 (shipped 2026-02-26)
- ✅ **v2.0 Community** - Phases 11-12 (shipped 2026-03-04)
- ✅ **v2.1 Smart Features** - Phases 13-16 (shipped 2026-03-09)
- ✅ **v3.0 Gamification 2.0** - Phases 17-21 (shipped 2026-03-12)
- 🔄 **v3.1 Gap Closure** - Phases 22-23 (current)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)
- v3.1 starts at Phase 22 (v3.0 ended at Phase 21)

- [x] **Phase 22: Level Titles + XP Bar** - Display user level with title and XP progress in profile/leaderboard
- [x] **Phase 23: Extended Badges** - Implement Green Thumb and Weekend Warrior badges with progress tracking (completed 2026-03-16)

---

## Phase Details

### Phase 22: Level Titles + XP Bar

**Goal:** Users see their level as a meaningful title (Seedling to Legend) with visual XP progress toward the next level.

**Depends on:** Phase 21 (Gamification UI from v3.0)

**Requirements:** TITL-01, TITL-02, TITL-03, TITL-04, GMUI-02

**Success Criteria** (what must be TRUE):
1. User sees their current level displayed as a title (e.g., "Gardener", "Expert") in the profile header
2. User sees an XP progress bar showing current XP and XP needed for next level in the profile header
3. User sees level titles next to names in leaderboard entries
4. User receives a toast notification when their title changes on level-up
5. All 6 titles are correctly mapped to level ranges: Seedling (1-5), Sprout (6-10), Gardener (11-20), Expert (21-35), Master (36-50), Legend (51+)

**Plans:** 1 plan (verification only - all requirements pre-existing)

---

### Phase 23: Extended Badges

**Goal:** Users can earn two additional badges that reward consistent care habits (7-day watering streak) and weekend dedication.

**Depends on:** Phase 22 (builds on gamification foundation)

**Requirements:** BADG-02, BADG-06

**Success Criteria** (what must be TRUE):
1. User earns "Green Thumb" badge automatically when reaching a 7-day consecutive watering streak
2. User earns "Weekend Warrior" badge when completing all care tasks (watering + any scheduled reminders) on both Saturday and Sunday of the same week
3. User sees badge progress indicator for each badge (e.g., "5/7 days" for Green Thumb)
4. Badge unlock triggers celebration animation and toast notification
5. Badges appear in the gamification hub badge grid with earned/unearned state

**Plans:** 2/2 plans complete

Plans:
- [ ] 23-01-PLAN.md — Verify/fix Green Thumb badge progress display (BADG-02)
- [ ] 23-02-PLAN.md — Implement Weekend Warrior badge with full stack (BADG-06)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 22. Level Titles + XP Bar | v3.1 | 1/1 | ✅ Complete | 2026-03-13 |
| 23. Extended Badges | 2/2 | Complete    | 2026-03-16 | - |

---

## Coverage Validation

| Requirement | Phase | Category |
|-------------|-------|----------|
| TITL-01 | Phase 22 | Level Titles |
| TITL-02 | Phase 22 | Level Titles |
| TITL-03 | Phase 22 | Level Titles |
| TITL-04 | Phase 22 | Level Titles |
| GMUI-02 | Phase 22 | XP Progress |
| BADG-02 | Phase 23 | Extended Badges |
| BADG-06 | Phase 23 | Extended Badges |

**Coverage:** 7/7 requirements mapped (100%)

---

*Roadmap created: 2026-03-13*
*Roadmap updated: 2026-03-13*
