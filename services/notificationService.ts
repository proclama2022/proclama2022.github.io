import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
