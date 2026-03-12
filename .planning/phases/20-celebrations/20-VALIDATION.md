---
phase: 20
slug: celebrations
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + @testing-library/react-native |
| **Config file** | jest.config.js (project root) |
| **Quick run command** | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` |
| **Full suite command** | `npx jest --testPathPattern="(Gamification|gamificationStore)" -x` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x`
- **After every plan wave:** Run `npx jest --testPathPattern="(Gamification|gamificationStore)" -x`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | CELE-01, CELE-02 | unit | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` | ❌ W0 | ⬜ pending |
| 20-01-02 | 01 | 1 | CELE-03 | unit | `npx jest components/Gamification/__tests__/Leaderboard.test.tsx -x` | ✅ existing | ⬜ pending |
| 20-01-03 | 01 | 1 | CELE-04 | unit | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` | ❌ W0 | ⬜ pending |
| 20-01-04 | 01 | 1 | CELE-05 | unit | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` | ❌ W0 | ⬜ pending |
| 20-01-05 | 01 | 1 | CELE-06 | unit | `npx jest stores/__tests__/gamificationStore.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `components/Gamification/__tests__/CelebrationOverlay.test.tsx` — stubs for CELE-01, CELE-02, CELE-04, CELE-05
- [ ] `stores/__tests__/gamificationStore.test.ts` — cooldown logic tests for CELE-06
- [ ] Mock setup for `expo-haptics` and `react-native-confetti-cannon`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Haptic intensity feel | CELE-04 | Device-specific feedback | Physical device test during UAT |
| Confetti visual appeal | CELE-01, CELE-02 | Visual QA | Manual review on device |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
