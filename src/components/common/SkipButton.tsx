import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface SkipButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export const SkipButton = ({ onPress, style }: SkipButtonProps) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>SKIP</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.sm,
  },
  text: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SkipButton;

