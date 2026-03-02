import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common';
import { useThemedAlert } from '../../components/common/ThemedAlert';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useGetActiveJourneyQuery, useStartJourneyMutation } from '../../services/api/journeysApi';
import { useMarkOnboardedMutation } from '../../services/api/auth';

interface JourneyPreviewScreenProps {
    navigation: any;
}

const timelinePhases = [
    { id: '1', title: 'Tiny Wins', days: 'Days 1-7', icon: 'star-outline' },
    { id: '2', title: 'Habit Stacking', days: 'Days 8-14', icon: 'stats-chart-outline' },
    { id: '3', title: 'Identity Shift', days: 'Days 15-21', icon: 'pricetag-outline' },
];

const goalsList = [
    { id: '1', title: 'Set Micro Goals', active: true },
    { id: '2', title: 'First win', active: false },
    { id: '3', title: 'Identify Trigger', active: false },
];

const bottomFeatures = [
    { id: '1', title: 'Coach', icon: 'person-outline' },
    { id: '2', title: 'Nudges', icon: 'notifications-outline' },
    { id: '3', title: 'Analytics', icon: 'bar-chart-outline' },
];

export const JourneyPreviewScreen = ({ navigation }: JourneyPreviewScreenProps) => {
    const { alert } = useThemedAlert();
    const { data: journeyData } = useGetActiveJourneyQuery(undefined);
    const [startJourney] = useStartJourneyMutation();
    const [markOnboarded] = useMarkOnboardedMutation();

    // Use API data if available, fallback to hardcoded
    const phases = journeyData?.journey?.phases?.map((p: any, i: number) => ({
        id: String(i + 1),
        title: p.title || timelinePhases[i]?.title,
        days: p.days || timelinePhases[i]?.days,
        icon: timelinePhases[i]?.icon || 'star-outline',
    })) ?? timelinePhases;

    const goals = journeyData?.journey?.goals?.map((g: any, i: number) => ({
        id: String(i + 1),
        title: g.title || g,
        active: i === 0,
    })) ?? goalsList;

    const handleStartPlan = async () => {
        try {
            if (journeyData?.journey?.id) {
                await startJourney(journeyData.journey.id).unwrap();
            }
        } catch (error: any) {
            alert(
                'Journey Start Failed',
                error?.data?.message || 'Could not start the journey. You can try again from the dashboard.',
                [{ text: 'OK' }]
            );
        }
        // Mark onboarding complete so the user goes straight to Dashboard on next launch
        try {
            await markOnboarded(undefined).unwrap();
        } catch {}
        navigation.navigate('MainTabs');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="light" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>{"Your 21-Day\nJourney Preview"}</Text>
                    <Text style={styles.subtitle}>Uncover your path to lasting change</Text>
                </View>

                <View style={styles.phasesSection}>
                    <View style={styles.phasesRow}>
                        {phases.map((phase: { id: string; title: string; days?: string; icon: string }) => (
                            <View key={phase.id} style={styles.phaseItem}>
                                <View style={styles.phaseIconWrapper}>
                                    <View style={styles.phaseGlow}>
                                        <View style={styles.phaseIcon}>
                                            <Ionicons name={phase.icon as any} size={20} color={COLORS.primary} />
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.phaseTitle}>{phase.title}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack} />
                        <View style={[styles.progressFill, { width: '70%' }]} />
                        {phases.map((phase: { id: string }, index: number) => (
                            <View
                                key={phase.id}
                                style={[
                                    styles.progressDot,
                                    { left: `${(index / (phases.length - 1)) * 100}%` },
                                ]}
                            >
                                <View style={styles.progressDotInner} />
                            </View>
                        ))}
                    </View>

                    <View style={styles.daysRow}>
                        {phases.map((phase: { id: string; days?: string }) => (
                            <Text key={phase.id} style={styles.daysText}>
                                {phase.days}
                            </Text>
                        ))}
                    </View>
                </View>

                <View style={styles.goalsSection}>
                    {goals.map((goal: { id: string; title: string; active: boolean }) => (
                        <View
                            key={goal.id}
                            style={[styles.goalItem, goal.active ? styles.goalItemActive : styles.goalItemInactive]}
                        >
                            <View style={[styles.goalCheck, goal.active ? styles.goalCheckActive : styles.goalCheckInactive]}>
                                {goal.active && <Ionicons name="checkmark" size={16} color={COLORS.black} />}
                            </View>
                            <Text style={styles.goalText}>{goal.title}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.featuresSection}>
                    {bottomFeatures.map((feature) => (
                        <View key={feature.id} style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Ionicons name={feature.icon as any} size={24} color={COLORS.primary} />
                            </View>
                            <Text style={styles.featureText}>{feature.title}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.buttonSection}>
                    <Button
                        title="Start My 21-days Plan"
                        onPress={handleStartPlan}
                        size="lg"
                        style={styles.ctaButton}
                        textStyle={styles.ctaText}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: SPACING['3xl'],
    },
    header: {
        alignItems: 'center',
        paddingTop: SPACING['2xl'],
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING['2xl'],
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    phasesSection: {
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING['2xl'],
        gap: SPACING.md,
    },
    phasesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: SPACING.lg,
    },
    phaseItem: {
        flex: 1,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    phaseIconWrapper: {
        width: 78,
        height: 78,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseGlow: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(44, 232, 198, 0.18)',
        shadowColor: '#2CE8C6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 14,
    },
    phaseIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(44, 232, 198, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseTitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    progressContainer: {
        position: 'relative',
        height: 18,
        justifyContent: 'center',
        marginTop: SPACING.xs,
        paddingHorizontal: SPACING.sm,
    },
    progressTrack: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 4,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        height: 4,
        borderRadius: 20,
        backgroundColor: COLORS.white,
    },
    progressDot: {
        position: 'absolute',
        top: '50%',
        width: 18,
        height: 18,
        marginTop: -9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressDotInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: SPACING.sm,
    },
    daysText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    goalsSection: {
        paddingHorizontal: SPACING.xl,
        gap: SPACING.md,
        marginBottom: SPACING['2xl'],
    },
    goalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        minHeight: 64,
        borderRadius: 12,
        borderWidth: 2,
        gap: SPACING.md,
    },
    goalItemActive: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(44, 232, 198, 0.04)',
    },
    goalItemInactive: {
        borderColor: '#1c1c1c',
        backgroundColor: '#111',
    },
    goalCheck: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.35)',
    },
    goalCheckActive: {
        backgroundColor: COLORS.white,
        borderColor: COLORS.white,
    },
    goalCheckInactive: {
        backgroundColor: 'transparent',
    },
    goalText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    featuresSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING['2xl'],
        gap: SPACING.md,
    },
    featureItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.md,
        backgroundColor: '#0C0C0C',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.18)',
        gap: SPACING.sm,
        minHeight: 88,
        justifyContent: 'center',
    },
    featureIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    buttonSection: {
        paddingHorizontal: SPACING.xl,
        marginBottom: SPACING['3xl'],
    },
    ctaButton: {
        backgroundColor: COLORS.white,
        minHeight: 56,
        borderRadius: 14,
    },
    ctaText: {
        color: COLORS.black,
        fontWeight: '700',
    },
});

export default JourneyPreviewScreen;
