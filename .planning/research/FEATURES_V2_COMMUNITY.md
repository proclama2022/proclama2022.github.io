# Feature Research: Community Platform for Plantid

**Domain:** Plant identification app adding community/social features
**Researched:** 2026-02-27
**Mode:** Ecosystem Research
**Confidence:** HIGH for iNaturalist patterns; MEDIUM for competitor analysis (limited to public documentation)

## Executive Summary

Research into plant/nature community apps (iNaturalist, PictureThis, Planta, Blossom, and general social app patterns) reveals clear patterns for community features in plant identification apps. The domain has established table stakes: **Feed, Profiles, Follow, Comments, Likes, Auth, and Moderation** are all expected for a viable community platform.

**Key findings:**
- iNaturalist (the gold standard for nature communities) focuses on **observations, identifications, and projects** — not generic social features
- Feed is typically organized around **observations with photos**, not text posts
- User profiles highlight **contributions** (species observed, identifications made) rather than social metrics
- Moderation is critical: scientific accuracy requires expert validation and spam/abuse prevention
- **Plant-specific differentiators**: care tips wiki, plant ID help, regional plant tracking

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users assume exist in any community platform. Missing these makes the product feel incomplete or broken.

---

#### 1. User Authentication

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Email + password signup** | Baseline expectation for any account system | Low | Supabase Auth provides built-in |
| **OAuth providers** (Google, Apple) | Mobile users expect single-tap login; Apple Sign In required for iOS | Medium | Supabase supports Google, Apple, Facebook, etc. |
| **Persistent sessions** | Users should stay logged in across app launches | Low | Supabase handles token refresh automatically |
| **Password reset** | Standard requirement for email auth | Low | Supabase sends reset emails with deep links |
| **Optional auth for core features** | Plant identification shouldn't require account | Medium | Critical: keep v1.x features offline-first |

**UX Patterns from iNaturalist:**
- Sign up is optional for viewing content; required for posting
- OAuth prominently displayed; email/password secondary
- "Join the community" messaging emphasizes contribution, not just access

**Dependency on Existing Features:**
- Must NOT gate existing features (camera, identification, plant collection)
- Only new v2.0 features require auth (feed posting, profile, following)

**Supabase Implementation:**
- `supabase.auth.signUp()` for email/password
- `supabase.auth.signInWithOAuth()` for Google/Apple
- `supabase.auth.onAuthStateChange()` for session management
- Deep linking required for password reset emails

---

#### 2. User Profiles

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Display name + avatar** | Basic identity in community | Low | Avatar upload to Supabase Storage |
| **Bio/about section** | Users express identity and interests | Low | Text field 500 char max |
| **Contribution stats** | Domain-specific: plants identified, tips shared | Medium | Counter fields in profiles table |
| **Joined date** | Establishes tenure/trust in community | Low | Auto-populated on signup |
| **Link to shared plants** | View user's public plant collection | Medium | Filter plants table by user_id |
| **Edit profile** | Users must update their info | Low | Update mutation to profiles table |

**UX Patterns from iNaturalist:**
- Profile shows: "Observations" (count), "Species" (count), "Identifications" (count)
- "About" section with optional location, bio
- Avatar prominently displayed
- Tabs for: Observations, Identifications, Journal Posts

**Plant-Specific Adaptation:**
- Replace "Observations" with "Plants Identified"
- Replace "Identifications" with "Care Tips Shared" or "Helped Others"
- Add "Plants in Garden" count (from saved plants)

**Data Model:**
```typescript
interface Profile {
  id: string; // matches auth.uid()
  email: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  plants_identified_count: number; // aggregated
  tips_shared_count: number; // aggregated
  followers_count: number; // denormalized for perf
  following_count: number; // denormalized for perf
  joined_at: timestamptz;
  updated_at: timestamptz;
}
```

**Complexity Notes:**
- Avatar upload requires Supabase Storage + image compression
- Stats counters require triggers or periodic aggregation
- Public vs private profile data controlled via RLS

---

#### 3. Community Feed

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Photo-centric posts** | Plant apps are visual; feed should be image-first | Medium | Similar to iNaturalist "Observations" |
| **Infinite scroll pagination** | Standard mobile feed pattern | Low | Cursor-based pagination |
| **Like button** | Basic engagement signal | Low | Counter + user_likes join table |
| **Comment count** | Shows activity without opening detail | Low | Aggregated counter |
| **Timestamp ("2 hours ago")** | Users expect recency context | Low | Client-side time diff |
| **Post creator badge** | Identify who shared | Low | Display name + avatar |
| **Pull-to-refresh** | Standard mobile pattern | Low | Re-fetch feed on pull |
| **Empty state** | Onboard users when no posts | Low | "Be the first to share..." |

