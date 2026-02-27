# Phase 11: Auth Infrastructure & Supabase Setup - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Add Supabase authentication (email/password + OAuth) to existing offline-first app while preserving v1.x features without requiring auth. Users can optionally migrate local plants to cloud account. Community features require auth; local features remain fully functional offline.

</domain>

<decisions>
## Implementation Decisions

### Auth Trigger Point
- Prompt when user accesses community features (not on first launch)
- Community feed is browsable without auth; auth required to post/comment
- Just-in-time sign-in modal appears when user taps "post" button
- Settings screen includes "Sign In / Create Account" option for proactive sign-up

### Sign-in UX
- Full-screen modal with logo, OAuth buttons, and email option
- OAuth buttons prominent at top (Google, Apple), email option below with divider
- Tabs at top to toggle between "Sign In" and "Create Account"
- Apple Sign In button shown only on iOS (not on Android)

### Offline Behavior
- Supabase unreachable during sign-in: show toast "Unable to connect", stay on screen
- Signed-in user goes offline: all local features work normally, no community feed
- Expired session (token refresh failed): prompt on next community action with "Session expired, please sign in again"
- Community tab when offline: show "Connect to internet to view community" placeholder

### Migration Flow
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

</decisions>

<specifics>
## Specific Ideas

- Auth should feel non-intrusive — user can use app fully without ever signing in
- Migration progress should give user confidence (show plant names/photos being synced)
- Consider Supabase free tier limits when designing migration batching

</specifics>

<deferred>
## Deferred Ideas

- Cloud sync for reminders — future phase (would require backend scheduling)
- Multi-device real-time sync — out of scope for v2.0
- Profile creation during sign-up — Phase 12 handles profiles

</deferred>

---

*Phase: 11-auth-infrastructure-supabase-setup*
*Context gathered: 2026-02-27*
