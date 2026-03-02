import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import { COLORS, SPACING } from '../../constants/theme';

interface OnboardingWelcomeScreenProps {
  navigation: any;
  route: any;
}

export const OnboardingWelcomeScreen = ({ navigation, route }: OnboardingWelcomeScreenProps) => {
  const habitDescription = route?.params?.habitDescription;
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'} backgroundColor="#000" translucent={true} />
      <View style={styles.contentSection}>
        <View style={styles.mascotContainer}>
          <Image
            source={require('../../../assets/onboarding/nudge.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
          {/* Confetti/celebration effect can be added here if desired */}
        </View>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>Ready to UnHabit?</Text>
      </View>
      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Questions', { habitDescription })}>
          <Text style={styles.primaryButtonText}>Start Your Journey</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.secondaryButtonText}>Already Started? Log In</Text>
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
    width: 180,
    height: 180,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  buttonSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingWelcomeScreen;