**UX Patterns from iNaturalist:**
- Feed shows: large photo, species name (if identified), observer name, like count, comment count
- Tab filters: "Recent", "Quality Grade" (Research/Needs ID), "Nearby"
- Each card is expandable to full observation detail
- Map view toggle (show posts on map)

**Plant-Specific Adaptation:**
- Posts show: plant photo, common name (from PlantNet ID), caption (optional), care tips (optional)
- Filter tabs: "Recent", "Popular" (most likes), "Following" (from followed users)
- "Identify This?" button: users can request help identifying unknown plants

**Data Model:**
```typescript
interface CommunityPost {
  id: string;
  user_id: string; // author
  photo_url: string;
  plant_name?: string; // from PlantNet identification
  scientific_name?: string;
  caption?: string;
  care_tip?: string; // user-contributed care advice
  likes_count: number; // denormalized
  comments_count: number; // denormalized
  is_public: boolean; // for moderation
  created_at: timestamptz;
  updated_at: timestamptz;
}
```

**Complexity Notes:**
- Infinite scroll requires cursor pagination (use `created_at` + `id` as cursor)
- Image upload to Supabase Storage with compression (reuse v1.x logic)
- Feed query: `SELECT * FROM community_posts WHERE is_public = true ORDER BY created_at DESC LIMIT 20`
- "Following" filter requires JOIN with follows table

---

#### 4. Comments

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Threaded comments** | Standard on all social platforms | Medium | Flat or nested (1-level) |
| **Reply to comment** | Enable conversation | Medium | Parent comment reference |
| **Comment count on post** | Shows engagement level | Low | Denormalized counter |
| **Timestamp on comments** | Recency context | Low | "X ago" format |
| **Delete own comments** | User control over content | Low | RLS policy check |
| **Comment pagination** | Posts with 100+ comments | Medium | Load 20 at a time |

**UX Patterns from iNaturalist:**
- Comments shown below observation
- "Add a comment" input at bottom
- Each comment: avatar, name, timestamp, text
- No threading (flat comments only)
- "Identifications" are separate from comments (expert IDs)

**Plant-Specific Adaptation:**
- Keep comments flat (simpler, matches iNaturalist)
- Add "Identify" button separate from comments (for ID help)
- Show "Care Tip" badge if comment includes care advice

**Data Model:**
```typescript
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string; // for replies (optional for MVP)
  content: string;
  is_identification?: boolean; // if user is helping ID the plant
  created_at: timestamptz;
  updated_at: timestamptz;
}
```

**Complexity Notes:**
- Threading adds significant complexity (recursive queries)
- For MVP: flat comments only, replies as sibling comments with @mentions
- Denormalized `comments_count` on posts requires trigger

---

#### 5. Likes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Like/unlike toggle** | Basic engagement | Low | Toggle button |
| **Like count** | Social proof | Low | Denormalized counter |
| **Show who liked** | Users expect to see likers | Medium | Optional for MVP |
| **Unlike** | Users must undo actions | Low | Delete from join table |

**UX Patterns from iNaturalist:**
- Heart icon with count
- Tap to toggle (no separate unlike action)
- "Favorited" observations appear in profile

**Plant-Specific Adaptation:**
- Same as standard social apps
- Add "Liked Plants" section to user profile

**Data Model:**
```typescript
interface Like {
  post_id: string;
  user_id: string;
  created_at: timestamptz;
  // Primary key: (post_id, user_id)
}
```

**Complexity Notes:**
- Use Supabase trigger to update `likes_count` on posts
- Check if user already liked before insert (avoid duplicates)
- Realtime updates optional for MVP (poll on view)

---

#### 6. Follow System

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Follow/unfollow users** | Build social graph | Low | Insert/delete follows table |
| **Followers count** | Social proof | Medium | Denormalized on profiles |
| **Following count** | Social proof | Medium | Denormalized on profiles |
| **"Following" feed filter** | See posts from followed users | Medium | JOIN with follows table |
| **Follower list** | Users expect to see followers | Medium | Optional for MVP |
| **Following list** | Users expect to see who they follow | Medium | Optional for MVP |

