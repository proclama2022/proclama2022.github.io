# Architecture Research: Community Features Integration (v2.0)

**Domain:** React Native + Expo plant identification app — Community features integration
**Project:** Plantid
**Researched:** 2026-02-27
**Confidence:** MEDIUM (existing codebase analysis + Supabase documentation + established React Native patterns)

---

## Executive Summary

The v2.0 community milestone transforms Plantid from a personal plant tracker into a social platform by integrating Supabase backend for authentication, user profiles, community feed, comments, likes, follows, and wiki/tips.

**Key architectural insight:** Community features are **additive extensions** that respect existing boundaries. The local-first architecture (AsyncStorage + Zustand) remains the source of truth for personal plant data. Supabase is a **parallel backend** for community/social features, not a replacement for local storage.

**Integration strategy:**
1. **New stores** (authStore, feedStore, userStore) extend Zustand pattern
2. **New services** (supabase client, communityService, storageService) follow existing service layer pattern
3. **New screens** (Community tab, Profile, Auth) integrate via Expo Router file-based navigation
4. **No breaking changes** to existing stores (plantsStore, settingsStore, proStore)

---

## System Overview: v2.0 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                          │
│                         (Expo Router Screens)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │
│  │Community│  │Profile  │  │Auth     │  │Feed     │  │Tips     │  │
│  │Feed     │  │Screen   │  │Screens  │  │Item     │  │Wiki     │  │
│  │(NEW)    │  │(NEW)    │  │(NEW)    │  │(NEW)    │  │(NEW)    │  │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │
│       │            │            │            │            │        │
│       └────────────┴────────────┴────────────┴────────────┴────────┘
│                    │                  │             │
│  ┌────────────────┴──────────────────┴─────────────┴────────────────┐
│  │                 EXISTING SCREENS (Unchanged)                    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │  │Home     │  │Camera   │  │Settings │  │Plant    │             │
│  │  │(plants) │  │(identify│  │(prefs)  │  │Detail   │             │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘             │
│  └──────────────────────────────────────────────────────────────────┘
├─────────────────────────────────────────────────────────────────────┤
│                         State Management                            │
│                         (Zustand Stores)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │authStore │  │feedStore │  │userStore │  │plants    │           │
│  │(NEW)     │  │(NEW)     │  │(NEW)     │  │Store     │           │
│  │          │  │          │  │          │  │(EXISTING)│           │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │settings  │  │proStore  │  │onboarding│            │           │
│  │Store     │  │          │  │Store     │            │           │
│  │(EXISTING)│  │(EXISTING)│  │(EXISTING)│            │           │
│  └──────────┘  └──────────┘  └──────────┘            │           │
├────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│                         Services Layer                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │supabase  │  │supabase  │  │plantnet  │  │storage   │           │
│  │auth      │  │client    │  │service   │  │service   │           │
│  │(NEW)     │  │(NEW)     │  │(EXISTING)│  │(NEW)     │           │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┘  ┌──────────┘           │
│  │community │  │user      │  │EXISTING    │                       │
│  │Service   │  │Service   │  │SERVICES    │                       │
│  │(NEW)     │  │(NEW)     │  │            │                       │
│  └─────┬────┘  └─────┬────┘  └────────────┘                       │
├────────┼──────────────┼──────────────┼──────────────────────────────┤
│                         Data Layer                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │Supabase  │  │Supabase  │  │Async     │  │PlantNet  │           │
│  │PostgreSQL│  │Storage   │  │Storage   │  │API       │           │
│  │(NEW)     │  │(NEW)     │  │(EXISTING)│  │(EXISTING)│           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **authStore (NEW)** | User session (JWT), auth state, login/logout | Zustand store with Supabase auth client integration |
| **feedStore (NEW)** | Community posts cache, pagination, realtime updates | Zustand with Supabase Realtime subscriptions |
| **userStore (NEW)** | Current user profile, follows/followers, settings sync | Zustand with selective Supabase profile sync |
| **supabaseClient (NEW)** | Singleton Supabase client instance, query wrappers | `services/supabase/client.ts` module |
| **communityService (NEW)** | Feed queries, post creation, comment/likes actions | Service layer using supabaseClient |
| **userService (NEW)** | Profile CRUD, follow/unfollow, user search | Service layer using supabaseClient |
| **storageService (NEW)** | Image uploads to Supabase Storage, URL generation | Expo-FileSystem + Supabase Storage SDK |
| **plantsStore (EXISTING)** | Local plant collection, watering, notifications | **No changes** — remains AsyncStorage-only |
| **settingsStore (EXISTING)** | App language, dark mode, notification prefs | **Minimal changes** — add username/avatar fields |
| **proStore (EXISTING)** | Pro status, IAP verification | **No changes** — RevenueCat unchanged |

---

## Recommended Project Structure

```
app/
├── (tabs)/
│   ├── index.tsx              # EXISTING: Home/plant collection (no changes)
│   ├── camera.tsx             # EXISTING: Camera screen (no changes)
│   ├── settings.tsx           # MODIFY: Settings (add auth section/link)
│   ├── _layout.tsx            # MODIFY: Add "Community" tab
│   └── community.tsx          # NEW: Community feed screen
├── auth/
│   ├── _layout.tsx            # NEW: Auth guard layout (optional, for protected routes)
│   ├── login.tsx              # NEW: Login screen (email/password + OAuth)
│   ├── signup.tsx             # NEW: Signup screen
│   └── profile-setup.tsx      # NEW: First-time profile setup (username, avatar)
├── profile/
│   ├── _layout.tsx            # NEW: Profile layout (protected route)
│   ├── [username].tsx         # NEW: Public profile view
│   ├── followers.tsx          # NEW: Followers list
│   └── following.tsx          # NEW: Following list
├── post/
│   ├── _layout.tsx            # NEW: Post layout (protected route)
│   ├── [id].tsx               # NEW: Single post detail with comments
│   └── new.tsx                # NEW: Create post (share identification)
├── plant/
│   ├── [id].tsx               # MODIFY: Plant detail (add "Share to Community" button)
├── tips/
│   ├── _layout.tsx            # NEW: Tips/wiki layout
│   ├── index.tsx              # NEW: Browse tips by species/category
│   └── [species].tsx          # NEW: Species-specific care tips
├── _layout.tsx                # MODIFY: Add Supabase auth state listener
└── _sitemap.ts                # MODIFY: Exclude auth routes if needed

stores/
├── authStore.ts               # NEW: Auth state (session, user, isLoading, signOut)
├── feedStore.ts               # NEW: Community feed (posts, pagination, realtime)
├── userStore.ts               # NEW: User profile (profile data, followers, following)
├── plantsStore.ts             # EXISTING: No changes needed
├── settingsStore.ts           # MODIFY: Add username, avatar_url fields (sync to Supabase)
├── proStore.ts                # EXISTING: No changes needed
└── onboardingStore.ts         # EXISTING: No changes needed

services/
├── supabase/
│   ├── client.ts              # NEW: Supabase client singleton (createClient)
│   ├── auth.ts                # NEW: Auth wrapper functions (signIn, signUp, signOut)
│   ├── types.ts               # NEW: Supabase-generated database types
│   └── config.ts              # NEW: Supabase config (URL, anon key from .env)
├── communityService.ts        # NEW: Feed queries, post CRUD, like/comment actions
├── userService.ts             # NEW: Profile CRUD, follow/unfollow, user search
├── tipsService.ts             # NEW: Wiki/tips CRUD (community care advice)
├── storageService.ts          # NEW: Image upload/download (Supabase Storage)
├── plantnet.ts                # EXISTING: No changes
├── cache.ts                   # EXISTING: No changes
├── wateringService.ts         # EXISTING: No changes
├── notificationService.ts     # EXISTING: No changes
├── purchaseService.ts         # EXISTING: No changes
├── careDB.ts                  # EXISTING: No changes
└── reminderService.ts         # EXISTING: No changes

components/
├── community/
│   ├── FeedCard.tsx           # NEW: Post card (image, caption, likes, comments)
│   ├── CommentSection.tsx     # NEW: Comments list + inline input
│   ├── LikeButton.tsx         # NEW: Like/unlike button with optimistic update
│   ├── ShareButton.tsx        # NEW: Share plant to community action
│   ├── UserAvatar.tsx         # NEW: Avatar component with fallback
│   ├── FollowButton.tsx       # NEW: Follow/unfollow button
│   └── PostEditor.tsx         # NEW: Create/edit post modal
├── auth/
│   ├── AuthGuard.tsx          # NEW: Protected route wrapper component
│   ├── LoginForm.tsx          # NEW: Email/password login form
│   ├── SignupForm.tsx         # NEW: Email/password signup form
│   └── SocialLogin.tsx        # NEW: Google/Apple OAuth buttons
├── tips/
│   ├── TipCard.tsx            # NEW: Wiki entry card (species, content, contributors)
│   ├── TipEditor.tsx          # NEW: Rich text tip editor
│   └── ContributorList.tsx    # NEW: Show contributors for a tip
├── PlantCard.tsx              # EXISTING: No changes
├── PlantGrid.tsx              # EXISTING: No changes
├── SearchFilterBar.tsx        # EXISTING: No changes
└── ... (other existing components)

types/
├── community.ts               # NEW: Post, Comment, Like, Follow types
├── user.ts                    # NEW: Profile, ExtendedUser types
├── supabase-generated.ts      # NEW: Supabase DB types (auto-generated via CLI)
└── index.ts                   # MODIFY: Export new types alongside existing

lib/
├── utils/
│   ├── image.ts               # NEW: Image compression helpers (reuse plantnet logic)
│   ├── validation.ts          # NEW: Username validation, content moderation helpers
│   └── realtime.ts            # NEW: Supabase Realtime subscription helpers
└── hooks/
    ├── useAuth.ts             # NEW: Auth state hook (wrapper around authStore)
    ├── useFeed.ts             # NEW: Feed pagination hook (infinite scroll)
    ├── useRealtime.ts         # NEW: Realtime subscription hook (auto-cleanup)
    └── useThemeColors.ts      # EXISTING: No changes
```

### Structure Rationale

- **`app/(tabs)/community.tsx`**: Follows existing tab pattern from `index.tsx`, integrates cleanly with current 3-tab layout
- **`app/auth/`**: Dedicated auth section for authentication flows, matches Expo Router conventions for grouped routes
- **`app/profile/[username].tsx`**: Dynamic route enables deep linking to user profiles (e.g., plantid://profile/gardener123)
- **`stores/`**: All Zustand stores co-located, `authStore`/`feedStore`/`userStore` follow exact same pattern as `plantsStore`
- **`services/supabase/`**: Dedicated Supabase module isolates backend logic, same pattern as existing `services/plantnet.ts`
- **`components/community/`**: Community-specific components grouped together, avoids cluttering root components dir
- **`types/community.ts`**: New domain types separate from existing plant types, prevents circular dependencies

---

## Architectural Patterns

### Pattern 1: Supabase Client Singleton

**What:** Single Supabase client instance initialized at app startup, imported by all services

**When to use:** All Supabase database, auth, storage, and realtime operations

**Trade-offs:**
- ✅ Centralized configuration (URL, keys), easier to mock for testing
- ✅ Single connection pool, efficient resource usage on mobile
- ❌ Global state (but same pattern as existing Zustand stores)

**Example:**
```typescript
// services/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;

// Usage in services
import supabase from '@/services/supabase/client';

export async function getFeed(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}
```

### Pattern 2: Auth State Integration with Zustand

**What:** Zustand store (`authStore`) wraps Supabase auth state, provides reactive auth status to components

**When to use:** Authentication-dependent features throughout the app (protected screens, conditional rendering)

**Trade-offs:**
- ✅ Familiar pattern (matches existing `plantsStore`, `settingsStore`)
- ✅ Easy auth guards via `useAuthStore` selectors
- ❌ Requires careful session sync (Supabase auth state listener)

**Example:**
```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import supabase from '@/services/supabase/client';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  setSession: (session) => set({
    session,
    user: session?.user ?? null,
    isLoading: false
  }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null });
  },
}));

// Initialize auth state in app/_layout.tsx
useEffect(() => {
  // Check for existing session on app start
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setSession(session);
  });

  // Listen for auth state changes (login, logout, token refresh)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      useAuthStore.getState().setSession(session);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### Pattern 3: Realtime Feed with Optimistic Updates

**What:** Supabase Realtime subscriptions for live feed updates + local optimistic UI updates

**When to use:** Community feed, comments, likes (any feature needing instant feedback)

**Trade-offs:**
- ✅ Instant UI feedback, better UX on slow connections
- ✅ Automatic sync across multiple devices
- ❌ Conflict resolution complexity on rollback (need to handle server errors)

**Example:**
```typescript
// stores/feedStore.ts
import { create } from 'zustand';
import supabase from '@/services/supabase/client';
import { Post } from '@/types/community';

interface FeedState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  removePost: (id: string) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  posts: [],
  loading: false,
  error: null,
  addPost: (post) => set((state) => ({
    posts: [post, ...state.posts]
  })),
  updatePost: (id, updates) => set((state) => ({
    posts: state.posts.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    )
  })),
  removePost: (id) => set((state) => ({
    posts: state.posts.filter((p) => p.id !== id)
  })),
}));

