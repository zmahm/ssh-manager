import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.zesha.sshmanager',
  appName: 'SSH Manager',
  webDir: 'dist',
  // In dev: point to Vite dev server (comment out for production builds)
  // server: {
  //   url: 'http://10.0.2.2:5173',  // Android emulator → host machine
  //   cleartext: true,
  // },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0a0e1a',
  },
  ios: {
    backgroundColor: '#0a0e1a',
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
}

export default config
