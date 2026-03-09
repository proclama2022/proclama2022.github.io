# Roadmap: Plantid

## Overview

Plantid transforms from personal plant tracker to community platform through 6 major milestones. v1.0-v1.3 delivered offline-first plant identification, care tracking, and enhanced UX. v2.0-v2.1 added Supabase backend for authentication, user profiles, community feed, social engagement, weather integration, and calendar sync. v3.0 expands gamification with leagues, badges, celebrations, and enhanced UI.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-02-20)
- ✅ **v1.1 Enhanced Plant Detail** - Phase 4 (shipped 2026-02-24)
- ✅ **v1.2 Multi-Photo Gallery + Custom Reminders** - Phases 5-6 (shipped 2026-02-25)
- ✅ **v1.3 Enhanced UX** - Phases 7-10 (shipped 2026-02-26)
- ✅ **v2.0 Community** - Phases 11-12 (shipped 2026-03-04)
- ✅ **v2.1 Smart Features** - Phases 13-16 (shipped 2026-03-09)
- 📋 **v3.0 Gamification 2.0** - Phases 17-21 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation and Core Loop** - Working Expo app with navigation, plant ID, and care tracking
- [x] **Phase 2: Care Features and Notifications** - Watering reminders with notification system
- [x] **Phase 3: Monetization** - AdMob integration and Pro unlock via RevenueCat
- [x] **Phase 4: Tabbed Layout and Content Reorganization** - Enhanced plant details with tabbed interface
- [x] **Phase 5: Multi-Photo Gallery** - Multiple photos per plant with lightbox view
- [x] **Phase 6: Custom Reminders** - Repotting, fertilization, pruning reminders
- [x] **Phase 7: Search & Filter** - Fuzzy search and filtering by care status
- [x] **Phase 8: Statistics Dashboard** - Watering streaks, identification counts, activity charts
- [x] **Phase 9: Care Calendar** - Monthly calendar with task indicators and completion
- [x] **Phase 10: UI Polish & Dark Mode** - Dark mode support and enhanced onboarding (shipped 2026-03-02)
- [x] **Phase 11: Auth Infrastructure & Supabase Setup** - User authentication with optional access (completed 2026-02-27)
- [x] **Phase 12: Database Schema & User Profiles** - User profiles with avatars and stats (completed 2026-03-02)
- [x] **Phase 13: Community Feed Core & Moderation** - Feed with posts, comments, likes, and moderation (completed 2026-03-04)
- [x] **Phase 14: Follow System & Engagement Polish** - Follow users and filter feed (completed 2026-03-05)
- [x] **Phase 15: Weather Integration & Climate-Aware Reminders** - Adjust watering based on local weather (completed 2026-03-05)
- [x] **Phase 16: Calendar Sync** - Sync care tasks with device calendar (completed 2026-03-05)
- [ ] **Phase 17: League System** - Duolingo-style leagues with weekly promotion/relegation
- [ ] **Phase 18: Extended Badges** - 8 new achievement badges with progress tracking
- [ ] **Phase 19: Level & Streak Enhancement** - Level titles, streak freeze, timezone support
- [ ] **Phase 20: Celebrations** - Confetti animations, haptic feedback, cooldown system
- [ ] **Phase 21: Gamification UI** - Gamification hub, badge grid, XP progress bar

## Phase Details

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-02-20</summary>

### Phase 1: Foundation and Core Loop
**Goal**: Working Expo app with navigation and state management
**Depends on**: Nothing (first phase)
**Success Criteria** (what must be TRUE):
  1. User can navigate between Home, Camera, and Settings screens
  2. User can capture photo and select plant organ
  3. User receives plant identification from PlantNet API with confidence score
  4. User can save identified plant to local collection
  5. Plant data persists across app launches via AsyncStorage
**Plans**: 11 plans

Plans:
- [x] 01-01: Initialize Expo project with TypeScript and Expo Router
- [x] 01-02: Set up Zustand stores and AsyncStorage persistence
- [x] 01-03: Create bottom tab navigation structure
- [x] 01-04: Camera screen with photo capture
- [x] 01-05: Plant organ selector (leaf, flower, fruit, etc.)
- [x] 01-06: PlantNet API integration service
- [x] 01-07: Results screen with species display
- [x] 01-08: Plant detail screen with care information
- [x] 01-09: Plant collection screen (Home)
- [x] 01-10: Settings screen structure
- [x] 01-11: Bilingual support (IT/EN) with i18next

