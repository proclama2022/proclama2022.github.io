---
phase: 12-database-schema-user-profiles
plan: 01
subsystem: database
tags: [supabase, postgresql, rls, zustand, typescript, storage, profiles, social]

# Dependency graph
requires:
  - phase: 11-auth-infrastructure-supabase-setup
    provides: supabase client, auth store, secure storage adapter
provides:
  - Database schema for profiles, follows, plants, watering_history
  - RLS policies for user-scoped data access
  - Storage buckets for avatars and plant photos
  - Profile query layer with type-safe functions
  - Profile state management with Zustand
  - Auto-create profile trigger on user signup
affects: [13-profile-ui, 14-social-feed, 15-comments-likes]

# Tech tracking
tech-stack:
  added: [supabase storage bucket management, postgresql triggers, rls policies]
  patterns: [profile store pattern, auto-creation trigger, user-isolated storage folders]

key-files:
  created:
    - supabase/migrations/001_initial_schema.sql
    - supabase/migrations/002_profiles_follows_tables.sql
    - lib/supabase/storage.ts
    - lib/supabase/profiles.ts
    - stores/profileStore.ts
  modified: []

key-decisions:
  - "Profile types already existed in types/profile.ts - skipped creation"
  - "Auto-create profile trigger extracts username from email (split_part)"
  - "Public profile viewing - authenticated users can read all profiles"
  - "User-isolated storage folders - user_id/* path pattern for RLS"
  - "No persist middleware for profileStore - fresh fetch on app launch"
  - "Helper functions for profile stats (get_follower_count, etc.)"
  - "Dynamic imports in profileStore to avoid circular dependencies"

patterns-established:
  - "Pattern: Profile queries return null for not-found (not an error)"
  - "Pattern: ProfileError class for structured error handling"
  - "Pattern: Composite primary key for follows (follower_id, following_id)"
  - "Pattern: Check constraint prevents self-follows"
  - "Pattern: Updated_at triggers for automatic timestamp maintenance"
  - "Pattern: Supabase join syntax for efficient stats aggregation"

requirements-completed: [PROF-01, PROF-04, PROF-07]

# Metrics
duration: 15min
completed: 2026-03-02
---

# Phase 12 Plan 01: Database Schema & Supabase Infrastructure Summary

**PostgreSQL schema with RLS policies, Supabase storage buckets, profile query layer, and Zustand state management**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-02T19:08:19Z
- **Completed:** 2026-03-02T20:14:00Z
- **Tasks:** 5
- **Files modified:** 5

## Accomplishments

- Database schema for profiles, follows, plants, and watering_history tables
- Row Level Security policies enabling public profile viewing with user-scoped data access
- Auto-create profile trigger that extracts username from email on signup
- Supabase Storage buckets for avatars and plant photos with RLS policies
- Type-safe profile query layer with error handling and stats aggregation
- Zustand profile store following authStore pattern for state management

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database migration SQL files** - `1cb3ce9` (feat)
2. **Task 2: Create Storage buckets configuration** - `5fbb11e` (feat)
3. **Task 3: Create Supabase profile queries layer** - `ae6c3ca` (feat)
4. **Task 4: Create TypeScript types for profiles** - Skipped (already exists)
5. **Task 5: Create profile state management store** - `c543613` (feat)

**Plan metadata:** N/A (summary created after execution)

## Files Created/Modified

### Created Files

- `supabase/migrations/001_initial_schema.sql` - Core database schema (profiles, follows, plants, watering_history tables)
- `supabase/migrations/002_profiles_follows_tables.sql` - RLS policies, triggers, and helper functions
- `lib/supabase/storage.ts` - Storage bucket management (avatars, plant-photos) with URL helpers
- `lib/supabase/profiles.ts` - Profile query layer (getProfile, updateProfile, followUser, etc.)
- `stores/profileStore.ts` - Zustand store for profile state management

### Modified Files

None - all files were new additions.

## Decisions Made

### Task 4: Profile Types Already Existed
- **Issue:** types/profile.ts already existed with complete type definitions
- **Decision:** Skipped Task 4 creation, verified all required types were present
- **Verification:** Profile, ProfileWithStats, ProfileStats, Follow, ProfileState all present and exported in types/index.ts
- **Rationale:** No duplication needed - existing implementation matched plan requirements exactly

### Architecture Decisions

1. **Auto-create profile trigger** - Uses `split_part(NEW.email, '@', 1)` to extract username from email, ensures profile exists immediately after signup
2. **Public profile viewing** - Authenticated users can read all profiles (SELECT policy with `USING (true)`), enables community features
3. **User-isolated storage folders** - Path pattern `{userId}/*` for RLS policies, prevents cross-user access
4. **No persist middleware** - Profile data fetched fresh from Supabase on app launch, follows authStore pattern
5. **Helper functions** - PostgreSQL functions `get_follower_count()`, `get_following_count()`, `get_plants_count()` for efficient stats
6. **Dynamic imports** - profileStore uses dynamic imports to avoid circular dependencies with lib/supabase/profiles

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

### Task Modifications

**Task 4: Profile types already complete**
- **Found during:** Task 4 execution
- **Issue:** types/profile.ts already existed with all required types
- **Resolution:** Verified completeness, skipped creation
- **Files checked:** types/profile.ts, types/index.ts
- **Verification:** All required types present (Profile, ProfileWithStats, ProfileStats, Follow, ProfileState)

---

**Total deviations:** 0 auto-fixed, 1 task skipped (already complete)
**Impact on plan:** No impact - Task 4 was already implemented in previous work. All other tasks executed as specified.

## Issues Encountered

None - execution was smooth with no blocking issues.

## User Setup Required

**External services require manual configuration.** To use the database schema and storage buckets created in this plan:

### Supabase Setup

1. **Run migrations:**
   ```bash
   supabase db push
   ```
   This will execute both migration files (001 and 002) to create tables, RLS policies, and triggers.

2. **Create storage buckets manually** (if not using initializeStorageBuckets()):
   - Go to Supabase Dashboard → Storage
   - Create bucket `avatars` (public)
   - Create bucket `plant-photos` (public)
   - Set up RLS policies for both buckets (see migration 002 comments)

3. **Verify setup:**
   ```bash
   # Check tables exist
   supabase db remote tables list

   # Check buckets exist
   supabase storage list
   ```

### Environment Variables

Ensure these are set in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Next Phase Readiness

### Ready for Next Phase

- Database schema complete with RLS policies
- Profile query layer ready for UI integration
- Profile store ready for profile screen implementation
- Storage buckets configured for avatar uploads

### Phase 13 (Profile UI) Can Now

- Build profile screen with stats display
- Implement profile editing (display name, bio)
- Add avatar upload functionality
- Display followers/following lists
- Implement follow/unfollow actions

### Blockers/Concerns

None - infrastructure is complete and ready for UI development.

## Self-Check: PASSED

All files created:
- ✅ supabase/migrations/001_initial_schema.sql
- ✅ supabase/migrations/002_profiles_follows_tables.sql
- ✅ lib/supabase/storage.ts
- ✅ lib/supabase/profiles.ts
- ✅ stores/profileStore.ts
- ✅ 12-01-SUMMARY.md

All commits verified:
- ✅ 1cb3ce9 (Task 1 - migration files)
- ✅ 5fbb11e (Task 2 - storage configuration)
- ✅ ae6c3ca (Task 3 - profile queries)
- ✅ c543613 (Task 5 - profile store)

---
*Phase: 12-database-schema-user-profiles*
*Plan: 01 - Database Schema & Supabase Infrastructure*
*Completed: 2026-03-02*
