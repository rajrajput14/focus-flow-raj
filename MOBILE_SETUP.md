# Focus Flow - Mobile App Setup Guide

Your Focus Flow app has been converted to a native mobile app using Capacitor! 🎉

## What's Been Added

### Mobile-Exclusive Features ✨
- **Push Notifications** - Get alerts for tasks, habits, and focus sessions
- **App State Detection** - Tracks when you switch apps and sends focus reminders
- **Background Tasks** - Schedule reminders that work even when the app is closed
- **Offline Mode** - Full app functionality without internet connection
- **Focus Alerts** - Notifications when you open distracting apps
- **Haptic Feedback** - Tactile responses for actions
- **Mobile UI Components**:
  - Bottom navigation bar for easy mobile navigation
  - Floating action button for quick task creation
  - Offline indicator banner
  - Gesture-optimized interfaces

### Current Development Mode
Your app is currently configured for **hot-reload development**, meaning you can develop and test changes instantly on real devices without rebuilding.

---

## How to Run on Your Device

### Prerequisites
1. **Export your project to GitHub**:
   - Click the "Export to GitHub" button in Lovable
   - Clone the repository to your local machine

2. **Install dependencies**:
   ```bash
   cd focus-flow-raj
   npm install
   ```

3. **Initialize Capacitor platforms**:
   ```bash
   # Run this ONLY ONCE to set up Capacitor
   npx cap init
   
   # Add iOS platform (requires Mac with Xcode)
   npx cap add ios
   
   # Add Android platform
   npx cap add android
   ```

4. **Update native dependencies**:
   ```bash
   # For iOS
   npx cap update ios
   
   # For Android
   npx cap update android
   ```

### Running on iOS (Mac only)
1. Build the web app:
   ```bash
   npm run build
   npx cap sync ios
   ```

2. Open Xcode:
   ```bash
   npx cap open ios
   ```

3. In Xcode:
   - Select your device or simulator
   - Click the Play button to build and run

**Requirements**:
- Mac computer
- Xcode installed
- Apple Developer account (for real device testing)

### Running on Android
1. Build the web app:
   ```bash
   npm run build
   npx cap sync android
   ```

2. Open Android Studio:
   ```bash
   npx cap open android
   ```

3. In Android Studio:
   - Wait for Gradle sync to complete
   - Select your device or emulator
   - Click Run

**Requirements**:
- Android Studio installed
- Android device with USB debugging enabled, or Android emulator

### Quick Development Run
For faster development testing:
```bash
# For Android
npx cap run android

# For iOS (Mac only)
npx cap run ios
```

---

## Hot-Reload Development

Your app is configured to load from the Lovable preview URL, which means:
- Changes you make in Lovable appear instantly on your device
- No need to rebuild after every change
- Perfect for rapid development and testing

**Current preview URL**: 
`https://513c206d-a9fa-4794-b9a4-647cf01d5f63.lovableproject.com`

---

## Switching to Production Mode

When you're ready to publish to app stores, you need to switch from hot-reload to production mode:

1. **Build your production bundle**:
   ```bash
   npm run build
   ```

2. **Update `capacitor.config.ts`**:
   ```typescript
   import { CapacitorConfig } from '@capacitor/cli';

   const config: CapacitorConfig = {
     appId: 'app.lovable.513c206da9fa4794b9a4647cf01d5f63',
     appName: 'Focus Flow',
     webDir: 'dist',
     // Remove the 'server' section for production
   };

   export default config;
   ```

3. **Sync your changes**:
   ```bash
   npx cap sync
   ```

---

## Testing Mobile Features

### Push Notifications
- Notifications are automatically requested on first app launch
- Test by completing tasks or creating habits
- Background notifications work even when app is closed

### App State Detection
- Switch between apps to test focus alerts
- After 5+ minutes away, you'll get a focus reminder
- Check console logs to see app state changes

### Offline Mode
- Turn off wifi/mobile data
- App continues to work fully
- Changes sync automatically when back online
- Watch for the offline indicator banner

### Voice-to-Task
- Your existing voice task feature works on mobile
- Uses device's native speech recognition
- Requires microphone permissions

---

## Publishing to App Stores

### iOS App Store
1. Configure app icons and splash screens in Xcode
2. Set up App Store Connect account
3. Configure signing certificates
4. Archive and upload build
5. Submit for review

### Google Play Store
1. Configure app icons and splash screens in Android Studio
2. Create Google Play Console account
3. Generate signed APK/AAB
4. Upload to Play Console
5. Submit for review

---

## Troubleshooting

### Build Errors
- Always run `npm install` after pulling changes
- Run `npx cap sync` after adding new Capacitor plugins
- Clean build folders: `npx cap sync --clean`

### Device Not Detected
- **iOS**: Ensure device is trusted in Settings
- **Android**: Enable USB debugging in Developer Options

### Permissions Not Working
- Check platform-specific permission configurations
- iOS: Update `Info.plist` with permission descriptions
- Android: Update `AndroidManifest.xml` with required permissions

### Hot-Reload Not Working
- Ensure device and computer are on same network
- Check firewall settings
- Verify preview URL in `capacitor.config.ts`

---

## Next Steps

1. **Test all features** on real devices
2. **Customize app icons** and splash screens
3. **Configure permissions** for camera, location, etc.
4. **Set up analytics** for mobile usage tracking
5. **Prepare store listings** with screenshots and descriptions

---

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Publishing Guide](https://capacitorjs.com/docs/ios)
- [Android Publishing Guide](https://capacitorjs.com/docs/android)
- [Lovable Documentation](https://docs.lovable.dev)

---

## Support

Need help? Check out:
- Capacitor Discord community
- Lovable support documentation
- Stack Overflow for specific issues

Happy mobile app development! 🚀
