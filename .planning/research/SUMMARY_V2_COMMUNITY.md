# Project Research Summary

**Project:** Plantid — Plant Identification Mobile App
**Milestone:** v2.0 Community
**Domain:** React Native/Expo plant identification app adding Supabase backend, authentication, and social community features
**Researched:** 2026-02-27
**Confidence:** HIGH

## Executive Summary

Plantid v2.0 transforms the app from a personal plant tracker into a community platform by integrating Supabase for authentication, user profiles, community feed, comments, likes, follows, and wiki/tips. Research across plant/nature community apps (iNaturalist, PictureThis, Planta, Blossom) reveals established patterns: **auth, profiles, feed, comments, likes, and moderation are table stakes** for viable community platforms. The critical architectural insight is that community features are **additive extensions** — the existing local-first architecture (AsyncStorage + Zustand) remains the source of truth for personal plant data, while Supabase serves as a parallel backend for social features only.

The recommended approach is **gradual migration preserving offline-first core**. Key risks center on breaking existing UX by making auth required, security breaches via exposed service keys or Row Level Security (RLS) gaps, data loss during AsyncStorage migration, and moderation crisis if community launches without safeguards. Mitigation strategy: keep auth **optional** for all v1.x features (plant ID, collection, care tracking), require Supabase RLS on all tables with least-privilege policies, implement migration flow with progress tracking, and build moderation (report system + admin queue) alongside posting, not after.

## Key Findings

### Recommended Stack

**Core v2.0 additions (backend platform):**
- **Supabase (PostgreSQL + Auth + Storage + Realtime)** — Full-stack backend as a service providing authentication, Row Level Security, real-time subscriptions, and image storage. Single platform replaces building custom backend.
- **@supabase/supabase-js** — Official Supabase JavaScript client for React Native. Handles auth state, database queries, realtime subscriptions, and storage operations.
- **Expo SecureStore** — Securely store Supabase session tokens on device (transitively included in Expo SDK 54).

**New libraries for community features:**
- **expo-image-picker** (already installed) — Select photos for community posts from camera/gallery
- **expo-image-manipulator** (already installed) — Compress images before upload to Supabase Storage
- **@react-native-async-storage/async-storage** (already installed) — Offline queue for posts/comments created while disconnected

**Why this approach:** No backend to build or maintain, RLS provides security without custom API, real-time features built-in, free tier sufficient for MVP, all libraries support React Native's New Architecture.

### Expected Features

**Must have (table stakes — users expect these):**
- **Authentication (email + OAuth)** — Email/password signup, Google OAuth, Apple OAuth (iOS required), password reset, persistent sessions
- **User Profiles** — Display name, avatar upload, bio, contribution stats (plants identified, tips shared), join date, profile viewable by others
- **Community Feed** — Photo-centric posts, infinite scroll pagination, like/unlike, comment count, timestamps ("2 hours ago"), pull-to-refresh, empty states
- **Comments** — Flat threading, reply to comments, timestamps, delete own comments, pagination for active posts
- **Likes** — Like/unlike toggle, like counts, show who liked (optional MVP)
- **Follow System** — Follow/unfollow users, follower/following counts, "Following" feed filter
- **Content Moderation** — Report button (posts/comments), report queue for admins, hide reported content, ban users, community guidelines

**Should have (competitive differentiators):**
- **Plant Identification Help Feed** — Users post unidentified plant photos, community suggests species, original poster accepts ID. Combines AI (PlantNet) with human expertise (iNaturalist model)
- **Plant Care Tips Wiki** — Community-contributed care advice for 500+ species. Crowdsourced tips aggregated by species with upvotes and expert badges
- **Regional Plant Tracking** — See what plants thrive in your geographic area. Optional location sharing, "Nearby" feed filter, species map by region

**Defer to v2.1+:**
- Push notifications for engagement (batched, not real-time) — High complexity, user fatigue risk
- Direct messaging — Requires massive moderation, privacy concerns
- Video posts — Storage costs, upload times, moderation difficulty
- Algorithmic "For You" feed — ML/recsys infrastructure, gaming vulnerability
- Threading comments — Recursive queries, complexity for MVP

### Architecture Approach

**v2.0 extends existing layered architecture with additive stores and services:**

