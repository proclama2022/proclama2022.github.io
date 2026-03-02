# Requirements: Plantid v2.0 Community

**Defined:** 2026-02-27
**Core Value:** Free, subscription-free plant identification with species-specific care guidance

## v2.0 Requirements

Requirements for Community milestone. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can sign in with Google OAuth (single tap)
- [x] **AUTH-03**: User can sign in with Apple (required for iOS App Store)
- [x] **AUTH-04**: User can reset password via email link
- [x] **AUTH-05**: User session persists across app launches
- [x] **AUTH-06**: User can sign out from Settings
- [x] **AUTH-07**: v1.x features (camera, plant ID, local collection) work WITHOUT auth — offline-first preserved

### User Profiles

- [x] **PROF-01**: User can create profile with display name (required, max 50 chars)
- [x] **PROF-02**: User can upload avatar image (optional, max 2MB, auto-compressed)
- [x] **PROF-03**: User can write bio (optional, max 500 chars)
- [x] **PROF-04**: User can view own profile with stats (plants identified, tips shared, followers, following)
- [x] **PROF-05**: User can view other users' public profiles
- [x] **PROF-06**: User can edit display name, avatar, and bio
- [x] **PROF-07**: Profile shows joined date
- [ ] **PROF-08**: Existing v1.x users can migrate local plants to community account (optional, with progress indicator)

### Community Feed

- [ ] **FEED-01**: User can view community feed with photo posts (no auth required to view)
- [ ] **FEED-02**: Feed supports infinite scroll pagination (20 posts per page)
- [ ] **FEED-03**: Each post shows: photo, plant name (if identified), caption, author, timestamp, like count, comment count
- [ ] **FEED-04**: User can pull-to-refresh feed
- [ ] **FEED-05**: Feed has filter tabs: Recent, Popular, Following
- [ ] **FEED-06**: User can create post with photo + optional caption (auth required)
- [ ] **FEED-07**: Post creation integrates PlantNet identification (auto-suggest species name)
- [ ] **FEED-08**: User can delete own posts
- [ ] **FEED-09**: Feed shows empty state when no posts exist ("Be the first to share...")
- [ ] **FEED-10**: Community tab added to bottom navigation

### Comments

- [ ] **COMM-01**: User can view comments on any post (no auth required)
- [ ] **COMM-02**: User can add comment to post (auth required, max 1000 chars)
- [ ] **COMM-03**: User can delete own comments
- [ ] **COMM-04**: Comments show: author avatar, display name, content, timestamp
- [ ] **COMM-05**: Comments paginate after 20 (load more button)
- [ ] **COMM-06**: Comment count updates in real-time on post card

### Likes

- [ ] **LIKE-01**: User can like any post (auth required)
- [ ] **LIKE-02**: User can unlike a post (toggle behavior)
- [ ] **LIKE-03**: Like count displayed on post card
- [ ] **LIKE-04**: User can view list of users who liked a post (optional for MVP)
- [ ] **LIKE-05**: Liked posts appear in user's profile ("Liked Plants" section)

### Follow System

- [ ] **FOLL-01**: User can follow another user (auth required)
- [ ] **FOLL-02**: User can unfollow a user (toggle behavior)
- [ ] **FOLL-03**: Follower and following counts displayed on profile
- [ ] **FOLL-04**: "Following" feed filter shows posts from followed users only
- [ ] **FOLL-05**: Follow/Unfollow button on user profiles

### Moderation

- [ ] **MODR-01**: User can report a post (reasons: spam, inappropriate, harassment, misinformation, other)
- [ ] **MODR-02**: User can report a comment (same reasons)
- [ ] **MODR-03**: User can report a user profile (same reasons)
- [ ] **MODR-04**: Reported content is auto-hidden pending review (is_public = false)
- [ ] **MODR-05**: Admin can view report queue (via Supabase Dashboard for MVP)
- [ ] **MODR-06**: Admin can dismiss report (restore content)
- [ ] **MODR-07**: Admin can action report (delete content permanently)
- [ ] **MODR-08**: Admin can ban users (is_banned = true on profile)
- [ ] **MODR-09**: Banned users cannot create posts or comments
- [ ] **MODR-10**: Community Guidelines screen accessible from report flow
- [ ] **MODR-11**: Rate limit: max 5 reports per hour per user

