# Domain Pitfalls: Plant Identification Mobile App

**Domain:** Cross-platform plant identification app (Expo / React Native / PlantNet API)
**Researched:** 2026-02-19
**Sources:** Existing codebase audit (CONCERNS.md, ARCHITECTURE.md, INTEGRATIONS.md), plan.md, package.json, known Expo/AsyncStorage/PlantNet domain patterns
**Confidence:** HIGH for pitfalls derived from existing code; MEDIUM for ecosystem patterns from training knowledge

---

## Critical Pitfalls

Mistakes that cause rewrites, store rejections, or major data loss.

---

### Pitfall 1: API Key Baked Into the Bundle

**What goes wrong:** `EXPO_PUBLIC_*` variables are bundled into the JavaScript artifact at build time and are fully readable by anyone who unpacks the APK/IPA. The API key becomes public.

**Why it happens:** Expo's convention for client-accessible env vars requires the `EXPO_PUBLIC_` prefix, which is convenient but means the value ships in plain text inside the bundle. Developers treat this like a server-side secret and it is not.

**Consequences:**
- PlantNet API key is scraped and abused; you exhaust your 500/day quota instantly
- PlantNet may revoke the key; the entire app stops working overnight
- No server sits between the app and the API, so there is no corrective layer

**Warning signs:**
- `.env` contains `EXPO_PUBLIC_PLANTNET_API_KEY` and that key works in production
- No backend proxy exists for the PlantNet call
- `services/plantnet.ts` sends the key as a URL query parameter (`?api-key=...`)

**Prevention:**
- Build a thin serverless proxy (Cloudflare Worker, Vercel Edge Function, or AWS Lambda) that holds the real key server-side
- The app calls your proxy; the proxy calls PlantNet
- Zero server-cost options: Cloudflare Workers free tier handles ~100k requests/day
- Do NOT store the key in `app.json extra` either — same bundle exposure problem

**Phase to address:** Phase 1 (MVP) — before the first real build. Retrofitting a proxy later requires changing every API call site.

---

### Pitfall 2: Client-Side Rate Limiting Is Trivially Bypassable

**What goes wrong:** The daily 5-scan limit is enforced via `AsyncStorage`. Clearing app data, reinstalling, or even manually editing AsyncStorage resets the counter. Power users burn through the global 500/day quota in minutes.

**Why it happens:** There is no user identity. The rate limiter (`services/rateLimiter.ts`) tracks state per-device per-install, not per-person. The existing code is already identified as a fragile area in CONCERNS.md.

**Consequences:**
- 500 global API calls depleted by a handful of users before most of the user base gets any
- PlantNet returns 429; the whole app shows errors to everyone
- Free-tier math (100 users × 5 scans = 500) collapses when even 10 users clear their storage

**Warning signs:**
- Rate limit resets when user reinstalls the app
- No server-side scan count per device fingerprint or user ID
- `@plantid_rate_limit` key is the only enforcement mechanism

**Prevention:**
- Add a lightweight backend endpoint that tracks scans by device fingerprint (Expo `Device.osBuildId + Device.modelId` hash) or IP
- Alternatively: tighten to 3 scans/day for free tier (smaller quota burn per abuse)
- Log the PlantNet `remainingIdentificationRequests` field from the API response and surface it to users; at <50 remaining, disable new scans globally
- Implement exponential backoff when the API returns 429 rather than crashing

**Phase to address:** Phase 1 (MVP) — establish the safety valve before launch. The 500/day ceiling is absolute; exceeding it stops all users.

---

### Pitfall 3: AsyncStorage Cache Grows Without Bound

**What goes wrong:** Each PlantNet response (JSON with images, scores, multi-language names) can be 5-20KB. The cache (`services/cache.ts`) stores entries with no eviction policy and no size cap. On a device used for months, the cache fills and AsyncStorage writes start failing silently.

**Why it happens:** CONCERNS.md already identifies this: "Cache unbounded — could fill device storage with large PlantNet responses over time." The 7-day TTL only cleans entries on access; cold entries persist indefinitely.

**Consequences:**
- AsyncStorage throws errors that are silently caught (`console.error` only)
- Cache writes fail; the rate limiter state also fails to write (same storage)
- Rate limit counter does not increment; users get unlimited free scans; quota drains

