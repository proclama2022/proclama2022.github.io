# Domain Pitfalls: Adding Community Features to Plantid

**Domain:** React Native/Expo plant identification app adding Supabase backend, auth, and social features
**Milestone:** v2.0 Community
**Researched:** 2026-02-27
**Sources:** Supabase official documentation (Architecture, Auth, RLS, JS API, Realtime), existing codebase audit, known React Native + Supabase patterns
**Confidence:** HIGH for Supabase official docs; MEDIUM for migration patterns and moderation challenges

---

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, data loss, or store rejection.

---

### Pitfall 1: Breaking Offline-First Core Features When Adding Auth

**What goes wrong:** Adding Supabase auth creates a hard dependency on network connectivity for app launch. If the auth check fails or times out, the entire app blocks. Existing users who could previously identify plants offline suddenly see a blank screen or error when their phone has no signal.

**Why it happens:** The app initializes Supabase client at startup and awaits `getSession()` before rendering. The existing AsyncStorage plant database still works, but the UI never reaches it because auth is gated. Supabase Auth docs show `supabase.auth.getSession()` as the pattern, but naive implementation blocks rendering.

**Consequences:**
- Core value proposition (plant identification) breaks in poor coverage areas
- App Store reviews complain "app doesn't work offline" despite offline functionality being intact
- Existing users churn because the app they trusted now requires connectivity for basic features

**Warning signs:**
- Root component has `<AuthContext>` or similar that blocks render until auth resolves
- No graceful degradation to "offline mode" when Supabase is unreachable
- `useEffect` in root component awaits `supabase.auth.getSession()` with no loading fallback

**Prevention:**
- Treat auth as optional for core features: plant identification, local plant collection, and care tracking work without auth
- Render the main app immediately; show auth prompts only when user taps social features (feed, profile, following)
- Use a "lazy auth" pattern: don't initialize Supabase client until user explicitly signs up or signs in
- Add a network-aware banner: "Connect to join community" but don't block plant ID
- Keep all v1.x features fully offline; only v2.0 community features require backend

**Detection:**
- Test app in airplane mode — should still allow camera, identification, and plant collection management
- Monitor app launch time: if >3 seconds on average, auth initialization may be blocking

**Phase to address:** Phase 1 (Auth Infrastructure) — design optional auth before writing any Supabase code. Core screens must NOT gate on auth state.

---

### Pitfall 2: Service Role Key Exposure Enables Full Database Access

**What goes wrong:** The Supabase `service_role` key (which bypasses all RLS policies) is embedded in the app bundle via `EXPO_PUBLIC_SUPABASE_SERVICE_KEY`. Any user who unpacks the APK/IPA can extract this key and gain full read/write/delete access to the entire PostgreSQL database, including other users' data.

**Why it happens:** Developers use the service key on client-side for "convenience" — it avoids writing RLS policies or backend functions. Supabase documentation explicitly warns: "Never use the service key on the client." However, the key works if used, so it's easy to accidentally include.

**Consequences:**
- Attackers dump the entire users table (emails, profiles, OAuth tokens)
- Attackers delete other users' posts, plant tips, or comments
- Attackers elevate themselves to admin by modifying the `profiles` table
- Compliance breach (GDPR) if user data is exposed

**Warning signs:**
- `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` exists in `.env`
- Client-side code calls `supabase.from('table').select('*', { db: { schema: 'public' } } )` with service key headers
- RLS policies are disabled or missing on "public" tables

**Prevention:**
- NEVER include `service_role` key in the app bundle. Only `anon` key should be client-accessible
- Use Row Level Security (RLS) policies on ALL tables — enable RLS by default
- Create Supabase Edge Functions or a serverless backend (Cloudflare Workers, Vercel) for admin operations
- Use Supabase Dashboard → API → service role key only from server-side code
- For v2.0, client should ONLY use the `anon` key; all privileged operations go through Edge Functions

**Detection:**
- Run `grep -r "service_role\|SERVICE_ROLE" .` in codebase — should match zero files in client code
- Review Supabase Dashboard → Authentication → Policies — ensure RLS is enabled on all tables

**Phase to address:** Phase 1 (Supabase Setup) — before writing any client code. Establish the rule: service key exists only in Edge Functions, never in app bundle.

---