### Phase 2: Care Features and Notifications
**Goal**: Users can track watering and receive reminders
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. User can view next watering date for each plant
  2. User can mark plant as watered with timestamp
  3. User receives push notification at scheduled watering time
  4. User can configure notification hours in Settings
  5. Watering history displays chronologically in plant detail
**Plans**: 3 plans

Plans:
- [x] 02-01: Watering tracking with timestamps
- [x] 02-02: Notification scheduling with expo-notifications
- [x] 02-03: Settings for notification preferences

### Phase 3: Monetization
**Goal**: Free app with ads and optional Pro upgrade
**Depends on**: Phase 2
**Success Criteria** (what must be TRUE):
  1. Banner ads display on bottom of main screens
  2. User can purchase Pro unlock to remove ads
  3. Free users limited to 5 identifications per day
  4. Pro users can perform 15 identifications per day
  5. Purchase status persists across app launches
**Plans**: 5 plans

Plans:
- [x] 03-01: AdMob integration with banner ads
- [x] 03-02: RevenueCat integration for IAP
- [x] 03-03: Identification rate limiting (5 free, 15 Pro)
- [x] 03-04: Pro upgrade modal and purchase flow
- [x] 03-05: Pro status persistence and ad removal logic

</details>

<details>
<summary>✅ v1.1 Enhanced Plant Detail (Phase 4) — SHIPPED 2026-02-24</summary>

### Phase 4: Tabbed Layout and Content Reorganization
**Goal**: Enhanced plant details with tabbed navigation and expanded care info
**Depends on**: Phase 3
**Success Criteria** (what must be TRUE):
  1. Plant detail screen has tabbed navigation (Info | Care | History | Notes)
  2. Care tab shows seasonal temperatures, fertilization info, pruning guide
  3. Pests section displays common problems with expandable remedies
  4. Notes field auto-saves after 500ms of inactivity
  5. Custom metadata (purchase date, price, origin) displays in Info tab
**Plans**: 4 plans

Plans:
- [x] 04-01: Tabbed layout with MaterialTopTabNavigator
- [x] 04-02: Seasonal care info (temperatures, fertilization, pruning)
- [x] 04-03: Common pests section with expandable remedies
- [x] 04-04: Expanded notes and custom plant metadata

</details>

<details>
<summary>✅ v1.2 Multi-Photo Gallery + Custom Reminders (Phases 5-6) — SHIPPED 2026-02-25</summary>

### Phase 5: Multi-Photo Gallery
**Goal**: Users can add multiple photos per plant with lightbox view
**Depends on**: Phase 4
**Success Criteria** (what must be TRUE):
  1. User can add multiple photos to a plant from camera or gallery
  2. Plant detail shows thumbnail grid of all photos
  3. Tapping photo opens full-screen lightbox
  4. User can set any photo as primary (displayed in feed)
  5. User can delete photos with confirmation dialog
**Plans**: 3 plans

Plans:
- [x] 05-01: Photo storage migration from single to array
- [x] 05-02: Photo gallery with thumbnail grid
- [x] 05-03: Photo lightbox with full-screen viewing

### Phase 6: Custom Reminders
**Goal**: Users can set custom reminders for repotting, fertilizing, pruning
**Depends on**: Phase 5
**Success Criteria** (what must be TRUE):
  1. User can create custom reminder (repotting, fertilizing, pruning, custom)
  2. User receives push notification when reminder is due
  3. History tab shows unified timeline of watering and reminders
  4. User can complete reminder by tapping in History
  5. User can edit or delete pending reminders
**Plans**: 3 plans

Plans:
- [x] 06-01: Reminder types and modal creation
- [x] 06-02: Reminder notifications with scheduling
- [x] 06-03: Unified History timeline with watering and reminders

</details>

<details>
<summary>✅ v1.3 Enhanced UX (Phases 7-10) — SHIPPED 2026-02-26</summary>

### Phase 7: Search & Filter
**Goal**: Users can search and filter their plant collection
**Depends on**: Phase 6
**Success Criteria** (what must be TRUE):
  1. User can search plants by name with fuzzy matching
  2. User can filter plants by watering status (needs water, up-to-date)
  3. User can filter plants by care difficulty (easy, medium, hard)
  4. Search and filter can be combined
  5. Results update in real-time as user types/selects
