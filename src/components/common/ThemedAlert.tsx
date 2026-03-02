import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface ThemedAlertContextValue {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ThemedAlertContext = createContext<ThemedAlertContextValue>({
  alert: () => {},
});

export const useThemedAlert = (): ThemedAlertContextValue =>
  useContext(ThemedAlertContext);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export const ThemedAlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [{ text: 'OK' }],
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  const show = useCallback(() => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const hide = useCallback(
    (onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        onDone?.();
      });
    },
    [fadeAnim, scaleAnim],
  );

  const alert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setOptions({
        title,
        message,
        buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      });
      // Small delay so state update completes before animation
      setTimeout(show, 10);
    },
    [show],
  );

  const handlePress = useCallback(
    (btn: AlertButton) => {
      hide(btn.onPress);
    },
    [hide],
  );

  const handleBackdropPress = useCallback(() => {
    // Dismiss on backdrop tap only when there's a cancel button or a single OK
    const cancelBtn = options.buttons?.find((b) => b.style === 'cancel');
    if (cancelBtn) {
      hide(cancelBtn.onPress);
    } else if (options.buttons?.length === 1) {
      hide(options.buttons[0].onPress);
    }
  }, [options.buttons, hide]);

  /* Helper to decide button color */
  const getButtonStyle = (style?: AlertButton['style']) => {
    switch (style) {
      case 'destructive':
        return { color: COLORS.error };
      case 'cancel':
        return { color: COLORS.textSecondary };
      default:
        return { color: COLORS.primary };
    }
  };

  /* For two-button layout cancel goes left, action goes right */
  const sortedButtons = (() => {
    const btns = options.buttons ?? [{ text: 'OK' }];
    if (btns.length === 2) {
      const cancel = btns.find((b) => b.style === 'cancel');
      const other = btns.find((b) => b.style !== 'cancel');
      if (cancel && other) return [cancel, other];
    }
    return btns;
  })();

  return (
    <ThemedAlertContext.Provider value={{ alert }}>
      {children}

      <Modal
        transparent
        visible={visible}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => handleBackdropPress()}
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.dialog,
                  { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
                ]}
              >
                {/* Title */}
                <Text style={styles.title}>{options.title}</Text>

                {/* Message */}
                {options.message ? (
                  <Text style={styles.message}>{options.message}</Text>
                ) : null}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Buttons */}
                <View
                  style={[
                    styles.buttonRow,
                    sortedButtons.length === 1 && styles.buttonRowSingle,
                  ]}
                >
                  {sortedButtons.map((btn, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.button,
                        sortedButtons.length > 1 && idx < sortedButtons.length - 1
                          ? styles.buttonBorderRight
                          : undefined,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handlePress(btn)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          getButtonStyle(btn.style),
                          btn.style === 'cancel' ? styles.buttonTextCancel : undefined,
                        ]}
                      >
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedAlertContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: width * 0.82,
    backgroundColor: COLORS.gray[900],
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray[700],
    overflow: 'hidden',
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xs,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    lineHeight: 20,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.gray[700],
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonRowSingle: {
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBorderRight: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.gray[700],
  },
  buttonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.primary,
  },
  buttonTextCancel: {
    fontWeight: '400',
  },
});
