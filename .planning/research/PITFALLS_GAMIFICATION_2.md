# Pitfalls Research: Gamification 2.0 Architecture

**Domain:** Gamification in React Native + Expo + Supabase app
**Project:** Plantid
**Researched:** 2026-03-09
**Confidence:** HIGH (existing codebase analysis + established patterns)

---

## Critical Pitfalls

### Pitfall 1: Leaderboard N+1 Query Problem

**What goes wrong:**
The current Leaderboard component (lines 125-135) fetches all badge counts client-side with a separate query:
```typescript
const { data: badgeData } = await supabase
  .from('user_badges')
  .select('user_id');
// Then loops in JavaScript to count badges per user
```
This returns ALL badges for ALL users and counts them in JavaScript, which is O(n*m) complexity.

**Why it happens:**
Developers avoid complex SQL aggregations and fall back to client-side processing. The badge leaderboard requires a COUNT aggregation grouped by user_id, which feels intimidating to implement as a Supabase view or RPC.

**How to avoid:**
Create a database view or RPC function that returns pre-computed badge counts:
```sql
CREATE OR REPLACE VIEW leaderboard_badges AS
SELECT
  up.user_id,
  p.display_name,
  p.avatar_url,
  up.xp_total,
  up.watering_streak,
  COUNT(ub.badge_key) as badge_count
FROM user_progress up
JOIN profiles p ON p.id = up.user_id
LEFT JOIN user_badges ub ON ub.user_id = up.user_id
GROUP BY up.user_id, p.display_name, p.avatar_url, up.xp_total, up.watering_streak
ORDER BY badge_count DESC;
```

**Warning signs:**
- Leaderboard takes >2 seconds to load
- Network tab shows large payload for badge_counts
- App becomes sluggish when scrolling leaderboard

**Phase to address:**
Phase 1 (Leaderboard 2.0) — must be fixed before scaling to 100+ users

---

### Pitfall 2: XP Synchronization Between Client Store and Supabase

**What goes wrong:**
The gamification system uses two sources of truth:
1. `user_progress` table in Supabase (authoritative)
2. Local Zustand store cache

If the app calls `awardGamificationEvent()` and the user closes the app before the response returns, XP is awarded on server but not reflected in local state. On next launch, store shows stale XP.

**Why it happens:**
The `gamificationStore` only manages toast queue, not XP state. There's no persistent XP cache. Every refresh fetches from Supabase, but there's a race condition window.

**How to avoid:**
1. Always fetch fresh XP from Supabase on app launch (already done in `getUserGamificationSummary`)
2. Add optimistic updates to store with rollback on failure
3. Use `useQuery`-style stale-while-revalidate pattern
4. Store last-known XP timestamp and invalidate cache after X minutes

**Warning signs:**
- User sees XP drop after app restart
- "Level up" toast appears but level doesn't change
- Support tickets about "lost XP"

**Phase to address:**
Phase 2 (XP + Level System 2.0) — requires store refactoring

---

### Pitfall 3: Streak Calculation Edge Cases

**What goes wrong:**
The current streak logic (migration 004, lines 487-499) has timezone issues:
```sql
IF v_event_day = v_progress.last_watering_date + 1 THEN
  v_progress.watering_streak := v_progress.watering_streak + 1;
```
The `v_event_day` is calculated as `(timezone('utc', p_event_time))::date`. If a user waters at 11:30 PM local time (which is 3:30 AM UTC next day), the streak breaks.

**Why it happens:**
UTC-based date comparison doesn't account for user's local timezone. Streaks should be based on calendar days in the user's timezone, not UTC days.

**How to avoid:**
1. Pass user's timezone offset from client
2. Calculate "local day" using `timezone('utc', p_event_time - interval 'X hours')` where X is the offset
3. Store last_watering_date in user's local date or include timezone in user_preferences

**Warning signs:**
- Users report streaks breaking "randomly"
- Streak breaks after late-night watering
- Support spikes around DST transitions

**Phase to address:**
Phase 2 (Streak System Enhancement) — requires RPC function update

---

### Pitfall 4: Race Condition in Challenge Completion

