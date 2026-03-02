import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Mascot } from '../../components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface NiceWorkScreenProps {
    navigation: any;
}

export const NiceWorkScreen = ({ navigation }: NiceWorkScreenProps) => {
    useEffect(() => {
        // Auto-navigate to JourneyPreview screen after 2 seconds
        const timer = setTimeout(() => {
            navigation.navigate('JourneyPreview');
        }, 2000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* Checkmark Icon */}
                <View style={styles.checkmarkContainer}>
                    <Image source={require('../../../assets/onboarding/check-circle.png')} />
                </View>

                {/* Title */}
                <Text style={styles.title}>Nice Work!</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>Your personalized plan is</Text>
                <Text style={styles.subtitle}>ready.</Text>
            </View>

            {/* Mascot at bottom */}
            <View style={styles.mascotSection}>
                <Mascot size={200} />
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
    checkmarkContainer: {
        marginBottom: SPACING.lg,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
    },
    mascotSection: {
        position: 'absolute',
        bottom: '-5%',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
});

export default NiceWorkScreen;
