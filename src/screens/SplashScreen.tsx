import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { COLORS, SPACING } from '../constants/theme';
import { Mascot } from '../components';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setCredentials, logout } from '../store/auth/authSlice';
import * as SecureStore from 'expo-secure-store';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { authApi } from '../services/api/auth';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
}

export const SplashScreen = ({ navigation }: SplashScreenProps) => {
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const dispatch = useAppDispatch();
    const hasNavigated = useRef(false);

    useEffect(() => {
        const checkAuth = async () => {
            // Give a brief splash display
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Guard against double navigation (e.g. if isAuthenticated changes mid-check)
            if (hasNavigated.current) return;

            try {
                const token = await SecureStore.getItemAsync('userToken');

                if (isAuthenticated) {
                    // Already authenticated in Redux — check onboarding status
                    hasNavigated.current = true;
                    const meResult = dispatch(authApi.endpoints.getMe.initiate(undefined));
                    try {
                        // Race the API call against a 5s timeout
                        const meData = await Promise.race([
                            meResult.unwrap(),
                            new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('timeout')), 5000)
                            ),
                        ]);
                        const onboarded = meData.profile?.onboarded ?? meData.user?.onboarded ?? false;
                        if (onboarded) {
                            navigation.replace('MainTabs');
                        } else {
                            navigation.replace('HabitInput');
                        }
                    } catch {
                        // Can't verify — assume onboarded to avoid blocking
                        navigation.replace('MainTabs');
                    } finally {
                        meResult.unsubscribe();
                    }
                    return;
                }

                if (token) {
                    // Token exists in storage but not in Redux state
                    // Validate it via RTK Query (uses reauth middleware)
                    const result = dispatch(authApi.endpoints.getMe.initiate(undefined));
                    try {
                        const data = await Promise.race([
                            result.unwrap(),
                            new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('timeout')), 5000)
                            ),
                        ]);
                        const refreshToken = await SecureStore.getItemAsync('refreshToken');
                        const user = data.user ?? data;
                        // Restore session into Redux
                        dispatch(setCredentials({
                            user,
                            token,
                            refreshToken: refreshToken ?? undefined,
                        }));
                        if (!hasNavigated.current) {
                            hasNavigated.current = true;
                            const onboarded = data.profile?.onboarded ?? user.onboarded ?? false;
                            if (onboarded) {
                                navigation.replace('MainTabs');
                            } else {
                                navigation.replace('HabitInput');
                            }
                        }
                    } catch {
                        // Token is invalid/expired or timed out — clear it
                        dispatch(logout());
                    } finally {
                        result.unsubscribe();
                    }
                    // Don't return here — if token validation failed and hasNavigated
                    // is still false, fall through to permission/onboarding checks below.
                }
            } catch {
                // Network error or other failure — clear stale state
                dispatch(logout());
            }

            if (!hasNavigated.current) {
                hasNavigated.current = true;
                // Check if permissions are already granted — skip those screens
                const [locPerm, notifPerm] = await Promise.all([
                    Location.getForegroundPermissionsAsync(),
                    Notifications.getPermissionsAsync(),
                ]);
                const locationGranted = locPerm.status === 'granted';
                const notifGranted = notifPerm.status === 'granted';

                if (locationGranted && notifGranted) {
                    navigation.replace('OnboardingTutorial');
                } else if (locationGranted) {
                    navigation.replace('NotificationPermission');
                } else {
                    navigation.replace('LocationPermission');
                }
            }
        };

        checkAuth();
    }, [navigation, dispatch]);

    return (
        <View style={styles.container}>
            {/* Main Content */}
            <View style={styles.content}>
                <Text style={styles.title}>UnHabit</Text>
                <Text style={styles.tagline}>Your 21-day change begins now.</Text>
            </View>

            {/* Mascot at bottom */}
            <View style={styles.mascotContainer}>
                <Mascot size={150} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 1,
        marginBottom: SPACING.sm,
    },
    tagline: {
        fontSize: 14,
        color: COLORS.textSecondary,
        opacity: 0.8,
        letterSpacing: 0.5,
    },
    mascotContainer: {
        position: 'absolute',
        bottom: -30,
        alignItems: 'center',
    },
});

export default SplashScreen;
