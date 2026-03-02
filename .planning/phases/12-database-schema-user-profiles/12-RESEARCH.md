# Phase 12: Database Schema & User Profiles - Research

**Researched:** 2026-03-02
**Domain:** Supabase Postgres database schema, Row Level Security (RLS), Storage buckets, React Native image handling
**Confidence:** HIGH

## Summary

Questa fase richiede l'implementazione di profili utente con avatar, statistiche e sistema di follow in Supabase. La ricerca conferma che Supabase è ben attrezzato per questo scopo con Row Level Security (RLS) per il controllo degli accessi, Storage per i file avatar, e trigger automatici per timestamp. L'architettura esistente del progetto (expo-image-manipulator per compressione, Zustand per state management) si allinea perfettamente con le best practice per la gestione di immagini e stato.

**Primary recommendation:** Use Supabase RLS policies with `auth.uid()` for user-scoped profile access, create dedicated 'avatars' Storage bucket with public-read transformations, and implement a Zustand profileStore following the existing authStore pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Profile Identity**
- Display name only — No unique @handle/username. Users are identified by display name (max 50 chars)
- No URL sharing via handle (profiles accessed only through in-app navigation)
- No username conflict resolution needed

**Avatar Implementation**
- Source: Both gallery picker AND camera capture
- Crop: Circular crop required before saving
- Compression: Use existing expo-image-manipulator pattern from migrationService (max 1200px, quality 0.7)
- Storage: Supabase Storage bucket 'avatars' (new bucket, separate from 'plant-photos')
- Placeholder: Default avatar placeholder when none uploaded
- Max size: 2MB before compression

**Profile Visibility**
- Auth-gated: Only authenticated users can view profiles
- No public/anonymous access to profile data
- All profiles visible to all logged-in users (no privacy toggle)

**Profile Statistics**
Stats to display on profile:
- Plants identified (count from plants table)
- Followers count
- Following count
- Joined date (from auth.users.created_at)

NOT included:
- Tips shared (feature doesn't exist yet — defer to future phase)

**Profile Location & Navigation**
- Dedicated Profile tab in bottom navigation (not in Settings)
- Tab shows: large avatar, display name, bio, stats grid
- Edit mode: inline editing or modal (planner's discretion)
- Viewing other profiles: push navigation from feed/comments

**Bio**
- Optional, max 500 characters
- Plain text (no markdown, no links)

### Claude's Discretion
- Exact Profile tab layout and spacing
- Edit mode UX (inline vs modal)
- Error states for avatar upload failures
- Loading states for stats fetching
- Empty state for users with 0 plants

### Deferred Ideas (OUT OF SCOPE)
- Unique @handles for URL sharing — would require username availability check and conflict resolution
- Tips shared stat — defer until tips feature is built (Phase 13+)
- Private profile option — future enhancement
- Followers/following lists — tappable stats but list views are separate phase
- Profile deep links — requires handles first
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | User profiles table with display name, avatar URL, bio, timestamps | Database schema section provides complete table structure with RLS policies |
| PROF-02 | Avatar upload with circular crop and compression | Image handling pattern from migrationService.ts + expo-image-picker documentation |
| PROF-03 | Profile stats display (plants identified, followers, following, joined date) | Query patterns for counting relationships and joining with plants table |
| PROF-04 | Follow/unfollow functionality between users | Follows table schema with RLS policies for self-service follow management |
| PROF-05 | Profile viewing (own and other users') | RLS policies enable authenticated users to read all profiles while preventing anon access |
| PROF-06 | Profile editing (display name, bio, avatar) | UPDATE RLS policy allowing users to modify only their own profile |
| PROF-07 | Automatic profile creation on user signup | Postgres trigger on auth.users INSERT to create profiles row |
| PROF-08 | Avatar placeholder when none uploaded | Conditional rendering in UI component with default SVG/Image asset |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS Client | 2.x (existing) | Database queries, RLS, Storage upload | Already configured in project, provides typed client, handles auth context automatically |
| expo-image-picker | latest | Gallery + camera capture | Expo's official image picker, cross-platform, handles permissions automatically |
| expo-image-manipulator | latest | Crop and compress avatars | Already in project for plant photos, proven compression pattern |
| Zustand | 4.x (existing) | Profile state management | Matches existing authStore pattern, lightweight, no boilerplate |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React Native fast-image | 8.x | Optimized avatar rendering | Large avatar images in feed, caching for performance |
| Expo SecureStore | existing | Session persistence (already configured) | Auth context for RLS, don't reimplement |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-image-picker | react-native-image-picker | expo-image-picker has simpler API, better Expo Router integration |
| Zustand profileStore | React Context | Zustand provides devtools, action logging, no provider wrapping |
| Supabase Storage | Cloudinary, S3 | Already have Supabase, no additional service needed, RLS integration |

**Installation:**
```bash
npm install expo-image-picker expo-image-manipulator @fast-check/react-native-fast-image
npx expo install expo-image-picker expo-image-manipulator
```

Note: expo-image-manipulator already in project from migrationService. Verify expo-image-picker installation.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts              # Existing: Supabase client singleton
│       └── profiles.ts            # NEW: Profile queries, mutations, RLS helpers
├── stores/
│   ├── authStore.ts               # Existing: Auth state (user, session)
│   └── profileStore.ts            # NEW: Profile state (currentProfile, stats)
├── services/
│   └── avatarService.ts           # NEW: Avatar upload, compression, circular crop
├── components/
│   ├── Avatar.tsx                 # NEW: Circular avatar component with placeholder
│   └── ProfileStats.tsx           # NEW: Stats grid component
└── types/
    └── profile.ts                 # NEW: Profile, Follows types
```

### Pattern 1: Row Level Security for User-Scoped Access

**What:** RLS policies automatically filter queries based on `auth.uid()` from the user's JWT.

**When to use:** All user-owned data (profiles, settings, private content).

**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/row-level-security

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (for viewing other users)
CREATE POLICY "Authenticated users can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### Pattern 2: Automatic Profile Creation with Trigger

**What:** Postgres trigger creates profile row automatically when user signs up via Supabase Auth.

**When to use:** Guaranteed profile existence for every authenticated user.

**Example:**
```sql
-- Source: https://supabase.com/docs/guides/auth/managing-user-data

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1)); -- Default display name from email
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Pattern 3: Supabase Storage with Transformations

**What:** Upload images to Supabase Storage and serve dynamically resized versions via URL parameters.

**When to use:** Avatar thumbnails, optimized images, multiple sizes.

**Example:**
```typescript
// Source: https://supabase.com/docs/guides/storage/image-transformations

// Upload avatar to avatars bucket
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload(`${userId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: true
  });