**Plans**: 2 plans

Plans:
- [x] 07-01: Fuzzy search by plant name
- [x] 07-02: Filter by watering status and care difficulty

### Phase 8: Statistics Dashboard
**Goal**: Users can view their plant care statistics and streaks
**Depends on**: Phase 7
**Success Criteria** (what must be TRUE):
  1. Dashboard shows current watering streak (consecutive days)
  2. Dashboard shows total plants identified
  3. Dashboard shows reminder completion rate
  4. Bar chart displays weekly activity (watering + reminders)
  5. All statistics accessible from Settings
**Plans**: 2 plans

Plans:
- [x] 08-01: Statistics cards with streaks and counts
- [x] 08-02: Weekly activity bar chart

### Phase 9: Care Calendar
**Goal**: Users can view upcoming care tasks on monthly calendar
**Depends on**: Phase 8
**Success Criteria** (what must be TRUE):
  1. Calendar displays current month with task indicators
  2. Each day shows colored dots for watering (blue/teal via colors.tint) and reminders (orange)
  3. Tapping a day shows list of tasks for that date
  4. User can complete tasks directly from calendar view
  5. User can navigate to previous/next months
**Plans**: 1 plan

Plans:
- [x] 09-01-PLAN.md — Replace hardcoded green watering color with colors.tint in calendar.tsx

### Phase 10: UI Polish & Dark Mode
**Goal**: Improved visual design with dark mode support
**Depends on**: Phase 9
**Success Criteria** (what must be TRUE):
  1. Dark mode toggle in Settings switches theme across all screens
  2. Onboarding screens display with Ionicons and entrance animations
  3. Settings screen organized into card sections
  4. All screens use consistent color palette from Colors.ts
  5. Loading states display skeletons for better perceived performance
**Plans**: 2 plans

Plans:
- [x] 10-01: Dark mode implementation across all screens
- [x] 10-02: Skeleton loading grid for Home screen

</details>

### 📋 v2.0 Community (Planned)

**Milestone Goal:** Transform from personal plant tracker to community platform with Supabase backend, user profiles, community feed, and social engagement.

#### Phase 11: Auth Infrastructure & Supabase Setup
**Goal**: Users can create accounts and sign in, while v1.x features remain accessible offline
**Depends on**: Phase 10
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and sign in with Google or Apple OAuth
  2. User session persists across app launches with automatic token refresh
  3. User can reset password via email link and sign out from Settings
  4. All v1.x features (camera, plant ID, local collection) work WITHOUT authentication — offline-first preserved
  5. Existing v1.x users can migrate local plants to community account with progress indicator
**Plans**: 5 plans

Plans:
- [x] 11-01: Supabase Client Infrastructure
- [x] 11-02: Auth State Management & Service Layer
- [x] 11-03: Auth UI Components
- [x] 11-04: Auth Integration
- [x] 11-05: Local-to-Cloud Migration

#### Phase 12: Database Schema & User Profiles
**Goal**: Users can create profiles, upload avatars, and view public profiles
**Depends on**: Phase 11
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08
**Success Criteria** (what must be TRUE):
  1. User can create profile with display name (required), avatar image (optional, auto-compressed), and bio (optional)
  2. User can view own profile with stats (plants identified, tips shared, followers, following, joined date)
  3. User can view other users' public profiles
  4. User can edit display name, avatar, and bio
  5. Database schema with RLS policies supports profiles, posts, likes, comments, follows, and reports
**Plans**: 5 plans

Plans:
- [x] 12-01: Database Schema & Profile Table Setup
- [x] 12-02: Avatar Upload & Profile Services
- [x] 12-03: Profile UI Components
- [x] 12-04: Profile Tab & Edit UI
- [x] 12-05: Public Profile Viewing

#### Phase 13: Community Feed Core & Moderation
**Goal**: Users can view, create, and engage with community posts in a moderated environment
**Depends on**: Phase 12
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, FEED-06, FEED-07, FEED-08, FEED-09, FEED-10, COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, COMM-06, LIKE-01, LIKE-02, LIKE-03, MODR-01, MODR-02, MODR-03, MODR-04, MODR-05, MODR-06, MODR-07, MODR-08, MODR-09, MODR-10, MODR-11
**Success Criteria** (what must be TRUE):
  1. User can view community feed with photo posts, infinite scroll pagination, and pull-to-refresh
  2. User can create post with photo + caption (auth required), with PlantNet identification auto-suggesting species name
  3. User can like/unlike posts and add/delete comments with real-time counts updating
  4. User can report posts, comments, and user profiles (with reasons and rate limiting), reported content is auto-hidden
  5. Admin can review reports via Supabase Dashboard, dismiss reports (restore content), or action reports (delete content, ban users)
