import { Platform } from 'react-native'

// Metro injects `process.env`; declare it so TS in the Expo project is happy.
declare const process: { env: Record<string, string | undefined> }

// Dev API base URL. iOS simulator & web reach the host via localhost; the
// Android emulator uses 10.0.2.2. A physical device needs your machine's LAN
// IP — set EXPO_PUBLIC_API_URL to override.
const devHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost}:4000`