**Warning signs:**
- No `MAX_CACHE_ENTRIES` or `MAX_CACHE_SIZE_BYTES` constant exists
- `getCacheSize()` and `clearCache()` use linear key scan across ALL AsyncStorage keys
- Error handling in cache.ts swallows errors without surfacing them to the user

**Prevention:**
- Implement LRU eviction: keep max 50 entries; evict oldest-access on write
- Add a cache size guard: before writing, check current key count; if over limit, evict N oldest entries
- Compress cached JSON with a lightweight codec (e.g., store only `results[0..4]` not all results)
- Make cache errors throw (not just console.error) so the service layer can handle degradation

**Phase to address:** Phase 1 (MVP) — the cache is already written; cap it before it ships.

---

### Pitfall 4: Hash Collision in Cache Keys Serves Wrong Plant

**What goes wrong:** `hashString()` in `services/cache.ts` is a basic polynomial hash over the image URI string — not the image content. Two different images with URIs that hash to the same value will share a cache entry. User photographs plant B and sees cached results for plant A.

**Why it happens:** Hashing by URI instead of content is fast but incorrect for a cache keyed on image identity. URI paths from `expo-image-picker` and `expo-camera` often follow predictable patterns (`file:///data/user/0/.../DCIM/Camera/IMG_XXXX.jpg`) that increase collision probability.

**Consequences:**
- Silent wrong identification: user sees "Lavanda 85% confidence" for a rose photo
- User adds the wrong plant to their collection; care reminders are wrong
- Trust in the app collapses when users notice mismatch

**Warning signs:**
- `hashString()` takes the URI string, not image bytes
- No collision detection or cache invalidation on mismatch
- Already flagged as "Known Bug: Hash collision vulnerability" in CONCERNS.md

**Prevention:**
- Hash a combination of: URI + file size + last-modified timestamp
- `expo-file-system` provides `FileSystem.getInfoAsync(uri)` which returns `size` and `modificationTime` — use both in the hash key
- Alternatively, use the first 1KB of image bytes as hash input (read with `FileSystem.readAsStringAsync` with encoding options)
- Add a content-type check: verify the cached result's confidence score is reasonable before serving from cache

**Phase to address:** Phase 1 (MVP) — fix before the cache service is used by any real screen.

---

### Pitfall 5: Notification Scheduling Fails Silently on Android

**What goes wrong:** Local notification scheduling on Android requires explicit permission (Android 13+), exact alarm permission (Android 12+), and battery optimization exclusion. Without these, scheduled notifications are silently dropped. Users never see watering reminders.

**Why it happens:** iOS and Android have diverged significantly on notification permissions. Expo's notification APIs abstract some of this but not all. Android's Doze mode and battery optimizers (especially on Samsung, Xiaomi, Huawei devices) kill background processes that would fire notifications.

**Consequences:**
- Core differentiator (watering reminders) does not work for a significant % of Android users
- App Store / Play Store reviews cite "notifications don't work" as top complaint
- Problem is device-model-specific and hard to reproduce in emulator

**Warning signs:**
- `expo-notifications` is not yet in `package.json` (currently missing — plan references `react-native-push-notification` which is community-maintained and deprecated in favor of `expo-notifications`)
- No permission request flow implemented yet
- No testing on physical Android devices from Samsung/Xiaomi/Huawei

**Prevention:**
- Use `expo-notifications` (not `react-native-push-notification` — the latter requires bare workflow and manual native configuration)
- Request permissions at the moment of value: when user first adds a plant, not at app launch
- On Android, prompt user to disable battery optimization for the app (link to settings)
- Schedule notifications as exact alarms when possible; fall back to inexact with user-facing warning
- Test on physical devices, not emulator — emulators do not replicate OEM battery optimizers

**Phase to address:** Phase 2 (Care features) — notifications are the core deliverable of that phase. Design the permission flow before writing the scheduling logic.

---

### Pitfall 6: PlantNet API Changes Break the App With No Warning

**What goes wrong:** PlantNet is a free academic API with no formal SLA, no versioned deprecation notice policy, and a history of unannounced endpoint changes. The current endpoint `/v2/identify/all` has been stable, but field names, response schema, and rate limit headers can change.

**Why it happens:** The code in `services/plantnet.ts` has no response schema validation. It accesses `data.results[0].species.commonNames` etc. directly. If PlantNet adds a wrapper or renames a field, the app crashes silently.

