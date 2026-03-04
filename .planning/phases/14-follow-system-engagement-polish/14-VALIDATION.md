---
phase: 14
slug: follow-system-engagement-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (React Native) |
| **Config file** | `jest.config.js` (existing) |
| **Quick run command** | `npm test -- --testPathPattern="components/__tests__" --passWithNoTests` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="components/__tests__" --passWithNoTests`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | FOLL-04 | integration | `npm test -- --testPathPattern="CommunityFeed"` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | FOLL-04 | unit | `npm test -- --testPathPattern="useCommunityFeed"` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | LIKE-04 | unit | `npm test -- --testPathPattern="LikesList"` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 2 | LIKE-05 | integration | `npm test -- --testPathPattern="ProfileTabs"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `components/__tests__/CommunityFeed.test.tsx` — stubs for FOLL-04
- [ ] `hooks/__tests__/useCommunityFeed.test.ts` — stubs for feed hook
- [ ] `components/__tests__/LikesList.test.tsx` — stubs for LIKE-04
- [ ] `components/__tests__/ProfileTabs.test.tsx` — stubs for LIKE-05

*Existing infrastructure: Jest + React Native Testing Library already configured in project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pull-to-refresh feel | FOLL-04 | Haptic/animation subjective | Verify on device, check spring animation |
| Infinite scroll threshold | FOLL-04 | Timing dependent | Scroll to 80% of list, verify load triggers |
| Like animation pop | LIKE-04 | Animation quality | Tap like on post, verify heart pop |
| Tab transition smooth | LIKE-05 | Animation quality | Switch Profile tabs, verify no jank |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
