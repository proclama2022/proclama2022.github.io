import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePlantsStore } from '@/stores/plantsStore';
import { getCareInfo } from '@/services/careDB';

function computeStats(plants: ReturnType<typeof usePlantsStore.getState>['plants']) {
  const now = new Date();

  // Total identifications
  const totalIdentifications = plants.length;

  // Global watering streak: max consecutive days with at least one watering across all plants
  const allWaterDates = new Set<string>();
  plants.forEach(p => {
    p.waterHistory.forEach(e => {
      allWaterDates.add(new Date(e.date).toISOString().split('T')[0]);
    });
  });

  let wateringStreak = 0;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (allWaterDates.has(dateStr)) {
      wateringStreak++;
    } else if (i > 0) {
      break;
    }
  }

  // Reminder completion rate
  let totalReminders = 0;
  let completedReminders = 0;
  plants.forEach(p => {
    if (p.reminders) {
      totalReminders += p.reminders.length;
      completedReminders += p.reminders.filter(r => r.completed).length;
    }
  });
  const reminderCompletionRate = totalReminders > 0 ? Math.round((completedReminders / totalReminders) * 100) : 0;

  // Weekly watering data (last 7 days)
  const weeklyData: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    let count = 0;
    plants.forEach(p => {
      p.waterHistory.forEach(e => {
        if (new Date(e.date).toISOString().split('T')[0] === dateStr) {
          count++;
        }
      });
    });
    weeklyData.push(count);
  }

  // Day labels for the week
  const dayLabels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayLabels.push(d.getDay().toString());
  }

  return {
    totalIdentifications,
    wateringStreak,
    reminderCompletionRate,
    totalReminders,
    completedReminders,
    weeklyData,
    dayLabels,
  };
}

function BarChart({ data, dayLabels, colors, t }: { data: number[]; dayLabels: string[]; colors: ReturnType<typeof useThemeColors>; t: ReturnType<typeof useTranslation>['t'] }) {
  const maxVal = Math.max(...data, 1);
  const dayNames: Record<string, string> = {
    '0': t('stats.sun'),
    '1': t('stats.mon'),
    '2': t('stats.tue'),
    '3': t('stats.wed'),
    '4': t('stats.thu'),
    '5': t('stats.fri'),
    '6': t('stats.sat'),
  };

  return (
    <View style={barStyles.container}>
      {data.map((val, i) => (
        <View key={i} style={barStyles.barColumn}>
          <View style={[barStyles.barTrack, { backgroundColor: colors.chipBg }]}>
            <View
              style={[
                barStyles.barFill,
                {
                  backgroundColor: colors.tint,
                  height: `${Math.round((val / maxVal) * 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={[barStyles.barValue, { color: colors.textSecondary }]}>{val}</Text>
          <Text style={[barStyles.dayLabel, { color: colors.textMuted }]}>
            {dayNames[dayLabels[i]] || ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    width: 28,
    height: 100,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
    minHeight: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

export default function StatisticsScreen() {
  const plants = usePlantsStore((state) => state.plants);
  const { t } = useTranslation();
  const colors = useThemeColors();

  const stats = useMemo(() => computeStats(plants), [plants]);

  return (
    <>
      <Stack.Screen options={{ title: t('stats.title'), headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Stat cards row */}
        <View style={styles.cardRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconBg, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="water" size={24} color="#2e7d32" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.wateringStreak}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('stats.wateringStreak')}</Text>
            <Text style={[styles.statUnit, { color: colors.textMuted }]}>{t('stats.days')}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconBg, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="leaf" size={24} color="#1565c0" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalIdentifications}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('stats.totalIdentifications')}</Text>
          </View>
        </View>

        {/* Reminder completion */}
        <View style={[styles.wideCard, { backgroundColor: colors.surface }]}>
          <View style={styles.wideCardHeader}>
            <Ionicons name="checkmark-circle" size={22} color={colors.tint} />
            <Text style={[styles.wideCardTitle, { color: colors.text }]}>{t('stats.reminderCompletion')}</Text>
          </View>
          {stats.totalReminders > 0 ? (
            <View style={styles.completionRow}>
              <View style={[styles.progressTrack, { backgroundColor: colors.chipBg }]}>
                <View style={[styles.progressFill, { backgroundColor: colors.tint, width: `${stats.reminderCompletionRate}%` }]} />
              </View>
              <Text style={[styles.percentText, { color: colors.tint }]}>{stats.reminderCompletionRate}%</Text>
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: colors.textMuted }]}>{t('stats.noData')}</Text>
          )}
          {stats.totalReminders > 0 && (
            <Text style={[styles.completionDetail, { color: colors.textSecondary }]}>
              {stats.completedReminders}/{stats.totalReminders}
            </Text>
          )}
        </View>

        {/* Weekly watering bar chart */}
        <View style={[styles.wideCard, { backgroundColor: colors.surface }]}>
          <View style={styles.wideCardHeader}>
            <Ionicons name="bar-chart" size={22} color={colors.tint} />
            <Text style={[styles.wideCardTitle, { color: colors.text }]}>{t('stats.weeklyWatering')}</Text>
          </View>
          {stats.weeklyData.some(v => v > 0) ? (
            <BarChart data={stats.weeklyData} dayLabels={stats.dayLabels} colors={colors} t={t} />
          ) : (
            <Text style={[styles.noDataText, { color: colors.textMuted }]}>{t('stats.noData')}</Text>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  statUnit: {
    fontSize: 11,
    marginTop: 2,
  },
  wideCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  wideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  wideCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  percentText: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 45,
    textAlign: 'right',
  },
  completionDetail: {
    fontSize: 13,
    marginTop: 6,
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