**Plans**: TBD

Plans:
- [x] 13-01: Community Feed Core Implementation

### Phase 14: Follow System & Engagement Polish
- [x] 14-01: Follow System Database Schema & Policies
- [x] 14-02: Follow Button & User Lists
- [x] 14-03: Feed Filtering (Following vs Global)
- [x] 14-04: Notification Polish (Likes, Comments, Follows)
- [x] 14-05: Engagement Polish (Optimistic Updates, Skeleton Loading)

### Phase 15: Weather Integration
- [x] 15-01: Weather Infrastructure & UI (Services, Store, Widget, Settings)
- [x] 15-02: Smart Logic (Rain Delay, Heat Acceleration)

### Phase 16: Calendar Sync
- [x] 16-01: Calendar Infrastructure & Service
- [x] 16-02: UI Integration & Event Management

### 📋 v3.0 Gamification 2.0 (Phases 17-21) — IN PROGRESS

#### Phase 17: League System
**Goal**: Duolingo-style leagues with weekly promotion/relegation
**Depends on**: Phase 16
**Requirements**: LEAG-01, LEAG-02, LEAG-03, LEAG-04, LEAG-05, LEAG-06, LEAG-07
**Success Criteria** (what must be TRUE):
  1. User is assigned to a league based on XP (Bronze → Silver → Gold → Platinum → Diamond)
  2. User can view weekly leaderboard showing top 30 users in their league
  3. Top 10 users promote to higher league at week end (Sunday midnight local time)
  4. Bottom 5 users relegate to lower league at week end
  5. League tab shows current rank, XP progress, and promotion/relegation zone
  6. New users start in Bronze league
  7. League badges are awarded on promotion (Bronze Member, Silver Member, etc.)
**Plans**: 5 plans

Plans:
- [x] 17-01: League Database Schema & Dependencies (confetti install, migration, types)
- [ ] 17-02: League Service Layer (assignment, leaderboard, toast queue)
- [ ] 17-03: League UI Components (Leaderboard extension, mini-widget, tab)
- [ ] 17-04: Weekly Promotion & Celebration (pg_cron, confetti, haptics)
- [ ] 17-05: Integration & Wave 0 Tests (all tests, PostCard/Profile integration)

#### Phase 18: Extended Badges
**Goal**: 8 new achievement badges with progress tracking
**Depends on**: Phase 17
**Requirements**: BADG-01, BADG-02, BADG-03, BADG-04, BADG-05, BADG-06, BADG-07, BADG-08, BADG-09, BADG-10
**Success Criteria** (what must be TRUE):
  1. User earns "First Plant" badge when identifying first plant
  2. User earns "Green Thumb" badge when reaching 7-day watering streak
  3. User earns "Plant Parent" badge when adding 10 plants to collection
  4. User earns "Community Star" badge when receiving 50 total likes
  5. User earns "Early Bird" badge when watering before 7am (local time)
  6. User earns "Weekend Warrior" badge when completing all weekend care tasks
  7. User earns "Plant Doctor" badge when identifying 5 diseased/ailing plants
  8. User earns "Social Butterfly" badge when gaining 10 followers
  9. User can view all earned badges in profile
  10. User can view locked badges with progress indicator (e.g., "5/10 plants")
**Plans**: 3 plans

Plans:
- [ ] 18-01: Badge Definitions & Progress Service
- [ ] 18-02: Badge Trigger Hooks (Plant ID, Watering, Community)
- [ ] 18-03: Badge Grid UI & Progress Display

