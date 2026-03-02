import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mascot, Button } from '../components/common';
import { StreakAtRiskModal } from '../components/home/StreakAtRiskModal';
import { StreakRecoveryModal } from '../components/home/StreakRecoveryModal';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useMarkOnboardedMutation } from '../services/api/auth';
import {
    useGetStreakStatusDetailsQuery,
    useGetStreakDetailsQuery,
    useGetAvailableFreezesQuery,
    useResetStreakMutation,
    useFreezeStreakMutation,
} from '../services/api/streaksApi';
import { useRestartJourneyMutation, useGetActiveJourneyQuery } from '../services/api/journeysApi';

interface HomeScreenProps {
    navigation: any;
}

export const HomeScreen = ({ navigation }: HomeScreenProps) => {
    const [markOnboarded] = useMarkOnboardedMutation();
    const { data: streakStatus, isLoading: streakLoading } = useGetStreakStatusDetailsQuery(undefined);
    const { data: streakDetails } = useGetStreakDetailsQuery(undefined);
    const { data: freezeData } = useGetAvailableFreezesQuery(undefined);

    // Mutations for recovery
    const [resetStreak, { isLoading: isResetLoading }] = useResetStreakMutation();
    const [useProtection, { isLoading: isProtectionLoading }] = useFreezeStreakMutation();
    const [restartJourney, { isLoading: isRestartLoading }] = useRestartJourneyMutation();
    const { data: activeJourneyData } = useGetActiveJourneyQuery(undefined);

    const [showRiskModal, setShowRiskModal] = React.useState(false);
    const [showRecoveryModal, setShowRecoveryModal] = React.useState(false);

    // Check for "Streak at Risk" (completed no tasks today)
    React.useEffect(() => {
        // Only show risk modal if we are NOT showing recovery modal
        if (!showRecoveryModal && streakStatus && streakStatus.at_risk) {
            setShowRiskModal(true);
        }
    }, [streakStatus, showRecoveryModal]);

    // Check for "Missed Day" (yesterday was missed)
    React.useEffect(() => {
        if (streakDetails && streakDetails.calendar) {
            // Find yesterday in calendar
            // Calendar is ordered latest first? No, the code says:
            // for (let i = 29; i >= 0; i--) ... calendar.push(...)
            // So index 0 is 29 days ago, index 29 is today?
            // Let's re-read getStreakDetails service:
            // calendar.push({ date: dateStr, ...Val }) inside the loop i=29...0
            // So index 0 (i=29) is oldest. Index 29 (i=0) is today.
            // Yesterday is index 28.
            const calendar = streakDetails.calendar;
            if (calendar.length >= 2) {
                const yesterday = calendar[calendar.length - 2];
                // If yesterday was "missed", trigger recovery modal
                if (yesterday.status === 'missed') {
                    setShowRecoveryModal(true);
                    setShowRiskModal(false); // Recovery takes precedence
                }
            }
        }
    }, [streakDetails]);

    const handleGetStarted = async () => {
        try {
            await markOnboarded(undefined).unwrap();
        } catch { }
        navigation.navigate('MainTabs');
    };

    const handleCloseRiskModal = () => {
        setShowRiskModal(false);
    };

    const handleGoToTasks = () => {
        setShowRiskModal(false);
    };

    // --- Recovery Handlers ---

    const handleContinuePenalty = async () => {
        try {
            await resetStreak(undefined).unwrap();
            setShowRecoveryModal(false);
        } catch (e) {
            // Error handling (e.g. toast) could go here
            console.error(e);
        }
    };

    const handleUseProtection = async () => {
        try {
            await useProtection(undefined).unwrap();
            setShowRecoveryModal(false);
        } catch (e) {
            console.error(e);
        }
    };

    const handleRestartJourney = async () => {
        try {
            if (activeJourneyData?.id) {
                await restartJourney(activeJourneyData.id).unwrap();
                setShowRecoveryModal(false);
            } else {
                console.error("No active journey found to restart.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.content}>
                <Mascot size={150} />

                <Text style={styles.title}>Welcome to Unhabit!</Text>
                <Text style={styles.subtitle}>
                    You've completed the onboarding. Start your habit transformation journey!
                </Text>

                <View style={styles.buttonContainer}>
                    <Button
                        title="Get Started"
                        onPress={handleGetStarted}
                        variant="primary"
                        size="lg"
                    />
                </View>
            </View>

            {/* Streak at Risk Modal */}
            {streakStatus && (
                <StreakAtRiskModal
                    visible={showRiskModal}
                    onClose={handleCloseRiskModal}
                    onGoToTasks={handleGoToTasks}
                    hoursLeft={streakStatus.hours_left || 0}
                    tasksNeeded={1}
                />
            )}

            {/* Streak Recovery Modal */}
            <StreakRecoveryModal
                visible={showRecoveryModal}
                onContinuePenalty={handleContinuePenalty}
                onUseProtection={handleUseProtection}
                onRestartJourney={handleRestartJourney}
                availableFreezes={freezeData?.available_freezes ?? 0}
                isResetLoading={isResetLoading}
                isProtectionLoading={isProtectionLoading}
                isRestartLoading={isRestartLoading}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: SPACING.xl,
    },
    buttonContainer: {
        width: '100%',
        marginTop: SPACING.lg,
    },
});

export default HomeScreen;

