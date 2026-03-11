# Requirements: Plantid v3.0 Gamification 2.0

**Defined:** 2026-03-09
**Core Value:** Free, subscription-free plant identification with species-specific care guidance

## v3.0 Requirements

Requirements for Gamification 2.0 milestone. Each maps to roadmap phases.

### League System

- [x] **LEAG-01**: User is assigned to a league based on XP (Bronze → Silver → Gold → Platinum → Diamond)
- [x] **LEAG-02**: User can view weekly leaderboard showing top 30 users in their league
- [x] **LEAG-03**: Top 10 users promote to higher league at week end (Sunday midnight local time)
- [x] **LEAG-04**: Bottom 5 users relegate to lower league at week end
- [x] **LEAG-05**: League tab shows current rank, XP progress, and promotion/relegation zone
- [x] **LEAG-06**: New users start in Bronze league
- [x] **LEAG-07**: League badges are awarded on promotion (Bronze Member, Silver Member, etc.)

### Extended Badges

- [x] **BADG-01**: User earns "First Plant" badge when identifying first plant
- [ ] **BADG-02**: User earns "Green Thumb" badge when reaching 7-day watering streak
- [x] **BADG-03**: User earns "Plant Parent" badge when adding 10 plants to collection
- [x] **BADG-04**: User earns "Community Star" badge when receiving 50 total likes
- [x] **BADG-05**: User earns "Early Bird" badge when watering before 7am (local time)
- [ ] **BADG-06**: User earns "Weekend Warrior" badge when completing all weekend care tasks
- [x] **BADG-07**: User earns "Plant Doctor" badge when identifying 5 diseased/ailing plants
- [x] **BADG-08**: User earns "Social Butterfly" badge when gaining 10 followers
- [x] **BADG-09**: User can view all earned badges in profile
- [x] **BADG-10**: User can view locked badges with progress indicator (e.g., "5/10 plants")

### Level Titles

- [ ] **TITL-01**: User level is displayed with title (Seedling, Sprout, Gardener, Expert, Master, Legend)
- [ ] **TITL-02**: Title is visible in profile header
- [ ] **TITL-03**: Title is visible in leaderboard entries
- [ ] **TITL-04**: Title changes with visual indication (toast) on level-up

### Streak System Enhancement

- [x] **STRK-01**: User has 1 streak freeze per week (free, not Pro-only)
- [x] **STRK-02**: Streak freeze is automatically applied when user misses a day
- [x] **STRK-03**: User sees streak freeze count remaining in streak widget
- [x] **STRK-04**: Streak freeze resets every Sunday (1/week, doesn't accumulate)
- [x] **STRK-05**: Streak calculation uses user's local timezone (not UTC)

### Celebrations

- [x] **CELE-01**: User sees confetti animation when earning a badge
- [x] **CELE-02**: User sees confetti animation when leveling up
- [x] **CELE-03**: User sees confetti animation when promoting to higher league
- [x] **CELE-04**: User feels haptic feedback (vibration) during celebrations
- [x] **CELE-05**: Celebration animations do not block UI (non-modal, auto-dismiss)
- [x] **CELE-06**: Celebration cooldown prevents spam (max 1 celebration per 3 seconds)

### Gamification UI

- [ ] **GMUI-01**: User can access gamification hub from profile screen
- [ ] **GMUI-02**: User sees XP progress bar in profile header
- [ ] **GMUI-03**: User sees current level, title, and XP in gamification hub
- [ ] **GMUI-04**: User sees badge collection grid with locked/unlocked states
- [ ] **GMUI-05**: User sees weekly streak calendar in gamification hub
- [ ] **GMUI-06**: User sees league badge next to their name in community feed

## Future Requirements

Deferred to v3.1+ or later.

### Advanced Leagues

- **LEAG-08**: League chat/messaging (v3.2+)
- **LEAG-09**: League competitions/challenges (v3.2+)
- **LEAG-10**: Custom league names (v3.2+)

### Badge Tiers

- **BADG-11**: Bronze/Silver/Gold/Platinum tiers per badge type (v3.1+)
- **BADG-12**: Hidden/secret badges (v3.1+)
- **BADG-13**: Seasonal badges (v3.1+)

### Advanced Celebrations

- **CELE-07**: Full-screen celebration modal (v3.1+)
- **CELE-08**: Celebration sound effects (v3.1+)
- **CELE-09**: Share celebration to social media (v3.2+)

## Out of Scope

- Real-money/gambling mechanics (explicitly rejected)
- Negative reinforcement (losing XP, demotion animations)
- Leaderboard manipulation/cheating (server-side validation)
- Subscription-gated gamification (streak freeze remains free)

## Traceability

| Phase | Requirements |
|-------|--------------|
| 17 - League System | LEAG-01..07 |
| 18 - Extended Badges | BADG-01..10 |
| 19 - Level & Streak | TITL-01..04, STRK-01..05 |
| 20 - Celebrations | CELE-01..06 |
| 21 - Gamification UI | GMUI-01..06 |

*Traceability will be updated as roadmap phases are defined.*
