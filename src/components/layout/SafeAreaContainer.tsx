import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

interface SafeAreaContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const SafeAreaContainer = ({
  children,
  style,
  backgroundColor = COLORS.background,
}: SafeAreaContainerProps) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaContainer;

