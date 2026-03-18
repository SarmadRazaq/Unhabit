import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useRegisterDeviceMutation } from './api/settingsApi';
import { useAppSelector } from '../store/hooks';
import { navigationRef } from '../navigation';
import type { RootStackParamList } from '../navigation';

const notificationLog = (...args: unknown[]) => {
    if (__DEV__) {
        console.log(...args);
    }
};

const notificationError = (...args: unknown[]) => {
    if (__DEV__) {
        console.error(...args);
    }
};

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const NotificationManager = () => {
    const [registerDevice] = useRegisterDeviceMutation();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const notificationListener = useRef<Notifications.EventSubscription | null>(null);
    const responseListener = useRef<Notifications.EventSubscription | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        registerForPushNotificationsAsync().then(token => {
            if (token) {
                // Avoid re-registering the same token repeatedly.
                // If token changes (reinstall / token rotation), we update backend.
                (async () => {
                    try {
                        const key = 'unhabit.push_token';
                        const lastToken = await SecureStore.getItemAsync(key);
                        if (lastToken === token) return;

                        await registerDevice({
                            platform: Platform.OS === 'ios' ? 'ios' : 'android',
                            push_token: token,
                            app_version: '1.0.0', // Could use Application.nativeApplicationVersion
                        }).unwrap();

                        await SecureStore.setItemAsync(key, token);
                    } catch (err: unknown) {
                        notificationLog('Failed to register push token:', err);
                    }
                })();
            }
        });

        // innovative listener logic could go here
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // Handle foreground notification received
            notificationLog('Notification Received:', notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            notificationLog('Notification Response:', response);
            const data = response.notification.request.content.data as Record<string, string> | undefined;
            const screen = data?.screen as keyof RootStackParamList | undefined;
            if (screen && navigationRef.isReady()) {
                navigationRef.navigate(screen as any, data?.params ? JSON.parse(data.params) : undefined);
            } else if (navigationRef.isReady()) {
                // Default: open Notifications screen
                navigationRef.navigate('Notifications', undefined);
            }
        });

        return () => {
            if (notificationListener.current) {
                notificationListener.current.remove();
            }
            if (responseListener.current) {
                responseListener.current.remove();
            }
        };
    }, [isAuthenticated, registerDevice]);

    return null; // This component doesn't render anything
};

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            // We don't ask here again usually if already denied, but we check just in case
            // The permission screen handles the actual request.
            // However, if we want to ensure we get the token if permission IS granted:
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            notificationLog('Failed to get push token for push notification!');
            return;
        }

        // Get the Expo Push Token
        // We explicitly set the projectId if using EAS managed workflow, but for bare usually not needed if configured correctly
        // or passing no args works for Expo Go / standard dev builds.
        try {
            token = (await Notifications.getExpoPushTokenAsync({
                projectId: '8f187eb8-4415-44d0-8b89-801f80320b64',
            })).data;
            notificationLog('Expo Push Token:', token);
        } catch (e) {
            notificationError('Error fetching push token', e);
        }
    }

    return token;
}
