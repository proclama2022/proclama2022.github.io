# Phase 11: Auth Infrastructure & Supabase Setup - Research

**Researched:** 2026-02-27
**Domain:** Supabase Authentication & React Native Integration
**Confidence:** HIGH

## Summary

Phase 11 implements authentication infrastructure using Supabase for Plantid's v2.0 Community milestone. The phase requires integrating email/password authentication, Google OAuth, Apple OAuth (iOS-only), password reset, and session persistence while preserving the existing offline-first architecture. The critical challenge is adding optional auth without breaking v1.x features that must remain fully functional without network connectivity.

Based on comprehensive research of Supabase Auth, React Native patterns, and the existing Plantid codebase, the recommended approach is to use `@supabase/supabase-js` with Expo SecureStore for session persistence, implement a lazy-initialized Supabase client pattern to avoid blocking app launch, and create a Zustand `authStore` following existing store patterns. Migration flow should batch plant uploads with progress tracking and be cancellable with retry support.

**Primary recommendation:** Implement auth as an optional, on-demand feature using Supabase's JavaScript client with Expo SecureStore. Keep auth initialization lazy (don't initialize until user signs in), maintain complete separation between local AsyncStorage (v1.x features) and Supabase (community features), and implement Row Level Security (RLS) from day one.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Auth Trigger Point**
- Prompt when user accesses community features (not on first launch)
- Community feed is browsable without auth; auth required to post/comment
- Just-in-time sign-in modal appears when user taps "post" button
- Settings screen includes "Sign In / Create Account" option for proactive sign-up

**Sign-in UX**
- Full-screen modal with logo, OAuth buttons, and email option
- OAuth buttons prominent at top (Google, Apple), email option below with divider
- Tabs at top to toggle between "Sign In" and "Create Account"
- Apple Sign In button shown only on iOS (not on Android)

**Offline Behavior**
- Supabase unreachable during sign-in: show toast "Unable to connect", stay on screen
- Signed-in user goes offline: all local features work normally, no community feed
- Expired session (token refresh failed): prompt on next community action with "Session expired, please sign in again"
- Community tab when offline: show "Connect to internet to view community" placeholder

**Migration Flow**
- Prompt existing v1.x users to sync local plants immediately after sign-up (with skip option)
- Full-screen progress UI with: plant count, progress bar, cancel button
- Data to sync: plants + photos + watering history (reminders remain local-only)
- Cancel mid-migration: stop and keep partial sync, allow retry later from Settings
- Migration available in Settings for users who skipped initially

### Claude's Discretion

- Exact toast messages and placeholder text
- Progress bar styling and animation
- Error message wording for auth failures
- Loading spinner vs skeleton during auth checks

### Deferred Ideas (OUT OF SCOPE)

