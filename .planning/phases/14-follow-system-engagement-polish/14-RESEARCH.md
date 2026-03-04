# Phase 14: Follow System & Engagement Polish - Research

**Researched:** 2026-03-04
**Domain:** React Native Community Feed, Supabase Queries, Social UI Patterns
**Confidence:** MEDIUM (existing codebase patterns + established React Native/Supabase docs, but Phase 13 dependencies need verification)

## Summary

Phase 14 completes the social engagement layer by building on the follow system (already implemented in Phase 12) and the community feed infrastructure (Phase 13). This phase focuses on three remaining requirements:

1. **FOLL-04**: "Following" feed filter that shows posts only from followed users
2. **LIKE-04**: User can view list of users who liked a post
3. **LIKE-05**: Liked posts appear in user's profile ("Liked Plants" section)

The follow/unfollow functionality (FOLL-01/02/03/05) was already delivered in Phase 12 via `services/followService.ts`, `lib/supabase/profiles.ts`, `components/FollowButton.tsx`, and the public profile screen `app/profile/[userId].tsx`.

**Critical Dependency:** FOLL-04, LIKE-04, and LIKE-05 require the `posts` and `post_likes` tables from Phase 13. Verify these tables exist before implementing this phase.

**Primary recommendation:** Use existing Zustand store pattern with Supabase cursor-based pagination for the Following filter, Modal-based bottom sheet for the likes list, and a new "Liked" tab in the profile screen for liked posts.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Implementation Decisions

#### Feed Layout
- **Card-based layout** — Vertical cards with photo on top, info below (Instagram/BeReal style)
- Reuse existing Card component patterns from app
- Full-width cards for maximum photo visibility

#### Card Content
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

#### Filter UX
- **Horizontal tabs** above feed: [Recent] [Popular] [Following]
- Tabs styled as pill buttons, active tab highlighted
- **Default filter:** Recent (shows all posts, newest first)
- Following filter shows only posts from followed users
- Popular sorted by like count (last 7 days)

#### Loading Behavior
- **Infinite scroll** — Pull-down to refresh, auto-load on scroll to bottom
- 20 posts per page
- Loading spinner at bottom during fetch
- Skeleton cards while initial load (3-5 placeholders)
- useInfiniteQuery pattern from @tanstack/react-query

#### Empty States
- **No posts at all:** Illustration + "Be the first to share a plant!" + Camera FAB
- **Following filter empty:** "You're not following anyone yet" + "Discover plant lovers" CTA
- **No posts in timeframe:** "No posts yet, check back soon"

### Claude's Discretion
- Exact card spacing and padding
- Animation for like button (heart pop)
- Skeleton card design
- Error state for failed loads
- Optimistic updates for like/unlike

### Deferred Ideas (OUT OF SCOPE)
- Post creation flow — separate phase (requires camera integration, PlantNet suggestion)
- Comment detail view — separate phase (threaded comments, reply functionality)
- User search/discovery — future feature for finding users to follow
- Like list (who liked this post) — engagement detail phase
- Bookmark/save posts — future feature
- Share posts externally — future feature

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIKE-04 | User can view list of users who liked a post | Modal/BottomSheet pattern with Supabase join query on post_likes + profiles |
| LIKE-05 | Liked posts appear in user's profile ("Liked Plants" section) | New tab in profile, query posts via post_likes join |
| FOLL-01 | User can follow another user (auth required) | **ALREADY IMPLEMENTED** - `services/followService.ts`, `components/FollowButton.tsx` |
| FOLL-02 | User can unfollow a user (toggle behavior) | **ALREADY IMPLEMENTED** - same as FOLL-01 |
| FOLL-03 | Follower and following counts displayed on profile | **ALREADY IMPLEMENTED** - `components/ProfileStats.tsx` |
| FOLL-04 | "Following" feed filter shows posts from followed users only | Supabase query joining posts with follows table |
| FOLL-05 | Follow/Unfollow button on user profiles | **ALREADY IMPLEMENTED** - `components/FollowButton.tsx` |

**Note:** FOLL-01, FOLL-02, FOLL-03, FOLL-05 were completed in Phase 12. This phase only needs FOLL-04, LIKE-04, and LIKE-05.

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | ^5.0.11 | State management | Existing pattern: plantsStore, profileStore, authStore |
| @supabase/supabase-js | ^2.98.0 | Backend queries | Existing client in lib/supabase/client.ts |
| expo-router | ~6.0.23 | Navigation | File-based routing already in use |
| i18next | ^25.8.11 | Translations | Existing pattern in i18n/resources/ |