**Consequences:**
- All identifications fail; users see blank results or errors
- No monitoring catches the failure until user reviews appear
- The fix requires an app store update (days to weeks for review)

**Warning signs:**
- No Zod/io-ts schema validation on the API response
- No `remainingIdentificationRequests` monitoring or alerting
- No fallback when `results` array is empty or malformed
- CONCERNS.md flags: "Hardcoded API URL without version management, no retry logic, no timeout handling"

**Prevention:**
- Add runtime schema validation with Zod on the PlantNet response shape
- Treat any response that doesn't match the schema as a degraded state: show "identification unavailable" rather than crash
- Subscribe to the PlantNet mailing list / GitHub issues for API change notices
- Add a 10-second timeout on the fetch call (currently missing)
- Add an exponential backoff retry (max 3 attempts) for 5xx errors and network timeouts
- Cache the last known-good schema version; compare on startup

**Phase to address:** Phase 1 (MVP) — the API integration is the core value; harden it before any other feature is built on top.

---

## Moderate Pitfalls

---

### Pitfall 7: Care DB Coverage Gap Breaks the Core UX Loop

**What goes wrong:** PlantNet identifies 50,000+ species. The local care DB targets 300-500. For every plant not in the DB, the app shows "Care information coming soon!" — which is what the app is for. Users who identify niche species (orchids, regional plants, anything uncommon) get no value from the core loop.

**Why it happens:** The DB is a manually curated JSON. Coverage gaps are inevitable. The fallback message is honest but defeats the purpose of the app for a significant subset of identifications.

**Prevention:**
- Prioritize DB entries by PlantNet's own frequency data: the API's top-result species across global queries gives a ranked list of what people actually photograph
- Add a graceful fallback: if species not in DB, check for genus-level care data (Lavandula sp. instead of Lavandula angustifolia) — genus match covers ~80% of care needs
- Show partial data ("This is a succulent — water sparingly") from family/genus even when species-level entry is absent
- Track which species users identify most and hit the DB miss for; prioritize those for backfill

**Warning signs:**
- DB only has common names as keys (not scientific names), causing misses from alternate spellings
- No genus-level fallback logic exists in the lookup function
- DB covers only European/North American common plants; users in Asia/South America get frequent misses

**Phase to address:** Phase 1 (DB building) and ongoing backfill in Phase 4.

---

### Pitfall 8: Image Quality Degrades Identification Accuracy Below Threshold

**What goes wrong:** PlantNet works best with close-up, well-lit photos of a single organ. Users routinely submit blurry, backlit, or whole-plant photos. The API returns a result with a low confidence score (0.2–0.4) which the app currently passes through as if valid.

**Why it happens:** `isGoodConfidence()` exists in `services/plantnet.ts` but there is no UX enforcement of what happens when confidence is low. The identification result screen shows a result regardless.

**Consequences:**
- Users trust wrong identifications; wrong care schedule; potentially dangerous for toxic plants (a misidentified toxic plant treated as safe)
- App develops reputation for inaccuracy that is actually user behavior, not API quality

**Prevention:**
- Gate the result display on confidence threshold: below 0.5 show "We're not sure — here are our best guesses" rather than a confident result card
- Add guidance during camera capture: "Get close to a single leaf or flower for best results"
- Show the organ selector prominently — `auto` mode is less accurate than explicit organ selection
- Allow users to send up to 5 images of the same plant in one API call (the API supports this; 1 request = 1 quota unit regardless of image count)

**Warning signs:**
- `isGoodConfidence()` threshold is not configurable
- Camera screen has no framing guidance
- Result screen does not visually distinguish high vs low confidence results

**Phase to address:** Phase 1 (Camera screen and Results screen implementation).

---

### Pitfall 9: Date/Timezone Handling in Rate Limiter and Watering Schedule

**What goes wrong:** The rate limiter uses `new Date().toISOString().split('T')[0]` which gives a UTC date. If a user in Tokyo scans at 11pm local time (UTC+9), the UTC date is the next day. Their daily count resets at 3pm local time, not midnight. Watering schedules have the same problem: a plant due "today" may appear due "tomorrow" or vice versa depending on timezone.

**Why it happens:** JavaScript's `Date` is timezone-aware but `toISOString()` always returns UTC. CONCERNS.md already flags this as a fragile area. The app targets Italian-speaking users (UTC+1/+2) so the error is small but real at daylight savings transitions.

