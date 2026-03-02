import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}

export const TextInput = ({
  value,
  onChangeText,
  placeholder = '',
  style,
  inputStyle,
  autoFocus = false,
  onSubmitEditing,
}: TextInputProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputWrapper}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray[400]}
          style={[styles.input, inputStyle]}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          returnKeyType="done"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  input: {
    backgroundColor: 'transparent',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
});

export default TextInput;