**UX Patterns from iNaturalist:**
- "Follow" button on user profiles
- "Following" count visible on profile
- Filter observations by "People you follow"

**Plant-Specific Adaptation:**
- Same as standard social apps
- Emphasize "Follow for care tips" messaging

**Data Model:**
```typescript
interface Follow {
  follower_id: string; // user who is following
  following_id: string; // user being followed
  created_at: timestamptz;
  // Primary key: (follower_id, following_id)
  // Check: follower_id != following_id (no self-follow)
}
```

**Complexity Notes:**
- Denormalized counts require triggers
- "Following" feed query:
  ```sql
  SELECT p.* FROM community_posts p
  JOIN follows f ON p.user_id = f.following_id
  WHERE f.follower_id = auth.uid()
  ORDER BY p.created_at DESC
  ```
- Index on `(follower_id, following_id)` critical for performance

---

#### 7. Content Moderation (Report System)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Report button** | Users must flag inappropriate content | Low | On posts, comments, profiles |
| **Report reasons** | Categorize issues (spam, abuse, inappropriate) | Low | Dropdown with options |
| **Report queue for admins** | Review flagged content | Medium | Supabase Dashboard or Edge Function |
| **Hide reported content** | Pending review content shouldn't be visible | Medium | Soft delete or `is_hidden` flag |
| **Ban users** | Repeat offenders must be removed | Medium | Set `is_banned` on profiles |
| **Community guidelines** | Users must know rules | Low | Static screen linked in report flow |

**UX Patterns from iNaturalist:**
- "Flag" dropdown on observations
- Community guidelines accessible from menu
- Curators review flags; violations hidden or removed
- Spam filters block common patterns

**Plant-Specific Concerns:**
- Inaccurate plant IDs (misinformation)
- Inappropriate photos (NSFW)
- Spam (ads, bot accounts)
- Harassment in comments

**Data Model:**
```typescript
interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'comment' | 'user';
  target_id: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'misinformation' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'actioned' | 'dismissed';
  created_at: timestamptz;
  reviewed_at?: timestamptz;
  reviewed_by?: string; // admin user_id
}
```

**Complexity Notes:**
- For MVP: manual review via Supabase Dashboard
- Admin can query: `SELECT * FROM reports WHERE status = 'pending'`
- Auto-hide: set `is_public = false` on post when report created
- Email notifications for new reports (Supabase Edge Function)

**Rate Limiting:**
- Max 5 reports/hour per user to prevent abuse
- Database trigger to enforce limit

---

### Differentiators (Competitive Advantage)

Features that set Plantid apart from generic social apps and competitor plant apps.

---

#### 1. Plant Identification Help Feed

**Value Proposition:** Users post unidentified plant photos, community helps identify species. Combines AI (PlantNet) with human expertise.

| Complexity | Notes |
|------------|-------|
| High | Requires coordination between PlantNet ID and community suggestions |

**Why Differentiator:**
- PictureThis, Planta are AI-only (no community help)
- iNaturalist has this, but focused on wildlife/science
- Plantid targets casual gardeners (not scientists)

**Implementation:**
- "Identify This?" post type: photo without species name
- Comments with identifications tagged as "ID suggestions"
- Original poster can "accept" an ID (updates post with species)
- Badges for top identifiers (gamification)

**Data Model:**
```typescript
interface CommunityPost {
  // ...existing fields...
  post_type: 'standard' | 'identify_help';
  accepted_identification_id?: string; // comment ID
}

interface Comment {
  // ...existing fields...
  is_identification: boolean; // true if suggesting species
  species_name?: string;
  confidence?: number; // optional confidence score
}
```

---

#### 2. Plant Care Tips Wiki (Community-Contributed)

**Value Proposition:** Crowdsource care advice for 500+ species. Users share real-world experience beyond static database.

| Complexity | Notes |
|------------|-------|
| High | Requires validation, versioning, or reputation system |

**Why Differentiator:**
- PictureThis, Planta have static care databases (no user contributions)
- iNaturalist focuses on identification, not care
- Plantid becomes "Wikipedia for plant care"

**Implementation:**
- Each post can have "Care Tip" section (watering, light, soil advice)
- Tips aggregated by species: view all tips for "Monstera deliciosa"
- Upvote tips (surface best advice)
- "Verified Expert" badges for users with high-quality tips

