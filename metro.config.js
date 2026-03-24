const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Store original resolveRequest
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub out native-only modules for web
  if (platform === 'web') {
    const stubs = {
      // Force CJS version of zustand to avoid import.meta in ESM files
      'zustand/middleware': path.resolve(__dirname, 'node_modules/zustand/middleware.js'),
      'zustand': path.resolve(__dirname, 'node_modules/zustand/index.js'),
      'react-native-google-mobile-ads': path.resolve(__dirname, 'metro/stub.google-mobile-ads.js'),
      'react-native-purchases': path.resolve(__dirname, 'metro/stub.react-native-purchases.js'),
      'expo-notifications': path.resolve(__dirname, 'metro/stub.expo-notifications.js'),
      'expo-calendar': path.resolve(__dirname, 'metro/stub.expo-calendar.js'),
      'expo-sensors': path.resolve(__dirname, 'metro/stub.expo-sensors.js'),
      'expo-location': path.resolve(__dirname, 'metro/stub.expo-location.js'),
      'expo-secure-store': path.resolve(__dirname, 'metro/stub.expo-secure-store.js'),
      'expo-crypto': path.resolve(__dirname, 'metro/stub.expo-crypto.js'),
      'react-native-worklets': path.resolve(__dirname, 'metro/stub.react-native-worklets.js'),
      'react-native-reanimated': path.resolve(__dirname, 'metro/stub.react-native-reanimated.js'),
    };

    if (stubs[moduleName]) {
      return {
        filePath: stubs[moduleName],
        type: 'sourceFile',
      };
    }
  }

  // Fall back to default resolution
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