### Supporting (May Need Addition)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.x | Infinite scroll caching | Optional - can use native FlatList pattern instead |
| react-native-safe-area-context | ~5.6.0 | Modal safe areas | For bottom sheet likes list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-query | Native state + useEffect | react-query adds caching, but project doesn't use it yet - keep simple with Zustand |
| @gorhom/bottom-sheet | React Native Modal | @gorhom is more polished but adds dependency weight - use Modal for MVP |

**Installation:**
```bash
# No new packages required - use existing Zustand + Supabase pattern
# If adding react-query for caching:
npm install @tanstack/react-query
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── (tabs)/
│   ├── community.tsx       # NEW: Community feed tab
│   └── profile.tsx         # MODIFY: Add "Liked" tab
├── post/
│   └── [id].tsx            # Post detail (Phase 13)
└── likes/
    └── [postId].tsx        # NEW: Likes list screen (or modal)
components/
├── community/
│   ├── PostCard.tsx        # NEW: Feed post card
│   ├── FeedFilterTabs.tsx  # NEW: Recent/Popular/Following tabs
│   ├── LikesList.tsx       # NEW: Bottom sheet or modal
│   └── LikedPostsTab.tsx   # NEW: Profile section for liked posts
services/
├── postService.ts          # NEW: Post queries (if not from Phase 13)
├── likeService.ts          # NEW: Like operations
└── followService.ts        # EXISTING: Already complete
stores/
├── feedStore.ts            # NEW: Feed state + pagination
└── profileStore.ts         # EXISTING: May extend for liked posts
lib/supabase/
├── posts.ts                # NEW: Post queries (if not from Phase 13)
└── likes.ts                # NEW: Like queries
```

### Pattern 1: Following Filter Query

**What:** Supabase query that filters posts to only those from followed users

**When to use:** FOLL-04 implementation

