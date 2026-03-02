import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, BORDER_RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PermissionType = 'location' | 'notification';

interface PermissionModalProps {
  visible: boolean;
  type: PermissionType;
  onAllow: () => void;
  onSkip: () => void;
}

const permissionContent = {
  location: {
    title: 'Location',
    description: 'Allow maps to access your\nlocation while you use the app?',
    image: require('../../../assets/onboarding/locationPopup.png'),
  },
  notification: {
    title: 'Notification',
    description: 'Please enable notifications to\nreceive updates and reminders',
    image: require('../../../assets/onboarding/notificationPopup.png'),
  },
};

export const PermissionModal = ({
  visible,
  type,
  onAllow,
  onSkip,
}: PermissionModalProps) => {
  const content = permissionContent[type];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#1E4D47', '#0D2926', '#0A1F1C']}
          locations={[0, 0.5, 1]}
          style={styles.modalContainer}
        >
          {/* Mascot Image */}
          <View style={styles.imageContainer}>
            <Image
              source={content.image}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{content.title}</Text>

          {/* Description */}
          <Text style={styles.description}>{content.description}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Allow Button - White/Light */}
            <TouchableOpacity 
              onPress={onAllow} 
              activeOpacity={0.8}
              style={styles.allowButton}
            >
              <Text style={styles.allowButtonText}>Allow</Text>
            </TouchableOpacity>
            
            <View style={styles.buttonSpacer} />
            
            {/* Skip Button - Teal outlined */}
            <TouchableOpacity 
              onPress={onSkip} 
              activeOpacity={0.8}
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.backgroundOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContainer: {
    borderRadius: BORDER_RADIUS['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(44, 232, 198, 0.3)',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    width: SCREEN_WIDTH - SPACING.xl * 2,
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  imageContainer: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  mascotImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
    opacity: 0.8,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: SPACING.sm,
  },
  allowButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    backgroundColor: '#E8E8E8',
  },
  allowButtonText: {
    color: COLORS.black,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '500',
  },
  skipButton: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  skipButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '500',
  },
  buttonSpacer: {
    height: SPACING.md,
  },
});

export default PermissionModal;
