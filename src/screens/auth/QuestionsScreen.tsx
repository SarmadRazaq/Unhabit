import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { useGenerateQuizFormMutation, useGenerateQuizSummaryMutation } from '../../services/api/aiApi';
import { useGetHabitsQuery } from '../../services/api/habitsApi';
import { useThemedAlert } from '../../components/common/ThemedAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuestionsScreenProps {
    navigation: any;
    route: any;
}

interface QuizOption {
    id: string;
    label: string;
    helper_text?: string | null;
}

interface QuizQuestion {
    id: string;
    question: string;
    helper_text?: string | null;
    options: QuizOption[];
}

interface QuizForm {
    habit_name_guess: string;
    questions: QuizQuestion[];
}

export const QuestionsScreen = ({ navigation, route }: QuestionsScreenProps) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [quizForm, setQuizForm] = useState<QuizForm | null>(null);
    const [loadError, setLoadError] = useState(false);
    const [generateQuizForm, { isLoading: isGenerating }] = useGenerateQuizFormMutation();
    const [generateQuizSummary] = useGenerateQuizSummaryMutation();
    const { data: habitsData } = useGetHabitsQuery(undefined);
    const hasStartedRef = useRef(false);
    const { alert } = useThemedAlert();

    // Determine the habit context from nav params or fetched habits
    const habitsArray = Array.isArray(habitsData) ? habitsData : (habitsData as any)?.habits ?? [];
    const habitDescription = route?.params?.habitDescription
        || (habitsArray[0]?.goal_text as string | undefined)
        || undefined;
    const habitCategory = route?.params?.habitCategory
        || (habitsArray[0]?.category_id as string | undefined)
        || 'general';

    const fetchQuizForm = () => {
        if (!habitDescription) return;
        setLoadError(false);
        generateQuizForm({
            habit_category: habitCategory,
            habit_description: habitDescription,
        })
            .unwrap()
            .then((result: any) => {
                const formData = result?.data || result;
                if (formData?.questions?.length) {
                    setQuizForm(formData);
                } else {
                    setLoadError(true);
                    showRetryAlert();
                }
            })
            .catch((err: any) => {
                if (__DEV__) console.warn('Failed to generate quiz form:', err);
                setLoadError(true);
                showRetryAlert();
            });
    };

    const showRetryAlert = () => {
        alert(
            'Could not generate questions',
            'The AI service is temporarily unavailable. Would you like to retry?',
            [
                { text: 'Retry', onPress: () => fetchQuizForm() },
            ],
        );
    };

    // Fetch AI-generated questions when habit context is available
    useEffect(() => {
        if (habitDescription && !quizForm && !hasStartedRef.current) {
            hasStartedRef.current = true;
            fetchQuizForm();
        }
    }, [habitDescription]);

    const questions = quizForm?.questions ?? [];
    const currentQuestion = questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleOptionSelect = (optionId: string) => {
        setSelectedOption(optionId);
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    };

    const handleContinue = () => {
        if (!selectedOption) return;

        if (isLastQuestion) {
            // Submit quiz answers to backend
            const finalAnswers = { ...answers, [currentQuestion.id]: selectedOption };
            generateQuizSummary({
                answers: finalAnswers,
                habit_category: habitCategory,
                habit_description: habitDescription,
                quiz_form: quizForm || undefined,
            })
                .unwrap()
                .catch((err: any) => {
                    if (__DEV__) console.warn('Quiz summary submission failed:', err);
                });
            // Navigate to PreparingPlan screen with answers
            navigation.navigate('PreparingPlan', { answers: finalAnswers });
        } else {
            // Move to next question
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOption(null);
        }
    };

    // Show loading while generating AI questions
    if (isGenerating || (!quizForm && !loadError)) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'} backgroundColor="#000" translucent={true} />
                <View style={styles.loadingContainer}>
                    <Image
                        source={require('../../../assets/onboarding/nudge.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
                    <Text style={styles.loadingText}>Preparing your questions...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state – alert is already showing, keep spinner visible
    if (loadError || questions.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'} backgroundColor="#000" translucent={true} />
                <View style={styles.loadingContainer}>
                    <Image
                        source={require('../../../assets/onboarding/nudge.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.loadingText}>Waiting for AI...</Text>
                    <TouchableOpacity
                        style={[styles.continueButton, { marginTop: SPACING.xl, width: 200 }]}
                        onPress={fetchQuizForm}
                    >
                        <Text style={styles.continueButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'} backgroundColor="#000" translucent={true} />

            <ScrollView 
                style={styles.scrollView} 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Mascot */}
                <View style={styles.mascotContainer}>
                    <Image
                        source={require('../../../assets/onboarding/nudge.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Question */}
                <View style={styles.questionSection}>
                    <Text style={styles.questionText}>{currentQuestion.question}</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsSection}>
                    {currentQuestion.options.map((option) => {
                        const isSelected = selectedOption === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionButton,
                                    isSelected ? styles.optionButtonSelected : styles.optionButtonUnselected,
                                ]}
                                onPress={() => handleOptionSelect(option.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.radioCircle,
                                    isSelected && styles.radioCircleSelected,
                                ]}>
                                    {isSelected && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.optionText,
                                        isSelected && styles.optionTextSelected,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.buttonSection}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedOption && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedOption}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        // Remove paddingTop, let SafeAreaView handle it
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.xl,
    },
    mascotContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
        marginBottom: SPACING.lg,
    },
    mascotImage: {
        width: 100,
        height: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: SPACING.md,
        textAlign: 'center',
    },
    questionSection: {
        marginBottom: SPACING.xl,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.white,
        textAlign: 'center',
        lineHeight: 30,
    },
    optionsSection: {
        gap: SPACING.sm,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: SPACING.lg,
        borderRadius: 10,
        borderWidth: 2,
        marginBottom: 16,
        backgroundColor: '#111',
    },
    optionButtonSelected: {
        borderColor: COLORS.primary,
        backgroundColor: 'transparent',
    },
    optionButtonUnselected: {
        borderColor: '#222',
        backgroundColor: '#111',
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#222',
        marginRight: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111',
    },
    radioCircleSelected: {
        borderColor: COLORS.white,
        backgroundColor: COLORS.white,
    },
    checkmark: {
        color: '#000',
        fontSize: 18,
        fontWeight: '900',
        lineHeight: 22,
        textAlign: 'center',
    },
    optionText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '600',
        flex: 1,
        flexWrap: 'wrap',
    },
    optionTextSelected: {
        color: COLORS.primary,
    },
    buttonSection: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING['2xl'],
        paddingTop: SPACING.lg,
    },
    continueButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default QuestionsScreen;
