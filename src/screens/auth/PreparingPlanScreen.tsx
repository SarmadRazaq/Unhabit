import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useGeneratePlan21dMutation } from '../../services/api/aiApi';
import { useCreateJourneyFromAiPlanMutation } from '../../services/api/journeysApi';
import { useGetHabitsQuery } from '../../services/api/habitsApi';
import { useThemedAlert } from '../../components/common/ThemedAlert';

interface PreparingPlanScreenProps {
    navigation: any;
    route?: any;
}

export const PreparingPlanScreen = ({ navigation, route }: PreparingPlanScreenProps) => {
    const answers = route?.params?.answers;
    const [generatePlan] = useGeneratePlan21dMutation();
    const [createJourneyFromAi] = useCreateJourneyFromAiPlanMutation();
    const { data: habitsData } = useGetHabitsQuery(undefined);
    const [statusText, setStatusText] = useState('Preparing\nyour plan...');
    const hasStartedRef = useRef(false);
    const { alert } = useThemedAlert();

    useEffect(() => {
        // Only run once when habitsData first becomes available
        if (habitsData === undefined || hasStartedRef.current) return;
        hasStartedRef.current = true;

        let cancelled = false;

        const buildPlan = async () => {
            // Get the user's most recent habit
            const habits = Array.isArray(habitsData) ? habitsData : habitsData?.habits ?? [];
            const userHabit = habits[habits.length - 1];
            const userHabitId = userHabit?.id;
            const habitGoal = userHabit?.goal_text ?? '';

            if (!userHabitId) {
                navigation.navigate('NiceWork');
                return;
            }

            // Build a text summary of the quiz answers for the AI
            const quizSummary = answers
                ? Object.entries(answers).map(([q, a]) => `${q}: ${a}`).join('; ')
                : 'No quiz answers provided';

            try {
                setStatusText('Analyzing your\nresponses...');
                const planResult = await generatePlan({
                    habit_goal: habitGoal,
                    quiz_summary: quizSummary,
                }).unwrap();

                if (cancelled) return;
                setStatusText('Building your\n21-day journey...');

                // Strip null values from AI plan — Zod rejects null for optional fields
                const cleanedPlan = planResult
                    ? Object.fromEntries(
                        Object.entries(planResult).filter(([_, v]) => v != null)
                    )
                    : planResult;

                await createJourneyFromAi({
                    user_habit_id: userHabitId,
                    ai_plan: cleanedPlan,
                    start_date: new Date().toISOString(),
                }).unwrap();

                if (cancelled) return;
                navigation.navigate('NiceWork');
            } catch (err) {
                console.error('[PreparingPlan] AI plan creation failed:', err);
                if (cancelled) return;

                setStatusText('Something went wrong');
                alert(
                    'Could not create your plan',
                    'There was a problem setting up your journey. Please try again.',
                    [
                        {
                            text: 'Retry',
                            onPress: () => {
                                if (!cancelled) {
                                    hasStartedRef.current = false;
                                    setStatusText('Retrying...');
                                    buildPlan();
                                }
                            },
                        },
                    ],
                );
            }
        };

        buildPlan();

        return () => { cancelled = true; };
    }, [navigation, answers, habitsData, generatePlan, createJourneyFromAi]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="light" />

            <View style={styles.content}>
                <Text style={styles.title}>{statusText}</Text>

                <View style={styles.spinnerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </View>
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
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.primary,
        textAlign: 'center',
        lineHeight: 42,
    },
    spinnerContainer: {
        marginTop: SPACING.xl,
    },
});

export default PreparingPlanScreen;
