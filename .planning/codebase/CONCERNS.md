# Codebase Concerns

**Analysis Date:** 2026-02-19

## Test Coverage Gaps

**No automated tests:**
- What's not tested: Entire codebase including API integration, cache logic, rate limiting, and UI components
- Files: `services/plantnet.ts`, `services/cache.ts`, `services/rateLimiter.ts`, `components/`, `app/(tabs)/`
- Risk: Critical business logic (PlantNet API integration, cache management, rate limiting) has no automated validation and can degrade silently
- Priority: High

**Missing E2E testing:**
- What's not tested: User workflows like image capture → plant identification → result display
- Files: `app/(tabs)/index.tsx`, `app/(tabs)/two.tsx`, complete app flow
- Risk: UI-level bugs, navigation issues, and integration failures won't be caught until runtime
- Priority: High

**No component testing:**
- What's not tested: Themed components, color scheme handling, responsive layouts
- Files: `components/Themed.tsx`, `components/EditScreenInfo.tsx`, `components/useColorScheme.ts`
- Risk: UI regressions and accessibility issues won't be caught
- Priority: Medium

## Security Considerations

**API key exposure:**
- Risk: API key is checked at runtime but may be embedded in build artifacts or logs. Using `process.env.EXPO_PUBLIC_PLANTNET_API_KEY` makes it public-facing.
- Files: `services/plantnet.ts` (lines 26-33)
- Current mitigation: Placeholder check for "your_api_key_here"
- Recommendations: Use proper secrets management (environment-specific .env files excluded from git), implement server-side API proxy, rotate key regularly

**FormData and image upload vulnerability:**
- Risk: FormData is used with `as any` type casting (line 49), bypassing type safety. Image URI validation is minimal (only checks file extension).
- Files: `services/plantnet.ts` (lines 45-49)
- Current mitigation: None
- Recommendations: Add proper image validation (file size, MIME type, dimensions), remove `as any` casting, validate URI format

**AsyncStorage data persistence:**
- Risk: Cache and rate limit data stored in plain text in AsyncStorage without encryption. Contains potentially sensitive plant identification data.
- Files: `services/cache.ts`, `services/rateLimiter.ts`
- Current mitigation: None
- Recommendations: Encrypt sensitive cached data, use secure storage for rate limit tracking

## Performance Bottlenecks

**Inefficient image hashing:**
- Problem: `hashString()` implementation is a basic JS hash function with poor collision characteristics and slow for large image URIs
- Files: `services/cache.ts` (lines 10-18)
- Cause: Custom hash implementation instead of proven algorithm. String iteration on every character
- Improvement path: Use cryptographic hash (crypto.md5, crypto.sha256) or image content-based hashing for better collision avoidance

**AsyncStorage bottleneck for cache:**
- Problem: Entire cache entry (including potentially large PlantNetResponse objects) serialized as JSON string in AsyncStorage
- Files: `services/cache.ts` (lines 58-70)
- Cause: Device storage I/O is synchronous and serialization overhead grows with response size
- Improvement path: Consider native cache (realm, sqlite) for large data, implement pagination for results, compress cached responses

**Linear cache key filtering:**
- Problem: `getCacheSize()` and `clearCache()` fetch ALL keys then filter - scales poorly with app usage
- Files: `services/cache.ts` (lines 75-96)
- Cause: AsyncStorage provides no built-in prefix filtering
- Improvement path: Keep separate registry of cache keys, use indexed storage solution

**Unoptimized rate limit lookup:**
- Problem: Rate limiter does full state deserialization on every identification attempt
- Files: `services/rateLimiter.ts` (lines 17-31, 67-77)
- Cause: No caching of rate limit state between calls
- Improvement path: Cache rate limit state in memory, only persist to AsyncStorage on state change

## Fragile Areas

**PlantNet API integration:**
- Files: `services/plantnet.ts`
- Why fragile:
  - Hardcoded API URL without version management
  - No retry logic for transient failures
  - No timeout handling
  - Error parsing attempts JSON first then falls back (lines 74-79) - fragile if API changes error format
  - FormData handling with type casting bypasses type safety
- Safe modification: Add comprehensive error types, implement exponential backoff retry, add request timeouts, validate responses against schema

**Cache synchronization:**
- Files: `services/cache.ts`, `services/rateLimiter.ts`
- Why fragile:
  - No locking mechanism for concurrent cache/rate-limit operations
  - AsyncStorage operations can race if called simultaneously
  - Error handling silently swallows errors with only console.error
- Safe modification: Implement request queueing, add transaction-like semantics, throw errors instead of silently failing in production

**Date handling in rate limiter:**
- Files: `services/rateLimiter.ts` (lines 10-12, 49-52)
- Why fragile:
  - Uses `new Date().toISOString().split('T')[0]` - assumes local timezone consistency
  - Could break across daylight savings, timezone changes, or system clock adjustments
  - No validation that date format is correct
- Safe modification: Use a date library (date-fns, dayjs) with timezone awareness, add validation

**Type safety gaps:**
- Files: `services/plantnet.ts` (line 49 `as any`), `services/cache.ts` (lines 40, 63 - JSON.parse without validation)
- Why fragile: `as any` and unvalidated JSON parsing can introduce runtime errors
- Safe modification: Use schema validation library (Zod, io-ts) for API responses and cached data

## Scaling Limits

