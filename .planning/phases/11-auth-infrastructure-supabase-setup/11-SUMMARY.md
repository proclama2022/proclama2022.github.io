# Phase 11: Auth Infrastructure & Supabase Setup - Summary

**Phase:** 11-auth-infrastructure-supabase-setup
**Status:** Planning Complete
**Total Plans:** 5
**Wave Structure:** 5 waves (sequential dependencies)

## Overview

Phase 11 implements Supabase authentication infrastructure for Plantid's v2.0 Community milestone while preserving the v1.x offline-first architecture. Users can optionally sign up with email/password, Google OAuth, or Apple OAuth (iOS-only) to access community features. All v1.x features (plant identification, collection management, watering tracking) remain fully functional without authentication.

## Plans

| Plan | Wave | Title | Dependencies | Status |
|------|------|-------|--------------|--------|
| 11-01 | 1 | Supabase Client Setup | None | Pending |
| 11-02 | 2 | Auth State & Service | 11-01 | Pending |
| 11-03 | 3 | Auth UI Components | 11-02 | Pending |
| 11-04 | 4 | App Integration | 11-02, 11-03 | Pending |
| 11-05 | 5 | Migration & Offline | 11-02, 11-04 | Pending |

## Requirements Coverage

All 7 authentication requirements are covered:

| ID | Requirement | Plan(s) |
|----|-------------|---------|
| AUTH-01 | Email/password sign up | 11-02, 11-03 |
| AUTH-02 | Google OAuth sign in | 11-02, 11-03 |
| AUTH-03 | Apple OAuth sign in | 11-02, 11-03 |
| AUTH-04 | Password reset via email | 11-02, 11-03 |
| AUTH-05 | Session persistence | 11-01, 11-04 |
| AUTH-06 | Sign out from Settings | 11-02, 11-04 |
| AUTH-07 | v1.x features work without auth | 11-01, 11-04 |

## Key Decisions

### Architecture

- **Lazy Initialization**: Supabase client created only when first accessed, preventing blocking app launch
- **SecureStore Adapter**: Session tokens encrypted via iOS Keychain / Android Keystore
- **Zustand Store**: Auth state managed with same pattern as existing plantsStore
- **Optional Auth**: All v1.x features work without network or authentication

### User Experience

- **Non-Intrusive Auth**: No forced sign-up on app launch
- **Just-in-Time Prompt**: Sign-in modal shown when accessing community features
- **Settings Access**: "Sign In / Create Account" option in Settings for proactive sign-up
- **Full-Screen Modal**: OAuth-first layout with tabs for Sign In / Create Account
- **iOS-Only Apple**: Apple Sign In button only shown on iOS devices

### Migration

- **Post Sign-Up Prompt**: Existing v1.x users prompted to sync plants after sign-up
- **Skip Option**: Users can skip migration and retry later from Settings
- **Progress Tracking**: Full-screen UI with plant count, current plant name, progress bar
- **Cancellable**: Cancel button stops migration, keeps partial sync
- **Data Synced**: Plants + photos + watering history (reminders stay local)

### Offline Behavior

- **Graceful Degradation**: "Unable to connect" toast when Supabase unreachable
- **Local Features Unaffected**: Plant ID, collection, care work offline
- **Session Expiry**: "Session expired" prompt on next community action
- **Community Placeholder**: "Connect to internet" placeholder for community tab offline

## Files Created

### Infrastructure (Plan 11-01)

- `lib/supabase/client.ts` - Lazy Supabase client singleton
- `lib/supabase/storageAdapter.ts` - Expo SecureStore adapter
- `lib/supabase/index.ts` - Barrel export
- `types/index.ts` - Auth types added (AuthState, StorageAdapter, AuthError)

### Service & State (Plan 11-02)

- `stores/authStore.ts` - Zustand auth state management
- `services/authService.ts` - Auth operations (signUp, signIn, signOut, resetPassword, OAuth)

### UI Components (Plan 11-03)