**Prevention:**
- Use `new Date().toLocaleDateString('en-CA')` for a YYYY-MM-DD date in the device's local timezone
- Or use `date-fns` with `startOfDay` in local timezone for all date comparisons
- Write a single `getLocalDateString()` utility function; use it everywhere dates are compared — do not inline date formatting
- Unit test the date utility across DST boundary scenarios

**Warning signs:**
- Multiple places in the codebase independently compute "today's date" as a string
- No centralized date utility exists yet

**Phase to address:** Phase 1 (fix before any date-sensitive feature ships).

---

### Pitfall 10: AsyncStorage Race Conditions on Concurrent Reads/Writes

**What goes wrong:** If the user taps the identify button twice quickly, two concurrent calls to `canIdentify()` both read the same count (e.g., 4), both determine the limit is not reached, both call `incrementIdentificationCount()`, and two API calls fire. The count increments twice but only one is tracked atomically. Users can double-tap past the rate limit.

**Why it happens:** AsyncStorage has no transaction primitive. The read-then-write pattern in `rateLimiter.ts` and `cache.ts` is inherently racy under concurrent calls. CONCERNS.md identifies this: "No locking mechanism for concurrent cache/rate-limit operations."

**Prevention:**
- Use a singleton promise queue for rate limit operations: queue all `canIdentify` + `increment` calls through a serial async queue (a simple array of pending promises)
- Disable the identify button immediately on first tap (set loading state before the async check completes)
- Loading state is also missing per CONCERNS.md — this fix solves both problems

**Warning signs:**
- No `isLoading` state guards the identify button
- `canIdentify()` and `incrementIdentificationCount()` are called in sequence without locking

**Phase to address:** Phase 1 (Camera/Identify screen implementation).

---

### Pitfall 11: expo-notifications vs react-native-push-notification

**What goes wrong:** `plan.md` specifies `react-native-push-notification` but the project is Expo managed workflow. `react-native-push-notification` requires native code modifications that only work in bare workflow. It will not work with `expo start` or `expo go`, and EAS builds will fail without custom native configuration.

**Why it happens:** `react-native-push-notification` is an older community library predating Expo's first-party notification solution. It is still widely referenced in tutorials.

**Prevention:**
- Use `expo-notifications` exclusively — it is the first-party Expo library, works in managed workflow, handles iOS permissions automatically, and is supported in EAS builds
- `expo-notifications` supports local notification scheduling natively without a server

**Warning signs:**
- `package.json` does not yet include `expo-notifications`
- `plan.md` references `react-native-push-notification` (wrong library for Expo managed workflow)

**Phase to address:** Phase 2 — before writing a single line of notification code.

---

### Pitfall 12: New Architecture Enabled Without Verifying Library Compatibility

**What goes wrong:** `app.json` has `"newArchEnabled": true`. React Native's New Architecture (Fabric + TurboModules) requires libraries to have New Arch-compatible native modules. Several key libraries on the roadmap — particularly AdMob integrations and older community libraries — may not support New Arch.

**Why it happens:** New Arch is opt-in in Expo 54. Enabling it aggressively increases performance but breaks libraries that have not migrated their native bridge code.

**Consequences:**
- `react-native-google-mobile-ads` (AdMob) has had known New Arch issues on specific RN versions
- App crashes on Android with cryptic "TurboModule not found" errors
- Problem appears only in production builds (EAS), not in Expo Go

**Prevention:**
- Before installing any library, check its GitHub issues for "new architecture" compatibility
- Run `npx expo install --check` after each library addition to verify peer dependency alignment
- If a critical library is New Arch incompatible, disable `newArchEnabled` and document the trade-off

**Warning signs:**
- `newArchEnabled: true` but no compatibility audit has been done for planned libraries
- AdMob, image processing, or notification libraries being added without checking RN 0.81 + New Arch compatibility matrix

**Phase to address:** Phase 3 (Monetization) — especially before adding `react-native-google-mobile-ads`.

---

## Minor Pitfalls

---

### Pitfall 13: Scientific Name Key Mismatch in Care DB Lookup

**What goes wrong:** PlantNet returns `scientificNameWithoutAuthor` as `"Lavandula angustifolia"` (mixed case). If the care DB uses lowercase keys (`"lavandula angustifolia"`) and the lookup does not normalize case, every lookup misses and users always see the fallback message.

