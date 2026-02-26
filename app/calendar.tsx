import React, { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePlantsStore } from '@/stores/plantsStore';
import { getCareInfo } from '@/services/careDB';
import { markAsWatered } from '@/services/wateringService';
import { SavedPlant, Reminder } from '@/types';

interface CalendarTask {
  id: string;
  plantId: string;
  plantName: string;
  type: 'watering' | 'reminder';
  reminderType?: Reminder['type'];
  reminderLabel?: string;
  completed: boolean;
  reminderId?: string;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function buildTasksForMonth(plants: SavedPlant[], year: number, month: number): Record<string, CalendarTask[]> {
  const tasks: Record<string, CalendarTask[]> = {};
  const daysInMonth = getDaysInMonth(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks: CalendarTask[] = [];

    plants.forEach(plant => {
      const displayName = plant.nickname || plant.commonName || plant.scientificName || plant.species;

      // Check watering events for this day
      const wateredToday = plant.waterHistory.some(e =>
        new Date(e.date).toISOString().split('T')[0] === dateStr
      );

      // Check if watering was expected
      const care = plant.scientificName ? getCareInfo(plant.scientificName) : null;
      if (care) {
        const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : new Date(plant.addedDate);
        const dayDate = new Date(dateStr);
        const daysSinceLast = Math.floor((dayDate.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceLast >= 0 && daysSinceLast % care.waterFrequencyDays === 0) {
          dayTasks.push({
            id: `water-${plant.id}-${dateStr}`,
            plantId: plant.id,
            plantName: displayName,
            type: 'watering',
            completed: wateredToday,
          });
        }
      }

      // Check reminders for this day
      if (plant.reminders) {
        plant.reminders.forEach(reminder => {
          const reminderDate = new Date(reminder.date).toISOString().split('T')[0];
          if (reminderDate === dateStr) {
            dayTasks.push({
              id: `reminder-${reminder.id}`,
              plantId: plant.id,
              plantName: displayName,
              type: 'reminder',
              reminderType: reminder.type,
              reminderLabel: reminder.customLabel || reminder.type,
              completed: reminder.completed,
              reminderId: reminder.id,
            });
          }
        });
      }
    });

    if (dayTasks.length > 0) {
      tasks[dateStr] = dayTasks;
    }
  }

  return tasks;
}

const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

export default function CalendarScreen() {
  const plants = usePlantsStore((state) => state.plants);
  const updatePlant = usePlantsStore((state) => state.updatePlant);
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const isIT = i18n.language === 'it';

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  );

  const monthTasks = useMemo(() => buildTasksForMonth(plants, currentYear, currentMonth), [plants, currentYear, currentMonth]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDate(null);
  }, [currentMonth]);

  const handleCompleteTask = useCallback(async (task: CalendarTask) => {
    if (task.completed) return;

    if (task.type === 'watering') {
      await markAsWatered(task.plantId);
    } else if (task.reminderId) {
      const plant = plants.find(p => p.id === task.plantId);
      if (plant?.reminders) {
        const updatedReminders = plant.reminders.map(r =>
          r.id === task.reminderId ? { ...r, completed: true } : r
        );
        updatePlant(task.plantId, { reminders: updatedReminders });
      }
    }
  }, [plants, updatePlant]);

  const selectedTasks = selectedDate ? (monthTasks[selectedDate] || []) : [];

  const dayNames = isIT
    ? ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthNames = isIT ? MONTH_NAMES_IT : MONTH_NAMES_EN;

  // Build calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  return (
    <>
      <Stack.Screen options={{ title: t('calendar.title'), headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Month navigation */}
        <View style={[styles.monthNav, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={colors.tint} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.tint} />
          </TouchableOpacity>
        </View>

        {/* Day names header */}
        <View style={[styles.dayNamesRow, { backgroundColor: colors.surface }]}>
          {dayNames.map((name, i) => (
            <View key={i} style={styles.dayNameCell}>
              <Text style={[styles.dayNameText, { color: colors.textMuted }]}>{name}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={[styles.calendarGrid, { backgroundColor: colors.surface }]}>
          {calendarDays.map((day, i) => {
            if (day === null) {
              return <View key={`empty-${i}`} style={styles.dayCell} />;
            }
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasTasks = !!monthTasks[dateStr];
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === todayStr;
            const tasks = monthTasks[dateStr] || [];
            const hasWatering = tasks.some(t => t.type === 'watering');
            const hasReminder = tasks.some(t => t.type === 'reminder');

            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.dayCell,
                  isSelected && [styles.dayCellSelected, { backgroundColor: colors.chipActiveBg, borderColor: colors.tint }],
                  isToday && !isSelected && [styles.dayCellToday, { borderColor: colors.tint }],
                ]}
                onPress={() => setSelectedDate(dateStr)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayText,
                  { color: colors.text },
                  isToday && { color: colors.tint, fontWeight: '700' },
                ]}>
                  {day}
                </Text>
                {hasTasks && (
                  <View style={styles.dotsRow}>
                    {hasWatering && <View style={[styles.dot, { backgroundColor: '#2e7d32' }]} />}
                    {hasReminder && <View style={[styles.dot, { backgroundColor: '#f57c00' }]} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2e7d32' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('calendar.watering')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f57c00' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('calendar.reminder')}</Text>
          </View>
        </View>

        {/* Selected day tasks */}
        {selectedDate && (
          <View style={[styles.taskSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.taskDateTitle, { color: colors.text }]}>
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString(isIT ? 'it-IT' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            {selectedTasks.length === 0 ? (
              <Text style={[styles.noTasksText, { color: colors.textMuted }]}>{t('calendar.noTasks')}</Text>
            ) : (
              selectedTasks.map(task => (
                <View key={task.id} style={[styles.taskRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={[styles.taskIcon, { backgroundColor: task.type === 'watering' ? '#e8f5e9' : '#fff3e0' }]}>
                    <Ionicons
                      name={task.type === 'watering' ? 'water' : 'alarm'}
                      size={18}
                      color={task.type === 'watering' ? '#2e7d32' : '#f57c00'}
                    />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskPlantName, { color: colors.text }]}>{task.plantName}</Text>
                    <Text style={[styles.taskType, { color: colors.textSecondary }]}>
                      {task.type === 'watering' ? t('calendar.watering') : task.reminderLabel}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.completeButton, task.completed && { backgroundColor: colors.chipActiveBg, borderColor: colors.tint }]}
                    onPress={() => handleCompleteTask(task)}
                    disabled={task.completed}
                  >
                    {task.completed ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.tint} />
                    ) : (
                      <Text style={[styles.completeText, { color: colors.tint }]}>{t('calendar.complete')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  dayNameCell: {
    flex: 1,
    alignItems: 'center',
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 16,
    paddingBottom: 8,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayCellSelected: {
    borderWidth: 1.5,
    borderRadius: 8,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  taskSection: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  taskDateTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  noTasksText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  taskIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskPlantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskType: {
    fontSize: 12,
    marginTop: 2,
  },
  completeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  completeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
