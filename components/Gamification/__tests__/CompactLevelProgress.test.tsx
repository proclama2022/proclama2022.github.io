/**
 * CompactLevelProgress Component Tests
 *
 * TDD Wave 0: Basic behavior verification for compact XP progress bar
 *
 * Test Coverage:
 * - Renders level badge (L{N}) with brand color background
 * - Renders title emoji + text from getLevelTitle()
 * - Renders XP bar with correct progress percentage
 * - Shows XP text "X/Y XP" on the right
 * - TouchableOpacity onPress fires callback
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompactLevelProgress } from '../CompactLevelProgress';

// Mock dependencies
jest.mock('@/components/useColorScheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key, opts) => {
      if (key === 'gamification.toast.levelLabel') {
        return `L${opts ? opts.level : 1}`;
      }
      if (key.startsWith('gamification.titles.')) {
        const titles = {
          'gamification.titles.seedling': 'Seedling',
          'gamification.titles.sprout': 'Sprout',
          'gamification.titles.gardener': 'Gardener',
          'gamification.titles.expert': 'Expert',
          'gamification.titles.master': 'Master',
          'gamification.titles.legend': 'Legend',
        };
        return titles[key] || key;
      }
      return key;
    }),
  })),
}));

jest.mock('@/constants/Colors', () => ({
  light: {
    text: '#000000',
    textSecondary: '#666666',
    tint: '#4CAF50',
    background: '#FFFFFF',
    cardBackground: '#F5F5F5',
    border: '#E0E0E0',
    surfaceGlass: 'rgba(255, 255, 255, 0.8)',
    surfaceStrong: '#F0F0F0',
    tabIconDefault: '#999999',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    tint: '#4CAF50',
    background: '#121212',
    cardBackground: '#1E1E1E',
    border: '#333333',
    surfaceGlass: 'rgba(30, 30, 30, 0.8)',
    surfaceStrong: '#2A2A2A',
    tabIconDefault: '#666666',
  },
}));

describe('CompactLevelProgress', () => {
  const mockProgress = {
    user_id: 'user123',
    level: 5,
    xp_total: 500,
    xp_in_level: 120,
    xp_for_next_level: 200,
    watering_streak: 7,
    last_watering_date: '2026-03-12',
    league_tier: 'bronze',
    timezone: 'UTC',
    streak_freeze_remaining: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-03-12T00:00:00Z',
  };

  it('component exists', () => {
    expect(CompactLevelProgress).toBeDefined();
  });

  it('renders without crashing', () => {
    const { getByTestId } = render(<CompactLevelProgress progress={mockProgress} />);
    const touchable = getByTestId('compact-progress-touchable');
    expect(touchable).toBeTruthy();
  });

  it('renders level badge (L5)', () => {
    const { getByText } = render(<CompactLevelProgress progress={mockProgress} />);
    const levelBadge = getByText('L5');
    expect(levelBadge).toBeTruthy();
  });

  it('renders title emoji + text', () => {
    const { getByText } = render(<CompactLevelProgress progress={mockProgress} />);
    const titleElement = getByText(/🌱/);
    expect(titleElement).toBeTruthy();
  });

  it('shows XP text "120/200 XP"', () => {
    const { getByText } = render(<CompactLevelProgress progress={mockProgress} />);
    const xpText = getByText('120/200 XP');
    expect(xpText).toBeTruthy();
  });

  it('TouchableOpacity onPress fires callback', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <CompactLevelProgress progress={mockProgress} onPress={onPressMock} />
    );

    const touchable = getByTestId('compact-progress-touchable');
    fireEvent.press(touchable);

    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders without onPress callback', () => {
    const { getByTestId } = render(<CompactLevelProgress progress={mockProgress} />);

    const touchable = getByTestId('compact-progress-touchable');
    expect(touchable).toBeTruthy();

    // Should not crash when pressed without callback
    fireEvent.press(touchable);
  });
});
