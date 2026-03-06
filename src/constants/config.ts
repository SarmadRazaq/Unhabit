// App configuration constants

export const APP_CONFIG = {
  name: 'Unhabit',
  version: '1.0.0',
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    'https://api.khurasanlabs.com/api',
  aiBaseUrl:
    process.env.EXPO_PUBLIC_AI_BASE_URL ||
    'https://py.khurasanlabs.com',
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
} as const;

export const STORAGE_KEYS = {
  // SecureStore keys (must match keys in authSlice.ts and api.ts)
  USER_TOKEN: 'userToken',
  REFRESH_TOKEN: 'refreshToken',
  // AsyncStorage keys
  USER_DATA: '@unhabit/user_data',
  SETTINGS: '@unhabit/settings',
  ONBOARDING_COMPLETE: '@unhabit/onboarding_complete',
} as const;

export const SCREEN_NAMES = {
  // Define your screen names here for type-safe navigation
  HOME: 'Home',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  ONBOARDING: 'Onboarding',
} as const;