// Setup realtime subscription (call once on app init)
supabase.channel('public:posts')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => {
      useFeedStore.getState().addPost(payload.new as Post);
    }
  )
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'posts' },
    (payload) => {
      useFeedStore.getState().updatePost(payload.new.id, payload.new);
    }
  )
  .subscribe();

// Optimistic like toggle
function toggleLike(postId: string) {
  const store = useFeedStore.getState();
  const post = store.posts.find(p => p.id === postId);

  if (!post) return;

  // Optimistic update (instant feedback)
  store.updatePost(postId, {
    likes: (post.likes || 0) + 1,
    isLiked: true
  });

  // Server update (rollback on error)
  supabase.from('likes').insert({ post_id: postId })
    .then(({ error }) => {
      if (error) {
        // Rollback optimistic update
        store.updatePost(postId, {
          likes: post.likes || 0,
          isLiked: false
        });
      }
    });
}
```

### Pattern 4: Protected Routes with Auth Guard

**What:** Expo Router layout component that redirects to login if not authenticated

**When to use:** Profile editing, post creation, settings (any auth-required screen)

**Trade-offs:**
- ✅ Centralized auth logic, no duplicate checks in each screen
- ✅ Deep-linking protection (can't deep link to protected route without auth)
- ❌ Requires careful route organization (all protected routes under same layout)

**Example:**
```typescript
// app/profile/_layout.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { ActivityIndicator } from 'react-native';