### Pitfall 3: Row Level Security (RLS) Policy Gaps Expose User Data

**What goes wrong:** RLS policies are written for "happy path" queries but miss edge cases. A user can view another user's private plants, edit posts they don't own, or access admin-only tables via API bypass. Supabase warns "Always enable RLS on public tables" but enabling isn't enough — policies must be comprehensive.

**Why it happens:** RLS policies use SQL `USING` clauses that filter rows. If a policy only checks `auth.uid() = user_id` but forgets a unique constraint or JOIN, data leaks. Common gaps: missing policies on INSERT/UPDATE/DELETE, policies that don't check ownership, policies that allow public reads but should be restricted.

**Consequences:**
- User A can see User B's private plant collection (privacy breach)
- Unauthorized users can edit or delete community posts
- Attackers enumerate all user IDs via SQL injection in policy logic
- Compliance violation (GDPR CCPA) if private data is accessible

**Warning signs:**
- Tables have RLS enabled but only SELECT policy (missing INSERT/UPDATE/DELETE policies)
- Policies use `auth.uid() IS NOT NULL` instead of ownership checks like `auth.uid() = user_id`
- No automated tests that query as different users to verify policy isolation
- Dashboard shows "RLS enabled" but "0 policies" on some tables

**Prevention:**
- Write RLS policies following the principle of least privilege: default-deny, explicit-allow
- Every table needs at least 4 policies: SELECT (read own), INSERT (create own), UPDATE (modify own), DELETE (remove own)
- For public content (community feed), use explicit `is_public` boolean columns; policy allows read if true
- Test policies by creating two test users and verifying User A cannot access User B's private data
- Use Supabase CLI's `supabase db diff` to track policy changes in version control
- Add integration tests that spawn multiple Supabase clients with different auth sessions and verify isolation

**Example correct policy for private plant collection:**
```sql
-- Private plants: users can only read their own
CREATE POLICY "Users can view own plants" ON plants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Private plants: users can only insert their own
CREATE POLICY "Users can insert own plants" ON plants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Public community posts: anyone can read, only author can update
CREATE POLICY "Anyone can view public posts" ON community_posts
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Authors can update own posts" ON community_posts
  FOR UPDATE
  USING (auth.uid() = author_id);
```

**Detection:**
- Supabase Dashboard → Authentication → Policies — review each table's policies
- Run `SELECT * FROM pg_policies WHERE schemaname = 'public'` — ensure every table has policies
- Integration test suite with multi-user auth scenarios

**Phase to address:** Phase 2 (Database Schema) — before creating any tables. Write policies alongside table DDL; test before deploying.

---

### Pitfall 4: Auth Session Staleness Causes Silent Data Loss or Wrong User Context

**What goes wrong:** User's Supabase auth session expires or is revoked server-side (e.g., user deletes account, admin bans user), but the app's local session state remains valid. The app continues making requests as if authenticated, but Supabase rejects them or, worse, requests succeed with wrong user context due to session confusion.

**Why it happens:** Supabase uses JWT tokens with expiry. The app caches the session in AsyncStorage. If the token expires or is invalidated on server, the cached session doesn't know. Supabase docs recommend `supabase.auth.getSession()` but naive code calls it once at startup and never refreshes.

**Consequences:**
- User creates posts or comments that fail silently; UI shows success but data never reaches server
- User A's device holds stale session; after user A logs out on device B, device A still operates as user A
- Confusing UX: app says "logged in as user@example.com" but server sees anonymous

**Warning signs:**
- `getSession()` called only once at app startup, not on focus/network resume
- No listener for `authStateChange` events
- No error handling for 401/403 responses from Supabase
- AsyncStorage holds session data but never invalidates

**Prevention:**
- Subscribe to `supabase.auth.onAuthStateChange()` and re-render app on session changes
- Call `getSession()` on every app foreground event (not just launch)
- Wrap all Supabase calls with error handling that clears local session on 401/403
- Use Supabase's built-in session refresh: the SDK auto-refreshes tokens, but your code must handle `TOKEN_REFRESHED` events
- On critical operations (post creation, comment, profile update), call `getSession()` immediately before the operation to verify validity

**Detection:**
- Test scenario: log in on device A, log out on device B, use device A — should force re-login
- Test scenario: revoke session via Supabase Dashboard, use app — should detect and logout
- Monitor logs for 401/403 errors from Supabase — should trigger session refresh

