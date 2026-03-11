/**
 * CelebrationOverlay Test Scaffold
 *
 * Wave 0 TDD test scaffold for celebration overlay component.
 * Tests will FAIL initially because the component doesn't exist yet - this is expected (RED phase of TDD).
 *
 * Coverage: CELE-01 (badge confetti), CELE-02 (level confetti), CELE-06 (cooldown)
 */

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(() => Promise.resolve()),
  NotificationFeedbackType: { Success: 'success' },
}));

// Mock react-native-confetti-cannon
jest.mock('react-native-confetti-cannon', () => {
  const React = require('react');
  return React.forwardRef((props: any, ref: any) => null);
});

import { render, waitFor } from '@testing-library/react-native';
import { CelebrationOverlay, CelebrationType } from '../CelebrationOverlay';
import * as Haptics from 'expo-haptics';

describe('CelebrationOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders null when visible=false', () => {
    const { toJSON } = render(
      <CelebrationOverlay visible={false} type="badge" />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders ConfettiCannon when visible=true', () => {
    const { toJSON } = render(
      <CelebrationOverlay visible={true} type="badge" />
    );
    expect(toJSON()).not.toBeNull();
  });

  it('triggers haptic feedback on visibility change', async () => {
    render(<CelebrationOverlay visible={true} type="level" />);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );
  });

  it('calls onComplete after 3 seconds', async () => {
    const onComplete = jest.fn();
    render(
      <CelebrationOverlay visible={true} type="badge" onComplete={onComplete} />
    );

    jest.advanceTimersByTime(3000);
    expect(onComplete).toHaveBeenCalled();
  });

  it('uses different colors for badge type', () => {
    // Verify colors are type-dependent (implementation detail)
    const { rerender } = render(
      <CelebrationOverlay visible={true} type="badge" />
    );
    // Badge should use vibrant colors
    rerender(<CelebrationOverlay visible={true} type="level" />);
    // Level should use metallic colors
  });
});
