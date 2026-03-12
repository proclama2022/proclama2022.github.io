/**
 * Weekly Streak Calendar Component
 *
 * Displays a 7-day streak visualization showing completed days, current day highlight,
 * freeze indicator, and streak/freeze stats below the calendar.
 *
 * @module components/Gamification/WeeklyStreakCalendar
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export type DayStatusValue = 'completed' | 'current' | 'future' | 'freeze';

export interface DayStatus {
  day: string; // Localized day initial
  status: DayStatusValue;
}

interface WeeklyStreakCalendarProps {
  streak: number;
  freezeRemaining: number;
  weekData?: DayStatus[]; // Optional - compute if not provided
}

/**
 * Generate week data based on streak and current day
 * Simple heuristic: if streak > 0 and day < currentDayIndex, mark as 'completed'
 */
function generateWeekData(streak: number, currentDayIndex: number): DayStatus[] {
  const { t } = useTranslation();

  // Italian weekday initials: L M M G V S D
  const dayLabels = [
    t('gamification.weekdays.mon'), // L
    t('gamification.weekdays.tue'), // M
    t('gamification.weekdays.wed'), // M
    t('gamification.weekdays.thu'), // G
    t('gamification.weekdays.fri'), // V
    t('gamification.weekdays.sat'), // S
    t('gamification.weekdays.sun'), // D
  ];

  return dayLabels.map((label, index) => {
    if (index === currentDayIndex) {
      return { day: label, status: 'current' };
    }
    if (index < currentDayIndex && streak > (currentDayIndex - index - 1)) {
      return { day: label, status: 'completed' };
    }
    return { day: label, status: 'future' };
  });
}

/**
 * Weekly streak calendar component
 */
export function WeeklyStreakCalendar({
  streak,
  freezeRemaining,
  weekData: propsWeekData,
}: WeeklyStreakCalendarProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  // Get current day of week (0=Sunday, 6=Saturday)
  // Map to Italian order: L(0) M(1) M(2) G(3) V(4) S(5) D(6)
  const currentDayIndex = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, etc.
    // Map to Italian order starting Monday: L=0, M=1, M=2, G=3, V=4, S=5, D=6
    // Sunday (0) should be 6, Monday (1) should be 0, etc.
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }, []);

  // Use provided weekData or generate it
  const weekData = useMemo(() => {
    if (propsWeekData) {
      return propsWeekData;
    }
    return generateWeekData(streak, currentDayIndex);
  }, [propsWeekData, streak, currentDayIndex]);

  /**
   * Render a single day circle
   */
  const renderDayCircle = (day: DayStatus) => {
    const { day: label, status } = day;

    if (status === 'freeze') {
      // Snowflake instead of circle
      return (
        <View key={label} style={styles.dayColumn}>
          <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
          <Text style={[styles.freezeIcon, { color: '#81D4FA' }]}>❄️</Text>
        </View>
      );
    }

    let circleStyle = styles.circle;
    let innerCircleStyle: object | null = null;

    if (status === 'completed') {
      // Filled circle with brand color
      circleStyle = [styles.circle, { backgroundColor: colors.tint, borderColor: colors.tint }];
    } else if (status === 'current') {
      // Highlighted border (2px brand + 2px white border)
      circleStyle = [
        styles.circle,
        { borderColor: colors.tint, borderWidth: 4 },
      ];
      innerCircleStyle = { backgroundColor: colors.cardBackground, borderRadius: 8 };
    } else {
      // Future: outlined circle with gray border
      circleStyle = [styles.circle, { borderColor: colors.textSecondary }];
    }

    return (
      <View key={label} style={styles.dayColumn}>
        <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>
          {label}
        </Text>
        <View style={circleStyle}>
          {status === 'completed' && null}
          {status === 'current' && <View style={[styles.innerCircle, innerCircleStyle]} />}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Day labels and circles row */}
      <View style={styles.dayRow}>
        {weekData.map((day) => renderDayCircle(day))}
      </View>

      {/* Stats row below */}
      <View style={styles.statsRow}>
        <Text style={[styles.streakText, { color: colors.text }]}>
          🔥 {streak} {t('stats.days')}
        </Text>
        {freezeRemaining > 0 && (
          <Text style={[styles.freezeText, { color: colors.text }]}>
            ❄️({freezeRemaining})
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayColumn: {
    alignItems: 'center',
    width: 32,
  },
  dayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  freezeIcon: {
    fontSize: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
  },
  freezeText: {
    fontSize: 14,
  },
});

export default WeeklyStreakCalendar;
