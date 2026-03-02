import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Keyboard, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import { TextInput, LoadingScreen } from '../../components/common';
import { useThemedAlert } from '../../components/common/ThemedAlert';
import { COLORS, SPACING } from '../../constants/theme';

interface HabitInputScreenProps {
    navigation: any;
}

import { useCreateHabitMutation } from '../../services/api/habitsApi';

export const HabitInputScreen = ({ navigation }: HabitInputScreenProps) => {
    const { alert } = useThemedAlert();
    const [habit, setHabit] = useState('');
    const [createHabit, { isLoading }] = useCreateHabitMutation();

    const handleContinue = async () => {
        if (habit.trim()) {
            Keyboard.dismiss();
            try {
                await createHabit({ goal_text: habit.trim() }).unwrap();
                // Use replace so we don't go back to input on back press
                navigation.replace('HabitSuccess', { habit: habit.trim() });
            } catch (error) {
                if (__DEV__) console.error('Failed to create habit', error);
                alert('Error', 'Failed to create habit. Please try again.');
            }
        }
    };

    // Removed handleLoadingComplete since we await the API call directly

    if (isLoading) {
        return (
            <LoadingScreen
                message="Creating Habit..."
                duration={0}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'} backgroundColor="#000" translucent={true} />

            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>What habit do you</Text>
                    <Text style={styles.title}>want Nudge to help</Text>
                    <Text style={styles.title}>you change?</Text>
                </View>

                {/* Input with dashed border */}
                <View style={styles.inputWrapper}>
                    <TextInput
                        value={habit}
                        onChangeText={setHabit}
                        placeholder="Enter Your Habit"
                        onSubmitEditing={handleContinue}
                    />
                </View>

                {/* Mascot */}
                <View style={styles.mascotContainer}>
                    <Image
                        source={require('../../../assets/onboarding/habitNudge.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                </View>
            </View>

            {/* Button Section */}
            <View style={styles.buttonSection}>
                <TouchableOpacity
                    onPress={handleContinue}
                    style={[styles.continueButton, !habit.trim() && styles.continueButtonDisabled]}
                    disabled={!habit.trim()}
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
        paddingTop: 60,
    },
    contentSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    titleContainer: {
        marginBottom: SPACING.xl,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.primary,
        textAlign: 'center',
        lineHeight: 32,
    },
    inputWrapper: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    mascotContainer: {
        marginTop: SPACING.lg,
    },
    mascotImage: {
        width: 330,
        height: 330,
    },
    buttonSection: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING['2xl'],
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

export default HabitInputScreen;

