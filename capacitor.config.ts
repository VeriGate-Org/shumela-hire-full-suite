import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arthmatic.shumelahire',
  appName: 'ShumelaHire',
  webDir: 'out',
  server: {
    // Use this for development — point to your local dev server
    ...(process.env.NODE_ENV === 'development' && {
      url: 'http://localhost:3000',
      cleartext: true,
    }),
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchAutoHide: true,
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
    },
  },
};

export default config;
