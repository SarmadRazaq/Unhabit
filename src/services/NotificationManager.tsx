import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRegisterDeviceMutation } from './api/settingsApi';
import { useAppSelector } from '../store/hooks';

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
                // Send token to backend
                registerDevice({
                    platform: Platform.OS === 'ios' ? 'ios' : 'android',
                    push_token: token,
                    app_version: '1.0.0', // Could use Application.nativeApplicationVersion
                }).unwrap().catch((err: unknown) => {
                    notificationLog('Failed to register push token:', err);
                });
            }
        });

        // innovative listener logic could go here
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            // Handle foreground notification received
            notificationLog('Notification Received:', notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            // Handle user interaction with notification
            notificationLog('Notification Response:', response);
            // Here we could navigate to specific screens based on response.notification.request.content.data
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
            token = (await Notifications.getExpoPushTokenAsync()).data;
            notificationLog('Expo Push Token:', token);
        } catch (e) {
            notificationError('Error fetching push token', e);
        }
    }

    return token;
}
