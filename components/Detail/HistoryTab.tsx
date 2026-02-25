import React, { useState, useMemo } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { usePlantsStore } from '@/stores/plantsStore';
import { Text } from '@/components/Themed';
import { ReminderFab } from './ReminderFab';
import { ReminderModal } from '@/components/ReminderModal';
import { toggleReminderComplete, deleteReminder, updateReminder } from '@/services/reminderService';
import { Reminder, WaterEvent } from '@/types';
import * as Haptics from 'expo-haptics';

type TimelineItem = (WaterEvent & { itemType: 'water' }) | (Reminder & { itemType: 'reminder' });

export function HistoryTab() {
  const { id: plantId } = useLocalSearchParams<{ id: string }>();
  const plant = usePlantsStore((state) => state.getPlant(plantId));
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Merge and sort watering events + reminders by date (most recent first)
  const timeline: TimelineItem[] = useMemo(() => {
    if (!plant) return [];

    const items: TimelineItem[] = [
      // Watering events
      ...plant.waterHistory.map((w) => ({ ...w, itemType: 'water' as const })),
      // Reminders
      ...(plant.reminders || []).map((r) => ({ ...r, itemType: 'reminder' as const })),
    ];

    // Sort by date descending (most recent first)
    return items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [plant]);

  const handleToggleComplete = (reminderId: string) => {
    toggleReminderComplete(plantId, reminderId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLongPress = (reminder: Reminder) => {
    Alert.alert(
      reminder.customLabel || reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1),
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Reminder',
              'Are you sure you want to delete this reminder?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    deleteReminder(plantId, reminder.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  },
                },
              ]
            );
          },
        },
        {
          text: 'Edit',
          onPress: () => {
            setEditingReminder(reminder);
            setShowReminderModal(true);
          },
        },
      ]
    );
  };

  const handleCreateReminder = () => {
    setEditingReminder(null);
    setShowReminderModal(true);
  };

  const handleReminderSaved = () => {
    setShowReminderModal(false);
    setEditingReminder(null);
  };

  const renderTimelineItem = ({ item }: { item: TimelineItem }) => {
    if (item.itemType === 'water') {
      // Watering event
      return (
        <View style={styles.item}>
          <Ionicons name="water" size={20} color="#2e7d32" />
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle}>Watered</Text>
            <Text style={styles.itemDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
          </View>
        </View>
      );
    } else {
      // Reminder
      return (
        <TouchableOpacity
          style={[
            styles.item,
            item.completed && styles.itemCompleted,
          ]}
          onLongPress={() => handleLongPress(item)}
          onPress={() => handleToggleComplete(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={getTypeIcon(item.type)}
            size={20}
            color={item.completed ? '#999' : '#ff9800'}
          />
          <View style={styles.itemContent}>
            <Text
              style={[
                styles.itemTitle,
                item.completed && styles.itemTitleCompleted,
              ]}
            >
              {item.customLabel || item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
            <Text style={styles.itemDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          <Ionicons
            name={item.completed ? 'checkmark-circle' : 'radio-button-off'}
            size={20}
            color={item.completed ? '#2e7d32' : '#ccc'}
          />
        </TouchableOpacity>
      );
    }
  };

  if (!plant) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Plant not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FAB */}
      <ReminderFab onPress={handleCreateReminder} />

      {/* Timeline */}
      <FlatList
        data={timeline}
        renderItem={renderTimelineItem}
        keyExtractor={(item) => item.itemType === 'water' ? `water-${item.date}` : `reminder-${item.id}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptyDetail}>
              Tap + to add your first reminder or water this plant
            </Text>
          </View>
        }
      />

      {/* Reminder modal */}
      <ReminderModal
        visible={showReminderModal}
        onClose={() => {
          setShowReminderModal(false);
          setEditingReminder(null);
        }}
        onCreate={handleReminderSaved}
        plantId={plantId}
        plantName={plant.nickname || plant.commonName || plant.species}
        reminder={editingReminder ?? undefined}
      />
    </View>
  );
}

function getTypeIcon(type: Reminder['type']): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'fertilize':
      return 'flask';
    case 'repot':
      return 'leaf-outline';
    case 'prune':
      return 'git-branch-outline';
    case 'custom':
      return 'create-outline';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
  },
  itemCompleted: {
    opacity: 0.6,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 12,
  },
  emptyDetail: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  notFound: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});