// Get public URL with transformations (200x200)
const { data: { publicUrl } } = supabase
  .storage
  .from('avatars')
  .getPublicUrl(`${userId}/${fileName}`, {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover'
    }
  });
```

### Pattern 4: Zustand Store for Profile State

**What:** Lightweight state management following existing authStore pattern.

**When to use:** Profile data that needs to be accessed across components (profile tab, avatar headers, edit screens).

**Example:**
```typescript
// Based on existing stores/authStore.ts pattern

import { create } from 'zustand';
import { Profile } from '@/types/profile';

interface ProfileState {
  currentProfile: Profile | null;
  stats: {
    plantsIdentified: number;
    followers: number;
    following: number;
    joinedAt: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  setCurrentProfile: (profile: Profile) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  currentProfile: null,
  stats: null,
  isLoading: false,
  error: null,
  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  fetchProfile: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      // Query profiles table + stats
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          plants:plants(count),
          followers:follows!follows_following_id_fkey(count),
          following:follows!follows_follower_id_fkey(count)
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ currentProfile: data });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
  updateProfile: async (updates) => {
    const { currentProfile } = get();
    if (!currentProfile) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', currentProfile.id);

    if (error) throw error;
    set({ currentProfile: { ...currentProfile, ...updates } });
  }
}));
```

### Anti-Patterns to Avoid

- **Storing avatar URLs in database with hard-coded paths:** Use Supabase Storage public URLs with transformations for flexibility
- **Querying follows table separately:** Use Supabase's join syntax to count followers/following in single query
- **Circular crop on every render:** Crop once at upload time, store cropped version, display with borderRadius
- **Manual auth checks in components:** RLS policies enforce access at database level, don't duplicate in UI

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image permissions dialog | Custom permission request handler | expo-image-picker's requestMediaLibraryPermissionsAsync() | Handles iOS/Android differences, edge cases |
| Circular image cropping | Manual canvas manipulation | expo-image-manipulator with crop + resize | Proven pattern in migrationService, handles EXIF rotation |
| Image compression | Custom JPEG encoder | expo-image-manipulator compress option | Native performance, quality control |
| Avatar file naming | UUID generation in client code | Supabase Storage upload path `${userId}/avatar.jpg` | User-scoped paths prevent conflicts, natural upsert |
| Follow relationship state | Manual array management | Database-driven state via Zustand store + RLS | Single source of truth, multi-device sync |

**Key insight:** Avatar upload has three distinct concerns: permissions (expo-image-picker), processing (expo-image-manipulator), and storage (Supabase Storage). Each has a mature library. Don't build a monolithic "avatar uploader" when composition works better.

## Common Pitfalls

### Pitfall 1: RLS Policy Preventing Profile Read
**What goes wrong:** User can't view their own profile after signup, RLS blocks read.

**Why it happens:** Forgot to create SELECT policy for `authenticated` role, or policy uses incorrect condition.

**How to avoid:** Create both read and update policies during schema setup. Test with `supabase.auth.signIn()` followed by immediate profile read.

**Warning signs:** Profile queries return 404 or empty arrays for authenticated users.

### Pitfall 2: Missing Profile on Signup
**What goes wrong:** User signs up successfully but no profile row exists, app crashes or shows blank profile.

**Why it happens:** Forgot to create Postgres trigger on `auth.users`, or trigger function fails silently.

**How to avoid:** Create trigger during schema migration, test with `SELECT * FROM profiles WHERE id = 'user-uuid'` immediately after signup.

**Warning signs:** Profile tab shows loading indefinitely, stats queries return null.

### Pitfall 3: Avatar Upload Fails Silently
**What goes wrong:** User selects avatar but it doesn't appear, no error message shown.

**Why it happens:** Uploading to non-existent Storage bucket, or file exceeds Supabase's default 25MB limit (before compression).

**How to avoid:** Create 'avatars' bucket during schema setup, compress image client-side before upload (max 2MB), show upload progress and handle errors explicitly.

**Warning signs:** getPublicUrl returns 404, Storage logs show no upload events.

### Pitfall 4: Follow Count Inaccuracy
**What goes wrong:** Follower count doesn't update after follow/unfollow, shows stale data.

**Why it happens:** Caching stats in profileStore without invalidation, or counting wrong relationship direction.

**How to avoid:** Re-query stats on profile tab focus, use Supabase's count syntax (`select(count)`) for accuracy.

**Warning signs:** Count differs from actual database query, updating requires app restart.

### Pitfall 5: Circular Avatar Distortion
**What goes wrong:** Avatar appears stretched or cropped incorrectly when displayed.

**Why it happens:** Using non-square image with borderRadius, or applying transform at display time instead of upload.

**How to avoid:** Crop to square at upload time, display with `borderRadius: Image.getSize()` and `overflow: 'hidden'`.

**Warning signs:** Avatar looks elliptical, shows unwanted parts of original image.

## Code Examples

Verified patterns from official sources:

### Avatar Upload with Compression
```typescript
// Source: Existing migrationService.ts pattern + Supabase Storage docs
// File: services/avatarService.ts

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { getSupabaseClient } from '@/lib/supabase/client';

