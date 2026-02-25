import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SavedPlant, Reminder } from '@/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: false,
  }),
});

/**
 * Initialize notification service (call on app startup)
 */
export async function initNotificationService(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('watering-reminders', {
      name: 'Watering Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2e7d32',
    });
  }
}

/**
 * Schedule a notification for a plant's next watering
 * @param plantId - ID of the plant
 * @param plantName - Display name of the plant
 * @param nextDate - When the next watering is due
 * @returns The notification ID for cancellation later
 */
export async function schedulePlantNotification(
  plantId: string,
  plantName: string,
  nextDate: Date
): Promise<string> {
  // Get notification settings for preferred time
  const hour = nextDate.getHours();
  const minute = nextDate.getMinutes();

  let trigger: Notifications.NotificationTriggerInput;

  if (Platform.OS === 'android') {
    // Android: Use daily trigger at specified time
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };
  } else {
    // iOS: Use calendar trigger with repeats
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      hour,
      minute,
    };
  }

  const notificationContent: Notifications.NotificationContentInput = {
    title: 'Watering Reminder',
    body: `${plantName} needs water today`,
    data: { plantId },
    sound: 'default',
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger,
  });

  return notificationId;
}

/**
 * Cancel a scheduled notification
 * @param notificationId - ID of the notification to cancel
 */
export async function cancelPlantNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all notifications for specific plants
 * @param plantIds - Array of plant IDs to cancel notifications for
 */
export async function cancelAllPlantNotifications(plantIds: string[]): Promise<void> {
  const allScheduled = await Notifications.getAllScheduledNotificationsAsync();

  // Filter notifications that belong to the given plants
  const toCancel = allScheduled.filter((notification) => {
    const plantId = notification.content.data?.plantId as string | undefined;
    return plantId && plantIds.includes(plantId);
  });

  // Cancel in batch
  await Promise.all(
    toCancel.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(notification.identifier)
    )
  );
}

/**
 * Request notification permissions from the user
 * @returns True if permission granted
 */
export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Check current notification permission status
 * @returns 'granted' | 'denied' | 'undetermined'
 */
export async function checkPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  const { status } = await Notifications.getPermissionsAsync();

  if (status === 'granted') {
    return 'granted';
  }

  if (Platform.OS === 'ios') {
    const iosStatus = status as Notifications.PermissionStatus;
    if (iosStatus === 'denied') {
      return 'denied';
    }
  }

  return 'undetermined';
}

/**
 * Schedule a daily digest notification listing all plants due for watering
 * @param plants - Array of all saved plants
 * @param time - Time string in "HH:mm" format (default "08:00")
 */
export async function scheduleDailyDigest(
  plants: SavedPlant[],
  time: string = '08:00'
): Promise<void> {
  // Parse time string to hour/minute
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Cancel existing daily digest notification
  await Notifications.cancelScheduledNotificationAsync('daily-watering-digest');

  // Get today's date in ISO format (local timezone)
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];

  // Filter plants due today
  const duePlants = plants.filter((plant) => {
    if (!plant.nextWateringDate) return false;
    const nextDate = new Date(plant.nextWateringDate);
    const nextISO = nextDate.toISOString().split('T')[0];
    return nextISO === todayISO;
  });

  // If no plants due, return early (don't show empty notification)
  if (duePlants.length === 0) {
    return;
  }

  // Build plant names list
  const plantNames = duePlants
    .map((p) => p.nickname || p.commonName || p.species)
    .slice(0, 3);

  let plantNamesStr: string;
  if (duePlants.length <= 3) {
    plantNamesStr = plantNames.join(', ');
  } else {
    plantNamesStr = `${plantNames.join(', ')} and ${duePlants.length - 3} more...`;
  }

  // Platform-specific trigger
  let trigger: Notifications.NotificationTriggerInput;

  if (Platform.OS === 'android') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };
  } else {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: true,
      hour,
      minute,
    };
  }

  const notificationContent: Notifications.NotificationContentInput = {
    title: 'Watering Reminder',
    body: `${plantNamesStr} need water today`,
    sound: 'default',
    categoryIdentifier: 'watering',
  };

  // Schedule notification with fixed identifier for cancellation
  await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger,
    identifier: 'daily-watering-digest',
  });
}

export interface ReminderScheduleInput {
  plantId: string;
  plantName: string;
  reminderType: 'fertilize' | 'repot' | 'prune' | 'custom';
  customLabel?: string;
  reminderDate: Date;
  notificationTime: string; // "HH:mm" format from Settings
}

/**
 * Schedule a one-time reminder notification for custom care tasks
 * @param input - Reminder scheduling parameters
 * @returns The notification ID for cancellation later
 */
export async function scheduleReminderNotification(
  input: ReminderScheduleInput
): Promise<string> {
  const { plantId, plantName, reminderType, customLabel, reminderDate, notificationTime } = input;

  // Parse notification time (e.g., "08:00")
  const [hourStr, minuteStr] = notificationTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Combine reminder date with notification time
  const scheduledDate = new Date(reminderDate);
  scheduledDate.setHours(hour, minute, 0, 0);

  // Don't schedule if date is in the past
  if (scheduledDate < new Date()) {
    throw new Error('Cannot schedule reminder in the past');
  }

  // Platform-specific trigger (one-time, not recurring)
  let trigger: Notifications.NotificationTriggerInput;

  if (Platform.OS === 'android') {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      year: scheduledDate.getFullYear(),
      month: scheduledDate.getMonth() + 1,
      day: scheduledDate.getDate(),
      hour,
      minute,
    };
  } else {
    trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      repeats: false,
      year: scheduledDate.getFullYear(),
      month: scheduledDate.getMonth() + 1,
      day: scheduledDate.getDate(),
      hour,
      minute,
    };
  }

  // Build notification content
  const typeLabel = customLabel || reminderType.charAt(0).toUpperCase() + reminderType.slice(1);
  const notificationContent: Notifications.NotificationContentInput = {
    title: `${typeLabel} Reminder`,
    body: `Time to ${typeLabel.toLowerCase()} ${plantName}`,
    data: {
      plantId,
      reminderType,
      reminderId: `${plantId}-${reminderType}-${Date.now()}`,
    },
    sound: 'default',
    categoryIdentifier: 'reminder',
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: notificationContent,
    trigger,
  });

  return notificationId;
}

/**
 * Cancel a reminder notification
 * @param notificationId - ID of the notification to cancel
 */
export async function cancelReminderNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Reschedule a reminder notification (cancel old, create new)
 * @param oldNotificationId - ID of the old notification to cancel
 * @param newInput - New reminder scheduling parameters
 * @returns The new notification ID
 */
export async function rescheduleReminderNotification(
  oldNotificationId: string,
  newInput: ReminderScheduleInput
): Promise<string> {
  await cancelReminderNotification(oldNotificationId);
  return scheduleReminderNotification(newInput);
}
