# Roadmap: Plantid

## Overview

Plantid ships in three phases that follow the hard dependency graph of the architecture. Phase 1 fixes the existing service bugs and delivers the complete identification-to-collection loop — nothing downstream is safe to build until the plumbing is correct. Phase 2 adds the retention engine: watering notifications, history tracking, and a deeper care database. Phase 3 adds monetization last, after the core product is verified, because AdMob requires a New Architecture compatibility audit and IAP requires app store provisioning.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Core Loop** - Fix existing service bugs, build missing services and data layer, implement all five screens, deliver the complete identify-save-view workflow
- [ ] **Phase 2: Care Features and Notifications** - Add watering reminders via expo-notifications, watering history tracking, compliance stats, expanded care DB to 300-500 species
- [ ] **Phase 3: Monetization** - AdMob banner ads, Pro one-time IAP (€4.99), Pro unlock removes ads and raises limits

## Phase Details

### Phase 1: Foundation and Core Loop
**Goal**: Users can identify a plant by photo, see its scientific name, confidence score, and basic care info, then save it to a persistent local collection — with the underlying services hardened against the known bugs
**Depends on**: Nothing (first phase)
**Requirements**: ID-01, ID-02, ID-03, ID-04, ID-05, ID-06, ID-07, COLL-01, COLL-02, COLL-03, COLL-04, COLL-05, COLL-06, CARE-01, CARE-02, CARE-03, CARE-04, CARE-05, RATE-01, RATE-03, RATE-04, RATE-05, I18N-01, I18N-02, I18N-03, I18N-04, UI-01, UI-02, UI-03, UI-04, UI-05, LEGAL-01, LEGAL-02, LEGAL-03
**Success Criteria** (what must be TRUE):
  1. User can take a photo or pick from gallery, select organ type, and receive a ranked list of plant matches with scientific name, common name, family, and confidence percentage bar within the app
  2. User can tap any result and read care information (watering frequency, sunlight, temperature, soil type, difficulty, pet toxicity) for that species, or sees "Care info coming soon" if the species is not in the database
  3. User can save an identified plant to "My Plants" with a photo and location nickname, view it in a thumbnail grid, open its full detail screen, and delete it — and the collection is still there after restarting the app
  4. When a free user reaches 5 identifications in a calendar day, the app shows a friendly limit message and blocks further scans until midnight in the user's local timezone
  5. The "Powered by Pl@ntNet" attribution is visible in the app and all user-visible text is available in both Italian and English, switchable from Settings
**Plans**: 11 plans

**Plan List:**
- [x] 01-01-PLAN.md — Fix service bugs (cache LRU, rate limiter mutex, API proxy)
- [x] 01-02-PLAN.md — i18n setup with IT/EN translations
- [ ] 01-03-PLAN.md — Zustand stores with AsyncStorage persist
- [ ] 01-04-PLAN.md — Care database (100 species)
- [ ] 01-05-PLAN.md — Settings screen with language switcher
- [ ] 01-06-PLAN.md — Onboarding screens (first launch)
- [ ] 01-07-PLAN.md — Camera screen with organ selector
- [ ] 01-08-PLAN.md — Results screen with carousel and care info
- [ ] 01-09-PLAN.md — Home/collection screen with grid/list
- [ ] 01-10-PLAN.md — Plant detail screen
- [ ] 01-11-PLAN.md — Rate limiting with modal

### Phase 2: Care Features and Notifications
**Goal**: Users can schedule watering reminders for each saved plant, receive a daily 08:00 notification listing plants due for watering, mark plants as watered, and view their watering history and compliance rate
**Depends on**: Phase 1
**Requirements**: WATER-01, WATER-02, WATER-03, WATER-04, WATER-05, WATER-06
**Success Criteria** (what must be TRUE):
  1. User can tap "Mark Watered" on a plant detail screen and the app schedules a local notification for the next watering date based on that plant's care database frequency
  2. At 08:00 in the user's local timezone, a single notification lists all plants due for watering that day — and this notification fires correctly on Android (including Samsung and Xiaomi devices with battery optimizers) after the user grants permission at the moment of first plant save
  3. User can view a per-plant watering history for the last 30 days and see a compliance rate (e.g., "5/7 watered on schedule this month")
  4. If a user deletes a plant, its scheduled notification is cancelled — reinstalling the app does not leave orphaned notifications
**Plans**: TBD

### Phase 3: Monetization
**Goal**: The app displays a non-intrusive banner ad on the Home screen for free users, and offers a one-time €4.99 Pro unlock that removes all ads and raises daily scan and collection limits
**Depends on**: Phase 2
**Requirements**: AD-01, AD-02, AD-03, PRO-01, PRO-02, PRO-03, RATE-02
**Success Criteria** (what must be TRUE):
  1. A banner ad is visible at the bottom of the Home screen for free users and is absent for Pro users
  2. User can complete the in-app purchase flow for Pro (€4.99 one-time), and Pro status persists across app restarts and reinstalls without requiring re-purchase
  3. Pro users see no ads on any screen, their daily scan limit is raised from 5 to 15, and they can save more than 10 plants to their collection
  4. The "No subscription, ever" message is prominent in the Pro upgrade screen
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Core Loop | 2/11 | In progress | 2026-02-19 |
| 2. Care Features and Notifications | 0/TBD | Not started | - |
| 3. Monetization | 0/TBD | Not started | - |
