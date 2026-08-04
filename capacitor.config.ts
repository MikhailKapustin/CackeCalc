import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gliderk.cakecalc',
  appName: 'CakeCost',
  webDir: 'dist',
  plugins: {
    AdMob: {
      testingDevices: [],
      initializeForTesting: false
    },
    CapacitorSQLite: {
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: "Biometric login for capacitor sqlite"
      }
    }
  }
};

export default config;
