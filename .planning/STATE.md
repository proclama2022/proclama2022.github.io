# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-19)

**Core value:** Free, subscription-free plant identification with species-specific care guidance — accessible to anyone without a €30/year paywall
**Current focus:** Phase 1 — Foundation and Core Loop

## Current Position

Phase: 1 of 3 (Foundation and Core Loop)
Plan: 05 of 11
Status: Plan 05 completed — Settings screen, i18n init, language switcher, privacy policy
Last activity: 2026-02-19 — Completed Settings screen and i18n initialization

Progress: [█████░░░░░░] 45% (5/11 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 144s
- Total execution time: 721s

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 5 | 721s | 144s |

**Recent Trend:**
- Last 5 plans: 160s (01-05), 313s (01-04), 100s (01-03), 86s (01-02), 61s (01-01)
- Trend: stable

*Updated after each plan completion*
| Phase 01-foundation-and-core-loop P05 | 160 | 1 task | 7 files |
| Phase 01-foundation-and-core-loop P04 | 313 | 1 task | 1 file |
| Phase 01-foundation-and-core-loop P03 | 100 | 1 task | 5 files |
| Phase 01-foundation-and-core-loop P01 | 180 | 3 tasks | 3 files |

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1]: API key exposure in bundle (EXPO_PUBLIC_PLANTNET_API_KEY ships in plain text in every APK/IPA) — must deploy Cloudflare Workers proxy before first device build
- [Phase 3]: react-native-google-mobile-ads New Architecture compatibility unconfirmed — budget a spike at start of Phase 3 planning to verify before committing to implementation

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 01-05 (Settings screen + i18n init) — ready for 01-06
Resume file: .planning/phases/01-foundation-and-core-loop/01-05-SUMMARY.md
