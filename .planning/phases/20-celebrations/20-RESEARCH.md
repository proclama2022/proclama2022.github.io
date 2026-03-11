# Phase 20: Celebrations - Research

**Researched:** 2026-03-11
**Domain:** React Native celebration animations, haptic feedback, gamification UX
**Confidence:** HIGH

## Summary

This phase implements the celebration system for gamification milestones using existing infrastructure. The project already has `react-native-confetti-cannon` (v1.5.2) and `expo-haptics` (~15.0.8) installed and working. The `LeagueCelebration` component (79 lines) already demonstrates the pattern: confetti + haptic + 3s auto-dismiss. The `GamificationToastHost` already handles toast queuing but only triggers confetti for league promotions.

**Primary recommendation:** Extend the existing celebration pattern to badge unlock and level-up events. Add a 3-second cooldown mechanism to the toast queue to prevent celebration spam.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. **Confetti events:** Badge unlock + Level-up + League promotion (all three)
   - Rationale: User wants all gamification milestones celebrated equally
   - Implementation: Extend existing pattern to all three events

2. **Confetti intensity:** Party mode (100 particles)
   - Count: 100 confetti
   - colors: Gold (#FFD700), Silver (#C0C0C1), Diamond (#B9F2FF), Platinum (#E5E4E2), Bronze (#CD7F32)
   - origin: Bottom center (x: -10, y: 0) - fadeOut: true
   - Note: Same colors as existing LeagueCelebration

3. **Spam handling:** Queue with 3-second debounce
   - Cooldown: 3 seconds between celebrations
   - Implementation: Add timestamp tracking to gamificationStore
   - Queue events during `enqueueToast()` and process with debounce

4. **Haptic feedback:** Success feedback for all celebrations
   - Badge/Level-up/League promotion: Haptics.notificationAsync(Success)
   - League relegation: NO haptic (negative event)
   - Title change: NO haptic (informational)

5. **Auto-dismiss:** 3 seconds with fade-out
   - Toast automatically dismisses after celebration completes
   - Confetti fades out naturally

6. **Component architecture:** Generalize LeagueCelebration -> CelebrationOverlay
   - Create generic CelebrationOverlay component
   - Accept event type for customization (colors, count)
   - Keep LeagueCelebration as wrapper for backward compatibility
   - Alternative: Inline confetti in GamificationToastHost

### Claude's Discretion
- Implementation details for the cooldown mechanism
- Test file structure and coverage approach

### Deferred Ideas (OUT OF SCOPE)
- CELE-07: Full-screen celebration modal (v3.1+)
- CELE-08: Celebration sound effects (v3.1+)
- CELE-09: Share celebration to social media (v3.2+)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CELE-01 | User sees confetti animation when earning a badge | Extend `LeagueCelebration` pattern to badge events; use `react-native-confetti-cannon` with 100 particles |
| CELE-02 | User sees confetti animation when leveling up | Same pattern as CELE-01; trigger on `kind === 'level'` toast |
| CELE-03 | User sees confetti animation when promoting to higher league | Already implemented in `LeagueCelebration`; no changes needed |
| CELE-04 | User feels haptic feedback during celebrations | Use `expo-haptics` `notificationAsync(Success)`; already working for league promotions |
| CELE-05 | Celebration animations do not block UI | ConfettiCannon is non-modal; toast uses `pointerEvents="box-none"` on overlay |
| CELE-06 | Celebration cooldown prevents spam (max 1 per 3 seconds) | Add `lastCelebrationAt` timestamp to `gamificationStore`; check before showing confetti |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-confetti-cannon | 1.5.2 | Confetti particle animation | Already installed, proven in LeagueCelebration |
| expo-haptics | ~15.0.8 | Haptic feedback | Expo SDK standard, cross-platform |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.11 | State management for toast queue | Already used in gamificationStore |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-confetti-cannon | react-native-confetti | confetti-cannon has better explosion effect, already integrated |
| expo-haptics | react-native-haptic-feedback | expo-haptics is SDK-standard, less configuration |

**Installation:** No new packages required - all dependencies already installed.

## Architecture Patterns

### Current Project Structure
```
components/
├── GamificationToastHost.tsx    # Central toast manager (197 lines)
├── Gamification/
│   ├── LeagueCelebration.tsx    # Confetti component (79 lines)
│   └── __tests__/              # Test files
stores/
└── gamificationStore.ts         # Toast queue state
types/
└── gamification.ts              # Type definitions
```

### Pattern 1: Celebration Component Structure
**What:** Non-blocking confetti overlay that triggers haptics and auto-dismisses
**When to use:** All gamification milestone celebrations
**Example:**
```typescript
// Source: components/Gamification/LeagueCelebration.tsx (existing)
export function LeagueCelebration({ visible, tier, onComplete }: LeagueCelebrationProps) {
  const confettiRef = useRef<ConfettiCannon>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (visible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setTimeout(() => confettiRef.current?.start(), 100);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const timer = setTimeout(() => onComplete?.(), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={100}
      origin={{ x: -10, y: 0 }}
      fadeOut
      autoStart={false}
      colors={['#FFD700', '#C0C0C0', '#B9F2FF', '#E5E4E2', '#CD7F32']}
    />
  );
}
```

### Pattern 2: Toast Queue with Celebration
**What:** Zustand store manages sequential toast display with celebration triggers
**When to use:** Multiple gamification events may fire simultaneously
**Example:**
```typescript
// Source: stores/gamificationStore.ts (existing pattern)
interface GamificationState {
  currentToast: GamificationToastItem | null;
  queue: GamificationToastItem[];
  enqueueAwardResult: (result: GamificationAwardResult) => void;
  dismissToast: () => void;
  // ADD: lastCelebrationAt: number | null;
  // ADD: canTriggerCelebration: () => boolean;
}

// dismissToast processes next item from queue
dismissToast: () => {
  const { queue } = get();
  if (queue.length === 0) {
    set({ currentToast: null });
    return;
  }
  const [nextToast, ...rest] = queue;
  set({ currentToast: nextToast, queue: rest });
}
```

### Anti-Patterns to Avoid
- **Blocking UI during celebration:** Never use Modal with `animationType="none"` and full-screen overlay
- **Haptic on negative events:** Do NOT trigger haptics for `league_relegation` or `title` (informational)
- **Multiple confetti simultaneously:** Always check cooldown before triggering new celebration

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Particle animation system | Custom Animated API solution | react-native-confetti-cannon | Complex physics, performance optimized, proven |
| Haptic patterns | Native module bridge | expo-haptics | SDK handles platform differences, permission on Android |
| Toast queue | setTimeout chains | Zustand store with queue | Handles edge cases, state inspection, testing |

**Key insight:** The celebration infrastructure already exists. This phase is about extending the trigger conditions and adding cooldown logic - not building new celebration mechanics.

## Common Pitfalls

### Pitfall 1: Celebration Spam on Batch Operations
**What goes wrong:** User waters 5 plants at once -> 5 celebrations fire simultaneously
**Why it happens:** Each XP award triggers its own celebration event
**How to avoid:** Implement 3-second cooldown via `lastCelebrationAt` timestamp check
**Warning signs:** Multiple confetti layers overlapping, toast queue backing up

### Pitfall 2: Haptics Failing Silently
**What goes wrong:** Haptics don't fire on some devices, no error visible
**Why it happens:** Low Power Mode on iOS, no vibration hardware on some Androids
**How to avoid:** Always wrap haptics in `.catch(() => {})` to handle gracefully
**Warning signs:** Celebration appears but no vibration feedback

### Pitfall 3: Confetti Ref Timing
**What goes wrong:** `confettiRef.current?.start()` called before component mounts
**Why it happens:** React ref is null during initial render
**How to avoid:** Use 100ms setTimeout before calling start(), check ref exists
**Warning signs:** Confetti doesn't appear on first celebration

### Pitfall 4: Memory Leak on Rapid Dismiss
**What goes wrong:** User taps toast multiple times, timers stack up
**Why it happens:** useEffect cleanup not properly clearing all timers
**How to avoid:** Return cleanup function from useEffect, store timer IDs
**Warning signs:** App sluggish after multiple celebrations

## Code Examples

### Cooldown Implementation in gamificationStore
```typescript
// Extension to stores/gamificationStore.ts
interface GamificationState {
  // ... existing properties
  lastCelebrationAt: number | null;
  canTriggerCelebration: () => boolean;
  recordCelebration: () => void;
}

const CELEBRATION_COOLDOWN_MS = 3000;

export const useGamificationStore = create<GamificationState>((set, get) => ({
  // ... existing implementation
  lastCelebrationAt: null,

  canTriggerCelebration: () => {
    const { lastCelebrationAt } = get();
    if (!lastCelebrationAt) return true;
    return Date.now() - lastCelebrationAt >= CELEBRATION_COOLDOWN_MS;
  },

  recordCelebration: () => {
    set({ lastCelebrationAt: Date.now() });
  },
}));
```

### Extended GamificationToastHost Celebration Logic
```typescript
// Extension to components/GamificationToastHost.tsx
useEffect(() => {
  if (!currentToast) {
    setShowCelebration(false);
    return;
  }

  // Check if this event type deserves confetti
  const celebrationWorthyEvents = ['badge', 'level', 'league_promotion'];
  const shouldCelebrate = celebrationWorthyEvents.includes(currentToast.kind);

  if (shouldCelebrate) {
    const canCelebrate = useGamificationStore.getState().canTriggerCelebration();
    if (canCelebrate) {
      setShowCelebration(true);
      useGamificationStore.getState().recordCelebration();
      // Haptics handled by celebration component
    }
  } else if (currentToast.kind !== 'league_relegation' && currentToast.kind !== 'title') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  }

  const timer = setTimeout(() => dismissToast(), 3000);
  return () => clearTimeout(timer);
}, [currentToast, dismissToast]);
```

### Generalized CelebrationOverlay Component
```typescript
// New component: components/Gamification/CelebrationOverlay.tsx
import React, { useEffect, useRef } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

export type CelebrationType = 'badge' | 'level' | 'league_promotion';

export interface CelebrationOverlayProps {
  visible: boolean;
  type: CelebrationType;
  onComplete?: () => void;
}

// Colors for different celebration types
const CELEBRATION_COLORS: Record<CelebrationType, string[]> = {
  badge: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF'],
  level: ['#FFD700', '#C0C0C0', '#B9F2FF', '#E5E4E2', '#CD7F32'],
  league_promotion: ['#FFD700', '#C0C0C0', '#B9F2FF', '#E5E4E2', '#CD7F32'],
};

export function CelebrationOverlay({ visible, type, onComplete }: CelebrationOverlayProps) {
  const confettiRef = useRef<ConfettiCannon>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (visible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      setTimeout(() => confettiRef.current?.start(), 100);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const timer = setTimeout(() => onComplete?.(), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, type, onComplete]);

  useEffect(() => {
    if (!visible) hasTriggeredRef.current = false;
  }, [visible]);

  if (!visible) return null;

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={100}
      origin={{ x: -10, y: 0 }}
      fadeOut
      autoStart={false}
      colors={CELEBRATION_COLORS[type]}
    />
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single celebration type | Multiple celebration types per event | Phase 20 | Badge/level now celebrated same as league |
| No cooldown | 3-second celebration cooldown | Phase 20 | Prevents spam on batch operations |

**Deprecated/outdated:**
- Phase 18 decision "NO confetti for badges" - OVERRIDDEN by this phase

## Open Questions

1. **Should CelebrationOverlay replace LeagueCelebration entirely?**
   - What we know: LeagueCelebration works well, tested
   - What's unclear: Migration path, backward compatibility needs
   - Recommendation: Create CelebrationOverlay, keep LeagueCelebration as thin wrapper

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + @testing-library/react-native |
| Config file | jest.config.js (project root - implied from test patterns) |
| Quick run command | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` |
| Full suite command | `npx jest --testPathPattern="components/Gamification/__tests__"` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| CELE-01 | Confetti on badge unlock | unit | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` | Wave 0 |
| CELE-02 | Confetti on level-up | unit | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` | Wave 0 |
| CELE-03 | Confetti on league promotion | unit | `npx jest components/Gamification/__tests__/Leaderboard.test.tsx -x` | Existing |
| CELE-04 | Haptic feedback triggers | unit | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` | Wave 0 |
| CELE-05 | Non-blocking UI | unit | `npx jest components/Gamification/__tests__/CelebrationOverlay.test.tsx -x` | Wave 0 |
| CELE-06 | Cooldown prevents spam | unit | `npx jest stores/__tests__/gamificationStore.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="20-celebrations" -x`
- **Per wave merge:** `npx jest --testPathPattern="(Gamification|gamificationStore)" -x`
- **Phase gate:** Full gamification test suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `components/Gamification/__tests__/CelebrationOverlay.test.tsx` - covers CELE-01, CELE-02, CELE-04, CELE-05
- [ ] `stores/__tests__/gamificationStore.test.ts` - covers CELE-06 (cooldown logic)
- [ ] Mock setup for expo-haptics and react-native-confetti-cannon

*(If no gaps: "None - existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- [npm: react-native-confetti-cannon](https://www.npmjs.com/package/react-native-confetti-cannon) - API documentation, props reference
- [Expo Docs: Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) - notificationAsync, ImpactFeedbackStyle API
- Existing codebase: `components/Gamification/LeagueCelebration.tsx` - proven pattern
- Existing codebase: `components/GamificationToastHost.tsx` - toast queue integration
- Existing codebase: `stores/gamificationStore.ts` - Zustand state pattern

### Secondary (MEDIUM confidence)
- CONTEXT.md decisions - locked user choices for implementation

### Tertiary (LOW confidence)
- None required - all information from primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All dependencies already installed and working
- Architecture: HIGH - Pattern proven in LeagueCelebration, extending to other events
- Pitfalls: HIGH - Based on existing codebase analysis and React Native patterns

**Research date:** 2026-03-11
**Valid until:** 30 days (stable React Native/Expo SDK)