const MAX_AVATAR_SIZE = 1200;
const AVATAR_QUALITY = 0.7;
const MAX_FILE_SIZE_MB = 2;

export const uploadAvatar = async (userId: string): Promise<string | null> => {
  // Request permissions
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission required');
  }

  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Force square crop
    quality: 1,
  });

  if (result.canceled) return null;

  // Compress image
  const manipulated = await ImageManipulator.manipulateAsync(
    result.assets[0].uri,
    [
      { resize: { width: MAX_AVATAR_SIZE, height: MAX_AVATAR_SIZE } }
    ],
    {
      compress: AVATAR_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Check file size
  const fileInfo = await fetch(manipulated.uri).then(r => r.blob());
  if (fileInfo.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error('Image exceeds 2MB limit');
  }

  // Upload to Supabase Storage
  const supabase = getSupabaseClient();
  const fileName = `avatar_${Date.now()}.jpg`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase
    .storage
    .from('avatars')
    .upload(filePath, fileInfo, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  // Return public URL with transformations
  const { data: { publicUrl } } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(filePath, {
      transform: { width: 200, height: 200, resize: 'cover' }
    });

  return publicUrl;
};
```

### Follow/Unfollow Mutation
```typescript
// Source: Supabase JS Client docs
// File: lib/supabase/profiles.ts

export const followUser = async (followerId: string, followingId: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const unfollowUser = async (followerId: string, followingId: string) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) throw error;
};

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  return !!data && !error;
};
```

### Profile Query with Stats
```typescript
// Source: Supabase join syntax documentation
// File: lib/supabase/profiles.ts