- `components/auth/AuthModal.tsx` - Full-screen auth modal with tabs
- `components/auth/EmailAuthForm.tsx` - Email/password form with validation
- `components/auth/OAuthButtons.tsx` - Google + Apple OAuth buttons
- `components/auth/index.ts` - Barrel export
- `app/auth/callback.tsx` - OAuth deep link handler

### App Integration (Plan 11-04)

- `app/_layout.tsx` - Auth initialization added
- `app/(tabs)/settings.tsx` - Sign in/sign out options added

### Migration & Offline (Plan 11-05)

- `services/migrationService.ts` - Plant migration with progress tracking
- `components/auth/MigrationScreen.tsx` - Full-screen migration UI
- `types/index.ts` - Migration types added (MigrationProgress, MigrationResult, MigrationFlag)

## Dependencies Installed

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "expo-secure-store": "~13.0.2" (included in Expo SDK 54)
}
```

## Environment Variables

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Migration Flow

1. User signs up/signs in
2. AuthModal closes, user redirected
3. Check if user has local plants (plantsStore)
4. Check if not already migrated (AsyncStorage flag)
5. If plants exist AND not migrated:
   - Show MigrationScreen
   - User can sync, skip, or cancel
6. On sync completion:
   - Store migration flag
   - Navigate to Settings or Community

## OAuth Deep Link Flow

1. User taps "Continue with Google/Apple"
2. `signInWithGoogle/Apple()` returns OAuth URL
3. App opens URL in external browser
4. User completes sign-in with provider
5. Provider redirects to `plantidtemp://auth/callback`
6. `app/auth/callback.tsx` extracts session
7. Session stored in authStore, user redirected to app

## Known Risks & Mitigations

### Risk 1: Supabase Free Tier Limits During Migration

**Mitigation:**
- Compress photos before upload (max 1200px, quality 0.7)
- Batch uploads (process sequentially per plant)
- Show warning if on cellular connection
- Allow retry from Settings if migration fails

### Risk 2: Apple Sign In Configuration Complexity

**Mitigation:**
- Conditionally render Apple button only on iOS
- Document Apple Developer account requirement
- Allow testing with TestFlight (no Apple Sign In required)
- Fallback to email/password if OAuth unavailable

### Risk 3: Session Refresh Edge Cases

**Mitigation:**
- Subscribe to `onAuthStateChange` for automatic refresh
- Check session validity on app foreground
- Show "Session expired" prompt if refresh fails
- Require re-authentication on critical auth errors

### Risk 4: Breaking v1.x Offline-First Architecture

**Mitigation:**
- Lazy Supabase initialization (no blocking calls on launch)
- All auth calls wrapped in try-catch
- No auth checks in v1.x services (plantnet, cache, rateLimiter)
- Explicit verification tests for offline usage

## Success Criteria

Phase 11 is complete when:

1. ✅ User can sign up with email/password and sign in with Google/Apple OAuth
2. ✅ User session persists across app launches with automatic token refresh
3. ✅ User can reset password via email link and sign out from Settings
4. ✅ All v1.x features (camera, plant ID, local collection) work WITHOUT authentication
5. ✅ Existing v1.x users can migrate local plants to community account with progress indicator

## Next Phase Dependencies

Phase 11 enables Phase 12 (Database Schema & User Profiles):

- Auth tokens required for RLS policy evaluation
- User ID from auth required for profile creation
- Session persistence required for profile editing
- Migration requires Supabase tables (created in Phase 12)

## Verification

See `11-VERIFICATION.md` for complete verification checklist including:

- Manual testing scenarios (8 scenarios)
- Integration tests (app launch, session persistence, auth state, migration, offline)
- Known limitations
- Sign-off procedure

## Execution Order

Execute plans in sequence: 11-01 → 11-02 → 11-03 → 11-04 → 11-05

Each plan has autonomous: true, meaning execute-phase can run without user intervention once started.

---

**Phase 11 Planning Complete**

**Ready for execution with `/gsd:execute-phase`**

**Total Estimated Time:** ~3-4 hours (based on plan complexity)
