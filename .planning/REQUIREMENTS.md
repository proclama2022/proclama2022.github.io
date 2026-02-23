# Requirements: Plantid v1.1

**Defined:** 2026-02-20
**Core Value:** Free, subscription-free plant identification with species-specific care guidance — accessible to anyone without a €30/year paywall

## v1.1 Requirements

### Tabbed Layout

- [x] **TAB-01**: User sees tabbed navigation at top of plant detail screen with 4 tabs (Info | Care | History | Notes)
- [x] **TAB-02**: User can swipe horizontally to switch between tabs
- [x] **TAB-03**: User can tap tab labels to switch between tabs
- [x] **TAB-04**: Tab state persists while viewing same plant (returns to last active tab)
- [x] **TAB-05**: Only active tab content is rendered (lazy loading for performance)

### Multi-Photo Gallery

- [ ] **PHOTO-01**: User can add multiple photos to a single plant (max 10)
- [ ] **PHOTO-02**: User sees thumbnail grid of all plant photos in Info tab
- [ ] **PHOTO-03**: User can tap a photo to open fullscreen lightbox with pinch-to-zoom
- [ ] **PHOTO-04**: User can swipe between photos in lightbox view
- [ ] **PHOTO-05**: User can delete photos from plant gallery
- [ ] **PHOTO-06**: User can set primary photo (shown in plant list)
- [ ] **PHOTO-07**: Photos are compressed on upload (max 1024px, JPEG 0.7 quality)
- [ ] **PHOTO-08**: Existing single-photo plants migrate automatically to multi-photo array

### Extended Care Information

- [x] **CARE-01**: User sees seasonal temperature range (min/max per season) in Care tab
- [x] **CARE-02**: User sees fertilization schedule (when, type, frequency) in Care tab
- [x] **CARE-03**: User sees pruning instructions (when, how) in Care tab
- [x] **CARE-04**: User sees common pests and remedies in Care tab
- [x] **CARE-05**: User sees "Info not available" fallback when extended care data missing
- [x] **CARE-06**: Extended care data displays in bilingual IT/EN

### Advanced Notes

- [x] **NOTE-01**: User can write expanded notes (multi-line textarea, 1000 char limit)
- [x] **NOTE-02**: User sees notes field in dedicated Notes tab
- [x] **NOTE-03**: Notes auto-save on blur (no explicit save button)
- [x] **NOTE-04**: User can add custom metadata: purchase date (optional)
- [x] **NOTE-05**: User can add custom metadata: purchase price (optional)
- [x] **NOTE-06**: User can add custom metadata: origin/location purchased (optional)
- [x] **NOTE-07**: User can add custom metadata: gift from (optional text field)

### Custom Reminders

- [ ] **REMIND-01**: User can add custom reminders beyond watering (fertilize, repot, prune, custom)
- [ ] **REMIND-02**: User can set reminder date and time
- [ ] **REMIND-03**: User sees list of all custom reminders in History tab
- [ ] **REMIND-04**: User receives push notification when custom reminder triggers
- [ ] **REMIND-05**: User can edit existing custom reminders
- [ ] **REMIND-06**: User can delete custom reminders
- [ ] **REMIND-07**: User can mark reminder as completed when notification triggers

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Growth Timeline

- **GROWTH-01**: User sees visual timeline of plant growth through photos
- **GROWTH-02**: User can add date stamps to photos

### Markdown Notes

- **MD-01**: User can format notes with markdown (bold, italic, lists)
- **MD-02**: User sees rendered markdown preview in Notes tab

### Social Features

- **SOCIAL-01**: User can share plant photos to social media
- **SOCIAL-02**: User can export plant collection data

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Social sharing | Requires backend, privacy concerns, moderation needed |
| Community plant tips | Server infrastructure required |
| AI-powered care adjustment | High complexity, requires ML/seasonal data |
| Real-time plant monitoring | Hardware integration required |
| Video upload | Storage costs, compression complexity |
| Cloud sync | Backend required, privacy concerns |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TAB-01 | Phase 4 | Complete |
| TAB-02 | Phase 4 | Complete |
| TAB-03 | Phase 4 | Complete |
| TAB-04 | Phase 4 | Complete |
| TAB-05 | Phase 4 | Complete |
| PHOTO-01 | Phase 5 | Pending |
| PHOTO-02 | Phase 5 | Pending |
| PHOTO-03 | Phase 5 | Pending |
| PHOTO-04 | Phase 5 | Pending |
| PHOTO-05 | Phase 5 | Pending |
| PHOTO-06 | Phase 5 | Pending |
| PHOTO-07 | Phase 5 | Pending |
| PHOTO-08 | Phase 5 | Pending |
| CARE-01 | Phase 4 | Complete |
| CARE-02 | Phase 4 | Complete |
| CARE-03 | Phase 4 | Complete |
| CARE-04 | Phase 4 | Complete |
| CARE-05 | Phase 4 | Complete |
| CARE-06 | Phase 4 | Complete |
| NOTE-01 | Phase 4 | Complete |
| NOTE-02 | Phase 4 | Complete |
| NOTE-03 | Phase 4 | Complete |
| NOTE-04 | Phase 4 | Complete |
| NOTE-05 | Phase 4 | Complete |
| NOTE-06 | Phase 4 | Complete |
| NOTE-07 | Phase 4 | Complete |
| REMIND-01 | Phase 6 | Pending |
| REMIND-02 | Phase 6 | Pending |
| REMIND-03 | Phase 6 | Pending |
| REMIND-04 | Phase 6 | Pending |
| REMIND-05 | Phase 6 | Pending |
| REMIND-06 | Phase 6 | Pending |
| REMIND-07 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-20*
*Last updated: 2026-02-20 after v1.1 roadmap created*
