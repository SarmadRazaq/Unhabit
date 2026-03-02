import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { COLORS } from '../../constants/theme';

interface IconProps {
  size?: number;
}

// Location Icon - Simple View-based design (no transforms)
export const LocationIcon = ({ size = 80 }: IconProps) => {
  const iconSize = size * 0.5;
  
  return (
    <View style={[styles.iconContainer, { width: size * 1.5, height: size * 1.2 }]}>
      {/* Blob background */}
      <View style={[styles.blobBackground, { width: size * 1.2, height: size }]}>
        {/* Location pin */}
        <View style={styles.pinContainer}>
          <View style={[styles.pinBody, { width: iconSize * 0.8, height: iconSize }]}>
            <View style={[styles.pinCircle, { width: iconSize * 0.4, height: iconSize * 0.4 }]} />
          </View>
          <View style={[styles.pinPoint, { 
            borderLeftWidth: iconSize * 0.25,
            borderRightWidth: iconSize * 0.25,
            borderTopWidth: iconSize * 0.35,
          }]} />
        </View>
      </View>
    </View>
  );
};

// Notification Icon - Simple View-based design (no transforms)
export const NotificationIcon = ({ size = 80 }: IconProps) => {
  const iconSize = size * 0.5;
  
  return (
    <View style={[styles.iconContainer, { width: size * 1.5, height: size * 1.2 }]}>
      {/* Blob background */}
      <View style={[styles.blobBackground, { width: size * 1.2, height: size }]}>
        {/* Bell icon */}
        <View style={styles.bellContainer}>
          {/* Bell top */}
          <View style={[styles.bellTop, { width: iconSize * 0.15, height: iconSize * 0.2 }]} />
          {/* Bell body */}
          <View style={[styles.bellBody, { width: iconSize * 0.7, height: iconSize * 0.55 }]} />
          {/* Bell bottom */}
          <View style={[styles.bellBottom, { width: iconSize * 0.85, height: iconSize * 0.15 }]} />
          {/* Bell clapper */}
          <View style={[styles.bellClapper, { width: iconSize * 0.2, height: iconSize * 0.2 }]} />
          
          {/* Notification badge */}
          <View style={[styles.notificationBadge, { width: iconSize * 0.35, height: iconSize * 0.35 }]}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobBackground: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Location pin styles
  pinContainer: {
    alignItems: 'center',
  },
  pinBody: {
    backgroundColor: COLORS.speechBubble,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCircle: {
    backgroundColor: '#F8BBD9',
    borderRadius: 999,
  },
  pinPoint: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.speechBubble,
    marginTop: -2,
  },
  // Bell styles
  bellContainer: {
    alignItems: 'center',
  },
  bellTop: {
    backgroundColor: COLORS.speechBubble,
    borderRadius: 4,
    marginBottom: -2,
  },
  bellBody: {
    backgroundColor: COLORS.speechBubble,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bellBottom: {
    backgroundColor: COLORS.speechBubble,
    borderRadius: 999,
    marginTop: -4,
  },
  bellClapper: {
    backgroundColor: COLORS.speechBubble,
    borderRadius: 999,
    marginTop: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -15,
    backgroundColor: '#4ADE80',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