- Cloud sync for reminders — future phase (would require backend scheduling)
- Multi-device real-time sync — out of scope for v2.0
- Profile creation during sign-up — Phase 12 handles profiles
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | `supabase.auth.signUp()` with email/password, email confirmation flow |
| AUTH-02 | User can sign in with Google OAuth (single tap) | `supabase.auth.signInWithOAuth()` with Google provider, deep linking setup |
| AUTH-03 | User can sign in with Apple (required for iOS App Store) | `supabase.auth.signInWithOAuth()` with Apple provider, iOS-only rendering |
| AUTH-04 | User can reset password via email link | `supabase.auth.resetPasswordForEmail()`, deep link configuration in app.config.js |
| AUTH-05 | User session persists across app launches | Expo SecureStore storage adapter, session restoration on app launch |
| AUTH-06 | User can sign out from Settings | `supabase.auth.signOut()`, clear session, reset auth store |
| AUTH-07 | v1.x features work WITHOUT auth — offline-first preserved | Lazy Supabase init, no auth checks on plant ID/collection, AsyncStorage remains primary |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.39.0 | Supabase client for auth, database, realtime, storage | Official Supabase JavaScript client, proven React Native support, handles JWT refresh automatically |
| `expo-secure-store` | ~13.0.2 | Secure persistent storage for session tokens | Included in Expo SDK 54, encrypts sensitive data on device, iOS Keychain & Android Keystore integration |
| `zustand` | ^5.0.11 | Auth state management | Already used in project (plantsStore, settingsStore), lightweight, TypeScript-first, persist middleware compatible |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `expo-linking` | ~8.0.11 | Deep linking for OAuth redirects and password reset | Already installed, handles OAuth callback URLs from Google/Apple, required for magic link flows |
| `expo-image-manipulator` | ~14.0.8 | Compress plant photos before upload to Supabase Storage | Already installed, reduces migration bandwidth, resize to max 1200px |
| `@react-native-async-storage/async-storage` | ^2.2.0 | Non-sensitive auth metadata (e.g., last sync timestamp) | Already installed, keeps session token separate from user preferences |
| `react-native-web` | ~0.21.0 | Web platform support for auth flows | Already installed, ensures auth works on web if needed for testing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Auth | Firebase Auth | Firebase more mature but requires separate database setup; Supabase provides unified PostgreSQL + Auth + Storage |
| Expo SecureStore | AsyncStorage for session | AsyncStorage not encrypted on Android; security risk for JWT tokens |
| Zustand store | React Context + useState | Context requires provider wrapper; Zustand has simpler API, already used in project |
| Supabase JS Client | Supabase Expo-specific libraries | Supabase has no official Expo library; JS client works with Expo's polyfills |

**Installation:**
```bash
npm install @supabase/supabase-js
# expo-secure-store is included in SDK 54
```

**Environment Variables to Add:**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts          # Singleton Supabase client instance
│       ├── storageAdapter.ts  # Expo SecureStore adapter for session persistence
│       └── types.ts           # Supabase-specific type extensions
├── stores/
│   └── authStore.ts           # Auth state (user, session, loading, error)
├── services/
│   └── authService.ts         # Auth operations (signUp, signIn, signOut, etc.)
├── components/
│   └── auth/
│       ├── AuthModal.tsx      # Full-screen sign in / create account modal
│       ├── EmailAuthForm.tsx  # Email/password inputs with validation
│       └── OAuthButtons.tsx   # Google + Apple sign-in buttons
├── screens/
│   └── settings/
│   └── migration/
│       └── MigrationScreen.tsx # Plant sync progress UI
└── types/
    └── auth.ts                # Auth-related TypeScript types
```

**Note:** If `src/` directory doesn't exist, place under project root following existing pattern (`/stores`, `/services`, `/types` already exist at root level).

### Pattern 1: Lazy-Initialized Supabase Client

**What:** Supabase client is not created until first auth operation, preventing network calls on app launch.

**When to use:** Always. Prevents blocking app startup if Supabase is unreachable.

**Example:**
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import { secureAdapter } from './storageAdapter';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: secureAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Handle OAuth manually
    },
  });

  return supabaseInstance;
};

// Source: Supabase JavaScript client v2 docs
```

### Pattern 2: Zustand Auth Store with Session Sync

**What:** Centralized auth state management following existing `plantsStore` pattern.

**When to use:** All auth state (user, session, loading states, error messages).

**Example:**
```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ user: null, session: null, error: null }),
}));

// Source: Existing plantsStore.ts pattern in codebase
```

### Pattern 3: OAuth Deep Link Handling

**What:** Capture OAuth redirect URLs from Google/Apple sign-in flows.

**When to use:** OAuth sign-in completion.

**Example:**
```typescript
// app/auth/callback.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        const { data, error } = await getSupabaseClient().auth.getSessionFromUrl(url);
        if (!error && data.session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(tabs)/settings'); // Show error
        }
      }
    };

    handleCallback();
  }, [router]);

  return <LoadingScreen />;
}

// Source: Supabase Auth OAuth docs + Expo Router patterns
```

### Pattern 4: Cancellable Migration with Progress