interface ProfileWithStats extends Profile {
  plants_identified: number;
  followers_count: number;
  following_count: number;
}

export const getProfileWithStats = async (userId: string): Promise<ProfileWithStats | null> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      display_name,
      bio,
      avatar_url,
      created_at,
      plants:plants(count),
      followers:follows!follows_following_id_fkey(count),
      following:follows!follows_follower_id_fkey(count)
    `)
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return {
    ...data,
    plants_identified: data.plants[0]?.count || 0,
    followers_count: data.followers[0]?.count || 0,
    following_count: data.following[0]?.count || 0,
  };
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual user creation in separate table | Postgres triggers on auth.users | Supabase 2.0 | Guaranteed profile existence, no race conditions |
| Client-side circular cropping | expo-image-manipulator + borderRadius | 2024 | Native performance, handles EXIF rotation |
| Separate avatar/thumbnail tables | Single avatar URL with Supabase transformations | 2023 | Reduced storage, dynamic resizing via URL params |
| Manual follower count caching | Real-time count queries with join syntax | Supabase 2.0 | Always accurate, no cache invalidation needed |

**Deprecated/outdated:**
- Storage API v1 signatures: Use `supabase.storage.from().upload()` not `supabase.storage.createUploadUrl()`
- Auth triggers manually calling functions: Use `supabase.auth.admin` for server-side triggers, not client SDK

## Open Questions

1. **Avatar placeholder image**
   - What we know: Need default avatar when none uploaded
   - What's unclear: Should use an icon (Ionicons) or an image asset (SVG/PNG)?
   - Recommendation: Use Ionicons `person-circle-outline` for simplicity, or create a single SVG asset for visual polish. Planner's discretion.

2. **Profile edit mode UX**
   - What we know: Users edit display name, bio, and avatar
   - What's unclear: Inline editing (edit button toggles text inputs) vs modal screen (dedicated edit screen)?
   - Recommendation: Modal screen with form is easier to implement and provides better UX for multi-field editing. Inline editing can be Phase 12.1 enhancement.

3. **Stats refresh strategy**
   - What we know: Follower/following counts change when others follow/unfollow
   - What's unclear: Should stats refresh on profile tab focus, or use real-time subscriptions?
   - Recommendation: Refresh on tab focus for Phase 12. Real-time Supabase subscriptions can be Phase 12.5 enhancement for "live" follower counts.

4. **Avatar bucket RLS policy**
   - What we know: Avatars should be publicly readable (for profile viewing)
   - What's unclear: Should avatars be public-read or authenticated-read?
   - Recommendation: Public-read is simpler for now. If privacy is needed later, can switch to authenticated-read with signed URLs.

## Validation Architecture

> Skipped: `workflow.nyquist_validation` is not enabled in `.planning/config.json`

## Sources

### Primary (HIGH confidence)
- **Supabase Row Level Security** - https://supabase.com/docs/guides/auth/row-level-security - RLS policy syntax, `auth.uid()` usage, authenticated role
- **Supabase Storage** - https://supabase.com/docs/guides/storage - Bucket creation, public URL generation, upload API
- **Supabase Image Transformations** - https://supabase.com/docs/guides/storage/image-transformations - Dynamic resizing with width/height/resize parameters
- **expo-image-manipulator** - Verified via existing migrationService.ts code pattern - crop, resize, compress options
- **Supabase JS Client** - Verified via existing lib/supabase/client.ts - Query builder, join syntax, count aggregation

### Secondary (MEDIUM confidence)
- **expo-image-picker documentation** - https://docs.expo.dev/versions/latest/sdk/imagepicker/ - launchImageLibraryAsync options, permission handling
- **Supabase Postgres triggers** - https://supabase.com/docs/guides/database/postgres-triggers - Trigger syntax for automatic profile creation

### Tertiary (LOW confidence)
- None - All findings verified with official documentation or existing code patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified via official docs or existing project usage
- Architecture: HIGH - RLS patterns from Supabase docs, Zustand pattern from existing authStore
- Pitfalls: HIGH - Common issues documented in Supabase troubleshooting guides

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days - Supabase ecosystem is stable, no major changes expected)

---

*Phase: 12-database-schema-user-profiles*
*Research completed: 2026-03-02*
