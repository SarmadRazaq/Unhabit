import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

// Navigation prop types for each screen
export type LocationPermissionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LocationPermission'
>;

export type NotificationPermissionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'NotificationPermission'
>;

export type OnboardingTutorialNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'OnboardingTutorial'
>;

export type HomeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;

