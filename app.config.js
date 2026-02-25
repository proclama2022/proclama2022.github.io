const IS_DEV = process.env.NODE_ENV !== 'production';

export default {
  expo: {
    name: "plantid-temp",
    slug: "plantid-temp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "plantidtemp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "com.plantid.app",
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "@react-native-community/datetimepicker",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: process.env.ADMOB_ANDROID_APP_ID,
          iosAppId: process.env.ADMOB_IOS_APP_ID,
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    // AdMob configuration will be added in Task 1
    extra: {
      // Environment variables that should be available in the app
      ...(IS_DEV && {
        REVENUECAT_API_KEY: process.env.REVENUECAT_API_KEY,
      }),
    },
  }
};