**Data Model:**
```typescript
interface CareTip {
  id: string;
  user_id: string;
  species_name: string; // e.g., "Monstera deliciosa"
  tip_type: 'watering' | 'light' | 'soil' | 'fertilizer' | 'pests' | 'general';
  content: string;
  upvotes_count: number;
  created_at: timestamptz;
}
```

**MVP Scope:**
- Phase 1: Care tips embedded in posts (not separate wiki)
- Phase 2: Dedicated tips screen with species filter
- Phase 3: Expert verification system

---

#### 3. Regional Plant Tracking

**Value Proposition:** See what plants are thriving in your geographic area. Hyperlocal gardening advice.

| Complexity | Notes |
|------------|-------|
| Medium | Requires location data + proximity queries |

**Why Differentiator:**
- No plant app offers this (iNaturalist has it for wildlife)
- Highly valuable for gardeners ("What grows well in my area?")
- Leverages existing user base for network effects

**Implementation:**
- Optional location sharing (user ZIP code or GPS)
- "Nearby" feed filter: posts from users within 50km
- Aggregated species map: see common plants in your region
- Climate zone suggestions (USDA zones, etc.)

**Data Model:**
```typescript
interface Profile {
  // ...existing fields...
  location_lat?: number;
  location_lng?: number;
  location_city?: string;
  location_shared: boolean; // user opt-in
}

interface CommunityPost {
  // ...existing fields...
  location_lat?: number;
  location_lng?: number;
}
```

**Privacy Concerns:**
- Location must be optional
- Approximate location (city-level) preferred over exact GPS
- RLS policy: location only visible if `location_shared = true`

---

#### 4. Plant Care Milestones (Gamification)

**Value Proposition:** Celebrate plant success: "1 year since I got this Monstera!", "First bloom!"

| Complexity | Notes |
|------------|-------|
| Medium | Extends existing reminder system |

**Why Differentiator:**
- Emotional connection to plants (not just utility)
- Shareable moments increase engagement
- PictureThis/Planta lack this social aspect

**Implementation:**
- Auto-generated milestones based on plant addition date
- "Share to community" button on milestones
- Milestone posts auto-tagged with plant species

**Data Model:**
```typescript
interface Milestone {
  id: string;
  user_id: string;
  plant_id: string; // local plant reference
  milestone_type: 'anniversary' | 'first_bloom' | 'repotted' | 'reached_size';
  occurred_at: timestamptz;
  shared_to_feed: boolean;
}
```

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Explicitly avoid these.

---

#### 1. Real-Time Notifications for All Activity

| Why Requested | Why Problematic | Alternative |
|---------------|-----------------|-------------|
| Users want to know when someone likes/comments | 75% of users delete apps with too many notifications | Batch notifications: "5 people liked your post" (1 notification) |
|  | Spammy behavior (rapid fire notifications) | Daily digest email: "Top activity on your posts today" |
|  | Battery drain from frequent push notifications | In-app notification center (check when convenient) |

**For v2.0 MVP:**
- No push notifications for community features
- In-app notification badge only
- User manually checks "Notifications" screen

---

#### 2. Direct Messaging Between Users

| Why Requested | Why Problematic | Alternative |
|---------------|-----------------|-------------|
| Users want to ask gardening questions privately | Requires massive moderation (harassment, spam) | Public comments only (visible to moderators) |
|  | Privacy concerns (unwanted messages) | "Mention" users in comments (@username) |
|  | Technical complexity (message queues, read receipts) | Email support for issues (not user-to-user) |

**For v2.0 MVP:**
- No DMs
- Public comments only
- @mention users in posts/comments (they get notification in-app)

---

#### 3. Video Posts

| Why Requested | Why Problematic | Alternative |
|---------------|-----------------|-------------|
| Users want to show plant growth timelapses | Storage costs: 100MB video vs 500KB photo | Multi-photo gallery (v1.x feature) |
|  | Upload time on mobile networks | GIF support (auto-generated from photos) |
|  | Moderation difficulty (NSFW in video) | External video links (YouTube, Vimeo) in captions |

**For v2.0 MVP:**
- Photos only (reuse existing compression logic)
- External video links allowed in captions (text only)

---

#### 4. Public Follower/Following Lists