export default function ProfileLayout() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

### Pattern 5: Image Upload with Progress Tracking

**What:** Expo-FileSystem + Supabase Storage with upload progress callbacks

**When to use:** Profile avatars, post images (any user-generated content)

**Trade-offs:**
- ✅ User feedback on slow uploads (progress bar)
- ✅ Cancellable uploads (user can tap back to cancel)
- ❌ More complex error handling (network failures, timeouts)

**Example:**
```typescript
// services/storageService.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import supabase from './supabase/client';

export async function uploadImage(
  uri: string,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  // Reuse existing compression logic from plantnet.ts
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1080 } }],
    { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Convert to base64 for Supabase Storage upload
  const base64 = await FileSystem.readAsStringAsync(compressed.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Upload with progress tracking
  const { data, error } = await supabase.storage
    .from('community-images')
    .upload(path, decode(base64), {
      contentType: 'image/jpeg',
      upsert: true,
      onUploadProgress: (progress) => {
        onProgress?.(progress / 100); // 0.0 to 1.0
      },
    });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('community-images')
    .getPublicUrl(data.path);

  return publicUrl;
}
```

---

## Data Flow

### Auth Flow

```
User opens app
    ↓
app/_layout.tsx initializes
    ↓
Supabase auth.getSession() → Check local session (JWT in AsyncStorage)
    ↓
onAuthStateChange listener → Subscribe to auth events
    ↓
Update authStore (session, user, isLoading)
    ↓
Components subscribe to authStore via useAuthStore()
    ↓
Conditional rendering based on auth state:
  - Logged in: Show profile avatar, enable posting
  - Logged out: Show login button, feed view-only
```

