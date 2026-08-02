import Constants from 'expo-constants';

/**
 * Enterprise Environment Configuration Helper
 * Resolves API Base URL dynamically for Expo Web, iOS, Android, and Physical Devices.
 */
export function getApiBaseUrl(): string {
  // 1. Environment variable override
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }

  // 2. Auto-detect host IP for physical device testing in Expo Go / Dev builds
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const hostIp = debuggerHost.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:3000`;
    }
  }

  // 3. Hard fallback — standalone/physical device builds have no debuggerHost,
  // so they always land here. Must point to the deployed backend, never localhost.
  return 'https://ecom-tau-bice.vercel.app';
}
