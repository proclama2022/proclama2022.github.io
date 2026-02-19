# Technology Stack

**Analysis Date:** 2026-02-19

## Languages

**Primary:**
- TypeScript 5.9.2 - Used for all source code with strict mode enabled
- JavaScript (ES2020+) - Runtime execution via Expo/React Native

**Secondary:**
- HTML/CSS - Used for web platform via React Native Web

## Runtime

**Environment:**
- React Native 0.81.5 - Cross-platform mobile runtime
- Expo 54.0.33 - Development platform and build system for React Native
- Node.js (LTS recommended) - Development environment

**Package Manager:**
- npm - Used for dependency management
- Lockfile: Present (`package-lock.json`)

## Frameworks

**Core:**
- React 19.1.0 - UI library for all platforms
- Expo Router 6.0.23 - File-based routing and navigation
- React Navigation Native 7.1.8 - Native navigation infrastructure
- React Native Web 0.21.0 - Web platform support layer

**UI/Components:**
- Reanimated 4.1.1 - Animation library for smooth transitions
- React Native Screens 4.16.0 - Native screen components
- React Native Safe Area Context 5.6.0 - Safe area management for notched devices
- Expo Vector Icons 15.0.3 - Icon library (FontAwesome integration)

**Device & Platform APIs:**
- Expo Camera 17.0.10 - Camera access for image capture
- Expo Image Picker 17.0.10 - Native image picker integration
- Expo Font 14.0.11 - Custom font loading
- Expo Constants 18.0.13 - App constants and configuration access
- Expo Status Bar 3.0.9 - Status bar management
- Expo Web Browser 15.0.10 - Native web browser integration
- Expo Linking 8.0.11 - Deep linking and URL handling
- Expo Splash Screen 31.0.13 - Splash screen management

**Storage & State:**
- AsyncStorage (via @react-native-async-storage/async-storage 2.2.0) - Local persistent storage for cache and rate limiting

**Worklets:**
- React Native Worklets 0.5.1 - Worklet support for performance-critical code

**Testing:**
- React Test Renderer 19.1.0 - Test renderer for React components

## Key Dependencies

**Critical:**
- `expo` (54.0.33) - Without this, the app cannot build or run
- `react-native` (0.81.5) - Core mobile runtime
- `expo-router` (6.0.23) - File-based routing is the primary navigation mechanism
- `expo-camera` (17.0.10) - Core feature for image capture in plant identification

**Infrastructure:**
- `@react-native-async-storage/async-storage` (2.2.0) - Local storage for caching and rate limiting
- `@react-navigation/native` (7.1.8) - Navigation state management
- `react-native-reanimated` (4.1.1) - Smooth animations and transitions
- `react-native-web` (0.21.0) - Enables web platform deployment

## Configuration

**Environment:**
- `.env` file present - Contains environment variables (contents protected)
- `EXPO_PUBLIC_PLANTNET_API_KEY` - Required for PlantNet API integration (checked via `process.env.EXPO_PUBLIC_PLANTNET_API_KEY`)
- Fallback to `Constants.expoConfig?.extra?.plantnetApiKey` from app.json

**Build:**
- `app.json` - Expo configuration at `/Users/martha2022/Documents/Claude code/Plantid/app.json`
  - App name: `plantid-temp`
  - Scheme: `plantidtemp`
  - New Architecture enabled
  - Typed routes enabled
- `tsconfig.json` - TypeScript compiler configuration at `/Users/martha2022/Documents/Claude code/Plantid/tsconfig.json`
  - Extends `expo/tsconfig.base`
  - Strict mode enabled
  - Path alias: `@/*` → root directory

## Platform Requirements

**Development:**
- Node.js (LTS)
- npm package manager
- macOS/Linux/Windows (Expo CLI support)
- iOS: Xcode (for iOS simulator testing)
- Android: Android SDK (for Android emulator testing)
- Expo Go app on physical devices (optional, for testing without local builds)

**Production:**
- **iOS**: App Store deployment via EAS Build (Expo Application Services)
- **Android**: Google Play Store deployment via EAS Build
- **Web**: Static hosting (outputs to `dist/` directory)
- Physical device with iOS 13+ or Android 5.0+ (when built as native app)

---

*Stack analysis: 2026-02-19*