### Community Feed Flow

```
User navigates to /community tab
    ↓
CommunityScreen mounts
    ↓
feedStore.fetchPosts() → Supabase query (posts + profiles JOIN)
    ↓
Posts rendered in FeedCards (FlatList with pagination)
    ↓
Realtime subscription active (listening for INSERT/UPDATE)
    ↓
User scrolls → fetchMorePosts() → Next page fetched
    ↓
New post from another user → INSERT event → feedStore.addPost() → Re-render
    ↓
User likes post → Optimistic UI update → Supabase INSERT like
    ↓
Success: Update confirmed | Failure: Rollback optimistic update
```

### Share Plant to Community Flow

```
User views plant detail (/plant/[id])
    ↓
Tap "Share to Community" button
    ↓
Check auth (useAuthStore) → Redirect to /auth/login if not authenticated
    ↓
Open PostEditor modal (pre-fill with plant data)
    ↓
User adds caption, optionally edits plant info (species name, care tips)
    ↓
Tap "Share" button
    ↓
Upload plant photo to Supabase Storage → Get public URL
    ↓
Insert post row (user_id, image_url, plant_data, caption)
    ↓
Supabase triggers INSERT event → Realtime updates all clients
    ↓
Navigate to shared post (/post/[id])
```

### Comment Flow

