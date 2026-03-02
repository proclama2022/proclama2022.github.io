# Roadmap: Plantid

## Overview

Plantid transforms from personal plant tracker to community platform through 5 major milestones. v1.0-v1.3 delivered offline-first plant identification, care tracking, and enhanced UX. v2.0 adds Supabase backend for authentication, user profiles, community feed, social engagement (likes, comments, follows), and content moderation.

## Milestones

- ✅ **v1.0 MVP** - Phases 1-3 (shipped 2026-02-20)
- ✅ **v1.1 Enhanced Plant Detail** - Phase 4 (shipped 2026-02-24)
- ✅ **v1.2 Multi-Photo Gallery + Custom Reminders** - Phases 5-6 (shipped 2026-02-25)
- ✅ **v1.3 Enhanced UX** - Phases 7-10 (shipped 2026-02-26)
- 📋 **v2.0 Community** - Phases 11-14 (planned)

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
- [ ] **Phase 12: Database Schema & User Profiles** - User profiles with avatars and stats
- [ ] **Phase 13: Community Feed Core & Moderation** - Feed with posts, comments, likes, and moderation
- [ ] **Phase 14: Follow System & Engagement Polish** - Follow users and filter feed

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
- [ ] 09-01-PLAN.md — Replace hardcoded green watering color with colors.tint in calendar.tsx

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
- [ ] 11-05: Local-to-Cloud Migration

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
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

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
- [ ] 13-01: TBD

#### Phase 14: Follow System & Engagement Polish
**Goal**: Users can follow plant enthusiasts and filter feed by followed users
**Depends on**: Phase 13
**Requirements**: LIKE-04, LIKE-05, FOLL-01, FOLL-02, FOLL-03, FOLL-04, FOLL-05
**Success Criteria** (what must be TRUE):
  1. User can follow/unfollow other users via profile buttons
  2. Follower and following counts displayed on profiles
  3. "Following" feed filter shows posts only from followed users
  4. Liked posts appear in user's profile ("Liked Plants" section)
  5. User can view list of users who liked a post
**Plans**: TBD

Plans:
- [ ] 14-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 11 → 12 → 13 → 14

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
| 11. Auth Infrastructure & Supabase Setup | 6/5 | Complete    | 2026-02-27 |
| 12. Database Schema & User Profiles | 3/5 | In Progress|  | - |
| 13. Community Feed Core & Moderation | v2.0 | 0/TBD | Not started | - |
| 14. Follow System & Engagement Polish | v2.0 | 0/TBD | Not started | - |

---

*Full archive: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.3-ROADMAP.md`*
