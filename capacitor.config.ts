import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gliderk.cakecalc',
  appName: 'CakeCost',
  webDir: 'dist',
  plugins: {
    AdMob: {
      testingDevices: [],
      initializeForTesting: false
    }
  }
};

export default config;