**Example:**
```typescript
// lib/supabase/posts.ts
import { getSupabaseClient } from './client';

/**
 * Fetch posts from followed users only
 *
 * Uses INNER JOIN on follows table to filter posts
 * Returns empty array if user follows no one
 */
export const getFollowingFeed = async (
  userId: string,
  limit: number = 20,
  cursor?: string
) => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('posts')
    .select(`
      id,
      photo_url,
      plant_name,
      caption,
      like_count,
      comment_count,
      created_at,
      profiles!posts_user_id_fkey(
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .in('user_id', (
      // Subquery: get all user_ids that current user follows
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
    ))
    .order('created_at', { ascending: false })
    .limit(limit);

  // Cursor-based pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

// Alternative: Using RPC for complex join
export const getFollowingFeedRPC = async (userId: string, limit = 20) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .rpc('get_following_feed', {
      p_user_id: userId,
      p_limit: limit
    });

  if (error) throw error;
  return data;
};
```

**SQL RPC Function (add to migration):**
```sql
CREATE OR REPLACE FUNCTION get_following_feed(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT p.*
  FROM posts p
  INNER JOIN follows f ON f.following_id = p.user_id
  WHERE f.follower_id = p_user_id
    AND p.is_public = true
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Pattern 2: Likes List Query

**What:** Fetch users who liked a specific post with profile info

**When to use:** LIKE-04 implementation

**Example:**
```typescript
// lib/supabase/likes.ts
import { getSupabaseClient } from './client';

export interface LikeWithProfile {
  user_id: string;
  created_at: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * Get all users who liked a post
 *
 * Joins post_likes with profiles for display
 */
export const getPostLikes = async (
  postId: string,
  limit: number = 50,
  offset: number = 0
): Promise<LikeWithProfile[]> => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('post_likes')
    .select(`
      user_id,
      created_at,
      profiles!post_likes_user_id_fkey(
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
};
```

### Pattern 3: Liked Posts in Profile

**What:** Query posts the current user has liked

**When to use:** LIKE-05 implementation

**Example:**
```typescript
// lib/supabase/posts.ts

/**
 * Get posts that the user has liked
 *
 * Joins posts with post_likes filtered by user
 */
export const getLikedPosts = async (
  userId: string,
  limit: number = 20,
  cursor?: string
) => {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('posts')
    .select(`
      id,
      photo_url,
      plant_name,
      caption,
      like_count,
      comment_count,
      created_at,
      profiles!posts_user_id_fkey(
        id,
        display_name,
        avatar_url
      )
    `)
    .eq('is_public', true)
    .in('id', (
      supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', userId)
    ))
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};
```

### Pattern 4: Infinite Scroll with FlatList

**What:** FlatList with onEndReached for pagination

**When to use:** All feed views (Recent, Popular, Following)

**Example:**
```typescript
// components/community/FeedList.tsx
import React, { useState, useCallback } from 'react';
import { FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { PostCard } from './PostCard';

interface FeedListProps {
  fetchFunction: (limit: number, cursor?: string) => Promise<Post[]>;
}

export const FeedList: React.FC<FeedListProps> = ({ fetchFunction }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = useCallback(async (cursor?: string) => {
    try {
      if (!cursor) setIsLoading(true);
      else setIsLoadingMore(true);

      const newPosts = await fetchFunction(20, cursor);

      if (cursor) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(newPosts.length === 20);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchFunction]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  const handleEndReached = useCallback(() => {
    if (!isLoadingMore && hasMore && posts.length > 0) {
      const lastPost = posts[posts.length - 1];
      loadPosts(lastPost.created_at);
    }
  }, [isLoadingMore, hasMore, posts, loadPosts]);

  // Initial load
  React.useEffect(() => {
    loadPosts();
  }, []);

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      ListFooterComponent={
        isLoadingMore ? <ActivityIndicator size="large" /> : null
      }
    />
  );
};
```

### Pattern 5: Likes List Modal

**What:** Modal-based list of users who liked a post

**When to use:** LIKE-04 implementation

**Example:**
```typescript
// components/community/LikesList.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/Themed';
import { Avatar } from '@/components/Avatar';
import { getPostLikes, LikeWithProfile } from '@/lib/supabase/likes';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface LikesListProps {
  visible: boolean;
  postId: string;
  likeCount: number;
  onClose: () => void;
}

export const LikesList: React.FC<LikesListProps> = ({
  visible,
  postId,
  likeCount,
  onClose,
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible && postId) {
      loadLikes();
    }
  }, [visible, postId]);

  const loadLikes = async () => {
    setIsLoading(true);
    try {
      const data = await getPostLikes(postId);
      setLikes(data);
    } catch (err) {
      console.error('Failed to load likes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPress = (userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.title}>Likes</ThemedText>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={likes}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.userRow}
              onPress={() => handleUserPress(item.profiles.id)}
            >
              <Avatar
                uri={item.profiles.avatar_url}
                size={44}
              />
              <ThemedText style={styles.userName}>
                {item.profiles.display_name}
              </ThemedText>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '600' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  userName: { fontSize: 16 },
});
```

### Anti-Patterns to Avoid

- **Don't use offset pagination for feeds** — Use cursor-based (created_at) to handle new posts arriving during scroll
- **Don't query all follows client-side** — Use server-side JOIN/RPC for efficiency
- **Don't fetch full profile for each like** — Only select id, display_name, avatar_url
- **Don't implement real-time subscriptions for likes list** — Pull-to-refresh is sufficient

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pagination state | Custom useState logic | FlatList + cursor pattern | Proven pattern, handles edge cases |
| Avatar display | Custom Image component | `components/Avatar.tsx` | Already handles loading, error, placeholder |
| Follow button | New button component | `components/FollowButton.tsx` | Already complete with loading state |
| Profile stats | New stats component | `components/ProfileStats.tsx` | Already formats numbers with K suffix |

**Key insight:** This phase is primarily about data queries and UI composition, not building new foundational components. Reuse existing Avatar, FollowButton, ProfileStats patterns.

## Common Pitfalls

### Pitfall 1: Missing Phase 13 Tables
**What goes wrong:** Queries fail because `posts` and `post_likes` tables don't exist
**Why it happens:** Phase 13 (Community Feed Core) must create these tables first
**How to avoid:** Verify migration files exist for posts/post_likes before starting
**Warning signs:** `relation "posts" does not exist` error in Supabase

### Pitfall 2: Self-Posts in Following Feed
**What goes wrong:** User's own posts don't appear in Following filter
**Why it happens:** Query only joins on follows table, not including self
**How to avoid:** Add `OR posts.user_id = current_user_id` to query, or create self-follow on signup
**Warning signs:** Users report their posts "disappeared" when switching to Following

### Pitfall 3: N+1 Query on Likes List
**What goes wrong:** Loading likes list is slow because of multiple profile queries
**Why it happens:** Not using Supabase join syntax correctly
**How to avoid:** Use `.select('*, profiles(...)')` for single query
**Warning signs:** Each like item triggers separate API call

### Pitfall 4: Stale Like Counts
**What goes wrong:** Like count doesn't update after user likes/unlikes
**Why it happens:** Not using optimistic updates or not refreshing after mutation
**How to avoid:** Update local state immediately, sync with server in background
**Warning signs:** Count shows "5" but list shows 6 users

## Code Examples

### Relative Timestamp Utility
```typescript
// lib/utils/dateFormatter.ts (already exists, extend for posts)

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};
```

### Post Card Component Skeleton
```typescript
// components/community/PostCard.tsx
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Text } from '@/components/Themed';
import { Avatar } from '@/components/Avatar';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRelativeTime } from '@/lib/utils/dateFormatter';