| Why Requested | Why Problematic | Alternative |
|---------------|-----------------|-------------|
| Users want to see who follows whom | Privacy concerns (stalking, harassment) | Show counts only, not lists |
|  | Data scraping (export social graph) | Private follower/following lists (owner only) |
|  | No real value for plant community | Focus on content, not social graph |

**For v2.0 MVP:**
- Show follower/following counts on profiles
- Lists visible only to profile owner
- No "discover users via follower lists"

---

#### 5. Trending/Explore Algorithm

| Why Requested | Why Problematic | Alternative |
|---------------|-----------------|-------------|
| Discover popular content | Requires ML/recsys infrastructure | "Recent" + "Popular" (most likes) tabs |
|  | Gaming the system (like farms) | Editorial "Featured Plants" weekly |
|  | Cold start problem (no data initially) | Simple chronological feed for MVP |

**For v2.0 MVP:**
- "Recent" tab (chronological)
- "Popular" tab (most likes in last 7 days)
- No ML-based ranking
- No "For You" algorithmic feed

---

#### 6. Public User Search

| Why Requested | Why Problematic | Alternative |
|---------------|-----------------|-------------|
| Find specific users | Privacy/safety concerns | Search by display name only (no email) |
|  | Harassment (target specific users) | Block user feature (both sides) |
|  | Not core to plant community | Discover via content, not user search |

**For v2.0 MVP:**
- No global user search
- Find users by tapping their names on posts/comments
- Search plants/species (not users)

---

#### 7. Anonymous Posting

| Why Requested | Why Problematic | Alternative |
|---------------|-----------------|-------------|
| Users want privacy without creating account | Impossible with moderation (accountability) | Optional auth (read without account) |
|  | Spam (anonymous bots) | Pseudonymous accounts (not real name required) |
|  | No reputation/trust system | Display name only (no real name public) |

**For v2.0 MVP:**
- Account required for posting
- Display name only (email never shown)
- Read feed without account (auth optional)

---

## Feature Dependencies

```
Auth Infrastructure (Phase 1)
├── User Profiles (Phase 2)
│   ├── Avatar Upload → Supabase Storage
│   └── Profile Stats → Aggregation queries
├── Community Feed (Phase 3)
│   ├── Post Creation → Upload + Insert
│   ├── Like System → Toggle + Counter
│   ├── Comments → Threading (optional)
│   └── Moderation → Report system
└── Follow System (Phase 3)
    ├── Follow/Unfollow → Insert/Delete
    └── Following Feed → JOIN query

Plant ID Help Feed (Phase 4)
├── Depends on: Community Feed
├── Adds: post_type field
└── Adds: identification acceptance flow

Care Tips Wiki (Phase 5)
├── Depends on: User Profiles + Posts
├── Adds: CareTip model
└── Adds: Species aggregation

Regional Tracking (Phase 6)
├── Depends on: User Profiles (location opt-in)
├── Depends on: Community Feed (post location)
└── Adds: Proximity queries (PostGIS)
```

**Dependency Notes:**

- **Auth is foundational:** All community features require authenticated users
- **Profiles enable identity:** Feed, comments, likes all reference user profiles
- **Feed is core interaction:** Comments, likes, moderation all attach to posts
- **Follow system is independent:** Can ship after core feed is stable
- **Advanced features (ID help, care tips, regional) build on base feed**

---

## MVP Definition for v2.0

### Launch With (Essential for Community)

**Phase 1: Auth Infrastructure**
- [ ] Email + password signup/signin
- [ ] Google OAuth
- [ ] Apple OAuth (iOS requirement)
- [ ] Persistent sessions (token refresh)
- [ ] Password reset via email
- [ ] **Critical:** Auth is optional for v1.x features

**Phase 2: User Profiles**
- [ ] Display name + avatar upload
- [ ] Bio/about section
- [ ] Contribution stats (plants identified, tips shared)
- [ ] Edit profile screen
- [ ] Profile viewable by other users
- [ ] Migration flow (v1.x users → Supabase)

**Phase 3: Community Feed + Engagement**
- [ ] Photo feed with infinite scroll
- [ ] Create post (photo + caption + optional plant name)
- [ ] Like/unlike posts
- [ ] Comments (flat, no threading for MVP)
- [ ] Report system (flag posts/comments)
- [ ] Moderation queue (manual review via Dashboard)
- [ ] Pull-to-refresh
- [ ] Empty state onboarding

