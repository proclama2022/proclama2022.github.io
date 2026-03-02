# Phase 12: Database Schema & User Profiles - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create profiles with display name, avatar, and bio. Users can view their own profile with stats and view other users' public profiles (authenticated only). Profile editing is done through a dedicated Profile tab.

Scope includes:
- User profiles table in Supabase
- Avatar upload with compression and circular crop
- Profile stats display
- Public profile viewing (auth-gated)
- Profile editing UI

Out of scope:
- Unique @handles (using display name only)
- Tips sharing feature (future phase)
- Private profile option
- Plant migration (already in Phase 11)

</domain>

<decisions>
## Implementation Decisions

### Profile Identity
- **Display name only** — No unique @handle/username. Users are identified by display name (max 50 chars)
- No URL sharing via handle (profiles accessed only through in-app navigation)
- No username conflict resolution needed

### Avatar Implementation
- **Source:** Both gallery picker AND camera capture
- **Crop:** Circular crop required before saving
- **Compression:** Use existing expo-image-manipulator pattern from migrationService (max 1200px, quality 0.7)
- **Storage:** Supabase Storage bucket 'avatars' (new bucket, separate from 'plant-photos')
- **Placeholder:** Default avatar placeholder when none uploaded
- **Max size:** 2MB before compression

### Profile Visibility
- **Auth-gated:** Only authenticated users can view profiles
- No public/anonymous access to profile data
- All profiles visible to all logged-in users (no privacy toggle)

### Profile Statistics
Stats to display on profile:
- Plants identified (count from plants table)
- Followers count
- Following count
- Joined date (from auth.users.created_at)

**NOT included:**
- Tips shared (feature doesn't exist yet — defer to future phase)

### Profile Location & Navigation
- **Dedicated Profile tab** in bottom navigation (not in Settings)
- Tab shows: large avatar, display name, bio, stats grid
- Edit mode: inline editing or modal (planner's discretion)
- Viewing other profiles: push navigation from feed/comments

### Bio
- Optional, max 500 characters
- Plain text (no markdown, no links)

### Claude's Discretion
- Exact Profile tab layout and spacing
- Edit mode UX (inline vs modal)
- Error states for avatar upload failures
- Loading states for stats fetching
- Empty state for users with 0 plants

</decisions>

<specifics>
## Specific Ideas

- Profile should feel like Instagram's profile tab — photo prominent, stats grid below, content below that
- Circular avatar with subtle border
- Stats should be tappable (followers → followers list, etc.) — but lists are future phase

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/supabase/client.ts` — Supabase client already configured
- `stores/authStore.ts` — Auth state with user/session, pattern to follow for profile store
- `services/migrationService.ts` — Image compression with expo-image-manipulator, can reuse pattern
- `lib/supabase/storageAdapter.ts` — SecureStore adapter for session persistence
- `components/useColorScheme.ts` — Theme-aware hook pattern

### Established Patterns
- **State management:** Zustand stores with typed interfaces (see authStore, plantsStore, settingsStore)
- **UI components:** Themed components from `components/Themed.tsx`
- **Navigation:** Expo Router file-based tabs in `app/(tabs)/`
- **Storage:** Supabase Storage for files, Supabase Postgres for data
- **Image handling:** expo-image-picker + expo-image-manipulator

### Integration Points
- **Auth:** `useAuthStore().user.id` is the primary key for profiles
- **Navigation:** Add new `(profile)` tab to `app/(tabs)/_layout.tsx`
- **Database:** Create `profiles` table in Supabase linked to `auth.users`
- **Storage:** Create `avatars` bucket in Supabase Storage

### Database Schema Needed
```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL CHECK(char_length(display_name) <= 50),
  bio TEXT CHECK(char_length(bio) <= 500),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)

follows (
  follower_id UUID REFERENCES profiles(id),
  following_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
)
```

</code_context>

<deferred>
## Deferred Ideas

- Unique @handles for URL sharing — would require username availability check and conflict resolution
- Tips shared stat — defer until tips feature is built (Phase 13+)
- Private profile option — future enhancement
- Followers/following lists — tappable stats but list views are separate phase
- Profile deep links — requires handles first

</deferred>

---

*Phase: 12-database-schema-user-profiles*
*Context gathered: 2026-03-02*
