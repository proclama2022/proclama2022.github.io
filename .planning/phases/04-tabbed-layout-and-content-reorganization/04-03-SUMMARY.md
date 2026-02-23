---
phase: 04-tabbed-layout-and-content-reorganization
plan: "03"
subsystem: ui
tags: [react-native, typescript, care-tab, i18n, expandable-list]

# Dependency graph
requires:
  - "04-02 — tab host screen with CareTabPlaceholder stub"
  - "04-01 — types (SeasonalTemp, FertilizationInfo, PruningInfo, PestEntry), i18n care keys"
provides:
  - "components/Detail/CareTab.tsx — 6-section care tab with fallbacks, seasonal temps, expandable pests"
  - "services/careDB.ts Monstera entry extended with seasonalTemps, fertilization, pruning, pests"
affects:
  - 04-04

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CareSection helper component always renders heading regardless of data presence — satisfies CARE-05"
    - "Expandable pest entries via useState<number | null>(null) index — tap to toggle remedy card"
    - "Bilingual display via i18n.language === 'it' check — reads { it, en } object fields directly"
    - "Seasonal temps rendered as list of seasonLabel(st.season): tempRange rows inside white card"

key-files:
  created:
    - "components/Detail/CareTab.tsx"
  modified:
    - "services/careDB.ts"
    - "app/plant/[id].tsx"

key-decisions:
  - "CareSection always renders heading even when hasData=false — per CARE-05 locked decision"
  - "notAvailable fallback text in italic muted style (#aaa) per design"
  - "Seasonal temps nested inside Temperature section under a sub-label — avoids 7th section"
  - "Pest remedy revealed in green F1F8E9 card, hidden by default with tapToExpand hint"
  - "CareTabPlaceholder stub removed from [id].tsx, replaced with real CareTab import"

# Metrics
duration: 104s
completed: 2026-02-23
---

# Phase 4 Plan 03: CareTab Component Summary

**Full Care tab with 6 always-visible sections (Watering, Light, Temperature, Fertilization, Pruning, Pests), bilingual IT/EN display, seasonal temperature list, and expandable pest entries with remedy cards**

## Performance

- **Duration:** ~2 min (104s)
- **Started:** 2026-02-23T18:49:57Z
- **Completed:** 2026-02-23T18:51:41Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 2 modified)

## Accomplishments

- Created `components/Detail/CareTab.tsx` with a reusable `CareSection` helper that always renders its heading, showing an italic "Not available for this species" fallback when `hasData=false`
- Implemented all 6 sections in correct order: Watering, Light, Temperature, Fertilization, Pruning, Pests
- Temperature section renders basic `tempMin–tempMax°C` range plus a nested seasonal temperatures list when `care.seasonalTemps` is present (Spring/Summer/Autumn/Winter rows)
- Fertilization and Pruning sections render bilingual `{ it, en }` schedule/type and when/how texts respectively
- Pests section uses `useState<number | null>(null)` for expand/collapse — collapsed state shows pest name + description + "Tap for remedy" hint; expanded shows a green card with "Remedy:" label and remedy text
- Extended Monstera deliciosa entry in `careDB.ts` with all 4 new fields: `seasonalTemps` (4 seasons), `fertilization` (schedule + type), `pruning` (when + how), `pests` (Spider Mite, Mealybug — each with bilingual name/description/remedy)
- Replaced `CareTabPlaceholder` stub in `app/plant/[id].tsx` with real `CareTab` import; added `initialParams={{ plantId: plant.id }}` to Care Tab.Screen as defensive fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Build CareTab component with extended care sections** — `50693dd` (feat)
2. **Task 2: Extend careDB with sample extended data + wire CareTab into [id].tsx** — `7a66ea3` (feat)

## Files Created/Modified

- `components/Detail/CareTab.tsx` — Created. 6-section care tab with CareSection helper, bilingual support, seasonal temp list, expandable pest entries. Exports `CareTab`.
- `services/careDB.ts` — Modified. Monstera deliciosa entry extended with `seasonalTemps`, `fertilization`, `pruning`, `pests` (Spider Mite + Mealybug with IT/EN bilingual data).
- `app/plant/[id].tsx` — Modified. Added `CareTab` import, removed `CareTabPlaceholder` function, replaced stub usage with real `CareTab` component in Tab.Screen.

## Decisions Made

- **CareSection always renders heading:** Per locked CARE-05 requirement — section headings are visible even when the care DB has no data for that field. Only the section content is replaced with fallback text.
- **Seasonal temps nested in Temperature section:** Rather than creating a 7th section, seasonal temps are rendered inside the Temperature section under a "SEASONAL TEMPERATURES" sub-label in a white card.
- **Pest expand/collapse design:** Collapsed shows name + description + green "Tap for remedy" hint. Expanded replaces hint with a `#F1F8E9` card with uppercase "REMEDY:" label matching app's tip-box pattern from CareInfo.
- **bilingual via direct field access:** Rather than adding more i18n keys for plant-specific text, the `{ it, en }` object pattern (already established in Plan 01 for PestEntry) is used directly — `isItalian ? x.it : x.en`.

## Deviations from Plan

None - plan executed exactly as written.

All TypeScript checks passed cleanly after each task. The i18n keys (`detail.care.*`) were already in place from Plan 01.

## Self-Check: PASSED

- `components/Detail/CareTab.tsx` exists and exports `CareTab`
- `services/careDB.ts` Monstera entry contains `seasonalTemps`, `fertilization`, `pruning`, `pests`
- `app/plant/[id].tsx` imports `CareTab` and uses it in Tab.Screen
- TypeScript exits 0
- Commits `50693dd` and `7a66ea3` confirmed in git log
