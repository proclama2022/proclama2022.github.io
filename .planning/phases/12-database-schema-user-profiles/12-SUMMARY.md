# Phase 12: Database Schema & User Profiles - Summary

**Planned:** 2026-03-02
**Status:** Ready for execution
**Total Plans:** 5
**Estimated Duration:** 780 minutes (13 hours)

## Overview

Phase 12 transforms Plantid from a personal plant tracker to a community platform by introducing user profiles with avatars, statistics, and a follow system. This phase establishes the database infrastructure, UI components, and user-facing features necessary for social engagement in preparation for the community feed (Phase 13).

## Phase Goals

1. **Database Infrastructure:** Create Supabase database schema with RLS policies for profiles, follows, and plants
2. **Avatar System:** Enable users to upload, crop, and compress avatar images
3. **Profile Management:** Allow users to create, view, and edit profiles with display name, bio, and avatar
4. **Public Profiles:** Enable viewing other users' profiles with follow/unfollow functionality
5. **Profile Statistics:** Display plants identified, followers, following, and joined date

## User Decisions (from CONTEXT.md)

### Locked Decisions
- **Display name only:** No unique @handle/username, identified by display name (max 50 chars)
- **Avatar implementation:** Gallery + camera source, circular crop, compression (max 1200px, quality 0.7), max 2MB
- **Profile visibility:** Auth-gated only, no public/anonymous access
- **Profile stats:** Plants identified, followers, following, joined date (NO tips shared - deferred)
- **Profile location:** Dedicated Profile tab in bottom navigation (not in Settings)
- **Bio:** Optional, max 500 characters, plain text

### Claude's Discretion
- Exact Profile tab layout and spacing
- Edit mode UX (modal vs inline) - chose modal for multi-field editing
- Error states for avatar upload failures
- Loading states for stats fetching
- Empty state for users with 0 plants

## Plans Created

### Wave 1: Foundation (Parallel execution)

#### Plan 12-01: Database Schema & Supabase Infrastructure
**Duration:** 180 minutes
**Requirements:** PROF-01, PROF-04, PROF-07, PROF-08
**Dependencies:** None

**Deliverables:**
- Migration SQL files for profiles, follows, plants, watering_history tables
- RLS policies for user-scoped access control
- Postgres trigger for automatic profile creation on signup
- Storage buckets configuration (avatars, plant-photos)
- Supabase query functions in `lib/supabase/profiles.ts`
- TypeScript types in `types/profile.ts`
- Zustand `profileStore` foundation

**Key Decisions:**
- Profile auto-creation via trigger on `auth.users INSERT`
- Default display_name from email prefix
- RLS enables authenticated users to read all profiles
- Storage buckets with user-isolated folders

#### Plan 12-02: Avatar Upload & Profile Services
**Duration:** 150 minutes
**Requirements:** PROF-01, PROF-02, PROF-06
**Dependencies:** 12-01

**Deliverables:**
- `services/avatarService.ts` for upload, compression, circular crop
- `services/profileService.ts` for CRUD operations
- Enhanced `profileStore` with service actions
- Profile initialization on app mount
- Validators for display name (≤ 50 chars) and bio (≤ 500 chars)

**Key Decisions:**
- Follow migrationService compression pattern (max 1200px, quality 0.7)
- Square crop (1:1 aspect ratio) enforced at upload time
- Avatar path: `{userId}/avatar_{timestamp}.jpg`
- 200x200 transformation on public URL
- Silent profile fetch on app mount (no blocking)

### Wave 2: UI Implementation (Parallel after Wave 1)

#### Plan 12-03: Profile UI Components
**Duration:** 120 minutes
**Requirements:** PROF-01, PROF-04
**Dependencies:** 12-01, 12-02

**Deliverables:**
- `components/Avatar.tsx` - Circular avatar with placeholder
- `components/ProfileStats.tsx` - Stats grid (2x2 layout)
- `ThemedCard`, `ThemedStatCard` in `components/Themed.tsx`
- `lib/utils/dateFormatter.ts` for "Joined MMM YYYY" format

**Key Decisions:**
- Avatar placeholder uses `person-circle-outline` Ionicons
- Stats grid: 2 columns, 4 items (plants, followers, following, joined)
- Number formatting: "1.2K", "10.5K" for > 1000
- Tappable stats (but list views deferred to future phase)
- Full dark mode support via Themed wrappers

#### Plan 12-04: Profile Tab & Edit UI
**Duration:** 180 minutes
**Requirements:** PROF-01, PROF-03, PROF-04, PROF-06, PROF-07
**Dependencies:** 12-01, 12-02, 12-03