#### Phase 19: Level & Streak Enhancement
**Goal**: Level titles, streak freeze, and timezone support
**Depends on**: Phase 18
**Requirements**: TITL-01, TITL-02, TITL-03, TITL-04, STRK-01, STRK-02, STRK-03, STRK-04, STRK-05
**Success Criteria** (what must be TRUE):
  1. User level is displayed with title (Seedling, Sprout, Gardener, Expert, Master, Legend)
  2. Title is visible in profile header
  3. Title is visible in leaderboard entries
  4. Title changes with visual indication (toast) on level-up
  5. User has 1 streak freeze per week (free, not Pro-only)
  6. Streak freeze is automatically applied when user misses a day
  7. User sees streak freeze count remaining in streak widget
  8. Streak freeze resets every Sunday (1/week, doesn't accumulate)
  9. Streak calculation uses user's local timezone (not UTC)
**Plans**: 3 plans

Plans:
- [ ] 19-01: Level Title System & Display
- [ ] 19-02: Streak Freeze Logic & Service
- [ ] 19-03: Timezone-Aware Streak Calculation

#### Phase 20: Celebrations
**Goal**: Confetti animations, haptic feedback, and cooldown system
**Depends on**: Phase 19
**Requirements**: CELE-01, CELE-02, CELE-03, CELE-04, CELE-05, CELE-06
**Success Criteria** (what must be TRUE):
  1. User sees confetti animation when earning a badge
  2. User sees confetti animation when leveling up
  3. User sees confetti animation when promoting to higher league
  4. User feels haptic feedback (vibration) during celebrations
  5. Celebration animations do not block UI (non-modal, auto-dismiss)
  6. Celebration cooldown prevents spam (max 1 celebration per 3 seconds)
**Plans**: 2 plans

Plans:
- [ ] 20-01: Confetti Animation & Haptic Service
- [ ] 20-02: Celebration Coordination & Cooldown

#### Phase 21: Gamification UI
**Goal**: Gamification hub, badge grid, and XP progress bar
**Depends on**: Phase 20
**Requirements**: GMUI-01, GMUI-02, GMUI-03, GMUI-04, GMUI-05, GMUI-06
**Success Criteria** (what must be TRUE):
  1. User can access gamification hub from profile screen
  2. User sees XP progress bar in profile header
  3. User sees current level, title, and XP in gamification hub
  4. User sees badge collection grid with locked/unlocked states
  5. User sees weekly streak calendar in gamification hub
  6. User sees league badge next to their name in community feed
**Plans**: 3 plans

Plans:
- [ ] 21-01: Gamification Hub Screen
- [ ] 21-02: Profile Header XP Integration
- [ ] 21-03: Community Feed League Badge Display

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13-light-meter → 13 → 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Core Loop | v1.0 | 11/11 | Complete | 2026-02-19 |
| 2. Care Features and Notifications | v1.0 | 3/3 | Complete | 2026-02-20 |
| 3. Monetization | v1.0 | 5/5 | Complete | 2026-02-20 |
| 4. Tabbed Layout and Content Reorganization | v1.1 | 4/4 | Complete | 2026-02-23 |
| 5. Multi-Photo Gallery | v1.2 | 3/3 | Complete | 2026-02-25 |
| 6. Custom Reminders | v1.2 | 3/3 | Complete | 2026-02-25 |
| 7. Search & Filter | 2/2 | Complete    | 2026-03-02 | 2026-02-26 |
| 8. Statistics Dashboard | 2/2 | Complete    | 2026-03-02 | 2026-02-26 |
| 9. Care Calendar | v1.3 | Complete    | 2026-03-02 | - |
| 10. UI Polish & Dark Mode | 2/2 | Complete    | 2026-03-02 | 2026-02-26 |
| 11. Auth Infrastructure & Supabase Setup | 5/5 | Complete    | 2026-02-27 |
| 12. Database Schema & User Profiles | 6/5 | Complete    | 2026-03-02 | - |
| 13-light-meter. Light Meter | v2.1 | 5/5 | Complete | 2026-03-04 |
| 13. Community Feed Core & Moderation | v2.0 | 5/5 | Complete | 2026-03-04 |
| 14. Follow System & Engagement Polish | v2.0 | 5/5 | Complete | 2026-03-05 |
| 15. Weather Integration | v2.1 | 2/2 | Complete | 2026-03-05 |
| 16. Calendar Sync | v2.1 | 2/2 | Complete | 2026-03-05 |
| 17. League System | 4/5 | In Progress|  | 2026-03-09 |
| 18. Extended Badges | v3.0 | 0/3 | Pending | - |
| 19. Level & Streak Enhancement | v3.0 | 0/3 | Pending | - |
| 20. Celebrations | v3.0 | 0/2 | Pending | - |
| 21. Gamification UI | v3.0 | 0/3 | Pending | - |

---

*Full archive: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.3-ROADMAP.md`*
