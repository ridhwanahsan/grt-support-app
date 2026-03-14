import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grtsupport.app',
  appName: 'GRT Support',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true, // Enables HTTP connection for local testing/WP integration
    allowNavigation: ['*']
  }
};

export default config;
