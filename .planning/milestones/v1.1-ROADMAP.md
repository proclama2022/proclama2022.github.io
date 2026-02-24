# Roadmap: Plantid

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 (shipped 2026-02-20)
- 🚧 **v1.1 Enhanced Plant Detail** — Phases 4-6 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-02-20</summary>

- [x] Phase 1: Foundation and Core Loop (11/11 plans) — completed 2026-02-19
- [x] Phase 2: Care Features and Notifications (3/3 plans) — completed 2026-02-20
- [x] Phase 3: Monetization (5/5 plans) — completed 2026-02-20

</details>

---

### 🚧 v1.1 Enhanced Plant Detail (In Progress)

**Milestone Goal:** Transform plant detail screen into a rich, tabbed experience with extended care information, multi-photo gallery for growth tracking, and advanced custom reminders beyond watering.

#### Phase 4: Tabbed Layout and Content Reorganization
**Goal**: Reorganize plant detail screen into tabbed navigation with extended care info and dedicated notes tab
**Depends on**: Phase 3
**Requirements**: TAB-01, TAB-02, TAB-03, TAB-04, TAB-05, CARE-01, CARE-02, CARE-03, CARE-04, CARE-05, CARE-06, NOTE-01, NOTE-02, NOTE-03, NOTE-04, NOTE-05, NOTE-06, NOTE-07
**Success Criteria** (what must be TRUE):
  1. User sees 4 tabs at top of plant detail screen (Info, Care, History, Notes) and can switch between them via tap or horizontal swipe
  2. User views extended care information in Care tab including seasonal temperatures, fertilization schedule, pruning instructions, and common pests with remedies
  3. User reads and writes expanded notes (up to 1000 characters) in dedicated Notes tab with auto-save on blur
  4. User adds optional custom metadata (purchase date, price, origin, gift from) that persists in Notes tab
  5. Only active tab content is rendered (lazy loading) to maintain smooth performance
**Plans**: 5 plans

Plans:
- [x] 04-01-PLAN.md — Install dependencies, extend TypeScript types, add i18n keys
- [x] 04-02-PLAN.md — Refactor [id].tsx into tab host, create InfoTab and HistoryTab
- [x] 04-03-PLAN.md — Build CareTab with extended care sections, extend careDB
- [x] 04-04-PLAN.md — Build NotesTab with auto-save, char counter, metadata fields

#### Phase 5: Multi-Photo Gallery
**Goal**: Enable users to track plant growth over time with multiple photos per plant and full-screen lightbox viewing
**Depends on**: Phase 4
**Requirements**: PHOTO-01, PHOTO-02, PHOTO-03, PHOTO-04, PHOTO-05, PHOTO-06, PHOTO-07, PHOTO-08
**Success Criteria** (what must be TRUE):
  1. User adds up to 10 photos per plant with automatic compression (max 1024px, JPEG 0.7 quality) on upload
  2. User views thumbnail grid of all plant photos in Info tab with visual indication of primary photo
  3. User taps any photo to open full-screen lightbox with pinch-to-zoom and swipe between photos
  4. User sets primary photo and deletes unwanted photos from gallery with confirmation
  5. Existing plants with single photo migrate automatically to multi-photo array without data loss
**Plans**: TBD

Plans:
- [ ] 05-01: Create photoService for file system operations and implement data model migration (photo string → photos array)
- [ ] 05-02: Build PhotoGallery component with thumbnail grid, add photo button, and primary photo selection
- [ ] 05-03: Build PhotoLightbox with full-screen zoom viewer, swipe navigation, and delete functionality

#### Phase 6: Custom Reminders
**Goal**: Extend notification system beyond watering with custom reminders for fertilizing, repotting, pruning, and user-defined tasks
**Depends on**: Phase 4
**Requirements**: REMIND-01, REMIND-02, REMIND-03, REMIND-04, REMIND-05, REMIND-06, REMIND-07
**Success Criteria** (what must be TRUE):
  1. User creates custom reminders for fertilizing, repotting, pruning, or custom tasks with specified date and time
  2. User views list of all active and completed custom reminders in History tab sorted by due date
  3. User receives push notification when custom reminder triggers with action to mark as completed
  4. User edits reminder details (date, time, type) or deletes reminders with confirmation
  5. User marks reminder as completed from notification or History tab, removing it from active list
**Plans**: TBD

Plans:
- [ ] 06-01: Extend data models and notificationService for custom reminder types and scheduling
- [ ] 06-02: Build custom reminder UI (add, edit, delete) in History tab with date/time pickers
- [ ] 06-03: Implement push notification handling and completion workflow for custom reminders

---

### 📋 v2.0 Future Enhancements (Planned)

**Milestone Goal:** Growth timeline visualization, markdown notes, social features, and advanced differentiators.

[Requirements deferred to v2.0 — GROWTH-01, GROWTH-02, MD-01, MD-02, SOCIAL-01, SOCIAL-02]

---

*For full v1.0 milestone details, see `.planning/milestones/v1.0-ROADMAP.md`*

## Progress

**Execution Order:**
Phases execute in numeric order: 4 → 5 → 6

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation and Core Loop | v1.0 | 11/11 | Complete | 2026-02-19 |
| 2. Care Features and Notifications | v1.0 | 3/3 | Complete | 2026-02-20 |
| 3. Monetization | v1.0 | 5/5 | Complete | 2026-02-20 |
| 4. Tabbed Layout and Content Reorganization | v1.1 | 4/5 | In Progress | - |
| 5. Multi-Photo Gallery | v1.1 | 0/3 | Not started | - |
| 6. Custom Reminders | v1.1 | 0/3 | Not started | - |
