import { useEffect, useState } from 'react';
import { App, AppState } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useMobileFeatures = () => {
  const [appState, setAppState] = useState<AppState>({ isActive: true });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let appStateListener: any;
    let networkListener: any;
    let pushReceivedListener: any;
    let pushActionListener: any;

    const initMobileFeatures = async () => {
      // Initialize push notifications
      try {
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive === 'granted') {
          await PushNotifications.register();
        }
      } catch (error) {
        console.log('Push notification permission denied', error);
      }

      // Initialize local notifications
      try {
        await LocalNotifications.requestPermissions();
      } catch (error) {
        console.log('Local notification permission denied', error);
      }

      // App state change listener (detects app switch)
      appStateListener = await App.addListener('appStateChange', (state) => {
        setAppState(state);
        
        // Trigger haptic feedback when app becomes active
        if (state.isActive) {
          Haptics.impact({ style: ImpactStyle.Light });
        }
      });

      // Network status listener (offline mode)
      networkListener = await Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
      });

      // Push notification listeners
      pushReceivedListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification) => {
          console.log('Push notification received:', notification);
        }
      );

      pushActionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification) => {
          console.log('Push notification action performed:', notification);
        }
      );

      // Get initial network status
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };

    initMobileFeatures();

    // Cleanup
    return () => {
      appStateListener?.remove();
      networkListener?.remove();
      pushReceivedListener?.remove();
      pushActionListener?.remove();
    };
  }, []);

  return {
    appState,
    isOnline,
  };
};

// Schedule focus alert when user opens distracting apps
export const scheduleFocusAlert = async (appName: string) => {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '🎯 Stay Focused!',
          body: `You opened ${appName}. Remember your focus goals!`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'default',
          actionTypeId: 'FOCUS_ALERT',
          extra: {
            appName,
          },
        },
      ],
    });

    // Haptic feedback
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.error('Failed to schedule focus alert:', error);
  }
};

// Send push notification for task completion
export const sendTaskCompletionNotification = async (taskTitle: string) => {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title: '✅ Task Completed!',
          body: `Great job! You completed: ${taskTitle}`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 500) },
          sound: 'default',
        },
      ],
    });

    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.error('Failed to send task completion notification:', error);
  }
};

// Background task reminder
export const scheduleBackgroundReminder = async (title: string, body: string, scheduleAt: Date) => {
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          schedule: { at: scheduleAt },
          sound: 'default',
          actionTypeId: 'REMINDER',
        },
      ],
    });
  } catch (error) {
    console.error('Failed to schedule background reminder:', error);
  }
};