**Phase to address:** Phase 1 (Auth Infrastructure) — session management must be robust before any social features ship.

---

### Pitfall 5: Realtime Subscriptions Not Cleaned Up Cause Memory Leaks and Duplicate Events

**What goes wrong:** The app subscribes to Supabase Realtime channels (e.g., community feed updates, new comments) but never unsubscribes. When users navigate between screens, new subscriptions pile up. The same event triggers multiple handlers, UI updates spam, and memory grows unbounded.

**Why it happens:** Supabase Realtime uses WebSockets. Subscriptions persist unless explicitly removed. React components `useEffect` returns cleanup functions, but developers forget to call `channel.unsubscribe()`. Realtime docs show `.subscribe()` but don't emphasize cleanup.

**Consequences:**
- App memory usage grows 5-10MB per navigation between Feed and Detail screens
- Each new comment appears 2-5 times in the UI (multiple subscriptions all firing)
- Background threads keep WebSocket open even when app is backgrounded, draining battery
- Eventually app crashes with "too many open connections"

**Warning signs:**
- No `.unsubscribe()` or `removeChannel()` calls in `useEffect` cleanup functions
- Feed screen creates a new channel on every render or navigation
- Memory profiler shows steady growth when navigating between screens
- Console logs show multiple "Subscription created" messages without "Subscription removed"

**Prevention:**
- Always wrap Realtime subscriptions in `useEffect` with cleanup:
  ```typescript
  useEffect(() => {
    const channel = supabase
      .channel('feed-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_posts' }, payload => {
        // handle new post
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  ```
- Limit active subscriptions: only subscribe to the current screen's data, unsubscribe on navigation
- Use a singleton Realtime client per app, not multiple clients
- Test with React DevTools Profiler — ensure components unmount and subscriptions clean up
- Background the app: all subscriptions should pause or unsubscribe

**Detection:**
- React DevTools Profiler: mount/unmount Feed component 10 times — check that subscriptions are created/destroyed
- Network inspector: WebSocket connections should close when navigating away
- Memory profiler: no steady growth over 5 minutes of navigation

**Phase to address:** Phase 3 (Community Feed Realtime) — establish subscription pattern before adding realtime features.

---

### Pitfall 6: No Offline Sync Strategy Leads to Data Conflicts and Lost Content

**What goes wrong:** User creates a community post or comment while offline. The app stores it locally, but when connectivity returns, the sync logic is buggy: duplicate posts appear, edits overwrite newer server data, or content is lost entirely. The transition from offline-first (v1.x) to backend-connected (v2.0) creates a "sync gap."

**Why it happens:** v1.x was purely local AsyncStorage. v2.0 adds Supabase but doesn't design offline sync. Posts created while offline sit in AsyncStorage with no queue or conflict resolution. When network resumes, naive code just "push everything" without checking server state.

**Consequences:**
- Double posts: user's offline comment appears twice after sync
- Lost edits: user edits a post offline; another user edits the same post online; offline overwrite clobbers online changes
- Ghost data: app shows content as "posted" but it never reached server; user doesn't discover until app restart
- Confusing UX: "posted" indicator but content missing from feed

**Warning signs:**
- AsyncStorage holds draft posts/comments but no "pending sync" flag
- No `last_synced_at` or `version` field on user-generated content
- Network resume handler doesn't process offline queue
- No conflict resolution strategy (e.g., last-write-wins, merge, manual resolution)

**Prevention:**
- Design offline sync as a first-class feature, not an afterthought:
  - Create a `sync_queue` table in Supabase: store pending operations with timestamps
  - On create/edit while offline: write to AsyncStorage `sync_queue` array
  - On network resume: process queue sequentially; for each item, check server state before applying
- Use optimistic UI with rollback: show "posting..." spinner; if sync fails, revert to draft and show error
- Add conflict detection: if server version > client version, prompt user "Resolve conflict" or use last-write-wins with timestamp
- Consider limiting offline creation for v2.0 MVP: allow reading community content offline, but require connectivity to post
- For v2.0, simplest approach: disable "post" button when offline; show "Connect to share" message