**Phase 4: Follow System**
- [ ] Follow/unfollow users
- [ ] "Following" feed filter
- [ ] Follower/following counts on profiles
- [ ] @mention users in comments (optional for MVP)

### Add After Validation (v2.1+)

**Post-Launch Features**
- [ ] Push notifications for engagement (batched, not real-time)
- [ ] In-app notification center
- [ ] Plant ID Help Feed (identify this? posts)
- [ ] Identification acceptance flow
- [ ] Care tips extraction (tips from posts aggregated by species)
- [ ] Expert badges for top contributors
- [ ] Regional plant tracking (optional location sharing)
- [ ] "Nearby" feed filter

### Future Consideration (v3+)

**Advanced Features**
- [ ] Care Tips Wiki (dedicated wiki, not just embedded in posts)
- [ ] Plant milestones gamification
- [ ] Threading comments
- [ ] Video posts (or GIF generation)
- [ ] Algorithmic "For You" feed
- [ ] Public user search
- [ ] Direct messaging (if moderation scales)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Email + Password Auth | HIGH | LOW | P1 |
| Google OAuth | HIGH | MEDIUM | P1 |
| Apple OAuth (iOS) | HIGH | MEDIUM | P1 |
| User Profiles (basic) | HIGH | LOW | P1 |
| Community Feed (view) | HIGH | MEDIUM | P1 |
| Create Post | HIGH | MEDIUM | P1 |
| Like System | HIGH | LOW | P1 |
| Comments (flat) | HIGH | LOW | P1 |
| Report System | HIGH | MEDIUM | P1 |
| Follow/Unfollow | MEDIUM | LOW | P2 |
| Following Feed Filter | MEDIUM | MEDIUM | P2 |
| @mention Users | MEDIUM | MEDIUM | P2 |
| Plant ID Help Feed | HIGH | HIGH | P2 |
| Push Notifications | MEDIUM | HIGH | P3 |
| In-App Notification Center | MEDIUM | MEDIUM | P3 |
| Care Tips Wiki | HIGH | HIGH | P2 |
| Regional Tracking | MEDIUM | HIGH | P3 |
| Video Posts | LOW | VERY HIGH | P3 |
| Direct Messaging | LOW | VERY HIGH | P3 |

**Priority Key:**
- **P1**: Must have for v2.0 launch (core community features)
- **P2**: Should have, add when possible (engagement drivers)
- **P3**: Nice to have, future consideration (defer until post-launch validation)

---

## Competitor Feature Analysis

| Feature | iNaturalist | PictureThis | Planta | Blossom | Plantid (v2.0) |
|---------|-------------|-------------|--------|---------|----------------|
| **Community Feed** | ✅ Observations feed | ❌ No community | ❌ No community | ✅ "Community" tab | ✅ Photo feed |
| **User Profiles** | ✅ (stats-focused) | ❌ No accounts | ✅ (personal only) | ✅ Basic | ✅ With stats |
| **Follow System** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Comments** | ✅ Flat | ❌ | ❌ | ✅ | ✅ Flat (MVP) |
| **Likes/Favorites** | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Plant ID Help** | ✅ (core feature) | ❌ (AI-only) | ❌ (AI-only) | ❌ | ✅ (differentiator) |
| **Care Tips (UGC)** | ❌ | ❌ (static DB) | ❌ (static DB) | ❌ | ✅ (differentiator) |
| **Regional Tracking** | ✅ (map view) | ❌ | ❌ | ❌ | ✅ (differentiator) |
| **Auth Required** | ❌ (optional) | ❌ (no accounts) | ✅ (for sync) | ✅ | ❌ (optional for core) |
| **Moderation** | ✅ (curators) | N/A | N/A | ✅ (implied) | ✅ (report system) |

**Key Takeaways:**
- **iNaturalist** is closest model: scientific observations, ID help, strong moderation
- **PictureThis/Planta** have no community (pure identification/care apps)
- **Blossom** has basic community but no unique differentiators
- **Plantid's opportunity**: Combine iNaturalist's community with PictureThis's ease of use, add care tips focus

---

## MVP Recommendation for v2.0

**Phase Order (recommended):**

1. **Phase 1: Auth Infrastructure** (2-3 weeks)
   - Supabase setup + RLS policies
   - Email/password + OAuth (Google + Apple)
   - Session management
   - **Critical:** Ensure v1.x features work without auth