**What:** Upload local plants to Supabase with progress tracking and cancellation support.

**When to use:** Post-sign-up migration flow for existing v1.x users.

**Example:**
```typescript
// services/migrationService.ts
import { getSupabaseClient } from '@/lib/supabase/client';
import { SavedPlant } from '@/types';

interface MigrationProgress {
  total: number;
  completed: number;
  currentPlantName: string;
  isCancelled: boolean;
}

export const migratePlantsToSupabase = async (
  plants: SavedPlant[],
  onProgress: (progress: MigrationProgress) => void,
  signal: { cancelled: boolean }
): Promise<{ success: number; failed: number }> => {
  const supabase = getSupabaseClient();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < plants.length; i++) {
    if (signal.cancelled) {
      break; // User cancelled mid-migration
    }

    const plant = plants[i];
    onProgress({
      total: plants.length,
      completed: i,
      currentPlantName: plant.nickname || plant.commonName || plant.species,
      isCancelled: false,
    });

    try {
      // Upload plant data to Supabase
      const { error } = await supabase.from('plants').insert({
        id: plant.id,
        species: plant.species,
        common_name: plant.commonName,
        // ... other fields
      });

      if (error) throw error;
      success++;
    } catch (err) {
      console.error(`Failed to migrate plant ${plant.id}:`, err);
      failed++;
    }
  }

  return { success, failed };
};

// Source: React Native async patterns + Supabase insert operations
```

### Anti-Patterns to Avoid

- **Initializing Supabase on app launch:** Causes network dependency, blocks offline usage. Use lazy initialization instead.
- **Storing JWT in AsyncStorage:** Not encrypted on Android. Always use Expo SecureStore for session tokens.
- **Hardcoding service_role key:** Enables full database access if extracted from app bundle. Never include service key in client code.
- **Gating main app on auth state:** Prevents offline plant identification. Auth should be optional for v1.x features.
- **OAuth without deep link handling:** Leaves users stuck on web redirect. Configure app.config.js scheme and handle callback URL.
- **Migrating all plants synchronously:** Blocks UI, poor UX with large collections. Batch uploads with progress updates.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session persistence | Custom AsyncStorage logic for JWT | Expo SecureStore adapter | Automatic encryption, OS-level secure storage (iOS Keychain, Android Keystore) |
| JWT token refresh | Manual token expiry checking and refresh | Supabase autoRefreshToken | Built-in token refresh logic, handles race conditions |
| OAuth flow | Manual HTTP requests to Google/Apple | supabase.auth.signInWithOAuth() | Handles provider-specific quirks, token exchange, error cases |
| Password reset | Custom email sending with reset links | supabase.auth.resetPasswordForEmail() | Supabase sends magic link, handles token generation, expiry |
| Session URL parsing | Manual URL parameter extraction | supabase.auth.getSessionFromUrl() | Parses OAuth callback URL, extracts session, handles errors |
| Form validation | Custom regex for email/password | React Hook Form + Zod | Declarative validation, error messages, TypeScript integration |
| Progress bar UI | Custom animated View components | react-native-progress | Already installed, proven animations, minimal code |

**Key insight:** Authentication has many edge cases (CSRF, token expiry, provider-specific bugs). Supabase handles these complexities. Hand-rolling any auth component introduces security vulnerabilities and maintenance burden.

## Common Pitfalls

### Pitfall 1: Breaking Offline-First with Auth Initialization

**What goes wrong:** Supabase client initialized on app launch attempts to fetch session from network. If Supabase is unreachable, app hangs or shows error screen. User can't identify plants offline.

**Why it happens:** Standard Supabase examples show `createClient()` at module level, which executes on import.