**Detection:**
- Test: create post in airplane mode, enable wifi, force close app, reopen — check if post appears
- Test: edit a post offline, edit same post online from another device, sync both — check conflict handling

**Phase to address:** Phase 2 (Database Schema + Sync) — design sync architecture before allowing user-generated content. For MVP, consider requiring online for posting to avoid complexity.

---

## Moderate Pitfalls

Significant issues that degrade UX but are recoverable.

---

### Pitfall 7: Auth Flow Regression Breaks Existing User Experience

**What goes wrong:** Adding auth changes the app launch flow: new users see "Sign up to continue" before experiencing the core value (plant ID). Existing users on upgrade get prompted to create an account to continue using features they previously had. App feels "gatekept" and conversion drops.

**Why it happens:** Auth is treated as required rather than optional. Root component checks `if (!user) return <SignInScreen />`. The core camera and plant ID screens are behind auth gate, even though they don't technically need auth.

**Consequences:**
- New user conversion drops 40-60% — they don't see value before hitting a signup wall
- Existing users (v1.x) feel alienated: "I used this for months, now I need an account?"
- Reviews complain "app turned into a login wall"

**Prevention:**
- Keep auth OPTIONAL for all v1.x features: camera, identification, plant collection, care tracking, reminders
- Only prompt auth when user taps v2.0 features: community feed, post creation, user profile, following
- Use "progressive enrollment": let user identify 5 plants for free, then show gentle "Join community to share your garden" nudge
- For existing v1.x users upgrading, auto-migrate their AsyncStorage plants to Supabase if they choose to sign up (one-tap migration)
- Show auth benefits, not barriers: "Save your plants across devices" not "Sign up to continue"

**Detection:**
- UX test: new user installs app, can they reach the plant identification screen WITHOUT signing up?
- Funnel analytics: measure drop-off at auth prompt — should be <10% of new users

**Phase to address:** Phase 1 (Auth Infrastructure) — design optional auth before implementation.

---

### Pitfall 8: Missing Content Moderation Allows Spam, Abuse, or Policy Violations

**What goes wrong:** Community feed launches with no moderation. Spammers post ads, trolls post offensive content, or users post inappropriate plant photos. App Store/Play Store reviews complain about toxic community. Brands disassociate.

**Why it happens:** MVP assumes "plant enthusiasts are nice." No report system, no filters, no moderation queue. Reactive approach only kicks in after damage is done.

**Consequences:**
- New users churn after seeing spam/abuse in first 5 minutes
- App stores threaten removal for policy violations (user-generated content without moderation)
- Legal risk if users post illegal content (CSAM, hate speech, etc.)
- Brand damage: "Plantid community is toxic"

**Prevention:**
- Build moderation BEFORE launching public feed:
  - Report system: users can flag posts/comments with reason (spam, inappropriate, abuse)
  - Admin queue: Supabase Dashboard or Edge Function endpoint to review flagged content
  - Auto-filters: block common spam phrases, profanity filter (library like `bad-words`)
  - Rate limiting: max 5 posts/hour per user to prevent spam floods
  - Image moderation: use AWS Rekognition, Google Vision API, or Cloudflare AI to detect NSFW images before upload
- For v2.0 MVP, consider "require approval": posts go to moderation queue before appearing publicly
- Start with trusted community: beta testers only, then gradual rollout
- Add community guidelines screen before first post; user must acknowledge

**Detection:**
- Monitor report volume: >5% of posts flagged indicates moderation is too lax
- Review new posts manually for first 2 weeks post-launch
- Set up alerts for spikes in post volume (potential spam attack)

**Phase to address:** Phase 3 (Community Feed + Moderation) — moderation must be built alongside posting, not after.

---

### Pitfall 9: OAuth Implementation Gaps Cause Failed Logins or Data Loss

**What goes wrong:** Implementing Google/Apple/Facebook OAuth via Supabase Auth but missing critical steps: token refresh fails, scope issues (no email access), or provider-specific bugs (e.g., Apple Sign In requires additional consent for email on first sign-in). Users tap "Sign in with Google" and nothing happens or error appears.

**Why it happens:** OAuth requires proper configuration on both provider side (Google Cloud Console, Apple Developer) and Supabase Dashboard. Supabase docs show the configuration, but each provider has quirks. Missing or incorrect `redirectUrl`, `clientId`, or `scopes` cause silent failures.

