# Project Research Summary

**Project:** Plantid — React Native Plant Identification App
**Domain:** Offline-first mobile app / Plant ID + care tracking / Freemium
**Researched:** 2026-02-19
**Confidence:** MEDIUM-HIGH (stack HIGH, architecture HIGH, features MEDIUM, pitfalls HIGH for code-derived issues)

---

## Executive Summary

Plantid is a plant identification and care-tracking mobile app built on Expo SDK 54 with React Native New Architecture enabled. The scaffold is already in place with camera capture, gallery picker, PlantNet API integration, a result cache, and a rate limiter — approximately 30-40% of the plumbing exists. The remaining work is building the plant collection layer (saved plants, care database, watering history), a notification scheduler, the full screen suite, and monetization. The core architecture is on-device only with no backend, which eliminates auth and server costs but creates a hard constraint: every critical piece of logic (rate limiting, caching, API key management) that would normally live server-side must be hardened against client-side manipulation.

The recommended approach is a strict layered architecture with services-first build order: types are already complete, three services already exist (`plantnet.ts`, `cache.ts`, `rateLimiter.ts`), and the next step is adding `savedPlants.ts`, `notifications.ts`, and `settings.ts` before building any screen that depends on them. State management should remain simple — Zustand with AsyncStorage persist for the plant collection, React Context for cross-cutting concerns (i18n, theme), and local `useState` for ephemeral UI state. No Redux, no server state library. The care database is the product: PlantNet handles identification, but what users stay for is accurate, species-specific care guidance. The depth of `data/plantCareDB.ts` determines whether users rate the app 1 or 5 stars.

The two risks that most threaten the launch are the API key being exposed in the JavaScript bundle (the `EXPO_PUBLIC_` prefix ships the key in plain text in every APK/IPA) and the cache growing without any eviction bound (already identified in CONCERNS.md but not yet fixed). Both must be resolved in Phase 1 before any real build. A serverless proxy (Cloudflare Workers free tier is sufficient) solves the API key problem. LRU eviction on the cache solves the storage problem. The monetization phase (Phase 3) requires a separate New Architecture compatibility audit for `react-native-google-mobile-ads` before integration — this is the highest-risk third-party library in the plan.

---

## Key Findings

### Recommended Stack

The installed scaffold (Expo 54 / RN 0.81 / React 19 / expo-router 6 / expo-camera / expo-image-picker / AsyncStorage) covers navigation, camera, and storage. Seven additions are needed:

**Core technologies to add:**
- `expo-notifications` — local push notifications (watering reminders); the only correct solution for Expo managed workflow; `react-native-push-notification` referenced in `plan.md` is incompatible and must not be used
- `zustand ^4.5.x` — plant collection state with AsyncStorage `persist` middleware; replaces scattered raw AsyncStorage calls for shared UI state
- `expo-image` — disk-cached remote image display (PlantNet reference photos); replaces default RN `<Image>` which has no cache
- `react-native-google-mobile-ads ^14.x` — AdMob integration (Phase 3); MEDIUM confidence — verify New Architecture compatibility before installing
- `react-native-iap ^12.x` — in-app purchase for Pro unlock; `expo-in-app-purchases` is archived and must not be used
- `date-fns ^3.x` — date arithmetic for watering schedules and relative time labels
- `uuid ^9.x` + `react-native-get-random-values` polyfill — stable local IDs for saved plant records

**Critical constraint:** New Architecture is enabled (`newArchEnabled: true`). Every library added must have confirmed Fabric/JSI support. Run `npx expo install` (not `npm install`) for all Expo SDK packages. EAS Build is required for any library with native code — Expo Go will not suffice once native modules are added.

See `.planning/research/STACK.md` for full installation commands, app.json plugin configuration, and the complete "do not add" list.

### Feature Landscape

The competitive positioning is "free forever, no subscription" against PictureThis (€30/yr) and Planta (€36/yr). This framing shapes which features are table stakes and which are differentiators.

