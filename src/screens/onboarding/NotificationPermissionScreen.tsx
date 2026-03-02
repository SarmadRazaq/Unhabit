import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Mascot, SpeechBubble, PermissionModal, SkipButton } from '../../components/common';
import { useThemedAlert } from '../../components/common/ThemedAlert';
import { COLORS, SPACING } from '../../constants/theme';

interface NotificationPermissionScreenProps {
  navigation: any;
}

export const NotificationPermissionScreen = ({
  navigation,
}: NotificationPermissionScreenProps) => {
  const { alert } = useThemedAlert();
  const [modalVisible, setModalVisible] = useState(false);

  // Show modal automatically every time screen comes into focus
  // but skip if permission already granted
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (cancelled) return;
        if (status === 'granted') {
          // Already granted — skip this screen
          navigation.navigate('OnboardingTutorial');
          return;
        }
        setTimeout(() => {
          if (!cancelled) setModalVisible(true);
        }, 500);
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const handleAllow = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert(
          'Permission Denied',
          'Push notifications help remind you to stay on track. You can enable them later in Settings.',
          [{ text: 'OK' }]
        );
      }

      // Set default notification behavior
      if (finalStatus === 'granted') {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
      }
    } catch (e) {
      if (__DEV__) console.error('Notification permission error:', e);
    }

    setModalVisible(false);
    navigation.navigate('OnboardingTutorial');
  };

  const handleSkip = () => {
    setModalVisible(false);
    navigation.navigate('OnboardingTutorial');
  };

  const handleSkipAll = () => {
    // Skip the entire onboarding
    navigation.navigate('OnboardingTutorial');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Skip button */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <SkipButton onPress={handleSkipAll} />
      </View>

      {/* Speech Bubble - Absolutely positioned above mascot */}
      <View style={styles.speechBubbleContainer}>
        <SpeechBubble
          title="Meet Nudge"
          subtitle="Your smart AI coach here to guide your habit journey"
          tailPosition="center"
        />
      </View>

      {/* Mascot - Absolutely positioned at bottom center */}
      <View style={styles.mascotContainer}>
        <Mascot />
      </View>

      {/* Permission Modal */}
      <PermissionModal
        visible={modalVisible}
        type="notification"
        onAllow={handleAllow}
        onSkip={handleSkip}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    zIndex: 10,
  },
  headerSpacer: {
    flex: 1,
  },
  speechBubbleContainer: {
    position: 'absolute',
    top: "28%", // Position above mascot
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    zIndex: 2,
  },
  mascotContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

export default NotificationPermissionScreen;