interface PostCardProps {
  post: {
    id: string;
    photo_url: string;
    plant_name?: string;
    caption?: string;
    like_count: number;
    comment_count: number;
    created_at: string;
    profiles: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
  onLikePress?: () => void;
  onCommentPress?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikePress,
  onCommentPress,
}) => {
  const router = useRouter();
  const colors = useThemeColors();

  const handleAuthorPress = () => {
    router.push(`/profile/${post.profiles.id}`);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header: Avatar + Name + Time */}
      <TouchableOpacity style={styles.header} onPress={handleAuthorPress}>
        <Avatar uri={post.profiles.avatar_url} size={40} />
        <View style={styles.headerText}>
          <Text style={[styles.authorName, { color: colors.text }]}>
            {post.profiles.display_name}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textMuted }]}>
            {getRelativeTime(post.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Photo */}
      <Image
        source={{ uri: post.photo_url }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Info Section */}
      <View style={styles.info}>
        {post.plant_name && (
          <Text style={[styles.plantName, { color: colors.text }]}>
            {post.plant_name}
          </Text>
        )}
        {post.caption && (
          <Text style={[styles.caption, { color: colors.textSecondary }]} numberOfLines={2}>
            {post.caption}
          </Text>
        )}

        {/* Engagement Row */}
        <View style={styles.engagement}>
          <TouchableOpacity style={styles.engagementItem} onPress={onLikePress}>
            <Ionicons name="heart-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {post.like_count}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.engagementItem} onPress={onCommentPress}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {post.comment_count}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  info: {
    padding: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  engagement: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    fontSize: 14,
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Offset pagination | Cursor-based pagination | Industry standard 2023+ | Handles real-time data better |
| Separate like fetch | Embedded counts | Supabase pattern | Fewer API calls |
| Local state for feed | Zustand store pattern | Phase 11/12 established | Consistent state management |

**Deprecated/outdated:**
- **Real-time subscriptions for feeds:** Too complex for MVP, use pull-to-refresh
- **@tanstack/react-query:** Not in project yet, Zustand pattern is sufficient

## Open Questions

1. **Should user's own posts appear in Following filter?**
   - What we know: Instagram shows your own posts in Following feed
   - What's unclear: Product decision not made in CONTEXT.md
   - Recommendation: Include own posts via `OR posts.user_id = current_user_id`

2. **Where does the Likes List appear?**
   - What we know: LIKE-04 requires "view list of users who liked a post"
   - What's unclear: Modal vs dedicated screen
   - Recommendation: Use Modal (iOS sheet style) for simplicity, matches Instagram/Twitter

3. **How to handle empty Following state?**
   - What we know: CONTEXT.md specifies "Discover plant lovers" CTA
   - What's unclear: Where does discovery lead?
   - Recommendation: Navigate to search/discovery (future feature), show placeholder for now

## Validation Architecture

> Note: workflow.nyquist_validation not explicitly false in config.json - section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react-native (partially setup) |
| Config file | None detected in project root - uses Jest defaults |
| Quick run command | `npm test -- components/__tests__/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOLL-04 | Following filter shows posts from followed users | integration | `npm test -- feedStore.test.ts` | ❌ Wave 0 |
| LIKE-04 | User can view list of users who liked a post | unit | `npm test -- LikesList.test.tsx` | ❌ Wave 0 |
| LIKE-05 | Liked posts appear in user's profile | integration | `npm test -- profileStore.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --related <file>`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `components/__tests__/LikesList.test.tsx` — covers LIKE-04
- [ ] `stores/__tests__/feedStore.test.ts` — covers FOLL-04 pagination
- [ ] `services/__tests__/likeService.test.ts` — covers LIKE-05 queries
- [ ] Jest configuration in project root — if not detected by Jest presets

**Note:** Existing tests in `components/__tests__/Avatar.test.tsx` and `ProfileStats.test.tsx` are structural placeholders. Consider completing test setup before implementation.

## Sources

### Primary (HIGH confidence)
- Project codebase analysis — `services/followService.ts`, `lib/supabase/profiles.ts`, `components/FollowButton.tsx`, `app/profile/[userId].tsx`
- Existing research — `.planning/research/ARCHITECTURE_V2_COMMUNITY.md` (established patterns)
- Supabase documentation — join queries, RPC functions, RLS policies

### Secondary (MEDIUM confidence)
- React Native FlatList infinite scroll patterns — established community pattern
- Zustand store patterns from `stores/plantsStore.ts`, `stores/profileStore.ts`

### Tertiary (LOW confidence)
- Bottom sheet UX patterns — @gorhom/bottom-sheet documentation (not used, Modal alternative chosen)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuses existing Zustand + Supabase pattern
- Architecture: HIGH — patterns established in Phase 12 and existing research
- Pitfalls: MEDIUM — depends on Phase 13 completion, needs verification

**Research date:** 2026-03-04
**Valid until:** 30 days (stable patterns, Supabase API stable)