## v2.1+ Requirements

Deferred to future release. Tracked but not in current roadmap.

### Plant ID Help Feed

- **IDHF-01**: User can post unidentified plant for community help
- **IDHF-02**: Comments can be tagged as "ID suggestion"
- **IDHF-03**: Original poster can accept an ID suggestion
- **IDHF-04**: Accepted ID updates post with species name

### Care Tips Wiki

- **WIKI-01**: User can contribute care tip for a species
- **WIKI-02**: Care tips aggregated on plant detail screen
- **WIKI-03**: Users can upvote helpful tips
- **WIKI-04**: Top tips shown first

### Push Notifications

- **NOTF-01**: User receives push notification for new followers
- **NOTF-02**: User receives push notification for likes on own posts
- **NOTF-03**: User receives push notification for comments on own posts
- **NOTF-04**: User can configure notification preferences

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Direct messaging | Moderation nightmare, not core to community value |
| Video posts | Storage/bandwidth costs, moderation difficulty |
| Anonymous posting | Impossible to moderate effectively |
| Real-time notifications for all activity | Spammy, battery drain |
| Algorithmic feed | Chronological is simpler and more transparent |
| Threading in comments | Flat comments sufficient for MVP |
| Post editing | Add complexity; delete + repost acceptable for MVP |
| @mentions | Not essential for plant-focused community |
| Location-based features | Privacy complexity, defer to v2.1+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 11 | Complete |
| AUTH-02 | Phase 11 | Complete |
| AUTH-03 | Phase 11 | Complete |
| AUTH-04 | Phase 11 | Complete |
| AUTH-05 | Phase 11 | Complete |
| AUTH-06 | Phase 11 | Complete |
| AUTH-07 | Phase 11 | Complete |
| PROF-01 | Phase 12 | Complete |
| PROF-02 | Phase 12 | Complete |
| PROF-03 | Phase 12 | Complete |
| PROF-04 | Phase 12 | Complete |
| PROF-05 | Phase 12 | Complete |
| PROF-06 | Phase 12 | Complete |
| PROF-07 | Phase 12 | Complete |
| PROF-08 | Phase 12 | Pending |
| FEED-01 | Phase 13 | Pending |
| FEED-02 | Phase 13 | Pending |
| FEED-03 | Phase 13 | Pending |
| FEED-04 | Phase 13 | Pending |
| FEED-05 | Phase 13 | Pending |
| FEED-06 | Phase 13 | Pending |
| FEED-07 | Phase 13 | Pending |
| FEED-08 | Phase 13 | Pending |
| FEED-09 | Phase 13 | Pending |
| FEED-10 | Phase 13 | Pending |
| COMM-01 | Phase 13 | Pending |
| COMM-02 | Phase 13 | Pending |
| COMM-03 | Phase 13 | Pending |
| COMM-04 | Phase 13 | Pending |
| COMM-05 | Phase 13 | Pending |
| COMM-06 | Phase 13 | Pending |
| LIKE-01 | Phase 13 | Pending |
| LIKE-02 | Phase 13 | Pending |
| LIKE-03 | Phase 13 | Pending |
| LIKE-04 | Phase 14 | Pending |
| LIKE-05 | Phase 14 | Pending |
| FOLL-01 | Phase 14 | Pending |
| FOLL-02 | Phase 14 | Pending |
| FOLL-03 | Phase 14 | Pending |
| FOLL-04 | Phase 14 | Pending |
| FOLL-05 | Phase 14 | Pending |
| MODR-01 | Phase 13 | Pending |
| MODR-02 | Phase 13 | Pending |
| MODR-03 | Phase 13 | Pending |
| MODR-04 | Phase 13 | Pending |
| MODR-05 | Phase 13 | Pending |
| MODR-06 | Phase 13 | Pending |
| MODR-07 | Phase 13 | Pending |
| MODR-08 | Phase 13 | Pending |
| MODR-09 | Phase 13 | Pending |
| MODR-10 | Phase 13 | Pending |
| MODR-11 | Phase 13 | Pending |

**Coverage:**
- v2.0 requirements: 50 total
- Mapped to phases: 50
- Unmapped: 0

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after milestone scoping*
