import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface LoadingScreenProps {
  message?: string;
  onLoadingComplete?: () => void;
  duration?: number;
}

export const LoadingScreen = ({
  message = 'Loading',
  onLoadingComplete,
  duration = 2000,
}: LoadingScreenProps) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dot4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.loop(
            Animated.sequence([
              Animated.timing(dot, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(dot, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          ),
        ]);
      };

      Animated.parallel([
        createDotAnimation(dot1, 0),
        createDotAnimation(dot2, 100),
        createDotAnimation(dot3, 200),
        createDotAnimation(dot4, 300),
      ]).start();
    };

    animateDots();

    if (onLoadingComplete) {
      const timer = setTimeout(() => {
        onLoadingComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [onLoadingComplete, duration]);

  const getDotStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      {/* Mascot at top */}
      <View style={styles.mascotContainer}>
        <Image
          source={require('../../../assets/onboarding/nudge.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Loading text */}
      <Text style={styles.loadingText}>{message}</Text>

      {/* Animated dots */}
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
        <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
        <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
        <Animated.View style={[styles.dot, getDotStyle(dot4)]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotContainer: {
    marginBottom: SPACING.xl,
  },
  mascotImage: {
    width: 140,
    height: 140,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SPACING.md,
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginHorizontal: 4,
  },
});

export default LoadingScreen;