2. **Phase 2: User Profiles** (2 weeks)
   - Profile creation + avatar upload
   - Stats aggregation (plants, tips)
   - Profile view/edit screens
   - Migration flow for v1.x users

3. **Phase 3: Community Feed Core** (3-4 weeks)
   - Feed screen (view posts, infinite scroll)
   - Create post (photo + caption + PlantNet ID)
   - Like system
   - Comments (flat only)
   - Report system + moderation queue

4. **Phase 4: Follow System** (1-2 weeks)
   - Follow/unfollow UI
   - "Following" feed filter
   - @mention support (optional)

**Defer to v2.1:**
- Plant ID Help Feed (requires ID acceptance flow)
- Care Tips Wiki (requires aggregation UI)
- Regional Tracking (requires PostGIS + location opt-in)
- Push notifications (requires Edge Functions)

**Defer to v3:**
- Video posts
- Direct messaging
- Algorithmic feeds

---

## Complexity Assessment

| Feature Category | Technical Complexity | Data Model Changes | RLS Policies Required | Migration Needed |
|------------------|---------------------|-------------------|----------------------|------------------|
| Auth Infrastructure | Medium | New tables: `profiles` | 4 policies/profile | Yes (v1.x users) |
| User Profiles | Low | `profiles` table | 4 policies | Yes (v1.x → Supabase) |
| Community Feed | Medium | `community_posts` table | 4 policies + public reads | No |
| Like System | Low | `likes` join table | 4 policies | No |
| Comments | Low | `comments` table | 4 policies + public reads | No |
| Report System | Medium | `reports` table | 4 policies + admin access | No |
| Follow System | Medium | `follows` table | 4 policies | No |
| Plant ID Help | High | Add `post_type` to posts | Update feed policies | No |
| Care Tips Wiki | High | `care_tips` table | 4 policies + public reads | No |
| Regional Tracking | Medium | Add location columns | Update privacy policies | No |

**Migration Risk:** Only v1.x user migration carries risk. All other features are new and don't affect existing data.

---

## Open Questions Requiring Phase-Specific Research

1. **Supabase Free Tier Limits**: Can community features operate within free tier (500MB DB, 1GB bandwidth, 50k MAU)? Research: Phase 1 before committing to Supabase.

2. **Moderation Workload**: With 1K users posting 10 posts/day, what's the daily report volume? Can one admin handle, or need volunteer moderators? Research: Phase 3 before launch.

3. **Plant ID Help UX**: How does iNaturalist handle ID suggestions? What's the acceptance rate? Should we gamify (badges for top identifiers)? Research: Phase 4 before implementing.

4. **Care Tips Quality Control**: How to prevent bad care advice from spreading? Reputation system? Expert verification? Research: Phase 5 before building wiki.

5. **Regional Privacy**: What's the right granularity for location sharing? ZIP code? GPS within 1km? City only? Research: Phase 6 before regional features.

---

## Sources

### High Confidence (Official Documentation)

- **iNaturalist Website**: Official site documentation on features, community structure, and user flows (HIGH confidence — direct observation of platform)
- **iNaturalist Help Pages**: Community guidelines, curation system, feature descriptions (HIGH confidence — official documentation)
- **Supabase Auth Documentation**: Official docs on authentication patterns, OAuth, session management (HIGH confidence — authoritative source)
- **Supabase Database Documentation**: RLS policies, table design, triggers (HIGH confidence — authoritative source)

### Medium Confidence (Public Sources)

- **Competitor App Store Descriptions**: PictureThis, Planta, Blossom features (MEDIUM confidence — marketing claims, not verified by hands-on testing)
- **General Social App Patterns**: Standard patterns for feeds, likes, comments (MEDIUM confidence — widely known but not specific to plant domain)

### Low Confidence (Unverified)

- **Specific Competitor Implementations**: Internal architecture not public (LOW confidence — no access to app internals)
- **User Engagement Metrics**: Plant community engagement rates not available (LOW confidence — no public analytics)

### Gaps to Validate

- Actual iNaturalist ID help acceptance rates (need forum research or analytics)
- PictureThis/Planta user demand for community features (need user surveys)
- Optimal location granularity for regional features (need user testing)
- Moderation workload for small plant communities (need real-world data)

---

*Last updated: 2026-02-27*
*Researcher: GSD Project Research Agent*
*Mode: Ecosystem Research — Community Features for Plant Identification App*
