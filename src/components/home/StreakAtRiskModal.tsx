import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface StreakAtRiskModalProps {
    visible: boolean;
    onClose: () => void;
    onGoToTasks: () => void;
    hoursLeft: number;
    tasksNeeded?: number; // Optional, default to 1
}

export const StreakAtRiskModal = ({
    visible,
    onClose,
    onGoToTasks,
    hoursLeft,
    tasksNeeded = 1
}: StreakAtRiskModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Blur Background */}
                <BlurView intensity={20} style={styles.blur} tint="dark" />

                {/* Modal Content */}
                <View style={styles.modalContainer}>
                    {/* Warning Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="warning" size={32} color={COLORS.black} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Streak at Risk</Text>

                    {/* Time Left */}
                    <Text style={styles.timeLeft}>
                        Only {hoursLeft} hours left today
                    </Text>

                    {/* Message */}
                    <Text style={styles.message}>
                        Complete {tasksNeeded} task to save your streak.
                    </Text>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={onGoToTasks}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.actionButtonText}>Go to Today's Tasks</Text>
                    </TouchableOpacity>

                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    blur: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#1A1A1A', // Darker background to match screenshot
        borderRadius: 24,
        padding: SPACING.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 238, 46, 0.2)', // Yellow with opacity
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 238, 46, 0.3)',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.md,
        textAlign: 'center',
    },
    timeLeft: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary, // Teal color from screenshot
        marginBottom: SPACING.xs,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    actionButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#D9D9D9', // Light gray button
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: -60, // Positioned below the modal content
    },
});
