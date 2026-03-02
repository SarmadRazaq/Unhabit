import { StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

// Global reusable styles
export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerPadded: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
  },

  // Flex utilities
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  textCenter: {
    textAlign: 'center',
  },
  heading1: {
    fontSize: TYPOGRAPHY.fontSize['3xl'],
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  heading2: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  heading3: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  body: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray[700],
  },
  caption: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray[500],
  },
});

