# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Free, subscription-free plant identification with species-specific care guidance — accessible to anyone without a €30/year paywall
**Current focus:** Phase 1 — Foundation and Core Loop

## Current Position

Phase: 1 of 3 (Foundation and Core Loop)
Plan: 10 of 11
Status: Plan 10 completed — Plant detail screen with care guide, bilingual tips, save-on-blur fields, and modal delete
Last activity: 2026-02-19 — Completed plant detail screen

Progress: [██████████░] 91% (10/11 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 145s
- Total execution time: 1451s

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 10 | 1451s | 145s |

**Recent Trend:**
- Last 5 plans: 133s (01-10), 294s (01-08), 232s (01-07), 71s (01-06), 160s (01-05)
- Trend: steady

*Updated after each plan completion*
| Phase 01-foundation-and-core-loop P06 | 71 | 1 task | 4 files |
| Phase 01-foundation-and-core-loop P05 | 160 | 1 task | 7 files |
| Phase 01-foundation-and-core-loop P04 | 313 | 1 task | 1 file |
| Phase 01-foundation-and-core-loop P03 | 100 | 1 task | 5 files |
| Phase 01-foundation-and-core-loop P01 | 180 | 3 tasks | 3 files |
| Phase 01-foundation-and-core-loop P07 | 232 | 1 tasks | 4 files |
| Phase 01-foundation-and-core-loop P08 | 294 | 1 tasks | 4 files |
| Phase 01-foundation-and-core-loop P10 | 133 | 1 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-Phase 1]: Build serverless proxy (Cloudflare Workers) before any real device build — API key is exposed in plain text via EXPO_PUBLIC_ prefix in current scaffold
- [Pre-Phase 1]: Fix unbounded cache (LRU cap 50 entries, content-based hash) before building screens — existing cache.ts has known overflow and hash-collision bugs
- [Phase 3]: Run New Architecture compatibility audit for react-native-google-mobile-ads before installing — MEDIUM confidence currently; verify against RN 0.81 + Fabric
- [Stack]: Use expo-notifications (NOT react-native-push-notification referenced in plan.md — incompatible with managed workflow)
- [Stack]: Use react-native-iap (NOT expo-in-app-purchases — archived)
- [Stack]: Use Zustand with AsyncStorage persist for plant collection state
- [I18n]: Use expo-localization for device language detection with i18next
- [I18n]: AsyncStorage key '@plantid_language' for language preference persistence
- [I18n]: Formal Italian 'Lei' form for UI text, fallback to English
- [Phase 01]: Use expo-crypto for SHA-256 hashing (React Native compatible)
- [Phase 01]: Use async-mutex for atomic rate limit operations
- [Phase 01]: Route API calls through Cloudflare Workers proxy (hide API key from client bundle)
- [Phase 01]: Use LRUCache named import (not default) based on lru-cache library export
- [Phase 01]: Static in-memory care database (CARE_DATA array in careDB.ts) — 103 species, lookup by scientific name, bilingual IT/EN tips
- [Phase 01-05]: Use TouchableOpacity buttons for language switcher — SegmentedControl not installed
- [Phase 01-05]: Gate splash screen on both fonts loaded AND i18n ready to avoid untranslated flash
- [Phase 01-05]: Register privacy as Stack.Screen in root layout for proper back-button navigation
- [Phase 01-06]: Use ScrollView pagingEnabled instead of react-native-swiper for onboarding carousel (not installed, unnecessary dependency)
- [Phase 01-06]: Onboarding guard at HomeScreen level — conditional render !hasSeenOnboarding, avoids router-level navigation complexity
- [Phase 01-07]: Camera screen calls identifyPlant directly; passes serialised response to /results via router params
- [Phase 01-07]: useRef<CameraView> (not CameraViewRef) is the correct ref type for expo-camera CameraView class component
- [Phase 01-07]: OrganSelector shown after PreviewConfirm — user reviews image before selecting organ type
- [Phase 01-foundation-and-core-loop]: Phase 01-08: Use FlatList pagingEnabled for results carousel — react-native-snap-carousel@3.9.1 incompatible with RN 0.81 New Architecture
- [Phase 01-foundation-and-core-loop]: Phase 01-08: Results screen bootstrapped from camera params then cache then API — avoids duplicate API call
- [Phase 01-foundation-and-core-loop]: Save notes/nickname/location on TextInput blur — no explicit save button reduces UI noise
- [Phase 01-foundation-and-core-loop]: CareInfo component receives PlantCareInfo | null — null triggers coming soon state, component is fully self-contained
- [Phase 01-foundation-and-core-loop]: Delete confirmation via Modal not Alert.alert — consistent visual design across platforms

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: API key exposure in bundle (EXPO_PUBLIC_PLANTNET_API_KEY ships in plain text in every APK/IPA) — must deploy Cloudflare Workers proxy before first device build
- [Phase 3]: react-native-google-mobile-ads New Architecture compatibility unconfirmed — budget a spike at start of Phase 3 planning to verify before committing to implementation

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 01-10 (Plant Detail Screen) — ready for 01-11
Resume file: .planning/phases/01-foundation-and-core-loop/01-10-SUMMARY.md