**Must have (table stakes — absence triggers negative reviews):**
- Camera + gallery identification with confidence score + top 3 candidates
- Scientific + common name display
- Basic care information (watering frequency, light, temperature)
- Save identified plant to personal collection (with photo, nickname)
- Watering reminders via push notifications
- Watering history tracking
- Organ type selection (leaf/flower/fruit/bark) with auto fallback
- Free tier daily scan limit (5/day)
- "Powered by Pl@ntNet" attribution (required by API terms — also blocks key revocation)

**Should have (differentiators — reinforce the anti-subscription positioning):**
- One-time Pro unlock at €4.99 (no recurring charge, ever)
- Offline-first architecture (care info works without internet after first ID)
- Plant notes field (often paywalled by competitors; free here builds habit)
- Per-plant nickname (emotional attachment drives retention)
- Watering compliance statistics (gamification-lite, zero engineering beyond calculation)
- Privacy-first messaging (PlantNet does not persist images server-side — true by architecture)
- Multi-photo identification up to 5 images per scan (same API cost, higher accuracy)
- Customizable notification time

**Defer to v2+:**
- Social sharing (native share sheet, 1 day of work — fine to defer)
- Disease diagnosis (requires a separate model or paid API — do not estimate without dedicated research)
- Cloud sync / account system (kills the zero-server architecture; use native OS backup if needed later)
- Widget (requires bare workflow or third-party library — assess feasibility separately)
- Additional languages beyond IT/EN (PlantNet returns names in target language automatically, so marginal effort once i18n scaffolding exists)

**The care database is the product.** Generic care data drives 1-star reviews. Species-specific, seasonally-aware data drives retention. Start with 100-150 species for MVP; expand in Phase 2 (300-500); prioritize by PlantNet's most-queried species globally.

See `.planning/research/FEATURES.md` for full competitive comparison table and feature dependency graph.

### Architecture Approach

The architecture is strictly layered: Routing (Expo Router) → Screens → Services + Data → Persistence (AsyncStorage + expo-notifications). No layer skipping. Services never import screens. Screens never touch AsyncStorage directly. The layering is already partially enforced by the existing services; the remaining work is building five new modules before the screens that depend on them.

**Major components:**
1. `services/savedPlants.ts` — CRUD for plant collection; uses index pattern (one key per plant + one index key); never store image bytes in AsyncStorage (store URI only, copy to app document directory via expo-file-system)
2. `data/plantCareDB.ts` — static TypeScript Record keyed by lowercased scientific name; synchronous lookup, no async overhead; genus-level fallback when species-level entry absent
3. `services/notifications.ts` — schedule/cancel/reschedule per-plant notifications; always persist the returned notification ID in AsyncStorage or cancellation is impossible (orphaned notifications accumulate)
4. `services/settings.ts` — user preferences (language, notification time, Pro status)
5. `i18n context` — wrap at root layout level; all user-visible strings go through it from day one; retrofitting i18n after the fact is expensive

**Build order is a hard dependency graph.** Types first (done). Existing services second (done). New services third. Data layer (care DB) alongside services. Screens built in this sequence: Identify → Result → Plant Detail → Home → Settings. Ads and IAP last, after the entire core loop is verified.

See `.planning/research/ARCHITECTURE.md` for the full layered diagram, all data flows, anti-patterns, and the routing structure.

### Critical Pitfalls

Derived from codebase audit of CONCERNS.md + ARCHITECTURE.md + INTEGRATIONS.md and Expo ecosystem patterns. Six critical (rewrite/launch-blocking) and six moderate pitfalls identified.

**Top 5 (must address before or during Phase 1):**

1. **API key exposed in bundle** — `EXPO_PUBLIC_PLANTNET_API_KEY` ships in plain text inside every APK/IPA; key is scrape-able and will be abused. Fix: build a serverless proxy (Cloudflare Workers free tier) that holds the real key; the app calls the proxy. Do this before any real build. Retrofitting later requires changing all API call sites.