**How to avoid:** Use lazy initialization pattern (don't create client until first auth operation). Wrap all Supabase calls in try-catch, show "offline" placeholder for community features only.

**Warning signs:** App shows splash screen longer than 3 seconds, plant identification fails without network, console errors on app launch.

### Pitfall 2: Deep Link Configuration Missing

**What goes wrong:** OAuth redirect from Google/Apple fails to return to app. User stuck in browser or external app.

**Why it happens:** Supabase OAuth redirects to callback URL (e.g., `plantidtemp://auth/callback`). If `app.config.js` doesn't define `scheme`, OS doesn't route deep link back to app.

**How to avoid:** Add `scheme: 'plantidtemp'` to `app.config.js` (already exists). Create callback screen at `app/auth/callback.tsx`. Set Supabase project's Site URL and Redirect URLs in dashboard to match scheme.

**Warning signs:** OAuth sign-in completes in browser but app doesn't open, "Could not open URL" error, no screen rendered after sign-in.

### Pitfall 3: Session Not Persisting Across App Restarts

**What goes wrong:** User signs in, closes app, reopens — appears signed out. Must sign in again every launch.

**Why it happens:** Default Supabase storage uses localStorage (web) or AsyncStorage (React Native), which may not persist on app restart or doesn't survive OS killing the app.

**How to avoid:** Configure custom storage adapter using Expo SecureStore. Enable `persistSession: true` and `autoRefreshToken: true` in Supabase client config.

**Warning signs:** User logged out after force-quitting app, session lost after phone restart, auth state resets on hot reload.

### Pitfall 4: Row Level Security (RLS) Not Enabled

**What goes wrong:** Any user can query/modify/delete any other user's data. User A can view User B's private plants, delete their posts.

**Why it happens:** Supabase tables created without RLS policies enabled. Default PostgreSQL behavior allows all operations.

**How to avoid:** Enable RLS on all tables immediately after creation. Write policies following least-privilege: `auth.uid() == user_id` for row ownership. Test with two test users to verify isolation.

**Warning signs:** Can query all rows from any table, Postman shows other users' data, no `CREATE POLICY` statements in migration files.

### Pitfall 5: Apple Sign In Missing on iOS

**What goes wrong:** App rejected by Apple App Store. Reason: "Apps that support account creation must also offer Sign in with Apple."

**Why it happens:** Only implemented Google OAuth, not Apple Sign In. Apple requires it if any third-party sign-in is offered.

**How to avoid:** Always implement Apple OAuth alongside Google. Conditionally render Apple button only on iOS (use `Platform.OS === 'ios'`). Configure Apple Sign In in Supabase dashboard (requires Apple Developer account).

**Warning signs:** Only Google button shown on iOS, App Store review feedback mentions Sign in with Apple, no Apple provider in Supabase Auth settings.

### Pitfall 6: Migration Blocks Indefinitely

**What goes wrong:** User with 500 local plants starts migration. Progress bar sits at "Uploading plant 3/500..." for hours. Can't cancel, can't use app.

**Why it happens:** Synchronous upload loop, no cancellation support, no batching, large photos uploading sequentially.

**How to avoid:** Implement cancellation token (boolean flag checked in loop). Batch uploads (5-10 plants per request). Compress photos before upload. Show "Cancel" button. Allow retry from Settings if failed.

**Warning signs:** Upload time scales linearly with plant count, no cancel button, app freezes during migration, no progress updates.

## Code Examples

Verified patterns from official sources:

### Supabase Client Initialization with SecureStore

```typescript
// lib/supabase/storageAdapter.ts
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@supabase/supabase-js';

export const secureAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Source: Supabase Auth storage adapters + Expo SecureStore docs
```

### Email/Password Sign Up

```typescript
// services/authService.ts
import { getSupabaseClient } from '@/lib/supabase/client';

export const signUpWithEmail = async (email: string, password: string) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'plantidtemp://auth/callback',
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Check if email confirmation is required
  if (data.session === null) {
    return {
      success: true,
      requiresConfirmation: true,
      message: 'Check your email for confirmation link',
    };
  }

  return { success: true, session: data.session };
};

// Source: Supabase Auth signUp API
```

### OAuth Sign In

```typescript
// services/authService.ts
export const signInWithGoogle = async () => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'plantidtemp://auth/callback',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // OAuth flow redirects to browser — handle in callback screen
  return { success: true, url: data.url };
};

// Source: Supabase Auth OAuth providers
```

### Session State Listener

```typescript
// app/_layout.tsx (add to root layout)
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function RootLayout() {
  // ... existing font/i18n setup ...

  useEffect(() => {
    // Only initialize if user has previously signed in
    const initAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          useAuthStore.getState().setSession(session);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
            useAuthStore.getState().setSession(session);
          }
        );

        return () => subscription.unsubscribe();
      } catch (err) {
        // Supabase not configured or unreachable — continue without auth
        console.warn('Auth initialization skipped:', err);
      }
    };

    initAuth();
  }, []);

  // ... rest of layout ...
}

// Source: Supabase Auth state change listeners
```

### Password Reset

```typescript
// services/authService.ts
export const resetPassword = async (email: string) => {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'plantidtemp://auth/reset-password',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    message: 'Password reset email sent. Check your inbox.',
  };
};

// Source: Supabase Auth password reset
```

### Sign Out

```typescript
// services/authService.ts
export const signOut = async () => {
  const supabase = getSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  useAuthStore.getState().clearAuth();
  return { success: true };
};

// Source: Supabase Auth signOut
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual JWT handling | Supabase auto-refresh tokens | Supabase v2 (2023) | No manual token expiry logic, automatic background refresh |
| AsyncStorage for sessions | Expo SecureStore encryption | 2024 | Sessions encrypted on device, meets App Store security requirements |
| Custom OAuth flows | Supabase signInWithOAuth | Supabase v1 (2021) | 3 lines of code vs 100+ for Google + Apple integration |
| Deep link parsing manually | getSessionFromUrl | Supabase v2 | Handles edge cases, errors, session extraction automatically |
| Manual form validation | React Hook Form + Zod | 2023-2024 | Type-safe validation, better UX, less boilerplate |

**Deprecated/outdated:**
- **Supabase v1.x client:** Migrate to v2.39+ for React Native support. API changes: `createClient()` options differ, auth methods renamed.
- **localStorage on React Native:** Never worked consistently. Use Expo SecureStore for sensitive data, AsyncStorage for non-sensitive.
- **Custom OAuth implementations:** Too error-prone. Google OAuth 2.0 changes broke many custom flows in 2023.
- **Manual session storage in AsyncStorage:** Security risk on Android. Migrate to SecureStore before App Store submission.

## Open Questions

1. **Supabase Free Tier Limits for Migration**
   - What we know: Free tier includes 500MB database storage, 1GB bandwidth/month, 50k monthly active users.
   - What's unclear: How many plants can existing v1.x users have? If user has 500 plants with 5 photos each, migration could exceed bandwidth quota.
   - Recommendation: Pre-flight check before migration — calculate estimated upload size. Warn user if on cellular connection. Batch uploads to 10 plants per batch. Add retry logic with exponential backoff.

2. **Apple Sign In Configuration Complexity**
   - What we know: Requires Apple Developer account ($99/year), bundle identifier must match Supabase config, Service ID configuration required.
   - What's unclear: Does Plantid already have Apple Developer account? How long does Apple Sign In approval take?
   - Recommendation: If no Apple Developer account, start registration immediately (can take 1-2 weeks). For testing, use TestFlight which doesn't require Sign in with Apple until App Store submission.

3. **OAuth Provider Quirks on Physical Devices**
   - What we know: OAuth flows work differently on simulator vs physical device. Physical devices may show system Chrome browser vs embedded webview.
   - What's unclear: Will Google/Apple OAuth work seamlessly on both iOS and Android physical devices?
   - Recommendation: Test OAuth on physical iOS and Android devices before Phase 11 completion. Have fallback email/password ready if OAuth fails on specific OS versions.

4. **Migration Performance with Large Collections**
   - What we know: Uploading sequentially is slow. Parallel uploads may hit rate limits.
   - What's unclear: Optimal batch size for plant uploads? Should photos be uploaded in parallel or sequentially?
   - Recommendation: Start with batch size of 5 plants, compress photos to max 1200px width, upload photos sequentially per plant. Performance test with 50+ plant collection. Adjust batch size based on upload time.

5. **Session Refresh Timing**
   - What we know: Supabase JWT expires after 1 hour. autoRefreshToken refreshes at 50% token lifetime (30 mins).
   - What's unclear: Does session refresh work when app is backgrounded? What if token expires while offline?
   - Recommendation: Subscribe to `onAuthStateChange` which handles token refresh. On app foreground, call `getSession()` to verify session is valid. Show "Session expired" if refresh fails and require re-auth.

## Validation Architecture

> Workflow validation is disabled in `.planning/config.json` (workflow.verifier: false). Skipping Validation Architecture section.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Supabase Auth Overview](https://supabase.com/docs/guides/auth) — Authentication patterns, JWT, session management, OAuth providers (accessed 2026-02-27)
- [Supabase JavaScript Client Reference](https://supabase.com/docs/reference/javascript) — Client usage, auth methods, API signatures (accessed 2026-02-27)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) — RLS policies, least-privilege model (accessed 2026-02-27)
- [Supabase OAuth Providers](https://supabase.com/docs/guides/auth/social-login/auth-google) — Google/Apple OAuth configuration (accessed 2026-02-27)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — Secure storage for session tokens (accessed 2026-02-27)
- [Expo Linking](https://docs.expo.dev/versions/latest/sdk/linking/) — Deep linking for OAuth callbacks (accessed 2026-02-27)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction) — State management patterns (accessed 2026-02-27)

**Codebase Analysis:**
- `/Users/martha2022/Documents/Plantid/.planning/codebase/ARCHITECTURE.md` — v1.x architecture, Zustand stores, service layer
- `/Users/martha2022/Documents/Plantid/stores/plantsStore.ts` — Existing Zustand pattern with persist middleware
- `/Users/martha2022/Documents/Plantid/stores/settingsStore.ts` — Zustand pattern for user settings
- `/Users/martha2022/Documents/Plantid/app/_layout.tsx` — App initialization pattern, service loading
- `/Users/martha2022/Documents/Plantid/package.json` — React Native 0.81.5, Expo SDK 54, existing dependencies
- `/Users/martha2022/Documents/Plantid/app.config.js` — Deep linking scheme already configured

### Secondary (MEDIUM confidence)

**Community Patterns:**
- Supabase React Native examples from GitHub (multiple projects) — Common patterns for lazy initialization, storage adapters (MEDIUM — verified against official docs)
- React Native auth migration patterns (async-storage → backend) — General ecosystem patterns for offline-to-online migration (MEDIUM — standard patterns but app-specific)
- Expo Router OAuth deep linking examples — OAuth callback handling in file-based routing (MEDIUM — verified against Expo Router docs)

### Tertiary (LOW confidence)

**Industry Best Practices:**
- OAuth security best practices (PKCE, state parameters) — Known security patterns but implementation varies by provider (LOW — not verified against recent OAuth 2.1 spec)
- Migration UX patterns from other apps — General patterns but no access to competitor implementations (LOW — no hands-on verification)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase docs authoritative, libraries proven at scale
- Architecture: HIGH - Based on existing Plantid codebase patterns + official Supabase examples
- Pitfalls: HIGH - All pitfalls documented in official guides or common React Native issues
- Migration patterns: MEDIUM - General async patterns known, but app-specific performance needs testing
- OAuth provider quirks: MEDIUM - Platform requirements clear, but provider-specific bugs vary

**Research date:** 2026-02-27
**Valid until:** 2026-03-31 (30 days — Supabase platform stable, OAuth providers mature)

---

*Phase 11 research completed. Ready for planning phase.*
*Next step: Use /gsd:plan-phase to create implementation plans based on this research.*
