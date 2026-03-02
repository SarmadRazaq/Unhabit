import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Mascot, SpeechBubble, PermissionModal, SkipButton } from '../../components/common';
import { useThemedAlert } from '../../components/common/ThemedAlert';
import { COLORS, SPACING } from '../../constants/theme';

interface LocationPermissionScreenProps {
    navigation: any;
}

export const LocationPermissionScreen = ({
    navigation,
}: LocationPermissionScreenProps) => {
    const { alert } = useThemedAlert();
    const [modalVisible, setModalVisible] = useState(false);

    // Show modal automatically every time screen comes into focus
    // but skip if permission already granted
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            (async () => {
                const { status } = await Location.getForegroundPermissionsAsync();
                if (cancelled) return;
                if (status === 'granted') {
                    // Already granted — skip this screen
                    navigation.navigate('NotificationPermission');
                    return;
                }
                setTimeout(() => {
                    if (!cancelled) setModalVisible(true);
                }, 500);
            })();
            return () => { cancelled = true; };
        }, [])
    );

    const handleAllow = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert(
                    'Permission Denied',
                    'Location access helps us personalize your experience. You can enable it later in Settings.',
                    [{ text: 'OK' }]
                );
            }
        } catch (e) {
            if (__DEV__) console.error('Location permission error:', e);
        }

        setModalVisible(false);
        navigation.navigate('NotificationPermission');
    };

    const handleSkip = () => {
        setModalVisible(false);
        // Small delay to ensure modal closes before navigation
        setTimeout(() => {
            navigation.navigate('NotificationPermission');
        }, 100);
    };

    const handleSkipAll = () => {
        // Skip all remaining permission screens
        navigation.navigate('OnboardingTutorial');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header with Skip button */}
            <View style={styles.header}>
                <View style={styles.headerSpacer} />
                <SkipButton onPress={handleSkipAll} />
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Speech Bubble */}
                <SpeechBubble
                    title="Meet Nudge"
                    subtitle="Your smart AI coach here to guide your habit journey"
                    tailPosition="center"
                />

                {/* Mascot */}
                <View style={styles.mascotContainer}>
                    <Mascot />
                </View>
            </View>

            {/* Bottom spacer */}
            <View style={styles.bottomSpacer} />

            {/* Permission Modal */}
            <PermissionModal
                visible={modalVisible}
                type="location"
                onAllow={handleAllow}
                onSkip={handleSkip}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
    },
    headerSpacer: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    mascotContainer: {
        marginTop: SPACING.md,
        alignItems: 'center',
        justifyContent: 'center',

    },
    bottomSpacer: {
        flex: 0.3,
    },
});

export default LocationPermissionScreen;