**Consequences:**
- "Sign in with Google" button spins forever, user gives up
- User signs in but app can't access email (scope missing), can't create profile
- Token expires after 1 hour, app doesn't refresh, user logged out unexpectedly
- Platform-specific: Apple Sign In is REQUIRED for iOS apps; missing it causes App Store rejection

**Prevention:**
- Follow Supabase Auth guides for each provider exactly:
  - Google: enable Google+ API, set correct redirect URLs (supabase auth callback + app deep link)
  - Apple: generate Service ID, configure Sign In with Apple, enable email scope
  - Facebook: create app, set OAuth redirect URI
- Test each provider on both iOS and Android physical devices (not emulator)
- Add fallback: if OAuth fails, show email/password signup option
- Monitor OAuth errors in Supabase Dashboard → Analytics
- For iOS: Apple Sign In is MANDATORY — use `expo-apple-authentication` library
- Handle token refresh: Supabase SDK auto-refreshes, but listen for `TOKEN_REFRESHED` and `SIGNED_OUT` events

**Detection:**
- Test each OAuth provider on fresh device (not previously signed in)
- Test token expiry: sign in, wait 2 hours, use app — should stay logged in
- Supabase Dashboard → Auth → Users — check OAuth providers are linked correctly

**Phase to address:** Phase 1 (Auth Infrastructure) — OAuth is core to onboarding; test thoroughly before launch.

---

### Pitfall 10: Database Schema Changes Without Migration Scripts Break Production

**What goes wrong:** During development, tables are modified (columns added/renamed, types changed) via Supabase Dashboard UI. No migration SQL files exist. When deploying to production or rolling back, schema is out of sync. App crashes with "column does not exist" errors.

**Why it happens:** Supabase Dashboard makes schema changes easy. Developers edit tables directly. No `supabase migration` files are written. Local dev schema drifts from production.

**Consequences:**
- Production app crashes after schema change because app code expects new column
- Rolling back requires manually reversing Dashboard changes (error-prone)
- Team members have different local schemas; bugs appear only on some machines
- No audit trail of what changed and when

**Prevention:**
- Use Supabase CLI for ALL schema changes:
  - `supabase migration new add_column_to_posts` creates migration file
  - Edit generated SQL file
  - `supabase db push` applies to local dev
  - `supabase db remote commit` tracks in version control
- Never use Dashboard for schema changes in production; use migrations only
- Keep migrations in git; review in PRs
- For v2.0, plan schema upfront to minimize breaking changes
- Use TypeScript types generated from schema: `supabase gen types typescript --local > types/database.ts`

**Detection:**
- Run `supabase db diff` before deploying — shows pending changes
- Regularly audit Dashboard schema vs migration history
- CI/CD check: compare local schema to remote, fail if drift detected

**Phase to address:** Phase 2 (Database Schema) — establish migration-first workflow from day one.

---

### Pitfall 11: User Profile Migration from AsyncStorage Loses Data

**What goes wrong:** Existing v1.x users have plants stored in AsyncStorage. When they sign up for v2.0 community, the app creates a new Supabase user but doesn't migrate their local plants. Users lose their entire garden collection on signup. Alternatively, migration runs but duplicates data or crashes mid-migration.

**Why it happens:** AsyncStorage is JSON-based, Supabase is relational. Migration requires transforming JSON objects to database rows. No migration code exists. Signup flow creates new user but skips "import local plants" step.

**Consequences:**
- Existing users (most valuable) lose data on signup → rage churn
- 1-star reviews: "Lost all my plants after update"
- Support requests for data recovery

**Prevention:**
- Design migration as part of signup flow:
  1. User taps "Sign up"
  2. App reads AsyncStorage plants
  3. After successful Supabase auth, app calls Edge Function or batch insert to migrate plants
  4. Show progress: "Migrating 47 plants..." with percentage
  5. On success, show "Welcome! Your plants are now saved in the cloud"
  6. On failure, rollback signup or keep local copy, show error and support contact
- Use a migration flag in AsyncStorage: `migrated_to_supabase: true` to avoid re-migrating
- Test migration with large datasets (100+ plants) to ensure no timeouts
- For v2.0 MVP, make migration optional: "Import your plants? (recommended)" with skip option

