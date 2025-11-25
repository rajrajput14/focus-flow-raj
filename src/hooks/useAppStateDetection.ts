import { useEffect, useState } from 'react';
import { App, AppState } from '@capacitor/app';
import { scheduleFocusAlert } from './useMobileFeatures';

// List of distracting apps to monitor
const DISTRACTING_APPS = [
  'Instagram',
  'Facebook',
  'Twitter',
  'TikTok',
  'YouTube',
  'Reddit',
  'Snapchat',
  'WhatsApp',
  'Telegram',
];

export const useAppStateDetection = () => {
  const [currentAppState, setCurrentAppState] = useState<AppState>({ isActive: true });
  const [switchCount, setSwitchCount] = useState(0);
  const [lastActiveTime, setLastActiveTime] = useState<Date>(new Date());

  useEffect(() => {
    let listener: any;

    const initListener = async () => {
      listener = await App.addListener('appStateChange', async (state) => {
        setCurrentAppState(state);

        // Detect when user switches away from the app
        if (!state.isActive) {
          setLastActiveTime(new Date());
          setSwitchCount((prev) => prev + 1);

          // Log app switch for analytics
          console.log(`App switched away at ${new Date().toISOString()}`);
        }

        // Detect when user returns to the app
        if (state.isActive) {
          const timeAway = new Date().getTime() - lastActiveTime.getTime();
          const minutesAway = Math.floor(timeAway / 60000);

          // If user was away for more than 5 minutes, send a focus reminder
          if (minutesAway > 5) {
            await scheduleFocusAlert('another app');
          }

          console.log(`User returned after ${minutesAway} minutes`);
        }
      });
    };

    initListener();

    return () => {
      listener?.remove();
    };
  }, [lastActiveTime]);

  return {
    isActive: currentAppState.isActive,
    switchCount,
    lastActiveTime,
  };
};