```
User viewing post detail (/post/[id])
    ↓
CommentSection mounts
    ↓
Fetch comments via supabase (SELECT * FROM comments WHERE post_id = $1)
    ↓
Render comments list
    ↓
User types comment → Tap Send
    ↓
Optimistic: Add comment to local state immediately (instant feedback)
    ↓
Supabase INSERT comment → Get created_at timestamp from server
    ↓
Update comment in local state with server timestamp
    ↓
Realtime: Other clients receive INSERT event → Their CommentSections update
```

### State Management

```
┌────────────────────────────────────────────────────────────┐
│                    Zustand Stores                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐  │
│  │  authStore   │   │  feedStore   │   │  userStore   │  │
│  │              │   │              │   │              │  │
│  │ - session    │   │ - posts[]    │   │ - profile    │  │
│  │ - user       │   │ - loading    │   │ - following  │  │
│  │ - isLoading  │   │ - error      │   │ - followers  │  │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘  │
│         │                   │                   │         │
│         │                   │                   │         │
└─────────┼───────────────────┼───────────────────┼─────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────┐
│                    React Components                        │
│                                                            │
│  useAuthStore()  │  useFeedStore()  │  useUserStore()    │
│        ↓                ↓                  ↓               │
│  Conditional      Render posts      Profile info          │
│  rendering        + real-time        + actions            │
└────────────────────────────────────────────────────────────┘
```

### Key Data Flows

1. **Authentication**: Supabase Auth → authStore → Components (redirect/conditional render)

2. **Community Feed**: Supabase query → feedStore → FeedCards → Realtime INSERT → Optimistic UI updates

3. **Post Creation**: Plant photo + data → Supabase Storage upload → posts table INSERT → Realtime broadcast

4. **Comments/Likes**: User action → Optimistic local update → Supabase INSERT → Realtime sync to other clients