**Detection:**
- Test: signup with existing AsyncStorage data, verify all plants appear in Supabase
- Test: signup during migration failure (e.g., network drop), verify rollback or retry works
- Monitor analytics: how many users skip migration, how many migrations fail

**Phase to address:** Phase 1 (Auth + Migration) — migration is critical for existing users; build and test before launch.

---

### Pitfall 12: No Rate Limiting on Feed/Comments Allows Abuse

**What goes wrong:** User posts 50 comments in 1 minute, or creates 20 feed posts rapidly. Spam floods the community, driving away genuine users. Or attacker uses API directly (bypassing app) to mass-create content.

**Why it happens:** v2.0 assumes "reasonable use." No per-user rate limiting on write operations. Supabase has API limits but they're account-wide, not per-user. Client-side throttling is bypassable.

**Consequences:**
- Spam floods community feed within hours of launch
- Genuine users leave because content is unusable
- Database bloat: millions of junk rows
- Supabase quota exceeded early

**Prevention:**
- Implement rate limiting at multiple layers:
  - Database: PostgreSQL triggers to reject >N writes per user per hour
  - Edge Function: rate limit middleware using Supabase's rate limit or custom implementation
  - Client-side: debounce/disabled button state after N actions (not sufficient alone)
- Use Supabase Edge Functions with upstash/ratelimit or similar for distributed limiting
- Set reasonable limits:
  - Max 10 posts/hour per user
  - Max 30 comments/hour per user
  - Max 100 likes/hour per user
- Show user feedback: "You've reached the posting limit. Please wait before posting again."
- For v2.0 MVP, conservative limits are better — relax later based on usage

**Detection:**
- Monitor posts/comments per hour per user in Supabase Dashboard → Analytics
- Set up alerts for spikes in write volume
- Load test: script 100 posts in 1 minute from one user — should be rejected

**Phase to address:** Phase 3 (Community Feed) — rate limiting is non-optional for user-generated content.

---

## Minor Pitfalls

Annoyances and edge cases that don't break the app.

---

### Pitfall 13: Deep Linking Not Configured Breaks "Reset Password" and Email Verification

**What goes wrong:** User clicks "Reset password" email link on mobile device. Deep link tries to open app but fails or opens web browser instead. User can't reset password. Same for email verification links.

**Why it happens:** Supabase Auth sends deep links (e.g., `plantid://auth/reset-password/...`). Expo apps require deep link configuration in `app.json` (`scheme`, `associatedDomains`) and linking on native side. Missing config causes links to fail.

**Prevention:**
- Configure deep linking in Expo:
  - `app.json`: add `scheme: "plantid"` and `associatedDomains` for universal links
  - Use `expo-linking` to handle incoming links
  - Add `<Linking>` config in app root to handle auth callbacks
- Test reset password flow on physical iOS/Android devices
- For v2.0, document deep link setup in deployment checklist

**Phase to address:** Phase 1 (Auth Infrastructure) — test deep linking before auth feature ships.

---

### Pitfall 14: Avatar/Image Upload Size Not Limited Causes Storage Bloat

**What goes wrong:** Users upload 5MB photos as profile avatars or post images. Supabase Storage fills quickly. Uploads are slow on mobile. Images don't load on feed.

**Prevention:**
- Compress images before upload (same as v1.x PlantNet images): max 1024px, quality 0.8
- Enforce max file size: reject >2MB on client, validate on server
- Use Supabase Storage transformations for thumbnails (no need to upload multiple sizes)
- For avatars, square crop to 400x400

**Phase to address:** Phase 2 (User Profiles + Storage).

---

### Pitfall 15: Timezone Handling for Post Timestamps Causes Confusion

**What goes wrong:** Post shows "2 hours ago" but user just created it. Or feed is sorted wrong due to UTC vs local time confusion. Same moderation queue timestamps.

**Prevention:**
- Store all timestamps in UTC in Supabase (`DEFAULT NOW()`)
- Convert to local timezone on display using `date-fns` or native `Intl.DateTimeFormat`
- Use Supabase's `timestamptz` columns (timezone-aware)
- For "X ago" display, use client-side time diff against stored UTC

**Phase to address:** Phase 2 (Database Schema) — use `timestamptz` for all timestamp columns from day one.

---

