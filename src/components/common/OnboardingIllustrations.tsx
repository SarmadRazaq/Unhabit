import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface IllustrationProps {
  size?: number;
}
export const MeetNudgeIllustration = ({ size = 150 }: IllustrationProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={styles.emoji}>🤝</Text>
      <Text style={styles.label}>Meet Nudge</Text>
    </View>
  );
};

export const TellHabitIllustration = ({ size = 150 }: IllustrationProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text style={styles.emoji}>💬</Text>
      <Text style={styles.label}>Tell Your Habit</Text>
    </View>
  );
};

export const JourneyIllustration = ({ size = 150 }: IllustrationProps) => {
  return (
    <View style={[styles.container, { width: size * 1.3, height: size }]}>
      <Text style={styles.emoji}>🗺️</Text>
      <Text style={styles.label}>Your Journey</Text>
    </View>
  );
};

export const TrackTransformIllustration = ({ size = 150 }: IllustrationProps) => {
  return (
    <View style={[styles.container, { width: size * 1.2, height: size }]}>
      <Text style={styles.emoji}>📈</Text>
      <Text style={styles.label}>Track & Transform</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44, 232, 198, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(44, 232, 198, 0.2)',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
