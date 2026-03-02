import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface MascotProps {
  size?: number;
  style?: object;
}

export const Mascot = ({ size = 200, style }: MascotProps) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={require('../../../assets/onboarding/nudge.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Mascot;
