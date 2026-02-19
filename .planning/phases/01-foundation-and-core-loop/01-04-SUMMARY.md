---
phase: 01-foundation-and-core-loop
plan: 04
subsystem: database
tags: [typescript, plant-care, lookup, bilingual, i18n]

# Dependency graph
requires:
  - phase: 01-foundation-and-core-loop
    provides: "PlantCareInfo type definition in types/index.ts"
provides:
  - "CARE_DATA array with 103 common plant species and structured care data"
  - "getCareInfo(scientificName) lookup function returning PlantCareInfo | null"
affects: [results-screen, care-guidance, watering-reminders, plant-collection]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Static in-memory database pattern: data as typed constant array with lookup function"
    - "Bilingual content pattern: tips.it / tips.en for Italian/English care instructions"

key-files:
  created:
    - services/careDB.ts
  modified: []

key-decisions:
  - "103 species included (exceeds 100 minimum) covering indoor plants, succulents, cacti, herbs, ferns, and flowering plants"
  - "Lookup is case-insensitive scientific name match (toLowerCase on both sides)"
  - "aliases field on PlantCareInfo allows common synonyms but lookup is by scientificName only"
  - "Pre-existing TypeScript errors in ExternalLink.tsx and i18n/index.ts are out of scope (unrelated to this plan)"

patterns-established:
  - "getCareInfo pattern: import and call getCareInfo(result.species.scientificName) from results screen"
  - "Null-safe return: getCareInfo returns null for unknown species — callers must handle null"
  - "Toxicity warning pattern: toxicPets boolean used to show pet safety callout in UI"

requirements-completed: [CARE-01, CARE-02, CARE-03, CARE-04, CARE-05]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 1 Plan 04: Care Database Summary

**Static TypeScript care database with 103 plant species, getCareInfo() lookup function, and bilingual IT/EN tips covering watering, sunlight, temperature, soil, humidity, and pet toxicity**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-19T13:45:02Z
- **Completed:** 2026-02-19T13:50:15Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `services/careDB.ts` with 103 plant species (exceeds 100 minimum)
- All entries include complete PlantCareInfo fields: waterFrequencyDays, sunlight, tempMin/Max, soil, humidity, difficulty, toxicPets
- Every species has bilingual care tips (Italian and English)
- `getCareInfo(scientificName)` performs case-insensitive lookup and returns `PlantCareInfo | null`
- Exported `CARE_DATA` array for testing access
- Coverage spans indoor plants, succulents, cacti, herbs, aromatic plants, ferns, carnivorous plants, aquatic plants, and flowering plants

## Task Commits

Each task was committed atomically:

1. **Task 1: Create care database with 100 species and lookup function** - `d3a04c5` (feat)

**Plan metadata:** (pending — docs commit)

## Files Created/Modified

- `services/careDB.ts` — 1860-line care database: CARE_DATA array (103 species) + getCareInfo() lookup function

## Decisions Made

- 103 species included (exceeds 100 minimum) to provide better coverage across common plant categories
- Lookup is case-insensitive scientific name match (`.toLowerCase()` on both sides) for robustness
- `aliases` field populated where common synonyms exist but lookup remains scientific-name-only per spec
- Pre-existing TypeScript errors in `components/ExternalLink.tsx` and `i18n/index.ts` are out of scope; `careDB.ts` itself compiles cleanly with zero errors

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `components/ExternalLink.tsx` (unused @ts-expect-error) and `i18n/index.ts` (i18next API version mismatch) were present before this plan and are unrelated to careDB.ts. Logged to deferred-items but not fixed per scope boundary rule. `services/careDB.ts` itself has zero TypeScript errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `getCareInfo(scientificName)` ready for import in results screen via `import { getCareInfo } from '@/services/careDB'`
- Null-safe: callers must handle `null` return for unrecognized species
- Pet toxicity data ready for UI warning callout
- Bilingual tips ready for i18n display using current language setting

---
*Phase: 01-foundation-and-core-loop*
*Completed: 2026-02-19*
