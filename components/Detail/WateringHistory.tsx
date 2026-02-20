import React from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { usePlantsStore } from '@/stores/plantsStore';
import { getWateringStreak, generateMarkedDates } from '@/services/wateringService';
import { SavedPlant } from '@/types';
import { Text } from '@/components/Themed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WateringHistoryProps {
  plant: SavedPlant;
}

// ---------------------------------------------------------------------------
// WateringHistory Component
// ---------------------------------------------------------------------------

export function WateringHistory({ plant }: WateringHistoryProps) {
  const { t } = useTranslation();
  const getPlant = usePlantsStore((state) => state.getPlant);

  // Calculate streak
  const streak = getWateringStreak(plant.id);

  // Generate marked dates for calendar
  const markedDates = generateMarkedDates(plant);

  // Handle day press
  const handleDayPress = (day: DateData) => {
    // Find water event for selected day
    const waterEvent = plant.waterHistory.find((event) => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === day.dateString;
    });

    if (waterEvent?.notes) {
      // Show notes if available
      const dateStr = new Date(waterEvent.date).toLocaleDateString();
      Alert.alert(
        t('watering.notesFor', { date: dateStr }),
        waterEvent.notes
      );
    }
  };

  // Calculate date range (last 30 days to today)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('watering.wateringHistory')}</Text>

      {/* Streak badge */}
      {streak >= 7 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>
            {t('watering.dayStreak', { count: streak })}
          </Text>
        </View>
      )}

      {/* Calendar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Calendar
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          minDate={thirtyDaysAgo.toISOString().split('T')[0]}
          maxDate={today.toISOString().split('T')[0]}
          theme={{
            dotStyle: {
              width: 8,
              height: 8,
              marginTop: 2,
            },
            todayTextColor: '#2e7d32',
            selectedDayBackgroundColor: '#e8f5e9',
            arrowColor: '#2e7d32',
            monthTextColor: '#1a1a1a',
            textMonthFontSize: 16,
            textMonthFontWeight: 'bold',
            textDayFontSize: 14,
            textDayHeaderFontSize: 12,
            textDayFontFamily: 'System',
            calendarBackground: '#ffffff',
          }}
          style={styles.calendar}
          hideExtraDays
          disableMonthNavigation
          hideArrows={false}
          enableSwipeMonths={false}
        />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  header: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  streakBadge: {
    backgroundColor: '#fff9c4',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f57f17',
  },
  calendar: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
