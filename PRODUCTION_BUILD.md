# Production Build Instructions for Focus Flow Mobile

## Overview
This guide covers how to build Focus Flow for production deployment on iOS and Android devices.

## Prerequisites

1. **Export to GitHub**
   - Click "Export to GitHub" in Lovable
   - Clone your repository locally

2. **Install Dependencies**
   ```bash
   git clone <your-repo-url>
   cd focus-flow-raj
   npm install
   ```

3. **Add Capacitor Platforms** (if not already added)
   ```bash
   npx cap add ios
   npx cap add android
   ```

## Step 1: Switch to Production Mode

### Update capacitor.config.ts

**IMPORTANT:** Remove the `server` configuration block for production builds.

**Development Mode (Hot Reload):**
```typescript
server: {
  url: 'https://513c206d-a9fa-4794-b9a4-647cf01d5f63.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

**Production Mode:**
```typescript
// Remove or comment out the entire server block
// server: {
//   url: '...',
//   cleartext: true
// }
```

Your `capacitor.config.ts` should look like this for production:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focusflow.app',
  appName: 'Focus Flow',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#8B5CF6'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      iosSpinnerStyle: 'small',
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
```

## Step 2: Build the Web App

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

## Step 3: Sync with Native Projects

```bash
npx cap sync
```

This copies web assets to native projects and updates native dependencies.

## Step 4: Configure App Icons and Splash Screens

✅ **Your Custom Assets Are Ready:**
- `public/app-icon.png` - Custom "FF" logo (app icon)
- `public/splash-screen.png` - Custom fingerprint design (splash screen)

### Option A: Automated Setup with @capacitor/assets (Recommended)

1. **Install the assets tool:**
   ```bash
   npm install -g @capacitor/assets
   ```

2. **Create assets folder and copy your custom images:**
   ```bash
   mkdir -p assets
   cp public/app-icon.png assets/icon.png
   cp public/splash-screen.png assets/splash.png
   ```

4. **Generate all sizes:**
   ```bash
   npx capacitor-assets generate
   ```
   
   This automatically generates all required icon and splash screen sizes for iOS and Android!

### What Gets Generated:

**iOS:**
- AppIcon.appiconset with all required sizes (20pt to 1024pt)
- Splash.imageset with adaptive splash screens

**Android:**
- mipmap folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- drawable folders for splash screens (default, land, port)

### Option B: Manual Setup (If You Prefer Manual Control)

#### iOS Icons (Xcode)

1. Open `ios/App/App.xcworkspace` in Xcode
2. In Project Navigator, go to `App > Assets.xcassets > AppIcon`
3. Drag and drop your icon images for each size:
   - 20×20, 29×29, 40×40, 58×58, 60×60, 76×76, 80×80, 87×87, 120×120, 152×152, 167×167, 180×180, 1024×1024

#### iOS Splash Screen (Xcode)

1. In Xcode, go to `App > Assets.xcassets > Splash`
2. Add your splash screen images
3. Edit `LaunchScreen.storyboard` if needed

#### Android Icons (Android Studio)

1. Place icons in `android/app/src/main/res/`:
   - `mipmap-mdpi/ic_launcher.png` (48×48)
   - `mipmap-hdpi/ic_launcher.png` (72×72)
   - `mipmap-xhdpi/ic_launcher.png` (96×96)
   - `mipmap-xxhdpi/ic_launcher.png` (144×144)
   - `mipmap-xxxhdpi/ic_launcher.png` (192×192)

#### Android Splash Screen (Android Studio)

1. Place splash images in:
   - `drawable/splash.png`
   - `drawable-land/splash.png` (landscape)
   - `drawable-port/splash.png` (portrait)

## Step 5: Add Required Permissions

### iOS Permissions (Info.plist)

Open `ios/App/App/Info.plist` and add:

```xml
<key>NSFaceIDUsageDescription</key>
<string>Focus Flow uses Face ID to securely log you in to your account.</string>

<key>NSCameraUsageDescription</key>
<string>Focus Flow needs camera access for profile pictures and attachments.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Focus Flow needs photo library access to attach images to tasks and notes.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Focus Flow needs microphone access for voice task input.</string>
```

### Android Permissions (AndroidManifest.xml)

Open `android/app/src/main/AndroidManifest.xml` and add:

```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
<uses-permission android:name="android.permission.USE_FINGERPRINT" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

## Step 6: Build and Run

### iOS (Mac with Xcode required)

```bash
# Open in Xcode
npx cap open ios
```

In Xcode:
1. Select your development team in Signing & Capabilities
2. Choose a target device or simulator
3. Click the Play button (▶️) to build and run

### Android (Android Studio required)

```bash
# Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to complete
2. Select a device or emulator
3. Click Run (▶️)

## Step 7: Testing Checklist

- [ ] App icon displays correctly
- [ ] Splash screen shows on launch
- [ ] Biometric authentication works (on device with biometrics)
- [ ] All navigation works
- [ ] Tasks, habits, notes sync properly
- [ ] Offline mode functions
- [ ] Notifications appear correctly
- [ ] Camera/photo permissions work

## Troubleshooting

### "Could not find module" errors
```bash
cd ios/App
pod install
cd ../..
```

### Android build failures
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Biometric not working
- Test on a real device (not all simulators support biometrics)
- Ensure biometric is set up in device settings
- Check permissions in native project settings

### Assets not updating
```bash
npm run build
npx cap copy
npx cap sync
```

## Publishing to App Stores

### iOS App Store

1. **Create App Store Connect Record**
   - Go to appstoreconnect.apple.com
   - Create new app with your bundle ID

2. **Archive in Xcode**
   - Product > Archive
   - Upload to App Store Connect

3. **Submit for Review**
   - Add screenshots, description, keywords
   - Submit for Apple review

### Google Play Store

1. **Create Play Console Account**
   - Go to play.google.com/console
   - Create new application

2. **Generate Signed APK/Bundle**
   - In Android Studio: Build > Generate Signed Bundle/APK
   - Choose Android App Bundle (recommended)

3. **Upload to Play Console**
   - Create release in Play Console
   - Upload AAB file
   - Add store listing details
   - Submit for review

## Continuous Integration

For automated builds, consider setting up:
- **iOS:** Fastlane or Xcode Cloud
- **Android:** Fastlane or GitHub Actions

## Support

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Developer Program](https://developer.apple.com/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