**Deliverables:**
- Profile tab in bottom navigation (4th tab)
- `app/(tabs)/profile.tsx` - Profile view screen
- `components/ProfileEditModal.tsx` - Edit modal
- i18n translations for profile (en/it)

**Key Decisions:**
- Profile tab shows: Avatar (120px), display name, bio, edit button, stats grid
- Edit mode uses modal (not inline) for better UX
- Avatar upload via action sheet (library | camera)
- Character counts in modal (e.g., "25/50")
- Stats refresh on tab focus (not real-time)
- Auth-gated (show sign in prompt if not authenticated)

### Wave 3: Public Profiles & Follow (After Wave 2)

#### Plan 12-05: Public Profile Viewing & Follow System
**Duration:** 150 minutes
**Requirements:** PROF-04, PROF-05
**Dependencies:** 12-01, 12-02, 12-03, 12-04

**Deliverables:**
- `app/profile/[userId].tsx` - Public profile screen (dynamic route)
- `services/followService.ts` - Follow/unfollow logic
- `components/FollowButton.tsx` - Follow/unfollow button
- i18n translations for follow (en/it)

**Key Decisions:**
- Dynamic route: `/profile/{userId}`
- Redirect to own profile if viewing own profile
- Follow button: "Follow" (filled) vs "Following" (outlined with checkmark)
- Optimistic stats update after follow/unfollow
- Self-follow prevented (can't follow yourself)
- Future integration: Navigation from feed/comments (Phase 13)

## Requirements Coverage

| Requirement | Plan(s) | Status |
|-------------|---------|--------|
| PROF-01 | 12-01, 12-02, 12-04 | User can create profile with display name, avatar, bio |
| PROF-02 | 12-02 | Avatar upload with compression and circular crop |
| PROF-03 | 12-04 | User can view own profile with stats |
| PROF-04 | 12-01, 12-03, 12-05 | User can view other users' profiles + follow system |
| PROF-05 | 12-05 | User can view public profiles |
| PROF-06 | 12-02, 12-04 | User can edit display name, avatar, bio |
| PROF-07 | 12-01 | Automatic profile creation on signup |
| PROF-08 | 12-01 | Plants table supports migration from v1.x |

**Coverage: 8/8 requirements (100%)**

## Database Schema

### Tables Created

**profiles:**
```sql
- id UUID PRIMARY KEY REFERENCES auth.users(id)
- display_name TEXT NOT NULL CHECK(char_length(display_name) <= 50)
- bio TEXT CHECK(char_length(bio) <= 500)
- avatar_url TEXT
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()
```

**follows:**
```sql
- follower_id UUID REFERENCES profiles(id)
- following_id UUID REFERENCES profiles(id)
- created_at TIMESTAMPTZ DEFAULT now()
- PRIMARY KEY (follower_id, following_id)
```

**plants:**
```sql
- id UUID PRIMARY KEY
- user_id UUID REFERENCES auth.users(id)
- species TEXT
- common_name TEXT?
- scientific_name TEXT?
- nickname TEXT?
- location TEXT?
- photo_urls TEXT[]
- added_date TIMESTAMPTZ
- notes TEXT?
- purchase_date TEXT?
- purchase_price TEXT?
- purchase_origin TEXT?
- gift_from TEXT?
- created_at TIMESTAMPTZ DEFAULT now()
- updated_at TIMESTAMPTZ DEFAULT now()
```

**watering_history:**
```sql
- id UUID PRIMARY KEY
- user_id UUID REFERENCES auth.users(id)
- plant_id UUID REFERENCES plants(id)
- watered_date TIMESTAMPTZ
- notes TEXT?
- created_at TIMESTAMPTZ DEFAULT now()
```

### Storage Buckets

**avatars:**
- Public bucket
- Path pattern: `{userId}/avatar_{timestamp}.jpg`
- RLS: Authenticated users can read, users can write to own folder only

**plant-photos:**
- Public bucket
- Path pattern: `{userId}/{plantId}/{timestamp}.jpg`
- RLS: Authenticated users can read, users can write to own folder only

## Technical Stack

### Libraries Used (Existing)
- **Supabase JS Client 2.x** - Database queries, Storage upload, RLS
- **expo-image-picker** - Gallery and camera access
- **expo-image-manipulator** - Image compression and cropping
- **Zustand 4.x** - Profile state management
- **Expo Router** - File-based navigation (dynamic routes)
- **Ionicons** - Icons for UI elements
- **i18next** - Localization (en/it)

### New Installations
```bash
npm install @expo/react-native-fast-image
npx expo install expo-image-picker
```

Note: expo-image-manipulator already in project from migrationService.

## Architecture Patterns

### State Management
- **profileStore** (Zustand): Manages current profile, edit mode, loading, error states
- **authStore** (existing): Provides user.id for profile queries
- No persist middleware - fresh fetch on app launch

### Service Layer
- **avatarService**: Upload, compress, crop avatars
- **profileService**: CRUD operations for profiles
- **followService**: Follow/unfollow logic
- All services return `{ success, data?, error? }` structure

### Component Architecture
- **Avatar**: Reusable circular avatar with placeholder
- **ProfileStats**: 2x2 stats grid with tappable items
- **FollowButton**: Pill-shaped toggle button
- **ProfileEditModal**: Multi-field edit modal
- All components use Themed wrappers for dark mode

### Database Access
- RLS policies enforce access control at database level
- No manual auth checks in UI (RLS handles it)
- Service layer handles errors and returns consistent structure

## Open Questions & Deferred Features

### Open Questions (Resolved)
1. **Avatar placeholder:** Ionicons `person-circle-outline` (resolved)
2. **Edit mode UX:** Modal screen (resolved)
3. **Stats refresh:** On tab focus (resolved)
4. **Avatar bucket RLS:** Public-read (resolved)

### Deferred to Future Phases
- **Tips shared stat:** Defer until tips feature exists (Phase 13+)
- **Followers/following lists:** Tappable stats but list views are separate phase
- **Real-time stats updates:** Use Supabase subscriptions in Phase 12.5
- **Private profile option:** Future enhancement
- **Unique @handles:** Would require username availability check
- **Profile deep links:** Requires @handles first

## Quality Gates

- [x] All 5 PLAN.md files created with valid frontmatter
- [x] Tasks are specific and actionable (2-3 tasks per plan)
- [x] Dependencies correctly identified (wave structure)
- [x] Waves assigned for parallel execution (3 waves)
- [x] must_haves derived from phase goal and verified
- [x] All requirements mapped to plans (8/8 coverage)
- [x] Estimated durations: 780 minutes total
- [x] Files modified listed in each plan

## Next Steps

### Immediate (Execution Phase)
1. **Run database migrations:** `supabase db push`
2. **Create Storage buckets:** Via Supabase Dashboard or CLI
3. **Execute plans in wave order:** 12-01 & 12-02 (parallel) → 12-03 & 12-04 (parallel) → 12-05
4. **Test profile creation:** Sign up new user, verify profile auto-created
5. **Test avatar upload:** Upload, compress, verify in Storage
6. **Test follow system:** Follow/unfollow, verify stats update

### Integration with Future Phases
- **Phase 13 (Community Feed):** Navigation from feed/comments to profiles
- **Phase 14 (Follow System):** "Following" feed filter, liked posts in profile
- **Phase 12.5 (Enhancement):** Real-time stats with Supabase subscriptions

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Avatar upload fails silently | User frustration | Explicit error messages, retry logic |
| RLS policies block access | Profiles inaccessible | Test policies immediately after migration |
| Profile doesn't auto-create | App crashes on signup | Test trigger with new signup |
| Follow count desync | Incorrect stats | Re-query stats on tab focus |
| Large avatar file size | Upload timeout | Compress client-side before upload |

## Performance Considerations

- **Avatar compression:** Reduces bandwidth and storage (max 1200px, quality 0.7)
- **Image transformations:** Supabase transforms on-demand (200x200 for display)
- **Stats queries:** Use Supabase count aggregation (single query with joins)
- **Lazy profile fetch:** Non-blocking on app mount
- **Tab focus refresh:** Stats update when user navigates to profile

## Security & Privacy

- **RLS policies:** All tables enforce user-scoped access
- **Storage folders:** User-isolated paths prevent cross-user access
- **Auth-gated profiles:** No anonymous profile viewing
- **No public profiles:** All profiles require authentication
- **Avatar bucket:** Public-read but authenticated-write

## Summary

Phase 12 establishes the social infrastructure for Plantid v2.0 Community. Users can create rich profiles with avatars, view other users' profiles, and follow plant enthusiasts. The database schema supports future community features (posts, comments, likes) while maintaining strict access control via RLS. The UI follows Instagram-style patterns familiar to users, with full dark mode support and bilingual localization.

**Key achievement:** Transforms Plantid from personal tracker to social platform ready for community feed in Phase 13.

---

**Phase:** 12 - Database Schema & User Profiles
**Status:** Planning complete, ready for execution
**Created:** 2026-03-02
**Planner:** GSD Planner Agent
