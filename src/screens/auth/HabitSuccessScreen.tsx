import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HabitSuccessScreenProps {
    navigation: any;
    route: any;
}

export const HabitSuccessScreen = ({
    navigation,
    route,
}: HabitSuccessScreenProps) => {
    const habit = route?.params?.habit || '';

    const handleLetsGo = () => {
        // Navigate to OnboardingWelcome screen, forwarding the habit description
        navigation.navigate('OnboardingWelcome', { habitDescription: habit });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'} backgroundColor="#000" translucent={true} />

            {/* Content Section */}
            <View style={styles.contentSection}>
                {/* Celebration Mascot */}
                <View style={styles.mascotContainer}>
                    <Image
                        source={require('../../../assets/onboarding/nudge.png')}
                        style={styles.mascotImage}
                        resizeMode="contain"
                    />
                </View>

                {/* Message */}
                <Text style={styles.message}>
                    {habit ? `"${habit}" added!` : 'Awesome!'}
                </Text>
                <Text style={[styles.message, { marginTop: 8, fontSize: 16 }]}>
                    Answer a few quick questions so we can personalize your plan.
                </Text>
            </View>

            {/* Button Section */}
            <View style={styles.buttonSection}>
                <TouchableOpacity onPress={handleLetsGo} style={styles.letsGoButton}>
                    <Text style={styles.letsGoButtonText}>Let's GO</Text>
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
    mascotContainer: {
        marginBottom: SPACING.xl,
    },
    mascotImage: {
        width: 200,
        height: 200,
    },
    message: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
        textAlign: 'center',
        lineHeight: 28,
        paddingHorizontal: SPACING.md,
    },
    buttonSection: {
        paddingHorizontal: SPACING.xl,
        paddingBottom: SPACING['2xl'],
    },
    letsGoButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 8,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    letsGoButtonText: {
        color: COLORS.black,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HabitSuccessScreen;

