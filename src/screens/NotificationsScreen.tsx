import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllReadMutation } from '../services/api/notificationsApi';
import { formatDateTime } from '../utils/date';

// Notification types
type NotificationType = 'reminder' | 'completion' | 'badge' | 'motivation' | 'buddy' | 'nudge';

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    subtitle: string;
    detail?: string;
    time: string;
    read: boolean;
    icon: string;
}

// No mock data — notifications come from API

// Streak Alert Card Component
const StreakAlertCard = ({ onPress }: { onPress: () => void }) => (
    <LinearGradient
        colors={['rgba(44, 232, 198, 0.15)', 'rgba(12, 12, 12, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.streakCard}
    >
        <View style={styles.streakContent}>
            <View style={styles.streakHeader}>
                <View style={styles.streakTextContainer}>
                    <Text style={styles.streakTitle}>Daily Motivation</Text>
                    <Text style={styles.streakWarning}>Don't forget to complete your tasks today!</Text>
                    <Text style={styles.streakMessage}>Complete at least 1 task to keep your streak alive</Text>
                </View>
                <View style={styles.streakIconContainer}>
                    <Ionicons name="flame" size={24} color="#FFEE2E" />
                </View>
            </View>
            <TouchableOpacity style={styles.streakButton} onPress={onPress}>
                <Text style={styles.streakButtonText}>Go to Today's Tasks</Text>
            </TouchableOpacity>
        </View>
    </LinearGradient>
);

// Per-type icon colors matching design
const NOTIFICATION_COLORS: Record<NotificationType, string> = {
    reminder: '#FF9500',     // orange
    completion: COLORS.primary, // green/teal
    badge: '#5AC8FA',        // blue
    motivation: COLORS.primary, // green/teal
    buddy: '#AF52DE',        // purple
    nudge: '#FF6B6B',        // red
};

// Notification Item Component
const NotificationItem = ({ 
    notification, 
    onPress 
}: { 
    notification: Notification;
    onPress: () => void;
}) => {
    const iconBg = NOTIFICATION_COLORS[notification.type] || COLORS.primary;
    return (
    <TouchableOpacity 
        style={[
            styles.notificationItem,
            !notification.read && styles.notificationUnread,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
    >
        <View style={styles.notificationRow}>
            <View style={styles.notificationLeft}>
                <View style={[styles.notificationIconContainer, { backgroundColor: iconBg }]}>
                    <Ionicons 
                        name={notification.icon as any} 
                        size={24} 
                        color={COLORS.black}
                    />
                </View>
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationSubtitle}>{notification.subtitle}</Text>
                    {notification.detail && (
                        <Text style={styles.notificationDetail}>{notification.detail}</Text>
                    )}
                </View>
            </View>
            <Text style={styles.notificationTime}>{notification.time}</Text>
        </View>
    </TouchableOpacity>
    );
};

export const NotificationsScreen = () => {
    const { alert } = useThemedAlert();
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // API hooks
    const { data: notificationsApiData, isLoading: notificationsLoading, isError: notificationsError } = useGetNotificationsQuery(undefined);
    const [markRead] = useMarkNotificationReadMutation();
    const [markAllRead] = useMarkAllReadMutation();

    // Sync API data into local state when available
    useEffect(() => {
        const apiData = Array.isArray(notificationsApiData) ? notificationsApiData : (notificationsApiData?.notifications ?? []);
        if (apiData.length > 0) {
            const mapped = apiData.map((n: any) => ({
                id: n.id,
                type: n.type || 'reminder',
                title: n.title,
                subtitle: n.message || n.body || n.subtitle || '',
                detail: n.detail,
                time: n.created_at ? formatDateTime(n.created_at) : 'Just now',
                read: n.is_read ?? n.read ?? false,
                icon: n.icon_name || n.icon || 'notifications',
            }));
            setNotifications(mapped);
        }
    }, [notificationsApiData]);

    const handleMarkAllRead = () => {
        markAllRead(undefined).unwrap().catch(() => {});
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleNotificationPress = (notification: Notification) => {
        // Mark as read via API
        markRead(notification.id).unwrap().catch(() => {});
        // Mark as read locally
        setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );

        // Handle different notification types
        switch (notification.type) {
            case 'reminder':
            case 'completion':
                // Navigate to dashboard/home
                (navigation as any).navigate('MainTabs', { screen: 'Home' });
                break;
            case 'badge':
                // Navigate to achievements
                (navigation as any).navigate('Achievements');
                break;
            case 'motivation':
                // Navigate to challenges
                (navigation as any).navigate('Challenges');
                break;
            case 'buddy':
            case 'nudge':
                // Navigate to buddies
                (navigation as any).navigate('Buddies');
                break;
            default:
                navigation.goBack();
                break;
        }
    };

    const handleGoToTasks = () => {
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-down" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={handleMarkAllRead}>
                    <Ionicons name="checkmark-done" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Streak Alert Card */}
                <StreakAlertCard onPress={handleGoToTasks} />

                {/* Notifications List */}
                <View style={styles.notificationsList}>
                    {notificationsLoading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={{ color: '#999', marginTop: 12 }}>Loading notifications...</Text>
                        </View>
                    ) : notificationsError ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Ionicons name="alert-circle-outline" size={32} color="#FF4C0D" />
                            <Text style={{ color: '#999', marginTop: 12 }}>Failed to load notifications</Text>
                        </View>
                    ) : notifications.length === 0 ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Ionicons name="notifications-off-outline" size={32} color="#999" />
                            <Text style={{ color: '#999', marginTop: 12 }}>No notifications yet</Text>
                        </View>
                    ) : (
                        notifications.map(notification => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onPress={() => handleNotificationPress(notification)}
                            />
                        ))
                    )}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.white,
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
    },
    // Streak Alert Card
    streakCard: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        padding: 19,
        marginBottom: SPACING.lg,
    },
    streakContent: {
        gap: 24,
    },
    streakHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    streakTextContainer: {
        flex: 1,
        gap: 5,
    },
    streakTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
    },
    streakWarning: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FC9502',
        marginTop: 5,
    },
    streakMessage: {
        fontSize: 14,
        color: COLORS.white,
        marginTop: 10,
    },
    streakIconContainer: {
        width: 39,
        height: 39,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 238, 46, 0.14)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakButton: {
        height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        width: 190,
    },
    streakButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.black,
    },
    // Notifications List
    notificationsList: {
        gap: 14,
    },
    notificationItem: {
        backgroundColor: '#141414',
        borderRadius: 20,
        paddingHorizontal: 17,
        paddingVertical: 20,
    },
    notificationUnread: {
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.5)',
    },
    notificationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 14,
    },
    notificationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 89,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
        gap: 10,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    notificationSubtitle: {
        fontSize: 15,
        color: COLORS.white,
    },
    notificationDetail: {
        fontSize: 14,
        color: COLORS.white,
        marginTop: -2,
    },
    notificationTime: {
        fontSize: 12,
        color: COLORS.white,
    },
});

export default NotificationsScreen;
