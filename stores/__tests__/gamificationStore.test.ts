/**
 * gamificationStore Cooldown Test Scaffold
 *
 * Wave 0 TDD test scaffold for celebration cooldown logic in gamificationStore.
 * Tests will FAIL initially because the cooldown logic doesn't exist yet - this is expected (RED phase of TDD).
 *
 * Coverage: CELE-06 (3-second cooldown between celebrations)
 */

import { useGamificationStore } from '../gamificationStore';

describe('gamificationStore celebration cooldown', () => {
  beforeEach(() => {
    useGamificationStore.getState().reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('canTriggerCelebration returns true when lastCelebrationAt is null', () => {
    expect(useGamificationStore.getState().canTriggerCelebration()).toBe(true);
  });

  it('canTriggerCelebration returns false within 3 seconds of last celebration', () => {
    const store = useGamificationStore.getState();
    store.recordCelebration();

    // Immediately after, should be blocked
    expect(store.canTriggerCelebration()).toBe(false);

    // After 2.9 seconds, still blocked
    jest.advanceTimersByTime(2900);
    expect(store.canTriggerCelebration()).toBe(false);
  });

  it('canTriggerCelebration returns true after 3 seconds cooldown expires', () => {
    const store = useGamificationStore.getState();
    store.recordCelebration();

    jest.advanceTimersByTime(3000);
    expect(store.canTriggerCelebration()).toBe(true);
  });

  it('recordCelebration sets lastCelebrationAt to current timestamp', () => {
    const store = useGamificationStore.getState();
    const before = Date.now();
    store.recordCelebration();
    const after = Date.now();

    expect(store.lastCelebrationAt).toBeGreaterThanOrEqual(before);
    expect(store.lastCelebrationAt).toBeLessThanOrEqual(after);
  });

  it('reset clears lastCelebrationAt', () => {
    const store = useGamificationStore.getState();
    store.recordCelebration();
    expect(store.lastCelebrationAt).not.toBeNull();

    store.reset();
    expect(useGamificationStore.getState().lastCelebrationAt).toBeNull();
  });
});