**What goes wrong:**
When multiple events trigger simultaneously (e.g., rapid watering of 5 plants), the challenge progress update can race:
```sql
SELECT progress_count, completed
INTO v_prev_challenge_count, v_prev_challenge_completed
FROM challenge_progress
WHERE user_id = v_user_id AND challenge_key = v_challenge.challenge_key
FOR UPDATE;
```
The `FOR UPDATE` lock is per-row, but multiple calls can still interleave if the row doesn't exist yet (first insert, then concurrent selects).

**Why it happens:**
The `INSERT ... ON CONFLICT DO NOTHING` followed by `SELECT ... FOR UPDATE` creates a window where two concurrent calls both insert nothing, then both select the same row.

**How to avoid:**
1. Use `INSERT ... ON CONFLICT DO UPDATE` to ensure row exists in one statement
2. Or use `ON CONFLICT (user_id, challenge_key, challenge_date) DO UPDATE SET progress_count = challenge_progress.progress_count` (no-op update to lock the row)
3. Consider advisory locks for critical sections

**Warning signs:**
- Challenge shows 3/3 completed but no bonus XP awarded
- Challenge progress jumps by 2 instead of 1
- Duplicate XP awards for same challenge

**Phase to address:**
Phase 3 (Daily Challenges 2.0) — RPC function refactoring needed

---

### Pitfall 5: Missing RLS Policy for Leaderboard View

**What goes wrong:**
If a leaderboard view or RPC returns other users' data, RLS policies must allow reading other users' progress. Current RLS (migration 004, lines 151-154) only allows users to view their own progress:
```sql
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```
This blocks leaderboard queries that need other users' XP/streak data.

**Why it happens:**
Security-first approach is correct, but leaderboard is an exception that requires reading all users' progress. This wasn't anticipated in the original schema.

**How to avoid:**
1. Add a specific policy for leaderboard access:
```sql
CREATE POLICY "Leaderboard allows viewing all progress"
  ON user_progress FOR SELECT TO authenticated
  USING (true);  -- Or use a security-definer function
```
2. Or create a `leaderboard_entries` view with its own RLS that exposes only necessary columns (user_id, display_name, xp_total, watering_streak, level) without sensitive data

**Warning signs:**
- Leaderboard shows only current user
- "Failed to load leaderboard" errors
- RLS policy violations in Supabase logs

**Phase to address:**
Phase 1 (Leaderboard 2.0) — requires migration

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Client-side badge counting | Faster initial implementation | N+1 queries, poor performance at scale | Never — fix before 50+ users |
| UTC-only date handling | Simpler logic | Timezone bugs, user frustration | MVP only — fix in Phase 2 |
| No optimistic updates | Simpler state management | Slower perceived performance | Acceptable for Phase 1 |
| Hardcoded badge definitions | Quick iteration | Requires app update to add badges | Never — use catalog table |
| Toast queue in memory only | Simple implementation | Lost notifications on app close | Acceptable — toasts are transient |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Zustand + Supabase** | Storing XP in both places without sync | Supabase is source of truth; Zustand is ephemeral UI state |
| **Gamification + Community** | Not awarding XP for likes/comments | Use `award_event` RPC in post/like service hooks |
| **Gamification + Watering** | Forgetting to pass event_date | Always pass event_date for idempotency |
| **Toast + Navigation** | Showing toast after screen unmounts | Use `dismissToast` in `useEffect` cleanup |
| **Leaderboard + Pagination** | Fetching all users at once | Use Supabase range queries with cursor-based pagination |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Event log without pagination** | Activity feed loads slowly | Add `limit(50)` and infinite scroll | 1000+ events per user |
| **Badge grid without virtualization** | Scroll jank with many badges | Use FlatList with `numColumns` | 50+ badges |
| **Leaderboard re-fetch on every tab switch** | Unnecessary network requests | Cache with 5-minute TTL | 100+ MAU |
| **XP calculation in React** | Level progress bar flickers | Calculate in Supabase RPC | Complex level formulas |
| **Challenge progress without indexing** | Slow event awarding | Index on (user_id, challenge_date) | 10K+ challenge_progress rows |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Client-side XP calculation** | Users can manipulate XP | All XP awarded through server-side `award_event` RPC |
| **Exposing user IDs in leaderboard** | Privacy concern | Only expose display_name and avatar_url |
| **Missing daily_cap enforcement** | XP farming exploits | Enforce daily_cap in RPC (already done) |
| **No rate limiting on award_event** | DoS through event spam | Add rate limiting in Supabase edge function |
| **Badge metadata tampering** | Users could inject content | Validate metadata schema in RPC |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Toast spam on multiple XP awards** | Overwhelming, ignored | Queue toasts and show one at a time with delay (already done in store) |
| **No feedback for capped XP** | User confused why XP stopped | Show "Daily XP limit reached" message |
| **Streak breaks without warning** | Demotivating, churn | Push notification: "Water your plants to keep your streak!" |
| **Level up buried in toast** | Missed celebration | Full-screen modal for level up with animation |
| **Challenge completed silently** | Missed achievement feeling | Show confetti + "Challenge Complete!" banner |
| **Leaderboard with no context** | Why am I ranked here? | Show rank change indicator (+2, -1) |

