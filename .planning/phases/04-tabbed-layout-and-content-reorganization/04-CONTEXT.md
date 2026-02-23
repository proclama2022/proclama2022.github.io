# Phase 4: Tabbed Layout and Content Reorganization - Context

**Gathered:** 2026-02-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganize the existing plant detail screen into a 4-tab layout (Info, Care, History, Notes). Extend the Care tab with detailed care data from PlantNet (seasonal temps, fertilization, pruning, pests). Add a dedicated Notes tab with an auto-saving textarea and custom metadata fields. History tab is a placeholder only. Multi-photo gallery and search are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Tab bar design
- Underline indicator style — active tab has a colored underline, not a pill or segmented control
- Tab bar sits sticky below the plant header (photo + name stay at top, tabs stick as content scrolls)
- Default to Info tab on open — always, not context-dependent or remembered
- Horizontal swipe between tabs enabled alongside tap navigation

### Info tab content
- Info tab shows: species name, confidence %, identification photo, common name, brief description — identification-focused only
- Extended care info moves entirely to the Care tab
- Header (photo + name + confidence) is compact — small thumbnail photo, not a hero image (~80-100px tall)
- Action buttons (save to collection, share) stay in the header above the tabs, visible regardless of active tab
- History tab is a placeholder in Phase 4 — empty state or "coming soon" message; no actual history feature yet

### Care tab gaps
- When PlantNet returns no data for a field: show the section heading with muted "Not available for this species" text — don't hide sections
- Pest entries: expandable list items — pest name + brief description visible, tap to expand remedy details
- Seasonal temperature: simple list, one row per season (Spring: 15–20°C, Summer: 20–28°C, etc.)
- Care section order: Watering → Light → Temperature → Fertilization → Pruning → Pests

### Notes tab UX
- Character counter: hidden until ~800 chars used, then shows "N remaining" in muted text
- Custom metadata fields (purchase date, price, origin, gift from): inline form below the notes textarea — all 4 fields visible, not collapsible
- Auto-save confirmation: subtle "Saved ✓" flash for ~1.5s near the textarea after blur save — not silent, not a persistent timestamp
- Empty state: just the textarea with placeholder text "Add notes about this plant..." — no illustration needed

### Claude's Discretion
- Exact spacing and typography within tabs
- Error state handling for Care tab data fetch failures
- Tab library/component choice (react-native-tab-view or similar)
- Exact animation/transition style for tab switching
- How to handle keyboard avoidance in the Notes tab on iOS/Android

</decisions>

<specifics>
## Specific Ideas

- No specific design references mentioned — open to standard React Native patterns
- Placeholder for History tab should be minimal, not a full empty state illustration

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-tabbed-layout-and-content-reorganization*
*Context gathered: 2026-02-23*
