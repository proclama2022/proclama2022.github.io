import { scheduleReminderNotification, cancelReminderNotification } from './notificationService';
import { Reminder } from '@/types';
import { usePlantsStore } from '@/stores/plantsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import * as Haptics from 'expo-haptics';

/**
 * Create a new reminder for a plant
 */
export async function createReminder(
  plantId: string,
  type: Reminder['type'],
  date: Date,
  customLabel?: string
): Promise<Reminder> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  // Get notification time from settings
  const notificationTime = useSettingsStore.getState().notificationTime;

  // Schedule notification
  const notificationId = await scheduleReminderNotification({
    plantId,
    plantName: plant.nickname || plant.commonName || plant.species,
    reminderType: type,
    customLabel,
    reminderDate: date,
    notificationTime,
  });

  // Create reminder object
  const reminder: Reminder = {
    id: crypto.randomUUID(),
    type,
    customLabel,
    date: date.toISOString(),
    completed: false,
    notificationId,
  };

  // Update plant
  usePlantsStore.getState().updatePlant(plantId, {
    reminders: [...(plant.reminders || []), reminder],
  });

  // Haptic feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  return reminder;
}

/**
 * Update an existing reminder (reschedules notification)
 */
export async function updateReminder(
  plantId: string,
  reminderId: string,
  updates: Partial<Pick<Reminder, 'type' | 'date' | 'customLabel'>>
): Promise<void> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const reminder = plant.reminders?.find((r) => r.id === reminderId);
  if (!reminder) throw new Error('Reminder not found');

  // Cancel old notification
  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  // Get notification time from settings
  const notificationTime = useSettingsStore.getState().notificationTime;

  // Schedule new notification
  const newNotificationId = await scheduleReminderNotification({
    plantId,
    plantName: plant.nickname || plant.commonName || plant.species,
    reminderType: updates.type || reminder.type,
    customLabel: updates.customLabel !== undefined ? updates.customLabel : reminder.customLabel,
    reminderDate: updates.date ? new Date(updates.date) : new Date(reminder.date),
    notificationTime,
  });

  // Update reminder
  const updatedReminders = plant.reminders?.map((r) =>
    r.id === reminderId
      ? { ...r, ...updates, notificationId: newNotificationId }
      : r
  );

  usePlantsStore.getState().updatePlant(plantId, { reminders: updatedReminders });
}

/**
 * Delete a reminder (cancels notification)
 */
export async function deleteReminder(plantId: string, reminderId: string): Promise<void> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const reminder = plant.reminders?.find((r) => r.id === reminderId);
  if (!reminder) throw new Error('Reminder not found');

  // Cancel notification
  if (reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  // Remove reminder from plant
  const updatedReminders = plant.reminders?.filter((r) => r.id !== reminderId);
  usePlantsStore.getState().updatePlant(plantId, { reminders: updatedReminders });

  // Haptic feedback
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * Toggle reminder completion state
 */
export async function toggleReminderComplete(plantId: string, reminderId: string): Promise<void> {
  const plant = usePlantsStore.getState().getPlant(plantId);
  if (!plant) throw new Error('Plant not found');

  const reminder = plant.reminders?.find((r) => r.id === reminderId);
  if (!reminder) throw new Error('Reminder not found');

  const wasCompleted = reminder.completed;
  const updatedReminders = plant.reminders?.map((r) =>
    r.id === reminderId ? { ...r, completed: !r.completed } : r
  );

  usePlantsStore.getState().updatePlant(plantId, { reminders: updatedReminders });

  // Cancel notification if marking complete (prevent future notification for completed task)
  if (!wasCompleted && reminder.notificationId) {
    await cancelReminderNotification(reminder.notificationId);
  }

  // Haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
