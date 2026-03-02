import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'gradient' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) => {
  const isGradient = variant === 'gradient';

  const buttonStyles = [
    styles.base,
    !isGradient && styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  const content = loading ? (
    <ActivityIndicator
      color={variant === 'outline' || variant === 'ghost' ? COLORS.primary : COLORS.white}
      size="small"
    />
  ) : (
    <Text style={textStyles}>{title}</Text>
  );

  if (isGradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={['#2CE8C6', '#1AC7A8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles[`size_${size}`], styles.gradientButton]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS['3xl'],
  },
  fullWidth: {
    width: '100%',
  },
  // Variants
  primary: {
    backgroundColor: COLORS.buttonPrimary,
  },
  gradient: {
    // Handled by LinearGradient
  },
  gradientButton: {
    width: '100%',
  },
  outline: {
    // backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  // Sizes
  size_sm: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: SPACING.md - 2,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    minHeight: 56,
  },
  // Disabled
  disabled: {
    opacity: 0.5,
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  text_primary: {
    color: COLORS.white,
  },
  text_gradient: {
    color: COLORS.white,
  },
  text_outline: {
    color: COLORS.textDark,
  },
  text_ghost: {
    color: COLORS.primary,
  },
  textSize_sm: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  textSize_md: {
    fontSize: TYPOGRAPHY.fontSize.base,
  },
  textSize_lg: {
    fontSize: TYPOGRAPHY.fontSize.lg,
  },
  textDisabled: {
    opacity: 0.7,
  },
});

export default Button;