**New Zustand stores:**
- **authStore** — User session (JWT), auth state, login/logout
- **feedStore** — Community posts cache, pagination, realtime updates
- **userStore** — Current user profile, follows/followers, settings sync

**New services:**
- **supabaseClient** — Singleton Supabase client instance, query wrappers
- **communityService** — Feed queries, post creation, comment/likes actions
- **userService** — Profile CRUD, follow/unfollow, user search
- **storageService** — Image uploads to Supabase Storage, URL generation

**New screens (Expo Router file-based navigation):**
- **app/(tabs)/community.tsx** — Community feed screen
- **app/auth/** — Login, signup, profile-setup screens
- **app/profile/[username].tsx** — Public profile view
- **app/post/[id].tsx** — Single post detail with comments
- **app/tips/** — Wiki/tips screens (future phase)

**Critical integration pattern:** NO breaking changes to existing stores (plantsStore, settingsStore, proStore). Local plant data remains AsyncStorage-only. Supabase is parallel backend for community features, not replacement for local storage.

### Critical Pitfalls

**Top 6 pitfalls from research:**

1. **Breaking offline-first core features when adding auth** — Adding Supabase auth creates hard dependency on network. If auth check blocks app launch, users can't identify plants offline. **Mitigation:** Keep auth OPTIONAL for all v1.x features. Render main app immediately; show auth prompts only when user taps social features. Use "lazy auth" — don't initialize Supabase until user explicitly signs up.

2. **Service role key exposure enables full database access** — Embedding `service_role` key in app bundle lets any user extract it and gain full read/write/delete access. **Mitigation:** NEVER include service key in client. Use only `anon` key client-side. All privileged operations go through Supabase Edge Functions. RLS enabled on all tables.

3. **Row Level Security (RLS) policy gaps expose user data** — RLS policies written for "happy path" but missing edge cases allow User A to view User B's private plants or edit posts they don't own. **Mitigation:** Write RLS policies following least privilege: default-deny, explicit-allow. Every table needs 4 policies (SELECT, INSERT, UPDATE, DELETE). Test policies by creating two test users and verifying isolation.

4. **Auth session staleness causes silent data loss** — User's session expires server-side but app's cached state remains valid. Requests succeed with wrong user context or fail silently. **Mitigation:** Subscribe to `supabase.auth.onAuthStateChange()`, call `getSession()` on app foreground, wrap all Supabase calls with error handling that clears session on 401/403.

5. **Realtime subscriptions not cleaned up cause memory leaks** — App subscribes to Supabase Realtime channels but never unsubscribes. New subscriptions pile up, events trigger multiple handlers, memory grows unbounded. **Mitigation:** Always wrap Realtime subscriptions in `useEffect` with cleanup function calling `supabase.removeChannel(channel)`. Limit active subscriptions to current screen only.

6. **No moderation allows spam, abuse, or policy violations** — Community launches with no report system or moderation queue. Spammers post ads, trolls post offensive content, app stores threaten removal. **Mitigation:** Build moderation BEFORE launching public feed. Report system (flag posts/comments with reason), admin queue (Supabase Dashboard or Edge Function), auto-filters (profanity, spam phrases), rate limiting (max 5 posts/hour), image moderation (AWS Rekognition/Google Vision before upload).

## Implications for Roadmap

Based on research, v2.0 should be delivered in **4 sequential phases** to manage risk and dependencies:

### Phase 1: Auth Infrastructure & Supabase Setup
**Rationale:** Auth is the foundation for all community features. Delivered first to establish Supabase integration patterns, RLS policies, and ensure v1.x features remain accessible without auth.

**Delivers:**
- Supabase project setup with PostgreSQL database
- RLS policies enabled on all tables (least-privilege model)
- Email + password signup/signin flow
- Google OAuth integration
- Apple OAuth integration (iOS requirement)
- Persistent sessions with token refresh
- Password reset via email (deep linking configured)
- **Critical:** Auth gating tests — verify plant ID works offline without auth
- Migration flow for existing v1.x users (AsyncStorage → Supabase)

**Addresses:**
- FEATURES.md: "User Authentication" table stakes
- ARCHITECTURE.md: "authStore" and "supabaseClient" services
- PITFALLS.md: #1 (offline-first regression), #2 (service key exposure), #4 (session staleness), #9 (OAuth broken logins), #11 (user migration), #13 (deep linking)

**Uses:**
- `@supabase/supabase-js` (new library)
- `expo-secure-store` (included in SDK)
- `expo-linking` (already installed for password reset deep links)

**Avoids:**
- PITFALLS.md #1: Core screens NOT gated on auth state
- PITFALLS.md #2: Service key only in Edge Functions, never client-side
- PITFALLS.md #9: Test OAuth on physical iOS/Android devices before launch

**Research flag:** **MEDIUM** — OAuth provider quirks, migration performance with large plant collections. May need `/gsd:research-phase` for migration testing strategy.

---

### Phase 2: Database Schema & User Profiles
**Rationale:** Database schema and profiles are foundational for all user-generated content. Delivered after auth is stable to establish data model, RLS policies tested, and migration pattern validated.

**Delivers:**
- Database schema: `profiles`, `community_posts`, `likes`, `comments`, `follows`, `reports` tables
- RLS policies on all tables (4 policies per table: SELECT, INSERT, UPDATE, DELETE)
- Migration scripts via Supabase CLI (version-controlled)
- User profile creation/edit screens
- Avatar upload to Supabase Storage with compression
- Profile stats aggregation (plants identified, tips shared)
- Public profile viewable by other users
- `timestamptz` columns for all timestamps (timezone-aware)

**Addresses:**
- FEATURES.md: "User Profiles" table stakes
- ARCHITECTURE.md: "userService" and "storageService"
- PITFALLS.md: #3 (RLS gaps), #6 (offline sync), #10 (migration drift), #14 (avatar size limits), #15 (timezone handling)

**Uses:**
- Supabase PostgreSQL (NEW)
- Supabase Storage (NEW)
- Supabase CLI migrations (version control schema)
- `expo-image-manipulator` (existing, for avatar compression)

**Avoids:**
- PITFALLS.md #3: Enable RLS on all tables before inserting any data
- PITFALLS.md #10: Use Supabase CLI migrations only — never Dashboard for schema changes
- PITFALLS.md #14: Compress avatars before upload (max 400x400, quality 0.8)

**Research flag:** **LOW** — Standard database patterns, Supabase CLI well-documented. Skip research-phase unless offline sync complexity grows.

---

### Phase 3: Community Feed Core & Moderation
**Rationale:** Feed is the primary interaction surface. Delivered after profiles to give users something to view and post. Moderation built alongside posting to prevent Pitfall #8.

**Delivers:**
- Community feed screen with infinite scroll pagination
- Create post flow (photo + caption + optional plant name from PlantNet)
- Photo upload to Supabase Storage with compression
- Like/unlike posts with optimistic UI
- Flat comments (no threading for MVP)
- Comment pagination (20 at a time)
- Report system (flag posts/comments: spam, inappropriate, harassment, misinformation)
- Moderation queue (manual review via Supabase Dashboard)
- Rate limiting (max 10 posts/hour, 30 comments/hour per user)
- Auto-hide reported content pending review
- Community guidelines screen
- Pull-to-refresh, empty states, loading skeletons

**Addresses:**
- FEATURES.md: "Community Feed", "Comments", "Likes", "Content Moderation" table stakes
- ARCHITECTURE.md: "feedStore" and "communityService"
- PITFALLS.md: #5 (realtime cleanup), #8 (no moderation), #12 (no rate limiting), #16 (no loading states)

**Uses:**
- `@supabase/supabase-js` (feed queries, realtime subscriptions)
- Supabase Realtime (optional for MVP — poll on view for simplicity)
- `expo-image-picker` (existing, for post photos)
- `expo-image-manipulator` (existing, for compression)

**Avoids:**
- PITFALLS.md #5: Always unsubscribe Realtime channels in `useEffect` cleanup
- PITFALLS.md #8: Build moderation BEFORE launch (report queue, admin review)
- PITFALLS.md #12: Database trigger to enforce rate limits per user

**Research flag:** **MEDIUM** — Realtime scalability unclear. May need `/gsd:research-phase` to test Supabase Realtime with 1K concurrent users.

---

### Phase 4: Follow System & Advanced Features
**Rationale:** Follow system enables social graph and "Following" feed filter. Delivered after core feed is stable to reduce complexity. Advanced features (ID help, care tips) build on stable foundation.

**Delivers:**
- Follow/unfollow users
- Follower/following counts on profiles (denormalized)
- "Following" feed filter (JOIN query with follows table)
- @mention users in comments (optional MVP)
- Plant ID Help Feed (post_type: "identify_help", identification acceptance flow)
- Care Tips extraction (tips from posts aggregated by species)
- Expert badges for top contributors

**Addresses:**
- FEATURES.md: "Follow System", "Plant Identification Help", "Care Tips Wiki" differentiators
- ARCHITECTURE.md: Social graph features

**Uses:**
- Supabase queries (follows table, feed JOINs)
- Denormalized counts with triggers (followers_count, following_count)

**Avoids:**
- Anti-features: No public follower/following lists (privacy), no direct messaging (moderation burden), no video posts (storage costs)

**Research flag:** **LOW** — Standard social graph patterns. Skip research-phase.

---

### Phase Ordering Rationale

**Why this order:**
1. **Auth first** — Foundation for all community features. Establish Supabase integration, RLS policies, ensure v1.x remains offline. Migration flow protects existing users.
2. **Database second** — Schema and RLS before any user-generated content. Test policies, validate migration patterns, establish timezone handling.
3. **Feed third** — Core interaction surface. Build moderation alongside posting to prevent crisis. Rate limiting prevents abuse.
4. **Follow last** — Social graph complexity deferred until feed is stable. Advanced features (ID help, tips) build on proven foundation.

**How this avoids pitfalls:**
- **Phase 1** addresses Pitfalls #1, #2, #4, #9, #11, #13 — auth security before any social features
- **Phase 2** addresses Pitfalls #3, #6, #10, #14, #15 — database security before user content
- **Phase 3** addresses Pitfalls #5, #8, #12, #16 — moderation and realtime safeguards
- **Phase 4** builds safely on proven foundation

**Parallel opportunities:**
- Avatar upload compression logic can be tested in Phase 1 alongside auth
- Report UI can be designed in Phase 2 while schema is built
- Moderation queue admin interface can be built during Phase 3

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 1 (Auth Infrastructure):** Supabase free tier limits (500MB DB, 1GB bandwidth, 50k MAU) — can community features operate within free tier or require paid plan? OAuth provider costs at scale (Google/Apple/Facebook).
- **Phase 3 (Community Feed):** Supabase Realtime performance — how many concurrent subscribers before degradation? For 1K users actively viewing feed, will Realtime scale or need polling fallback? Image moderation service options (AWS Rekognition vs Google Vision vs Cloudflare AI).

**Phases with standard patterns (skip research-phase):**
- **Phase 2 (Database Schema):** Standard PostgreSQL + Supabase patterns, RLS well-documented.
- **Phase 4 (Follow System):** Standard social graph patterns, no unique challenges.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Supabase Platform & Auth | HIGH | Official documentation authoritative, patterns proven at scale |
| Community Features (feed, profiles, follows) | HIGH | Based on iNaturalist analysis (gold standard for nature communities) + established social app patterns |
| Row Level Security (RLS) | HIGH | Official Supabase RLS guide is authoritative, patterns clear |
| Realtime Subscriptions | HIGH | Official Realtime docs + known React cleanup patterns (useEffect cleanup) |
| Offline-First to Backend Migration | MEDIUM | General patterns known, but app-specific migration (AsyncStorage → Supabase) needs testing with large plant collections |
| Content Moderation Strategies | MEDIUM | Industry best practices clear (report system, rate limits), but effectiveness depends on implementation and community scale |
| OAuth Implementation | HIGH for Apple Sign In (iOS requirement), MEDIUM for other providers | Platform requirements clear; provider-specific bugs vary |

**Overall confidence:** HIGH

Research is based on:
- Official Supabase documentation (Architecture, Auth, RLS, JS API, Realtime)
- iNaturalist feature analysis (gold standard for nature communities)
- Existing Plantid codebase audit (v1.x architecture, Zustand stores, Expo Router)
- React Native + Expo ecosystem patterns for offline-to-online migration
- Competitive analysis (PictureThis, Planta, Blossom community features)

### Gaps to Address

**Minor gaps to validate during implementation:**

1. **Supabase Free Tier Limits** — Research indicates 500MB DB, 1GB bandwidth, 50k MAU. With multi-photo posts and community activity, will this suffice for MVP? **Mitigation:** Monitor usage during Phase 1. Set up alerts for quota thresholds. Plan upgrade path if free tier exhausted.

2. **Realtime Scalability** — Supabase Realtime documentation doesn't specify concurrent connection limits. For 1K users actively viewing feed, will Realtime degrade? **Mitigation:** Test with load simulation in Phase 3. Fallback to polling if Realtime bottlenecks.

3. **Migration Performance** — How long does migrating 500 local plants to Supabase take on average mobile connection? Should migration be batched or backgrounded? **Mitigation:** Test migration with 100+ plants during Phase 1. Show progress bar. Make migration optional with skip option.

4. **Moderation Workload** — With 1K users posting 10 posts/day, what's daily report volume? Can one admin handle or need volunteer moderators? **Mitigation:** Monitor report volume in Phase 3. Start with trusted beta community. Scale moderation team as needed.

5. **Image Moderation Service Integration** — Which service (AWS Rekognition, Google Vision, Cloudflare AI) integrates best with Supabase Storage triggers? **Mitigation:** Phase 2 research before implementing upload. Start with manual moderation, add automated filtering at scale.

**No blocking gaps** — all risks have clear mitigations. Research is sufficient to proceed with roadmap creation.

## Sources

### Primary (HIGH confidence)

**Official Documentation:**
- [Supabase Architecture](https://supabase.com/docs/guides/architecture) — Platform overview, service capabilities
- [Supabase Auth Overview](https://supabase.com/docs/guides/auth) — Authentication patterns, JWT, session management, OAuth
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security) — Security policies, least-privilege model
- [Supabase JavaScript API](https://supabase.com/docs/reference/javascript) — Client usage, queries, realtime
- [Supabase Realtime](https://supabase.com/docs/guides/realtime) — WebSocket subscriptions, cleanup patterns
- [Supabase Storage](https://supabase.com/docs/guides/storage) — Image upload, transformations, CDN

**Codebase Analysis:**
- `/Users/martha2022/Documents/Plantid/.planning/codebase/ARCHITECTURE.md` — v1.x architecture, Zustand stores, service layer
- `/Users/martha2022/Documents/Plantid/.planning/codebase/CONCERNS.md` — Known issues, fragile areas to avoid breaking
- `/Users/martha2022/Documents/Plantid/package.json` — Installed versions, React Native 0.81.5, Expo SDK 54
- `/Users/martha2022/Documents/Plantid/.planning/research/STACK.md` — Existing v1.x stack

### Secondary (MEDIUM confidence)

**Competitive App Research:**
- iNaturalist website and help pages — Community features, moderation system, ID help flow (HIGH confidence — direct observation)
- PictureThis, Planta, Blossom app store descriptions — Feature lists, marketing claims (MEDIUM confidence — not verified by hands-on testing)
- General social app patterns — Standard patterns for feeds, likes, comments, follows (MEDIUM confidence — widely known but not plant-specific)

**React Native Ecosystem:**
- Offline-to-online migration patterns — Known ecosystem patterns for AsyncStorage → backend migration (MEDIUM confidence — general patterns, app-specific needs vary)
- Content moderation best practices — Industry patterns for UGC moderation (MEDIUM confidence — verified via multiple sources, but effectiveness varies by implementation)

### Tertiary (LOW confidence)

**Industry Statistics:**
- Notification engagement metrics — 75% delete apps with too many notifications (Single source, not independently verified)
- Plant community engagement rates — No public analytics available (LOW confidence — no access to competitor data)

**Gaps to Validate:**
- Actual competitor app implementations (need hands-on testing or verified reviews)
- User research on which community features drive engagement in plant apps
- Optimal moderation workflow for small plant communities
- Exact schema used by production plant/community apps (proprietary, not public)

---

*Research completed: 2026-02-27*
*Ready for roadmap: YES*
*Next step: /gsd:roadmap to create v2.0 roadmap based on this research*
