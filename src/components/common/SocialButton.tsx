import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, Image } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface SocialButtonProps {
    type: 'apple' | 'google';
    onPress: () => void;
    style?: ViewStyle;
    disabled?: boolean;
}

export const SocialButton = ({
    type,
    onPress,
    style,
    disabled,
}: SocialButtonProps) => {
    const isApple = type === 'apple';

    return (
        <TouchableOpacity
            style={[
                styles.button,
                isApple ? styles.appleButton : styles.googleButton,
                disabled && { opacity: 0.5 },
                style,
            ]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled}
        >
            <View style={styles.iconContainer}>
                <Image
                    source={
                        isApple
                            ? require('../../../assets/onboarding/apple.png')
                            : require('../../../assets/onboarding/google.png')
                    }
                    style={styles.icon}
                    resizeMode="contain"
                />
            </View>
            <Text style={[styles.text, isApple ? styles.appleText : styles.googleText]}>
                Continue with {isApple ? 'Apple' : 'Google'}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
        width: '100%',
        minHeight: 54,
    },
    appleButton: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    googleButton: {
        backgroundColor: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#3A3A3C',
    },
    iconContainer: {
        marginRight: SPACING.sm,
    },
    icon: {
        width: 20,
        height: 20,
    },
    text: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: '500',
    },
    appleText: {
        color: COLORS.white,
    },
    googleText: {
        color: COLORS.white,
    },
});

export default SocialButton;