**AsyncStorage capacity:**
- Current capacity: Device-dependent (typically 5-10MB on mobile)
- Limit: Cache unbounded - could fill device storage with large PlantNet responses over time
- Scaling path: Implement LRU cache eviction, add configurable cache size limit, implement compression

**API rate limiting (client-side only):**
- Current capacity: 5 identifications per day per device
- Limit: No server-side rate limiting tracking; user could circumvent by clearing AsyncStorage
- Scaling path: Implement server-side rate limiting per user, add authentication, add server-side session tracking

**Daily count reset logic:**
- Current capacity: Resets per calendar day in local timezone
- Limit: Multiple devices/timezones per user not handled; gaming possible
- Scaling path: Implement server-side date tracking, use UTC timestamps, add user authentication

## Dependencies at Risk

**React Native 0.81.5:**
- Risk: Relatively old version (current is ~0.76+), potential security vulnerabilities, may have compatibility issues with newer libraries
- Impact: Security patches may not be available, future dependency updates may be blocked
- Migration plan: Update to latest stable React Native version incrementally, test thoroughly with new arch enabled

**Expo 54.0.33:**
- Risk: Near-deprecated version (major releases every ~6 months), will lose support soon
- Impact: Security updates end, new APIs unavailable, community resources dwindle
- Migration plan: Update to latest Expo version, review deprecation warnings, update plugins

**React 19.1.0 with React Native:**
- Risk: React 19 is very new; compatibility with React Native may have gaps, some libraries may not be compatible
- Impact: Stability issues, third-party library incompatibilities
- Migration plan: Verify all dependencies support React 19, monitor for issues, be prepared to downgrade if needed

## Missing Critical Features

**No offline support:**
- Problem: App requires internet connection for every plant identification
- Blocks: Users cannot identify plants without connectivity, cached results expire after 7 days
- Impact: Severely limits app usability in areas with poor connectivity

**No persistent plant library:**
- Problem: SavedPlant type exists in types but no implementation for saving/retrieving user's plant collection
- Blocks: Core feature (my plants) cannot function
- Impact: App cannot persist user data between sessions

**No error recovery:**
- Problem: Network errors, API errors, storage errors all fail silently or show minimal feedback
- Blocks: Users don't know what went wrong or how to retry
- Impact: Poor UX, silent failures in production

**No image size/format validation:**
- Problem: App can submit any image to API without checking size, format, or orientation
- Blocks: Large image uploads will fail, formats API doesn't support will cause errors
- Impact: Wasted bandwidth, poor user experience with no guidance

**No loading state management:**
- Problem: No visible feedback during API calls or cache operations
- Blocks: Users don't know if app is processing
- Impact: Poor perceived performance, accidental double-taps

## Known Bugs

**Hash collision vulnerability:**
- Symptoms: Multiple images could hash to same cache key (low probability but possible)
- Files: `services/cache.ts` (lines 10-18)
- Trigger: Load multiple images that happen to have same hash despite different URIs
- Workaround: Clear cache and retry, use full image content hash instead

**Date reset race condition:**
- Symptoms: On day boundary with concurrent identification attempts, rate limit might not reset correctly
- Files: `services/rateLimiter.ts` (lines 49-54, 67-77)
- Trigger: Call `incrementIdentificationCount()` at exactly midnight/day boundary
- Workaround: Retry identification if limit check seems wrong

**AsyncStorage errors silently ignored:**
- Symptoms: Cache and rate limit failures go unnoticed, app continues as if nothing happened
- Files: `services/cache.ts` (lines 49-52, 68-69), `services/rateLimiter.ts` (lines 23-25, 40-42, 86-87)
- Trigger: Storage full, permission denied, or corrupted data
- Workaround: None - errors only logged to console

## Technical Debt

**Placeholder UI screens:**
- Issue: App screens (TabOne, TabTwo, modal) are demo placeholders from Expo template, not real functionality
- Files: `app/(tabs)/index.tsx`, `app/(tabs)/two.tsx`, `app/modal.tsx`
- Impact: Core app features not implemented, services exist but UI to use them doesn't
- Fix approach: Implement actual plant identification UI using plantnet service

**Type definitions incomplete:**
- Issue: `SavedPlant` and `PlantCareInfo` types defined but no implementation for persistence or retrieval
- Files: `types/index.ts` (lines 47-83)
- Impact: App structure doesn't match intended functionality
- Fix approach: Implement data persistence layer, add repository pattern for data access

**Hardcoded constants:**
- Issue: Magic numbers scattered throughout (5 daily limit, 7 day expiry, hash algorithm details)
- Files: `services/cache.ts` (line 5), `services/rateLimiter.ts` (line 5)
- Impact: Hard to configure, hard to test different scenarios
- Fix approach: Create configuration file, inject values, add feature flags

**Error handling inconsistent:**
- Issue: Different modules handle errors differently (return objects vs throw, console.error vs silent)
- Files: `services/plantnet.ts`, `services/cache.ts`, `services/rateLimiter.ts`
- Impact: Caller must check different patterns, errors inconsistently propagated
- Fix approach: Establish error handling strategy, create custom error types, apply consistently

**Inline styling:**
- Issue: Many components use inline StyleSheet definitions without shared theme system
- Files: Multiple .tsx files
- Impact: Hard to maintain consistent design, duplicate styles, no design tokens
- Fix approach: Extract styles to theme system, use design tokens

---

*Concerns audit: 2026-02-19*
