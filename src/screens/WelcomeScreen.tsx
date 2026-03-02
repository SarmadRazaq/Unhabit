import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import { SocialButton, LoadingScreen } from '../components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useSocialLogin } from '../hooks/useSocialLogin';
import { useThemedAlert } from '../components/common/ThemedAlert';

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen = ({ navigation }: WelcomeScreenProps) => {
  const { handleAppleLogin, handleGoogleLogin, isLoading, isGoogleReady, isAppleLoginAvailable } = useSocialLogin();
  const { alert } = useThemedAlert();
  const onApplePress = async () => {
    try {
      await handleAppleLogin();
      // Login succeeded — navigate to Splash to determine next screen
      navigation.replace('Splash');
    } catch (error: any) {
      const msg =
        error?.data?.error ||
        error?.error?.data?.error ||
        error?.message ||
        'Could not sign in with Apple.';
      alert('Login Failed', msg);
    }
  };

  const onGooglePress = async () => {
    if (!isGoogleReady) return;
    try {
      await handleGoogleLogin();
      // Login succeeded — navigate to Splash to determine next screen
      navigation.replace('Splash');
    } catch (error: any) {
      alert('Login Failed', error?.message || 'Could not sign in with Google.');
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Signing in..." duration={0} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle={Platform.OS === 'android' ? 'light-content' : 'dark-content'} backgroundColor="#000" translucent={true} />

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <Image
            source={require('../../assets/onboarding/loginNudge.png')}
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>Start Your</Text>
        <Text style={styles.titleHighlight}>UnHabit Journey</Text>
        <Text style={styles.subtitle}>Kickstart your 21-day reset</Text>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonSection}>
        {isAppleLoginAvailable && (
          <>
            <SocialButton
              type="apple"
              onPress={onApplePress}
            />
            <View style={styles.buttonSpacer} />
          </>
        )}
        <SocialButton
          type="google"
          onPress={onGooglePress}
          disabled={!isGoogleReady}
        />
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
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  titleHighlight: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    opacity: 0.7,
  },
  buttonSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'],
  },
  buttonSpacer: {
    height: SPACING.md,
  },
});

export default WelcomeScreen;