### Pitfall 16: No Loading States for Supabase Queries Causes Janky UX

**What goes wrong:** Feed screen shows empty skeleton while loading posts, then snaps content in. Or tapping "Like" button does nothing visually while request in flight. User taps multiple times, causing duplicate likes.

**Prevention:**
- Add loading skeletons/spinners for all Supabase queries
- Disable buttons during mutation (optimistic UI with rollback)
- Use React Query or SWR for caching/loading states
- Show network errors clearly with retry buttons

**Phase to address:** Phase 3 (Community Feed UI) — loading states are not optional for good UX.

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|---------------|------------|
| **Phase 1: Auth Infrastructure** | Offline-first regression | Auth gates core features | Keep auth optional; plant ID works without auth |
| **Phase 1: Auth Infrastructure** | Service role key exposure | Key embedded in app bundle | NEVER include service key in client; use anon key only |
| **Phase 1: Auth Infrastructure** | Session management | Stale sessions cause data loss | Listen to auth state changes; refresh session on app foreground |
| **Phase 1: Auth Infrastructure** | OAuth broken login | Missing scopes or redirect URLs | Test each provider on physical devices; use Apple Sign In on iOS |
| **Phase 1: Auth Infrastructure** | Deep linking | Reset password links fail | Configure Expo deep linking in `app.json` |
| **Phase 1: Auth Infrastructure** | User migration | Local plants lost on signup | Build migration flow; show progress; handle failures |
| **Phase 2: Database Schema** | RLS policy gaps | Users can access others' data | Enable RLS on all tables; write least-privilege policies; test multi-user |
| **Phase 2: Database Schema** | Migration drift | No migration scripts, schema changes via Dashboard | Use Supabase CLI migrations only; version control all schema changes |
| **Phase 2: Database Schema** | Timezone confusion | Timestamps display wrong time | Use `timestamptz` columns; store UTC, display local |
| **Phase 2: Database Schema** | Offline sync | Data conflicts or lost content | Design sync queue or require online for posting in MVP |
| **Phase 2: Database Schema** | Storage costs | Large images fill quota | Compress before upload; limit file size |
| **Phase 3: Community Feed** | Realtime cleanup | Memory leaks from unclosed subscriptions | Always unsubscribe in `useEffect` cleanup |
| **Phase 3: Community Feed** | No moderation | Spam, abuse, policy violations | Build report system + admin queue BEFORE launch |
| **Phase 3: Community Feed** | No rate limiting | Users spam posts/comments | Database triggers + Edge Function rate limits |
| **Phase 3: Community Feed** | No loading states | Janky UX during queries | Add skeletons for all fetches; disable buttons during mutations |
| **All phases** | Supabase quota | Free tier exhausted unexpectedly | Monitor usage in Dashboard; set up alerts for quota thresholds |
| **All Phases** | API changes | Supabase breaks backward compatibility | Pin Supabase client version; review changelog before upgrades |
| **All Phases** | Security | SQL injection, XSS via user content | Sanitize all user input; use parameterized queries; validate content types |

---

## Key Differences from v1.x Pitfalls

| Area | v1.x (Offline-first) | v2.0 (Community + Supabase) |
|------|---------------------|----------------------------|
| **Data storage** | AsyncStorage (local) | Supabase PostgreSQL (remote) |
| **Auth** | None | Supabase Auth (email + OAuth) |
| **Security model** | Trust local client | RLS policies, JWT tokens, server-side validation |
| **Network dependency** | None (offline-first) | Required for auth + community, optional for core features |
| **Data privacy** | Only user's data | Multi-user; isolation via RLS critical |
| **Content moderation** | N/A | Required for user-generated content |
| **Sync complexity** | None | Offline queue, conflict resolution, optimistic UI |
| **Failure modes** | Cache misses, rate limit bypass | Session expiry, RLS gaps, realtime leaks |
| **Deployment complexity** | Static bundle | Database migrations, Edge Functions, auth provider config |

---

## Sources

