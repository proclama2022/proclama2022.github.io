# Phase 14: Follow System & Engagement Polish - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Community Feed with post display, filtering (Recent/Popular/Following), and engagement polish. The Follow System (follow/unfollow) was already implemented in Phase 12 - this phase adds the feed UI and Following filter to show posts from followed users.

Scope includes:
- Community Feed tab in bottom navigation
- Post cards with photo, plant info, caption, engagement counts
- Filter tabs: Recent, Popular, Following
- Infinite scroll with pull-to-refresh
- Empty states for no posts and no followed users
- Polish for engagement interactions (like animation, comment preview)

Out of scope:
- Post creation (separate feature)
- Comment detail view (separate feature)
- User search/discovery
- Notifications for likes/comments

</domain>

<decisions>
## Implementation Decisions

### Feed Layout
- **Card-based layout** — Vertical cards with photo on top, info below (Instagram/BeReal style)
- Reuse existing Card component patterns from app
- Full-width cards for maximum photo visibility

### Card Content
- **Full info per card:**
  - Author avatar (circular, 40px)
  - Author display name
  - Timestamp (relative: "2h ago", "Yesterday")
  - Plant photo (full-width, aspect ratio 4:3)
  - Plant name (if identified)
  - Caption text (max 2 lines with ellipsis)
  - Like count + heart icon
  - Comment count + bubble icon
- Tap card → navigate to post detail (future phase)

### Filter UX
- **Horizontal tabs** above feed: [Recent] [Popular] [Following]
- Tabs styled as pill buttons, active tab highlighted
- **Default filter:** Recent (shows all posts, newest first)
- Following filter shows only posts from followed users
- Popular sorted by like count (last 7 days)

### Loading Behavior
- **Infinite scroll** — Pull-down to refresh, auto-load on scroll to bottom
- 20 posts per page
- Loading spinner at bottom during fetch
- Skeleton cards while initial load (3-5 placeholders)
- useInfiniteQuery pattern from @tanstack/react-query

### Empty States
- **No posts at all:** Illustration + "Be the first to share a plant!" + Camera FAB
- **Following filter empty:** "You're not following anyone yet" + "Discover plant lovers" CTA
- **No posts in timeframe:** "No posts yet, check back soon"

### Claude's Discretion
- Exact card spacing and padding
- Animation for like button (heart pop)
- Skeleton card design
- Error state for failed loads
- Optimistic updates for like/unlike

</decisions>

<specifics>
## Specific Ideas

- "Feed should feel like Instagram's home feed — clean cards, easy to scroll"
- Like button should have a satisfying pop animation when tapped
- Following filter should feel personal — like seeing posts from friends

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/PlantCard.tsx` — Card pattern with image, title, subtitle
- `stores/profileStore.ts` — Profile state management pattern
- `services/followService.ts` — Follow/unfollow logic already built
- `lib/supabase/profiles.ts` — Supabase queries for profiles and follows
- `components/Avatar.tsx` — Circular avatar component ready to use

### Established Patterns
- **State management:** Zustand stores (see plantsStore, profileStore)
- **Navigation:** Expo Router file-based tabs in `app/(tabs)/`
- **Data fetching:** Direct Supabase queries, can add react-query for infinite scroll
- **Styling:** Themed components from `components/Themed.tsx`, Colors constants

### Integration Points
- **Navigation:** Add new `(community)` tab to `app/(tabs)/_layout.tsx`
- **Database:** Query posts from Supabase `posts` table (needs schema)
- **Follow filter:** Join posts with follows table to filter by followed user IDs
- **Auth:** Use `useAuthStore().user.id` for current user context

### Database Schema Needed
```sql
posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  photo_url TEXT NOT NULL,
  plant_name TEXT,
  caption TEXT,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
)

post_likes (
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
)
```

</code_context>

<deferred>
## Deferred Ideas

- Post creation flow — separate phase (requires camera integration, PlantNet suggestion)
- Comment detail view — separate phase (threaded comments, reply functionality)
- User search/discovery — future feature for finding users to follow
- Like list (who liked this post) — engagement detail phase
- Bookmark/save posts — future feature
- Share posts externally — future feature

</deferred>

---

*Phase: 14-follow-system-engagement-polish*
*Context gathered: 2026-03-04*
