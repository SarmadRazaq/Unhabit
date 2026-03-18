import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    SplashScreen,
    LocationPermissionScreen,
    NotificationPermissionScreen,
    OnboardingTutorialScreen,
    OnboardingWelcomeScreen,
    HomeScreen,
    WelcomeScreen,
    LoginScreen,
    HabitInputScreen,
    HabitSuccessScreen,
    QuestionsScreen,
    PreparingPlanScreen,
    NiceWorkScreen,
    JourneyPreviewScreen,
    ProfileScreen,
    NotificationsScreen,
    HabitManagementScreen,
    JourneyDayViewScreen,
    FocusTimerScreen,
    ChallengesScreen,
    RecoveryScreen,
    StreakFreezeScreen,
    DailyCompletionScreen,
    StreakDetailsScreen,
    BuddyProfileScreen,
    SettingsScreen,
    SupportScreen,
} from '../screens';
import { NotificationManager } from '../services/NotificationManager';
import { MainTabNavigator } from './MainTabNavigator';
import { GlobalFocusTimerBanner } from '../components/common';

export type RootStackParamList = {
    Splash: undefined;
    LocationPermission: undefined;
    NotificationPermission: undefined;
    OnboardingTutorial: undefined;
    Welcome: undefined;
    Login: undefined;
    HabitInput: undefined;
    HabitSuccess: { habit: string };
    Questions: { habitDescription?: string; habitCategory?: string } | undefined;
    PreparingPlan: { answers?: Record<string, string> };
    NiceWork: undefined;
    JourneyPreview: { journeyId?: string };
    Home: undefined;
    MainTabs: undefined;
    Profile: undefined;
    Notifications: undefined;
    OnboardingWelcome: { habitDescription?: string } | undefined;
    HabitManagement: undefined;
    JourneyDayView: { dayNumber?: number };
    FocusTimer: undefined;
    Challenges: undefined;
    Recovery: undefined;
    StreakFreeze: undefined;
    DailyCompletion: { streakCount?: number; xpEarned?: number; dayCompleted?: number };
    StreakDetails: undefined;
    BuddyProfile: { buddyId: string; buddyName?: string; buddyAvatar?: string };
    Settings: undefined;
    Support: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const RootNavigator = () => {
    return (
        <NavigationContainer ref={navigationRef}>
            <NotificationManager />
            <Stack.Navigator
                initialRouteName="Splash"
                screenOptions={{
                    headerShown: false,
                }}
            >
                {/* Splash decides routing: auth check → onboarding or main app */}
                <Stack.Screen name="Splash" component={SplashScreen} />

                {/* ── Pre-auth / onboarding screens ── */}
                <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
                <Stack.Screen name="NotificationPermission" component={NotificationPermissionScreen} />
                <Stack.Screen name="OnboardingTutorial" component={OnboardingTutorialScreen} />
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />

                {/* ── Post-login onboarding flow ── */}
                <Stack.Screen name="HabitInput" component={HabitInputScreen} />
                <Stack.Screen name="HabitSuccess" component={HabitSuccessScreen} />
                <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
                <Stack.Screen name="Questions" component={QuestionsScreen} />
                <Stack.Screen name="PreparingPlan" component={PreparingPlanScreen} />
                <Stack.Screen name="NiceWork" component={NiceWorkScreen} />
                <Stack.Screen name="JourneyPreview" component={JourneyPreviewScreen} />

                {/* ── Main app screens ── */}
                <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ gestureEnabled: false }} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="HabitManagement" component={HabitManagementScreen} />
                <Stack.Screen name="JourneyDayView" component={JourneyDayViewScreen} />
                <Stack.Screen name="FocusTimer" component={FocusTimerScreen} />
                <Stack.Screen name="Challenges" component={ChallengesScreen} />
                <Stack.Screen name="Recovery" component={RecoveryScreen} />
                <Stack.Screen name="StreakFreeze" component={StreakFreezeScreen} />
                <Stack.Screen name="DailyCompletion" component={DailyCompletionScreen} />
                <Stack.Screen name="StreakDetails" component={StreakDetailsScreen} />
                <Stack.Screen name="BuddyProfile" component={BuddyProfileScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Support" component={SupportScreen} />
            </Stack.Navigator>
            <GlobalFocusTimerBanner navigationRef={navigationRef} />
        </NavigationContainer>
    );
};

export default RootNavigator;