**Prevention:**
- Normalize to lowercase in both DB keys and at lookup time: `species.toLowerCase()` before every DB access
- Add a unit test: `lookupCare("LAVANDULA ANGUSTIFOLIA")` should return the same result as `lookupCare("lavandula angustifolia")`

**Phase to address:** Phase 1 (DB implementation).

---

### Pitfall 14: PlantNet Attribution Requirement Missed in Store Review

**What goes wrong:** PlantNet's free tier requires the "Powered by Pl@ntNet" attribution to be visible in the app. If it is absent or buried, PlantNet can revoke the API key. Apple and Google reviewers also increasingly check third-party attribution requirements.

**Prevention:**
- Display the attribution on the Settings/About screen AND on each identification result card (small logo or text)
- Do not rely on a single mention in a deep settings screen — it must be reasonably visible

**Phase to address:** Phase 1 (Result screen) and Phase 3 (Settings screen).

---

### Pitfall 15: Image Size Not Validated Before Upload

**What goes wrong:** `expo-camera` can produce images up to 12MP+ on modern phones. Uploading a 5MB image to PlantNet on a slow mobile connection causes timeouts. The API may also reject oversized payloads.

**Prevention:**
- Compress images before upload using `expo-image-manipulator` — resize to max 1024px on the longest edge, JPEG quality 0.8
- This reduces typical payload from 3-5MB to 100-300KB with negligible accuracy loss
- Add upload size validation: warn user if image exceeds 2MB after compression

**Phase to address:** Phase 1 (Camera/image capture implementation).

---

### Pitfall 16: Multi-Language Tip Strings Maintenance Burden

**What goes wrong:** The care DB structure has per-language tip strings (`tips: { it: "...", en: "..." }`). Adding a third language (Spanish, French) requires editing every one of 300-500 DB entries. This does not scale.

**Prevention:**
- Store tips as a single canonical English string in the DB
- Translate at display time using a localization library (`expo-localization` + `i18next`)
- For plant care tips specifically, the English content is professional-quality and machine translation (via a one-time script) is adequate

**Phase to address:** Phase 4 (Multi-language expansion).

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| Phase 1: MVP | API integration | API key exposure in bundle | Serverless proxy before first build |
| Phase 1: MVP | Cache implementation | Unbounded growth + collision | LRU cap + content-based hash key |
| Phase 1: MVP | Rate limiting | Client-side bypass | Add server-side device fingerprint tracking |
| Phase 1: MVP | PlantNet calls | No timeout, no retry | 10s timeout + 3-attempt exponential backoff |
| Phase 1: MVP | Care DB lookup | Case mismatch misses | Normalize to lowercase at write and read |
| Phase 1: MVP | Image upload | Oversized payloads | expo-image-manipulator compression before upload |
| Phase 2: Care | Notifications | Wrong library (react-native-push-notification) | Use expo-notifications only |
| Phase 2: Care | Notifications | Silent failure on Android (Doze, OEM battery) | Test physical Samsung/Xiaomi; prompt battery opt-out |
| Phase 2: Care | Watering dates | UTC vs local timezone drift | Centralized `getLocalDateString()` utility |
| Phase 3: Ads | AdMob | New Architecture incompatibility | Audit before install; fallback to disable newArchEnabled |
| Phase 4: i18n | Multi-language DB | Per-language string maintenance | Single canonical language + i18next for translation |
| All phases | PlantNet schema | Unannounced API changes | Zod validation on every response |

---

## Sources

- Existing codebase audit: `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/CONCERNS.md` (HIGH confidence — direct code analysis)
- Architecture audit: `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/ARCHITECTURE.md` (HIGH confidence)
- Integration audit: `/Users/martha2022/Documents/Claude code/Plantid/.planning/codebase/INTEGRATIONS.md` (HIGH confidence)
- Project plan: `/Users/martha2022/Documents/Claude code/Plantid/plan.md` (HIGH confidence — source of truth for requirements)
- PlantNet API terms: plan.md documents "one free account per legal entity, logo required" (MEDIUM confidence — not independently verified against current TOS)
- Expo New Architecture compatibility: Based on known Expo 50-54 migration history (MEDIUM confidence — verify before Phase 3)
- Android notification OEM behavior: Well-documented community pattern across React Native / Expo apps (MEDIUM confidence)
- `expo-notifications` vs `react-native-push-notification`: Expo managed workflow constraint is HIGH confidence — this is a hard limitation of managed workflow
