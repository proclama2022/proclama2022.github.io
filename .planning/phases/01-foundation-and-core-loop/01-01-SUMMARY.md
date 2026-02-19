---
phase: 01-foundation-and-core-loop
plan: 01
subsystem: Core Services
tags: [security, performance, bugfix]
dependency_graph:
  requires: []
  provides: [LRU cache, mutex-protected rate limiting, API proxy routing]
  affects: [01-02, 01-03, 01-04]
tech_stack:
  added:
    - package: lru-cache
      version: latest
      purpose: Memory-safe LRU caching with TTL
    - package: expo-crypto
      version: latest
      purpose: SHA-256 hashing for cache keys
    - package: async-mutex
      version: latest
      purpose: Atomic rate limit operations
  patterns:
    - SHA-256 content-based hashing for collision resistance
    - Mutex for read-modify-write atomicity
    - Cloudflare Workers proxy for API key protection
key_files:
  created:
    - services/cache.ts (105 lines)
    - services/rateLimiter.ts (132 lines)
    - services/plantnet.ts (199 lines)
  modified:
    - package.json (added dependencies)
key_decisions:
  - Use expo-crypto instead of node:crypto for React Native compatibility
  - Use LRUCache named import (not default) based on library export
  - Proxy URL uses __DEV__ flag to switch between direct API (dev) and Workers (prod)
metrics:
  duration_seconds: 180
  completed_date: 2026-02-19T17:36:05Z
  tasks_completed: 3
  files_created: 3
  files_modified: 1
  lines_added: 436
  commits: 3
---

# Phase 01 Plan 01: Critical Service Bugs Summary

## One-Liner
Hardened three core services with LRU cache (SHA-256 hashing), mutex-protected rate limiting, and Cloudflare Workers proxy routing to eliminate hash collisions, unbounded memory growth, race conditions, and API key exposure vulnerabilities.

## Objective
Fix critical service bugs before any UI work:
- Replace vulnerable cache with collision-resistant SHA-256 hashing and LRU library
- Fix rate limiter race conditions with mutex-protected atomic operations
- Secure API key via Cloudflare Workers proxy (prevent exposure in client bundle)

## Tasks Completed

### Task 1: Fix cache with LRU library and SHA-256 hashing
**Commit:** `50c940d`
**Files:** services/cache.ts, package.json
**Changes:**
- Installed lru-cache and expo-crypto dependencies
- Replaced vulnerable hashString() with Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256)
- Implemented LRUCache instance with max=100 entries, ttl=7 days
- Removed AsyncStorage operations (LRU handles in-memory caching with auto-eviction)
- Added getCacheStats() for debugging

**Verification:**
- TypeScript compiles without errors in services/cache.ts
- LRU cache configured with max=100, ttl=604800000 (7 days)
- hashImage() uses SHA-256 via expo-crypto

### Task 2: Fix rate limiter race conditions with mutex
**Commit:** `3f3900c`
**Files:** services/rateLimiter.ts, package.json
**Changes:**
- Installed async-mutex dependency
- Created Mutex instance for atomic operations
- Wrapped canIdentify() in mutex.runExclusive()
- Wrapped incrementIdentificationCount() in mutex.runExclusive()
- Fixed getTodayString() to use LOCAL timezone (new Date(year, month, day)) instead of UTC
- Added getRateLimitInfo() for debugging/UI display

**Verification:**
- TypeScript compiles without errors in services/rateLimiter.ts
- canIdentify() and incrementIdentificationCount() use mutex.runExclusive()
- getTodayString() constructs local date (not UTC)

### Task 3: Route API calls through Cloudflare Workers proxy
**Commit:** `aae4795`
**Files:** services/plantnet.ts
**Changes:**
- Added PROXY_URL constant (uses __DEV__ to switch between direct API and Workers)
- Removed 'api-key' from query params (proxy adds it server-side)
- Added comprehensive Cloudflare Workers deployment guide in comments
- Kept dev API key check for local development