---

## "Looks Done But Isn't" Checklist

- [ ] **Leaderboard:** Often missing RLS policy for cross-user reads — verify Supabase logs for RLS errors
- [ ] **Streak:** Often breaks on timezone edge cases — test at 11:59 PM and 12:01 AM in different timezones
- [ ] **Challenge completion:** Often missing bonus XP notification — verify toast shows for challenge XP
- [ ] **Level up:** Often missing persistent celebration — verify level up shown even if app restarted
- [ ] **Badge unlock:** Often missing catalog join — verify badge title/description shown (not just key)
- [ ] **Daily cap:** Often missing user feedback — verify "daily limit reached" shown in UI

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **N+1 badge queries** | MEDIUM | Create database view, update Leaderboard component to use view |
| **Streak timezone bugs** | HIGH | Backfill correct streaks from event log, add timezone to RPC |
| **Race condition in challenges** | MEDIUM | Add migration with `ON CONFLICT DO UPDATE`, deploy during low traffic |
| **Missing RLS for leaderboard** | LOW | Add policy, no data migration needed |
| **XP sync issues** | MEDIUM | Add migration to recalculate XP from event log, clear client cache |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Leaderboard N+1 queries | Phase 1 (Leaderboard 2.0) | Performance test with 100 users |
| XP synchronization | Phase 2 (XP System 2.0) | Test offline/online transitions |
| Streak timezone | Phase 2 (Streak Enhancement) | Test in multiple timezones |
| Challenge race condition | Phase 3 (Challenges 2.0) | Load test with concurrent events |
| RLS policy gap | Phase 1 (Leaderboard 2.0) | Verify Supabase logs clean |

---

## Build Order Considerations

Based on pitfalls identified, recommended build order for Gamification 2.0:

### Phase 1: Leaderboard + RLS (Foundation)
1. Create `leaderboard_entries` view with proper aggregation
2. Add RLS policy for cross-user reads
3. Update Leaderboard component to use view
4. Add pagination for performance

**Rationale:** Fixes critical N+1 issue before user growth. Enables other features.

### Phase 2: XP + Streak Enhancement
1. Add timezone support to streak calculation
2. Implement optimistic XP updates in store
3. Add daily cap feedback UI
4. Level up celebration modal

**Rationale:** Builds on stable leaderboard. Timezone fix is user-facing priority.

### Phase 3: Challenges + Achievements 2.0
1. Fix race condition in challenge progress
2. Add challenge completion celebration
3. Implement streak warning notifications
4. Add achievement sharing

**Rationale:** Most complex feature. Depends on stable XP system.

### Phase 4: Polish + Analytics
1. Add gamification analytics events
2. A/B test XP values
3. Add achievement density monitoring
4. Performance optimization pass

**Rationale:** Only after core features stable.

---

## Sources

- **Existing codebase analysis:** `/Users/martha2022/Documents/Plantid/` — Direct inspection of gamificationStore, gamificationService, Leaderboard, migrations (HIGH confidence)
- **Supabase RLS patterns:** Training knowledge + migration 004 RLS policies — Row-level security best practices (HIGH confidence)
- **PostgreSQL race conditions:** Training knowledge — `INSERT ... ON CONFLICT` patterns, `FOR UPDATE` locking (HIGH confidence)
- **Timezone handling:** Training knowledge + existing UTC patterns — Calendar day vs UTC day considerations (MEDIUM confidence — test in production)
- **Mobile gamification patterns:** Training knowledge — Toast queuing, celebration UX, streak psychology (MEDIUM confidence)

---

*Pitfalls research for: Plantid Gamification 2.0 Architecture*
*Researched: 2026-03-09*
