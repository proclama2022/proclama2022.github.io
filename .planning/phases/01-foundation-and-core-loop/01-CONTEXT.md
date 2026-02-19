# Phase 1: Foundation and Core Loop - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can identify a plant by photo, see its scientific name, confidence score, and basic care info, then save it to a persistent local collection — with underlying services hardened against known bugs. Daily scan limits enforced. Full IT/EN language support. "Powered by Pl@ntNet" attribution visible.

This phase delivers the complete identify-save-view workflow. Watering reminders, notifications, ads, and Pro unlock are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Camera & Capture Flow
- **Full-screen camera** experience (not embedded view)
- **Post-capture organ selector** — bottom sheet/modal appears after photo taken to select leaf/flower/fruit/bark/auto
- **Preview + confirm** before API call — user can retake if needed
- **Separate buttons** for camera and gallery (not combined in one action sheet)

### Result Presentation
- **Card carousel** layout — one match visible at a time, swipe/arrow to see alternatives
- **Compact info with expand** — photo, species name, confidence bar visible; tap to expand care details
- **Warn if low confidence** — if best match <50%, show warning message with option to retry
- **"Add to collection" button on card** — no need to open detail view to add

### Plant Collection UI
- **User choice: grid/list toggle** — 2-column grid or single-column list, switchable
- **Minimal card info** — photo thumbnail, common name, location nickname only
- **Sorted by date added** — most recent first
- **Badge on cards** for plants that need watering today (not separate section)

### States & Navigation
- **Quick onboarding** (2-3 screens) on first launch explaining key features
- **Friendly empty state** — illustration + "Identify your first plant!" + prominent camera FAB
- **Modal overlay** when rate limit reached — clear message, "Come back tomorrow" CTA
- **Tab bar navigation** — Home, Camera, Settings as main tabs

### Claude's Discretion
- Exact visual design of cards, badges, carousels, onboarding screens
- Animation/transition details between screens
- Error state UI patterns (network error, API error, permission denied)
- Loading state designs (skeleton, spinners)
- Onboarding copy and illustration content
- Tab bar icons and styling

</decisions>

<specifics>
## Specific Ideas

- Full-screen camera should feel immersive like native camera app
- Card carousel similar to Tinder-style swipe or dots indicator
- Empty state should feel welcoming, not empty/depressing
- Badge for watering should be subtle but noticeable (small water droplet icon?)

</specifics>

<deferred>
## Deferred Ideas

- Watering reminder notifications — Phase 2
- Watering history per plant — Phase 2
- AdMob banner integration — Phase 3
- Pro unlock IAP — Phase 3
- Multi-photo identification (3+ photos for accuracy) — v2 backlog
- Plant growth photo timeline — v2 backlog

</deferred>

---

*Phase: 01-foundation-and-core-loop*
*Context gathered: 2026-02-19*
