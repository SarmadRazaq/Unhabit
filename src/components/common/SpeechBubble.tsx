import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface SpeechBubbleProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  tailPosition?: 'left' | 'center' | 'right';
}

export const SpeechBubble = ({
  title,
  subtitle,
  style,
  tailPosition = 'left',
}: SpeechBubbleProps) => {
  return (
    <View
      style={[
        styles.container,
        tailPosition === 'center' && styles.containerCenter,
        tailPosition === 'right' && styles.containerRight,
        style,
      ]}
    >
      <View style={styles.bubble}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <View
        style={[
          styles.tail,
          tailPosition === 'left' && styles.tailLeft,
          tailPosition === 'center' && styles.tailCenter,
          tailPosition === 'right' && styles.tailRight,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  containerCenter: {
    alignItems: 'center',
  },
  containerRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    backgroundColor: COLORS.speechBubble,
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    maxWidth: 220,
    minWidth: 150,
  },
  title: {
    color: COLORS.speechBubbleText,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.speechBubbleText,
    fontSize: TYPOGRAPHY.fontSize.xs,
    opacity: 0.85,
    lineHeight: 16,
    textAlign: 'center',
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.speechBubble,
    marginTop: -1,
  },
  tailLeft: {
    marginLeft: 30,
    alignSelf: 'flex-start',
  },
  tailCenter: {
    alignSelf: 'center',
  },
  tailRight: {
    alignSelf: 'flex-end',
    marginRight: 30,
  },
});

export default SpeechBubble;
