import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Mascot } from '../common';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface StreakRecoveryModalProps {
    visible: boolean;
    onContinuePenalty: () => void;
    onUseProtection: () => void;
    onRestartJourney: () => void;
    availableFreezes: number;
    isProtectionLoading?: boolean;
    isRestartLoading?: boolean;
    isResetLoading?: boolean;
}

export const StreakRecoveryModal = ({
    visible,
    onContinuePenalty,
    onUseProtection,
    onRestartJourney,
    availableFreezes,
    isProtectionLoading = false,
    isRestartLoading = false,
    isResetLoading = false,
}: StreakRecoveryModalProps) => {
    const [selectedOption, setSelectedOption] = React.useState<number | null>(null);

    const handleOptionSelect = (option: number) => {
        if (option === 2 && availableFreezes <= 0) return; // Disable if no freezes
        setSelectedOption(option);
    };

    const handleContinue = () => {
        if (selectedOption === 1) onContinuePenalty();
        if (selectedOption === 2) onUseProtection();
        if (selectedOption === 3) onRestartJourney();
    };

    const isLoading = isProtectionLoading || isRestartLoading || isResetLoading;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => { }} // Prevent closing by back button effectively forcing a choice
        >
            <View style={styles.overlay}>
                <BlurView intensity={30} style={styles.blur} tint="dark" />

                <View style={styles.modalContainer}>
                    <View style={styles.mascotHeader}>
                        <Mascot size={80} />
                    </View>

                    <Text style={styles.title}>You missed a day</Text>
                    <Text style={styles.subtitle}>Choose how to continue:</Text>

                    <ScrollView style={styles.optionsContainer}>
                        {/* Option 1: Continue with penalty */}
                        <TouchableOpacity
                            style={[
                                styles.optionCard,
                                selectedOption === 1 && styles.optionCardSelected
                            ]}
                            onPress={() => handleOptionSelect(1)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.optionContent}>
                                <View style={[
                                    styles.optionNumber,
                                    selectedOption === 1 && styles.optionNumberSelected
                                ]}>
                                    <Text style={[
                                        styles.optionNumberText,
                                        selectedOption === 1 && styles.optionNumberTextSelected
                                    ]}>1</Text>
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[
                                        styles.optionTitle,
                                        selectedOption === 1 && styles.optionTitleSelected
                                    ]}>Continue with penalty</Text>
                                    <Text style={styles.optionBullet}>• Streak resets</Text>
                                    <Text style={styles.optionBullet}>• XP reduced</Text>
                                </View>
                            </View>
                            <Mascot size={40} />
                        </TouchableOpacity>

                        {/* Option 2: Use streak protection */}
                        <TouchableOpacity
                            style={[
                                styles.optionCard,
                                selectedOption === 2 && styles.optionCardSelected,
                                availableFreezes <= 0 && styles.optionCardDisabled
                            ]}
                            onPress={() => handleOptionSelect(2)}
                            activeOpacity={availableFreezes > 0 ? 0.8 : 1}
                        >
                            <View style={styles.optionContent}>
                                <View style={[
                                    styles.optionNumber,
                                    selectedOption === 2 && styles.optionNumberSelected,
                                    availableFreezes <= 0 && styles.optionNumberDisabled
                                ]}>
                                    <Text style={[
                                        styles.optionNumberText,
                                        selectedOption === 2 && styles.optionNumberTextSelected
                                    ]}>2</Text>
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[
                                        styles.optionTitle,
                                        selectedOption === 2 && styles.optionTitleSelected,
                                        availableFreezes <= 0 && styles.textDisabled
                                    ]}>Use streak protection</Text>
                                    <Text style={[styles.optionBullet, availableFreezes <= 0 && styles.textDisabled]}>• Streak saved</Text>
                                    <Text style={[styles.optionBullet, availableFreezes <= 0 && styles.textDisabled]}>
                                        • {availableFreezes > 0 ? `${availableFreezes} uses available` : 'No uses left'}
                                    </Text>
                                </View>
                            </View>
                            <Mascot size={40} style={availableFreezes <= 0 ? { opacity: 0.5 } : {}} />
                        </TouchableOpacity>

                        {/* Option 3: Restart 21-Day Plan */}
                        <TouchableOpacity
                            style={[
                                styles.optionCard,
                                selectedOption === 3 && styles.optionCardSelected
                            ]}
                            onPress={() => handleOptionSelect(3)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.optionContent}>
                                <View style={[
                                    styles.optionNumber,
                                    selectedOption === 3 && styles.optionNumberSelected
                                ]}>
                                    <Text style={[
                                        styles.optionNumberText,
                                        selectedOption === 3 && styles.optionNumberTextSelected
                                    ]}>3</Text>
                                </View>
                                <View style={styles.optionTextContainer}>
                                    <Text style={[
                                        styles.optionTitle,
                                        selectedOption === 3 && styles.optionTitleSelected
                                    ]}>Restart 21-Day Plan</Text>
                                    <Text style={styles.optionBullet}>• Fresh start</Text>
                                    <Text style={styles.optionBullet}>• XP kept</Text>
                                </View>
                            </View>
                            <Mascot size={40} />
                        </TouchableOpacity>
                    </ScrollView>

                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            (!selectedOption || isLoading) && styles.continueButtonDisabled
                        ]}
                        onPress={handleContinue}
                        disabled={!selectedOption || isLoading}
                    >
                        <Text style={styles.continueButtonText}>
                            {isLoading ? 'Processing...' : 'Continue'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#111',
        borderRadius: 24,
        padding: SPACING.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    mascotHeader: {
        marginTop: -50,
        marginBottom: SPACING.md,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.white,
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.primary,
        marginBottom: SPACING.lg,
        textAlign: 'center',
        fontWeight: '600',
    },
    optionsContainer: {
        width: '100%',
        maxHeight: 400,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    optionCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
    },
    optionCardDisabled: {
        opacity: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    optionContent: {
        flexDirection: 'row',
        flex: 1,
    },
    optionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
        marginTop: 2,
    },
    optionNumberSelected: {
        backgroundColor: COLORS.primary,
    },
    optionNumberDisabled: {
        backgroundColor: '#666',
    },
    optionNumberText: {
        color: COLORS.black,
        fontSize: 14,
        fontWeight: 'bold',
    },
    optionNumberTextSelected: {
        color: COLORS.black,
    },
    optionTextContainer: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 4,
    },
    optionTitleSelected: {
        color: COLORS.primary,
    },
    optionBullet: {
        fontSize: 13,
        color: COLORS.white,
        opacity: 0.8,
        lineHeight: 18,
    },
    textDisabled: {
        color: '#999',
    },
    continueButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#D9D9D9',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
});