5. **Profile Sync**: User profile edit → Supabase UPDATE → userStore sync → Realtime profile refresh

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Supabase Auth** | Singleton client + authStore | Email/password + OAuth (Google/Apple) via Expo Auth Session |
| **Supabase Database** | Service layer functions + Zustand stores | Row Level Security (RLS) for multi-tenancy |
| **Supabase Storage** | Dedicated storageService + progress callbacks | CDN-backed public URLs for images |
| **Supabase Realtime** | Channel subscriptions in store initialization | Feed updates, comment notifications |
| **PlantNet API** | Existing plantnet service (unchanged) | Identify plants before sharing to community |
| **RevenueCat** | Existing purchaseService (unchanged) | Pro status may unlock community features (e.g., verified badge) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **authStore ↔ plantsStore** | Direct (plants don't require auth) | Local plant collection remains accessible without login |
| **authStore ↔ feedStore** | Dependency (feed requires auth) | Feed screen checks authStore before loading posts |
| **feedStore ↔ userStore** | Posts reference user profiles | JOIN query fetches profiles with posts (posts.user_id → profiles.id) |
| **plantsStore ↔ communityService** | One-way (plants → community) | Share plant action reads from plantsStore, doesn't modify it |
| **settingsStore ↔ userStore** | Two-way sync | Some settings (language, theme) may sync to user profile for cross-device |

---

## Supabase Schema Integration

### New Tables Required

```sql
-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username VARCHAR(30) UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(100),
  is_pro BOOLEAN DEFAULT FALSE, -- Sync from RevenueCat
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts (shared plant identifications)
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  image_url TEXT NOT NULL,
  plant_data JSONB NOT NULL, -- { species, commonName, scientificName, careInfo }
  caption TEXT,
  species_name VARCHAR(255),
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Follows
CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Tips/Wiki entries (community care advice)
CREATE TABLE tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  species_name VARCHAR(255) UNIQUE NOT NULL,
  content JSONB NOT NULL, -- { it: "...", en: "..." }
  contributors UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reports (content moderation)
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) NOT NULL,
  target_type VARCHAR(20) NOT NULL, -- 'post' or 'comment'
  target_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Realtime on relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

### Row Level Security (RLS) Policies

```sql
-- Profiles: Users can view all, update only their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: Public read, auth users create, owner update/delete
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (true);
CREATE POLICY "Auth users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE USING (auth.uid() = user_id);

-- Comments: Public read, auth users create, owner update/delete
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);
CREATE POLICY "Auth users can create comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes: Public read, auth users create/delete own
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT USING (true);
CREATE POLICY "Auth users can manage own likes"
  ON likes FOR ALL USING (auth.uid() = user_id);

-- Follows: Auth users create/delete own follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT USING (true);
CREATE POLICY "Auth users can manage own follows"
  ON follows FOR ALL USING (auth.uid() = follower_id);