2. **Unbounded cache growth silently breaks rate limiting** — The cache has no eviction policy; on long-used devices it fills AsyncStorage; write failures are swallowed silently; the rate limiter cannot write its counter; users get unlimited free scans; quota drains. Fix: LRU cap at 50 entries; evict on write when over limit. This is already flagged in CONCERNS.md but not fixed.

3. **Client-side rate limiting is bypassable** — Clearing app data or reinstalling resets the counter. With 500 global API calls/day, even 10 abusive users can drain the quota. Fix: serverless device-fingerprint tracking (same proxy as pitfall #1 can handle this); also monitor `remainingIdentificationRequests` in every API response and disable scans globally when below threshold.

4. **Hash collision in cache serves wrong plant** — `hashString()` hashes the URI string, not image content; predictable camera URI patterns increase collision probability; user sees wrong identification silently. Fix before MVP: hash URI + file size + last-modified timestamp from `expo-file-system.getInfoAsync()`.

5. **Notification scheduling fails silently on Android** — Android 13+ requires runtime permission; Android 12+ requires exact alarm permission; OEM battery optimizers (Samsung, Xiaomi, Huawei) kill background processes. Fix: use `expo-notifications` exclusively; request permission at moment of value (first plant save, not app launch); test on physical Samsung/Xiaomi devices, not emulator.

**Additional moderate risks:**
- PlantNet schema changes break the app with no warning (no Zod validation, no timeout, no retry currently)
- UTC vs. local timezone drift in rate limiter and watering schedule date comparisons
- AsyncStorage race condition on rapid double-tap of Identify button
- Wrong library referenced in plan.md (`react-native-push-notification` vs `expo-notifications`)
- New Architecture compatibility not yet audited for AdMob library (Phase 3 risk)

See `.planning/research/PITFALLS.md` for full pitfall descriptions with warning signs and prevention details.

---

## Implications for Roadmap

The architecture's hard dependency graph, the severity of Phase 1 security/stability pitfalls, and the feature priority ranking all point to the same 4-phase structure.

### Phase 1: Foundation and Core Identification Loop

**Rationale:** The existing services have known bugs (unbounded cache, hash collision, race condition, missing timeout/retry) that will cascade into every downstream feature. These must be fixed before building on top of them. The API key exposure is a security issue that blocks any real device build. Building the missing services and data layer before screens is the architecture constraint.

**Delivers:**
- Serverless proxy for PlantNet API (fixes key exposure + rate limit bypass)
- Hardened cache (LRU cap, content-based hash key)
- PlantNet API client hardening (10s timeout, 3-attempt exponential backoff, Zod schema validation)
- `services/savedPlants.ts` with index pattern and image URI storage
- `data/plantCareDB.ts` with ~100-150 species, genus-level fallback, case-normalized keys
- `services/settings.ts`
- i18n context with IT/EN strings
- Camera/Identify screen + Result screen + Plant Detail screen
- Home screen (saved plant list, watering summary)
- Free tier rate limiting (5/day) with graceful "limit reached" UX
- PlantNet attribution on result cards and settings screen

**Addresses features:** Camera ID, gallery ID, confidence display, top 3 candidates, scientific + common names, basic care info, save plant to collection (with photo, nickname, notes), free tier gate

**Avoids pitfalls:** API key exposure, cache overflow, hash collision, race condition, missing timeout/retry, wrong library (plan.md references `react-native-push-notification` — do not implement)

**Research flag:** Standard patterns — no `/gsd:research-phase` needed; architecture is well-defined.

---

### Phase 2: Care Features and Notifications

**Rationale:** Notifications depend on a working `savedPlants.ts` from Phase 1. The watering schedule requires date utilities that must be built correctly (timezone-aware) before any date-sensitive feature ships. This phase delivers the core retention loop: save plant → get reminder → mark watered → see history.

**Delivers:**
- `expo-notifications` integration (NOT `react-native-push-notification`)
- Notification ID persistence in AsyncStorage (prevents orphaned notifications on delete/reschedule)
- Android permission flow at moment of value (not app launch)
- Watering history tracking
- Watering compliance statistics (% on-time, streak)
- Customizable notification time in settings
- `getLocalDateString()` centralized utility (fixes UTC/local timezone drift)
- Care DB expanded to 300-500 species
- Multi-photo identification flow (up to 5 images per scan)

**Uses:** `expo-notifications`, `date-fns`, `zustand` (for plant collection state)

**Avoids pitfalls:** Wrong notification library, silent Android failure, UTC drift, notification ID loss

**Research flag:** Notification permission flows and Android battery optimizer behavior are known pain points — manual testing on physical Android devices required. No additional research phase needed; the patterns are documented.

---

### Phase 3: Monetization

**Rationale:** Ads and IAP are built last, after the entire core loop is verified. AdMob (`react-native-google-mobile-ads`) has the highest New Architecture compatibility risk of any library in the plan. IAP requires app store provisioning and test accounts. These dependencies make monetization the final gate before submission.

**Delivers:**
- AdMob banner integration (free tier)
- Pro in-app purchase (€4.99 one-time, non-consumable)
- Pro unlock: removes ads, raises scan limit to 15/day, unlimited saved plants
- "No subscription, ever" messaging prominent in upgrade flow

**Uses:** `react-native-google-mobile-ads ^14.x`, `react-native-iap ^12.x`

**Avoids pitfalls:** New Architecture incompatibility (audit `react-native-google-mobile-ads` against RN 0.81 + Fabric before installing; run `npx expo install --check` after each addition)

**Research flag:** NEEDS `/gsd:research-phase` before implementation. Specifically: verify `react-native-google-mobile-ads` New Architecture status on Expo SDK 54 / RN 0.81 (MEDIUM confidence currently). If incompatible, decision point: disable `newArchEnabled` or find alternative.

---

### Phase 4: Polish and Expansion

**Rationale:** Low-risk additions that require the core product to be stable and live before prioritizing. Social sharing is 1 day of work with native share sheet. Additional languages are low-effort once i18n scaffolding exists. Disease diagnosis requires dedicated research before any estimate.

**Delivers:**
- Native share sheet for identification results
- Export CSV (Pro feature)
- Additional languages (ES, FR, DE) — PlantNet returns names in target language automatically
- Care DB backfill based on observed species miss rate from production
- Widget feasibility assessment (requires bare workflow or third-party lib)

**Research flag:** Disease diagnosis is explicitly deferred — requires dedicated research on available models/APIs before any estimate. Do not scope until researched.

---

### Phase Ordering Rationale

- Phase 1 must precede everything because three existing services have bugs that will cascade; the API key exposure blocks any real device build
- Phase 2 depends on Phase 1's `savedPlants.ts` being stable — notifications schedule against plant records
- Phase 3 is correctly last because AdMob/IAP require store provisioning that needs a finished app, and New Architecture compatibility is unconfirmed
- Phase 4 is all additive — nothing in it unblocks Phase 1-3 work

### Contradictions Between Research Dimensions

One direct contradiction found: `ARCHITECTURE.md` recommends against adding Zustand ("The app is not complex enough to justify the overhead") while `STACK.md` recommends Zustand as the correct solution for shared plant collection state. **Resolution: STACK.md is correct.** The architecture note reflects the state before the full feature set was analyzed. With 3+ screens sharing plant collection data and watering state, prop drilling and raw AsyncStorage calls from screens will create the anti-patterns ARCHITECTURE.md itself warns against. Use Zustand with the persist middleware.

### Confirmed vs. Needs Validation

**Confirmed (HIGH confidence):**
- Installed package versions and New Architecture status from `package.json` and `app.json`
- Service layer patterns (from direct codebase inspection)
- `expo-notifications` as the correct notification library for managed workflow
- `expo-in-app-purchases` is archived — use `react-native-iap` instead
- `expo-ads-admob` is removed (SDK 47) — use `react-native-google-mobile-ads` instead
- PlantNet API endpoint `/v2/identify/all`, response structure, attribution requirement
- All pitfalls derived from existing CONCERNS.md (code-level audit)

**Needs validation before implementation:**
- `react-native-google-mobile-ads ^14.x` New Architecture compatibility with RN 0.81 (MEDIUM confidence — check GitHub issues before Phase 3)
- `react-native-iap ^12.x` StoreKit 2 / Google Play Billing v6 current status (MEDIUM — verify changelog before Phase 3)
- PlantNet API terms: "Powered by Pl@ntNet" exact attribution requirements (MEDIUM — verify current TOS)
- Competitive pricing (PictureThis €30/yr, Planta €36/yr) — verify App Store listings before finalizing marketing copy
- Cloudflare Workers free tier request limits — confirm 100k/day is sufficient for expected traffic before choosing proxy platform

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Installed versions verified from package.json; additions are well-established libraries with documented managed workflow compatibility |
| Features | MEDIUM | Based on training data through Aug 2025; competitive pricing and feature sets should be manually verified against current App Store listings before marketing copy is finalized |
| Architecture | HIGH | Derived from direct codebase inspection of existing services + established Expo/RN patterns; routing structure confirmed from installed expo-router v6 |
| Pitfalls | HIGH (code-derived) / MEDIUM (ecosystem) | Pitfalls 1-10 derived from CONCERNS.md + direct code audit = HIGH; Android OEM battery optimizer and New Arch compatibility pitfalls based on training knowledge = MEDIUM |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Serverless proxy platform decision:** Cloudflare Workers vs. Vercel Edge vs. AWS Lambda. Cloudflare Workers free tier is the working assumption. Validate quota (100k requests/day) against expected user count before Phase 1 commit.
- **Care DB species prioritization:** No source available for PlantNet's global query frequency ranking. Use a combination of: (a) European common plants given Italian target market, (b) Wikipedia "common houseplants" lists, (c) post-launch miss-rate telemetry for backfill. Accept that Phase 1 coverage will be imperfect.
- **New Architecture / AdMob compatibility:** Cannot confirm without a test build. Budget for a spike in early Phase 3 planning to verify before committing to the monetization implementation.
- **Android physical device testing:** Emulators do not replicate OEM battery optimizers. Samsung Galaxy or Xiaomi physical device testing is required for notification validation in Phase 2. If no physical device is available, use BrowserStack device farm.

---

## Sources

### Primary (HIGH confidence — direct inspection)
- `/Users/martha2022/Documents/Claude code/Plantid/package.json` — installed versions, New Architecture flag
- `/Users/martha2022/Documents/Claude code/Plantid/app.json` — build config, plugins
- `/Users/martha2022/Documents/Claude code/Plantid/services/plantnet.ts` — API integration, existing patterns
- `/Users/martha2022/Documents/Claude code/Plantid/services/cache.ts` — cache bugs, hash collision, no eviction
- `/Users/martha2022/Documents/Claude code/Plantid/services/rateLimiter.ts` — bypass vulnerability
- `/Users/martha2022/Documents/Claude code/Plantid/types/index.ts` — data model
- `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/CONCERNS.md` — full bug/risk inventory
- `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/ARCHITECTURE.md` — existing architecture decisions
- `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/INTEGRATIONS.md` — external dependency audit
- `/Users/martha2022/Documents/Claude code/Plantid/plan.md` — product requirements and wireframes

### Secondary (MEDIUM confidence — training knowledge, Aug 2025 cutoff)
- Expo SDK 54 documentation — expo-notifications, expo-image, expo-router v6
- PlantNet API documentation — endpoint, response schema, rate limits, attribution requirements
- react-native-iap documentation — StoreKit 2, Google Play Billing v6 support
- react-native-google-mobile-ads — New Architecture compatibility history
- Competitive app analysis — PictureThis, Planta, PlantNet app, iNaturalist, Greg

### Tertiary (LOW confidence — needs independent verification)
- Competitor App Store pricing (PictureThis €30/yr, Planta €36/yr) — verify current listings
- PlantNet global species query frequency distribution — no public dataset; use proxy sources
- Cloudflare Workers free tier daily request limit — verify current pricing page

---

*Research completed: 2026-02-19*
*Ready for roadmap: yes*
