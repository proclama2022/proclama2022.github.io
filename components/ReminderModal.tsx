import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Alert, SafeAreaView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Themed';
import { createReminder } from '@/services/reminderService';
import * as Haptics from 'expo-haptics';

type ReminderType = 'fertilize' | 'repot' | 'prune' | 'custom';

interface ReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  plantId: string;
  plantName: string;
}

export function ReminderModal({
  visible,
  onClose,
  onCreate,
  plantId,
  plantName,
}: ReminderModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState<ReminderType>('fertilize');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const types: { key: ReminderType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: 'fertilize', icon: 'flask', label: 'Fertilize' },
    { key: 'repot', icon: 'leaf-outline', label: 'Repot' },
    { key: 'prune', icon: 'git-branch-outline', label: 'Prune' },
    { key: 'custom', icon: 'create-outline', label: 'Custom' },
  ];

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    // Validate: past dates not allowed
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reminderDate = new Date(selectedDate);
    reminderDate.setHours(0, 0, 0, 0);

    if (reminderDate < today) {
      Alert.alert('Invalid Date', 'Reminders must be scheduled for today or future dates.');
      return;
    }

    // Validate: custom type requires label
    if (selectedType === 'custom' && !customLabel.trim()) {
      Alert.alert('Label Required', 'Please enter a label for custom reminders.');
      return;
    }

    setIsCreating(true);
    try {
      await createReminder(
        plantId,
        selectedType,
        selectedDate,
        selectedType === 'custom' ? customLabel : undefined
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form
      setSelectedType('fertilize');
      setSelectedDate(new Date());
      setCustomLabel('');

      onCreate();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to create reminder. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.modalContainer, { paddingBottom: insets.bottom }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Reminder</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Plant name */}
            <Text style={styles.plantName}>{plantName}</Text>

            {/* Type selection chips */}
            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.chipsContainer}>
              {types.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.chip,
                    selectedType === type.key && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={selectedType === type.key ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      selectedType === type.key && styles.chipTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom label input */}
            {selectedType === 'custom' && (
              <>
                <Text style={styles.sectionLabel}>Label</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter reminder label..."
                  value={customLabel}
                  onChangeText={setCustomLabel}
                  autoFocus
                />
              </>
            )}

            {/* Date picker button */}
            <Text style={styles.sectionLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                {selectedDate.toLocaleDateString()}
              </Text>
              <Ionicons name="calendar" size={20} color="#2e7d32" />
            </TouchableOpacity>

            {/* Hidden date picker */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

            {/* Create button */}
            <TouchableOpacity
              style={[styles.createButton, isCreating && styles.createButtonDisabled]}
              onPress={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <Text style={styles.createButtonText}>Creating...</Text>
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createButtonText}>Create Reminder</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  plantName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginTop: 8,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