-- Reports: Auth users create, admins read all
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE username IN ('admin', 'moderator'))
  );
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1K users** | Supabase free tier (500MB DB, 1GB Storage, 2GB bandwidth/month) sufficient |
| **1K-100K users** | Upgrade to Pro tier ($25/month), implement feed pagination (infinite scroll), cache popular posts in feedStore |
| **100K-1M users** | Add Redis caching layer for feed (Supabase doesn't have built-in cache), implement CDN for images (Supabase Storage already uses CDN), consider read replicas for heavy read queries |

### Scaling Priorities

1. **First bottleneck:** Feed query performance (posts + profiles JOIN)
   - **Fix:** Add indexes on `posts(created_at)`, `posts(user_id)`, implement cursor-based pagination, cache feed in feedStore with TTL (5 minutes)

2. **Second bottleneck:** Realtime connection overhead
   - **Fix:** Use Supabase Realtime efficiently (single channel for feed, unsubscribe on unmount), implement debounced batch updates (don't re-render on every event)

3. **Third bottleneck:** Storage bandwidth (image delivery)
   - **Fix:** Supabase Storage CDN included, compress images on upload (max 1080px, 85% quality via expo-image-manipulator), implement lazy loading with expo-image

---

## Anti-Patterns

### Anti-Pattern 1: Direct Supabase Queries in Components

**What people do:** Import supabase client directly in screens and query inline

```typescript
// BAD
export default function FeedScreen() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    supabase.from('posts').select('*').then(({ data }) => setPosts(data));
  }, []);
  // ...
}
```

**Why it's wrong:** No state management, difficult to cache, impossible to test, duplicates query logic across screens

**Do this instead:** Use service layer + Zustand store

```typescript
// GOOD
// services/communityService.ts
export async function getFeed(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data;
}

// stores/feedStore.ts
export const useFeedStore = create((set, get) => ({
  posts: [],
  loading: false,
  fetchPosts: async () => {
    set({ loading: true });
    const posts = await getFeed();
    set({ posts, loading: false });
  },
}));

// app/community.tsx
export default function CommunityScreen() {
  const posts = useFeedStore((s) => s.posts);
  const fetchPosts = useFeedStore((s) => s.fetchPosts);
  useEffect(() => { fetchPosts(); }, []);
  // ...
}
```

### Anti-Pattern 2: Auth Checks in Every Component

**What people do:** Check `authStore.session` in every component manually

```typescript
// BAD
export default function ProfileScreen() {
  const { user } = useAuthStore();
  if (!user) {
    return <Redirect href="/login" />; // Repeated in every protected screen
  }
  // ...
}
```

**Why it's wrong:** Repetitive, easy to forget, breaks deep linking

**Do this instead:** Protected route layout

```typescript
// GOOD
// app/profile/_layout.tsx
export default function ProfileLayout() {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/auth/login" />;
  return <Stack />;
}

// app/profile/edit.tsx (no auth check needed)
export default function EditProfileScreen() {
  // Guaranteed to have user
}
```

### Anti-Pattern 3: Ignoring Offline State

**What people do:** Assume network always available, no error handling

```typescript
// BAD
export async function createPost(postData) {
  await supabase.from('posts').insert(postData);
}
```

**Why it's wrong:** Fails silently on poor connection, lost posts, bad UX

**Do this instead:** Optimistic updates + rollback + retry queue

```typescript
// GOOD
export async function createPost(postData: PostData) {
  const tempId = `temp-${Date.now()}`;
  const tempPost = { ...postData, id: tempId, created_at: new Date().toISOString() };

  // Optimistic update
  useFeedStore.getState().addPost(tempPost);

  try {
    const { data, error } = await supabase.from('posts').insert(postData).select().single();
    if (error) throw error;

    // Replace temp post with real one
    useFeedStore.getState().updatePost(tempId, data);
  } catch (error) {
    // Rollback + show error + save to retry queue
    useFeedStore.getState().removePost(tempId);
    showErrorToast(t('errors.postFailed'));
    await saveToRetryQueue('createPost', postData);
  }
}
```

### Anti-Pattern 4: Uploading Full-Resolution Images

**What people do:** Upload camera photos directly to Supabase Storage

```typescript
// BAD
const { uri } = await ImagePicker.launchCameraAsync({});
await supabase.storage.from('images').upload(`posts/${fileName}`, { uri });
```

**Why it's wrong:** Slow uploads, wasted bandwidth, storage costs, poor UX

**Do this instead:** Compress before upload (reuse existing plantnet.ts pattern)

```typescript
// GOOD
import * as ImageManipulator from 'expo-image-manipulator';

// Compress to max 1080px, 85% quality JPEG
const compressed = await ImageManipulator.manipulateAsync(
  uri,
  [{ resize: { width: 1080 } }],
  { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
);

await uploadImage(compressed.uri, `posts/${fileName}`);
```

### Anti-Pattern 5: Tight Coupling Between Local and Remote

**What people do:** Sync local plants to Supabase automatically, mix concerns

```typescript
// BAD
async function addPlant(plant: SavedPlant) {
  // Save locally
  usePlantsStore.getState().addPlant(plant);
  // Also sync to Supabase (why?)
  await supabase.from('plants').insert(plant);
}
```

**Why it's wrong:** Local plants are private, community posts are public — different domains

**Do this instead:** Clear separation, explicit user action to share

```typescript
// GOOD
// Local plants remain local-only (existing behavior)
function addPlant(plant: SavedPlant) {
  usePlantsStore.getState().addPlant(plant);
}

// Explicit share action to create community post
async function sharePlantToCommunity(plantId: string, caption: string) {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) return;

  const postData = {
    image_url: await uploadPlantPhoto(plant),
    plant_data: extractPlantData(plant),
    caption,
  };

  await createPost(postData); // Separate community service
}
```

---

## Build Order (Recommended)

Based on dependency analysis, suggested implementation order:

### Phase 1: Foundation (Auth + Database)
**Goal:** User authentication, database setup, basic profile

1. **Supabase setup**: Create project, configure Auth, set up env variables
2. **Database schema**: Create tables (profiles, posts, comments, likes, follows)
3. **RLS policies**: Implement security policies for all tables
4. **supabaseClient**: Singleton client, config, type generation
5. **authStore**: Zustand store + auth state integration in app/_layout.tsx
6. **Auth screens**: Login, signup, profile setup
7. **Profile screen**: Basic profile view, edit profile

**Dependencies:** None (foundation layer)

### Phase 2: Community Feed
**Goal:** View and create posts

1. **feedStore**: Zustand store for posts + realtime subscriptions
2. **communityService**: Feed queries, post creation
3. **storageService**: Image upload/download helpers
4. **FeedCard component**: Post display with avatar, likes, comments
5. **Community tab**: Feed screen with pagination (infinite scroll)
6. **Share to Community**: Button in plant detail → Post editor modal
7. **Post detail**: Single post view with full comments

**Dependencies:** Phase 1 (auth required for posting)

### Phase 3: Engagement Features
**Goal:** Likes, comments, follows

1. **CommentSection component**: Comments list + inline input
2. **LikeButton component**: Optimistic like/unlike with animation
3. **FollowButton component**: Follow/unfollow users
4. **User profile view**: Public profile with posts, followers, following
5. **Realtime updates**: Ensure all features use Supabase Realtime

**Dependencies:** Phase 2 (posts must exist)

### Phase 4: Wiki/Tips
**Goal:** Community-contributed care tips

1. **tips table**: Create tips schema in Supabase
2. **tipsService**: CRUD operations for tips
3. **TipCard component**: Display tip with contributor attribution
4. **Tips browser**: Search/filter by species
5. **Tip editor**: Rich text input for contributors

**Dependencies:** Phase 1 (auth for contributors)

### Phase 5: Moderation & Polish
**Goal:** Content moderation, notifications, final touches

1. **Report system**: Report UI + admin review interface
2. **Push notifications**: New follower, comment on post notifications (Supabase has push)
3. **Performance optimization**: Image compression, query optimization, caching
4. **Error boundaries**: Graceful failure handling
5. **Analytics**: Track community engagement metrics

**Dependencies:** Phase 3 (content to moderate)

---

## Migration Strategy (Existing Users)

### Challenge: Existing app has local-only plants

**Solution:** Opt-in community, graceful migration, no breaking changes

1. **v2.0 launch prompt:** On update, show onboarding card explaining new community features
2. **Optional auth:** App remains fully functional without login (local plants unchanged)
3. **Progressive enhancement:**
   - **Logged out:** Can view public feed, browse tips, search plants
   - **Logged in:** Can post, comment, follow, edit profile
4. **Data portability:** Local plants can be selectively shared to community (not auto-synced)

### No Breaking Changes

- ✅ Existing screens unchanged (Home, Camera, Settings, Plant Detail)
- ✅ AsyncStorage remains source of truth for local plants
- ✅ Supabase is additive, not replacement
- ✅ Dark mode, i18n, Pro features work identically
- ✅ Users can ignore community features entirely (app works like v1.3)

---

## Sources

- [Supabase JavaScript Library Reference](https://supabase.com/docs/reference/javascript) — Official Supabase JS client docs (MEDIUM confidence)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth) — Authentication patterns and best practices (HIGH confidence)
- [Expo Router File-Based Routing](https://docs.expo.dev/router/introduction/) — Official Expo Router navigation patterns (HIGH confidence — matches existing codebase)
- [Zustand Documentation](https://github.com/pmndrs/zustand) — State management library (HIGH confidence — already in use)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime) — Realtime subscription patterns (MEDIUM confidence)
- [Expo Image Manipulator](https://docs.expo.dev/versions/latest/sdk/image-manipulator/) — Image compression utilities (HIGH confidence — already used in plantnet.ts)
- [Existing Plantid codebase] — Architecture analysis (HIGH confidence — direct code inspection)

---
*Architecture research for: Plantid v2.0 Community features*
*Researched: 2026-02-27*
*Confidence: MEDIUM*
