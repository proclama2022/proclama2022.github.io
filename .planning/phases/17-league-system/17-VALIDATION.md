---
phase: 17
slug: league-system
status: ready_to_plan
created: 2026-03-09
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + react-test-renderer 19.1.0 |
| **Config file** | None detected - default Jest |
| **Quick run command** | `npm test -- --testPathPattern="league" --passWithNoTests` |
| **Full suite command** | `npm test` |

---

## Requirements → Test Map

| Req ID | Behavior | Test Type | Test File | Automated Command |
|--------|----------|-----------|-----------|-------------------|
| LEAG-01 | User assigned to league based on XP | unit | `services/__tests__/leagueService.test.ts` | `npm test -- --testNamePattern="assign"` |
| LEAG-02 | View weekly leaderboard top 30 | unit | `components/Gamification/__tests__/Leaderboard.test.tsx` | `npm test -- --testNamePattern="league"` |
| LEAG-03 | Top 10 promote at week end | integration | `services/__tests__/leaguePromotion.test.ts` | `npm test -- --testNamePattern="promotion"` |
| LEAG-04 | Bottom 5 relegate at week end | integration | `services/__tests__/leaguePromotion.test.ts` | `npm test -- --testNamePattern="relegation"` |
| LEAG-05 | League tab shows rank, XP, zones | unit | `components/Gamification/__tests__/Leaderboard.test.tsx` | `npm test -- --testNamePattern="zone"` |
| LEAG-06 | New users start in Bronze | unit | `services/__tests__/leagueService.test.ts` | `npm test -- --testNamePattern="new user"` |
| LEAG-07 | League badges awarded on promotion | integration | `services/__tests__/leagueBadges.test.ts` | `npm test -- services/__tests__/leagueBadges.test.ts` |

---

## Wave 0 Gaps

- [ ] `services/__tests__/leagueService.test.ts` — covers LEAG-01, LEAG-06
- [ ] `services/__tests__/leaguePromotion.test.ts` — covers LEAG-03, LEAG-04
- [ ] `services/__tests__/leagueBadges.test.ts` — covers LEAG-07
- [ ] `components/Gamification/__tests__/Leaderboard.test.tsx` — covers LEAG-02, LEAG-05

---

## Sampling Rate

| Trigger | Command | Expected Duration |
|---------|---------|-------------------|
| Per task commit | `npm test -- --testPathPattern="league|gamification" --passWithNoTests` | ~5s |
| Per wave merge | `npm test` | ~30s |
| Phase gate | Full suite green before `/gsd:verify-work` | ~30s |

---

## Acceptance Criteria

### LEAG-01: League Assignment
```gherkin
Given a user with XP >= 0
When they earn their first XP event
Then they are assigned to the appropriate league tier
And new users start in Bronze league
```

### LEAG-02: Leaderboard View
```gherkin
Given a user in a league cohort
When they open the League tab
Then they see the top 30 users in their cohort
And each entry shows avatar, name, league badge, XP
And ~8 users are visible before scroll
```

### LEAG-03/04: Weekly Promotion/Relegation
```gherkin
Given the weekly cron job runs at Sunday midnight
When processing completes
Then top 10 users in each cohort promote to next tier
And bottom 5 users relegate to previous tier
And Bronze users cannot relegate below Bronze
```

### LEAG-05: Zone Highlighting
```gherkin
Given a user viewing the leaderboard
Then top 10 rows have green background (promotion zone)
And bottom 5 rows have red background (relegation zone)
And current user row is sticky at bottom of visible list
```

### LEAG-06: New User Handling
```gherkin
Given a newly registered user
When they earn their first XP
Then they are assigned to a Bronze league cohort
And cohort membership is atomic with XP event
```

### LEAG-07: League Badge Awards
```gherkin
Given a user promotes to a new tier
When promotion completes
Then they receive the corresponding league badge (e.g., "Silver Member")
And badge appears in their profile
```

---

*Phase: 17-league-system*
*Validation created: 2026-03-09*