- Supabase Architecture: Official documentation (HIGH confidence — authoritative source on Supabase services)
- Supabase Auth Overview: Official docs (HIGH confidence — auth patterns, JWT, session management)
- Row Level Security (RLS): Official Supabase RLS guide (HIGH confidence — security policies are critical)
- JavaScript API Reference: Official Supabase JS client docs (HIGH confidence — API usage, patterns)
- Realtime Documentation: Official Supabase Realtime docs (HIGH confidence — WebSocket subscriptions, cleanup)
- Existing codebase audit: `.planning/codebase/CONCERNS.md`, `ARCHITECTURE.md` (HIGH confidence — current v1.x implementation)
- PROJECT.md: Milestone v2.0 requirements and context (HIGH confidence — source of truth)
- React Native + Expo patterns: Known ecosystem patterns for offline-to-online migration (MEDIUM confidence — general patterns, not specific to this app)
- Content moderation best practices: Industry patterns for UGC moderation (MEDIUM confidence — verified via multiple sources, but app-specific needs vary)
- OAuth provider quirks: Platform-specific issues documented in community resources (MEDIUM confidence — Apple Sign In requirement for iOS is HIGH confidence, other provider issues are MEDIUM)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Supabase Architecture & Auth | HIGH | Based on official documentation |
| Row Level Security (RLS) | HIGH | Official Supabase RLS guide is authoritative |
| Realtime Subscriptions | HIGH | Official Realtime docs + known React cleanup patterns |
| Offline-First to Backend Migration | MEDIUM | General patterns known, but app-specific migration needs testing |
| Content Moderation Strategies | MEDIUM | Industry best practices, but effectiveness depends on implementation |
| OAuth Implementation | HIGH for Apple Sign In (iOS requirement), MEDIUM for other providers | Platform requirements are clear; provider-specific bugs vary |
| Database Schema Design | MEDIUM | SQL patterns are standard, but Supabase-specific performance characteristics need validation |

---

## Open Questions Requiring Phase-Specific Research

1. **Supabase Free Tier Limits**: Can v2.0 community features operate within Supabase free tier (500MB DB, 1GB bandwidth, 50k MAU)? Or will this require paid plan? Research: Phase 1 before committing to Supabase.

2. **Realtime Performance**: How many concurrent subscriptions can Supabase Realtime handle before performance degrades? For 1K users actively viewing feed, will Realtime scale or need polling fallback? Research: Phase 3 before launching realtime features.

3. **Image Moderation Options**: Which image moderation service (AWS Rekognition, Google Vision, Cloudflare AI, or open-source) integrates best with Supabase Storage triggers? Research: Phase 2 before implementing upload.

4. **Migration Performance**: How long does migrating 500 local plants to Supabase take on average mobile connection? Should migration be batched or backgrounded? Research: Phase 1 before implementing migration.

5. **OAuth Provider Costs**: Google Sign In free tier is limited. What are the costs for Google/Apple/Facebook OAuth at scale (10K MAU, 100K MAU)? Research: Phase 1 before launch.

6. **Edge Function Costs**: If using Supabase Edge Functions for rate limiting, what's the cost implication at 100K requests/day? Research: Phase 3 before committing to Edge Functions.

---

## Summary

The v2.0 Community milestone introduces **significantly more complexity** than v1.x due to the transition from standalone app to multi-user platform. The **highest risks** are:

1. **Breaking offline-first core UX** by making auth required (Pitfall 1) — mitigate by keeping auth optional
2. **Security breaches** via service role key exposure or RLS gaps (Pitfalls 2-3) — mitigate by strict security practices
3. **Data loss** during migration from AsyncStorage (Pitfall 11) — migrate carefully and test thoroughly
4. **Moderation crisis** if community launches without safeguards (Pitfall 8) — build moderation alongside posting

**Recommended order** to address pitfalls:

1. **Phase 1**: Fix auth pitfalls first (Pitfalls 1, 2, 4, 7, 9, 11, 13) — auth is the foundation
2. **Phase 2**: Fix database pitfalls (Pitfalls 3, 6, 10, 14, 15) — schema and RLS before content
3. **Phase 3**: Fix community pitfalls (Pitfalls 5, 8, 12, 16) — moderation and realtime last

**Phase-specific research flags**:
- **Phase 1**: Research Supabase free tier limits and OAuth costs
- **Phase 2**: Research image moderation service options
- **Phase 3**: Research Realtime scalability and Edge Function costs

Overall confidence: **HIGH** for Supabase-specific patterns, **MEDIUM** for migration and moderation strategies (requires testing and iteration).