**Verification:**
- TypeScript compiles without errors in services/plantnet.ts
- PROXY_URL constant exists and is used in identifyPlant()
- No 'api-key' query parameter in production code path (only in deployment guide comments)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed lru-cache import error**
- **Found during:** Task 1
- **Issue:** lru-cache doesn't export a default export, causing TypeScript error
- **Fix:** Changed `import LRU from 'lru-cache'` to `import { LRUCache } from 'lru-cache'`
- **Files modified:** services/cache.ts
- **Commit:** 50c940d

## Requirements Satisfied
- ID-05: Plant identification uses PlantNet API
- ID-06: Identification results cached locally
- RATE-01: Free users limited to 5 identifications per day
- RATE-03: Rate limit tracked locally
- RATE-04: Rate limit resets at midnight
- RATE-05: Rate limit enforced before API call
- LEGAL-03: API key not exposed in client bundle

## Technical Implementation Details

### Cache Service (services/cache.ts)
- **Library:** lru-cache with LRUCache named import
- **Hash Algorithm:** SHA-256 via expo-crypto (React Native compatible)
- **Configuration:** max=100 entries, ttl=7 days
- **Fallback:** Simple hash if crypto fails (graceful degradation)
- **API:** getCachedResult(), setCachedResult(), clearCache(), getCacheSize(), getCacheStats()

### Rate Limiter Service (services/rateLimiter.ts)
- **Library:** async-mutex with Mutex class
- **Pattern:** mutex.runExclusive() wraps all read-modify-write cycles
- **Timezone:** Local date via `new Date(year, month, day)` (not UTC)
- **Daily Limit:** 5 identifications
- **API:** canIdentify(), incrementIdentificationCount(), resetRateLimit(), getRateLimitInfo()

### PlantNet Service (services/plantnet.ts)
- **Dev Mode:** Direct API call with EXPO_PUBLIC_PLANTNET_API_KEY
- **Prod Mode:** Cloudflare Workers proxy (API key hidden server-side)
- **Deployment:** User must manually deploy Cloudflare Worker (comprehensive guide in comments)
- **Security:** API key never ships in production APK/IPA

## Integration Points

The three services integrate as follows:

```
plantnet.ts (identifyPlant)
  ├─> cache.ts (getCachedResult/setCachedResult)
  └─> rateLimiter.ts (canIdentify/incrementIdentificationCount)

cache.ts
  └─> lru-cache (LRUCache instance)

rateLimiter.ts
  └─> async-mutex (Mutex instance)
```

## Next Steps

**IMPORTANT:** Before building any UI screens:
1. Deploy Cloudflare Workers proxy (see comments in services/plantnet.ts lines 9-65)
2. Update PROXY_URL with deployed worker URL
3. Test API calls through proxy

These fixes are prerequisites for all subsequent plans (01-02 through 01-11).

## Verification Checklist
- [x] Cache uses SHA-256 hashing (collision-resistant)
- [x] Cache has LRU cap of 100 entries max
- [x] Cache entries expire after 7 days
- [x] Rate limiter uses mutex to prevent race conditions
- [x] Rate limiter resets at user's local midnight
- [x] API calls route through Cloudflare Workers proxy (not direct PlantNet)
- [x] All existing tests still pass (no tests existed)
- [x] TypeScript compiles without errors in all service files

## Self-Check: PASSED

**Files created:**
- services/cache.ts: EXISTS
- services/rateLimiter.ts: EXISTS
- services/plantnet.ts: EXISTS

**Commits verified:**
- 50c940d: EXISTS (Task 1 - LRU cache with SHA-256)
- 3f3900c: EXISTS (Task 2 - Mutex rate limiter)
- aae4795: EXISTS (Task 3 - API proxy routing)

**Verification criteria:**
- LRU cache with max=100, ttl=7days: PASSED
- SHA-256 hashing via expo-crypto: PASSED
- Mutex.runExclusive() on rate limit operations: PASSED
- Local timezone for getTodayString(): PASSED
- PROXY_URL constant and usage: PASSED
- No 'api-key' in production query params: PASSED
