import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    Modal,
    Linking,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { APP_CONFIG } from '../constants/config';
import { useGetMeQuery, useLogoutMutation, useUpdateProfileMutation, useResetPasswordMutation, useDeleteAccountMutation } from '../services/api/auth';
import { useGetLevelQuery } from '../services/api/rewardsApi';
import { useGetStreakDetailsQuery } from '../services/api/streaksApi';
import { useGetActiveJourneyQuery } from '../services/api/journeysApi';
import { useGetHabitsQuery } from '../services/api/habitsApi';
import { useRequestExportMutation } from '../services/api/settingsApi';
import { useGetDashboardQuery } from '../services/api/homeApi';
import { useAppDispatch } from '../store/hooks';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { extractImageUri, formatMonthYear } from '../utils';

interface JourneyLite {
    start_date?: string;
    planned_days?: number;
    current_day?: number;
    user_habits?: { goal_text?: string };
    journey_blueprints?: { title?: string };
}

interface DashboardJourneyLite {
    current_day?: number;
    total_days?: number;
    habit_goal?: string;
}

interface HabitLite {
    name?: string;
}

// Menu items matching the design
const MENU_ITEMS = [
    { id: 'settings', icon: 'settings-outline' as const, label: 'Settings' },
    { id: 'notifications', icon: 'notifications-outline' as const, label: 'Notifications' },
    { id: 'ai_coach', icon: 'sparkles-outline' as const, label: 'AI Coach Preferences' },
    { id: 'support', icon: 'information-circle-outline' as const, label: 'Support & Info' },
];

/** Derive level name from level number — mirrors backend getLevelName() */
function getLevelName(level: number): string {
    const names = ['Beginner', 'Builder', 'Warrior', 'Champion', 'Master', 'Legend', 'Elite'];
    if (level <= 3) return names[level - 1] || 'Beginner';
    if (level <= 10) return names[3] || 'Champion';
    if (level <= 20) return names[4] || 'Master';
    if (level <= 50) return names[5] || 'Legend';
    return names[6] || 'Elite';
}



export const ProfileScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const dispatch = useAppDispatch();
    const { alert } = useThemedAlert();

    // API hooks
    const { data: meData, refetch: refetchMe, isLoading: meLoading } = useGetMeQuery(undefined);
    const { data: levelData } = useGetLevelQuery(undefined);
    const { data: streakData } = useGetStreakDetailsQuery(undefined);
    const { data: dashboardData } = useGetDashboardQuery(undefined, {
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    const { data: journeyData } = useGetActiveJourneyQuery(undefined, {
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    const { data: habitsData } = useGetHabitsQuery(undefined);
    const [logoutApi] = useLogoutMutation();
    const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
    const [resetPassword] = useResetPasswordMutation();
    const [deleteAccount] = useDeleteAccountMutation();
    const [requestExport] = useRequestExportMutation();

    // Modal states
    // Modal states - Removed as they are now in SettingsScreen


    // Build profile from API data
    const resolvedName = meData?.profile?.full_name ?? meData?.user?.full_name ?? meData?.user?.name ?? 'User';
    const resolvedEmail = meData?.user?.email ?? '';
    const profileInitials = (() => {
        const source = resolvedName && resolvedName !== 'User'
            ? resolvedName
            : (resolvedEmail.split('@')[0] || 'U');
        const parts = source.trim().split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
        }
        return (parts[0]?.slice(0, 2) || 'U').toUpperCase();
    })();

    const profile = {
        name: resolvedName,
        email: resolvedEmail,
        avatarUrl: extractImageUri(meData?.profile?.avatar_url) ?? extractImageUri(meData?.user?.avatar_url),
        initials: profileInitials,
        levelName: getLevelName(levelData?.level ?? 1),
        currentStreak: streakData?.current_streak ?? 0,
        joinedDate: (meData?.profile?.created_at ?? meData?.user?.created_at)
            ? formatMonthYear(meData?.profile?.created_at ?? meData?.user?.created_at)
            : '',
    };

    // Journey / habit info
    const journey = journeyData as JourneyLite | undefined;
    const dashboardJourney = (dashboardData as { journey?: DashboardJourneyLite } | undefined)?.journey;
    const firstHabitName = Array.isArray(habitsData)
        ? ((habitsData as HabitLite[])[0]?.name ?? null)
        : null;
    const habitName = dashboardJourney?.habit_goal ?? journey?.user_habits?.goal_text ?? journey?.journey_blueprints?.title ?? firstHabitName ?? 'My Habit';
    const totalDays = dashboardJourney?.total_days ?? journey?.planned_days ?? 21;
    const currentDay = (() => {
        if (dashboardJourney?.current_day) {
            return dashboardJourney.current_day;
        }
        if (journey?.start_date && totalDays > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = new Date(journey.start_date);
            startDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            return Math.min(Math.max(diffDays + 1, 1), totalDays);
        }
        return journey?.current_day ?? 1;
    })();
    const habitHealth = totalDays > 0 ? Math.min(Math.round((currentDay / totalDays) * 100), 100) : 0;

    // Edit Profile & Change Password logic moved to SettingsScreen


    // ── Linked Accounts ──
    const handleLinkedAccounts = () => {
        const provider = meData?.user?.app_metadata?.provider || 'email';
        alert(
            'Linked Accounts',
            `You are signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
            [{ text: 'OK' }]
        );
    };

    // ── Delete Account ──
    const handleDeleteAccount = () => {
        alert(
            'Delete Account',
            'This will permanently delete your account and all data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount(undefined).unwrap();
                            // Auth gate in RootNavigator auto-routes to unauthenticated screens
                        } catch (err: any) {
                            alert('Error', err?.data?.message || 'Failed to delete account.');
                        }
                    },
                },
            ]
        );
    };

    // ── Menu Press ──
    const handleMenuPress = (id: string) => {
        switch (id) {
            case 'settings':
                navigation.navigate('Settings');
                break;
            case 'notifications':
                navigation.navigate('Notifications');
                break;
            case 'ai_coach':
                navigation.navigate('Chat');
                break;
            case 'support':
                navigation.navigate('Support');
                break;
            default:
                break;
        }
    };

    const handleLogout = () => {
        alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logoutApi(undefined);
                        } catch (e) {
                            // logout action already dispatched in onQueryStarted
                        }
                        navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
                    }
                },
            ]
        );
    };

    if (meLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar style="light" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section — Horizontal Layout */}
                <View style={styles.profileSection}>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
                        <View style={styles.avatarRing}>
                            {profile.avatarUrl ? (
                                <Image
                                    source={{ uri: profile.avatarUrl }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatarBadge}>
                                    <Text style={styles.avatarBadgeText}>{profile.initials}</Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{profile.name}</Text>
                        {!!profile.email && (
                            <Text style={styles.userEmail} numberOfLines={1} ellipsizeMode="middle">
                                {profile.email}
                            </Text>
                        )}
                        <Text style={styles.habitSubtitle}>
                            {habitName} · Day {currentDay} of {totalDays}
                        </Text>
                        <View style={styles.memberBadge}>
                            <Text style={styles.memberBadgeText}>
                                Member Since: {profile.joinedDate}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Quick Progress Card */}
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Quick Progress</Text>
                    <View style={styles.progressStatsRow}>
                        <View style={styles.progressStat}>
                            <Ionicons name="flame" size={18} color={COLORS.primary} />
                            <Text style={styles.progressStatText}>
                                Current Streak: {profile.currentStreak} days
                            </Text>
                        </View>
                        <View style={styles.progressStat}>
                            <Ionicons name="star" size={18} color={COLORS.primary} />
                            <Text style={styles.progressStatText}>
                                Level: {profile.levelName}
                            </Text>
                        </View>
                    </View>

                    {/* Habit Health */}
                    <View style={styles.habitHealthRow}>
                        <Text style={styles.habitHealthLabel}>Habit Health</Text>
                        <Text style={styles.habitHealthValue}>{habitHealth}%</Text>
                    </View>
                    <View style={styles.healthBarTrack}>
                        <View
                            style={[
                                styles.healthBarSegmentOrange,
                                { width: `${Math.min(habitHealth, 33)}%` },
                            ]}
                        />
                        <View
                            style={[
                                styles.healthBarSegmentGreen,
                                { width: `${Math.max(0, Math.min(habitHealth - 33, 33))}%` },
                            ]}
                        />
                        <View
                            style={[
                                styles.healthBarSegmentTeal,
                                { width: `${Math.max(0, habitHealth - 66)}%` },
                            ]}
                        />
                        {/* Dot markers */}
                        <View style={[styles.healthBarDot, { left: '33%' }]} />
                        <View style={[styles.healthBarDot, { left: '66%' }]} />
                    </View>

                    {/* View Progress Button */}
                    <TouchableOpacity
                        style={styles.viewProgressBtn}
                        onPress={() => navigation.navigate('Stats')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewProgressText}>View Progress</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                {MENU_ITEMS.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => handleMenuPress(item.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.menuLeft}>
                            <View style={styles.menuIconContainer}>
                                <Ionicons name={item.icon} size={22} color={COLORS.primary} />
                            </View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                        </View>
                        <Ionicons name="open-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                ))}

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Text style={styles.logoutText}>Logout</Text>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.white} />
                </TouchableOpacity>

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
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
    },
    /* ── Profile Section ── */
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        gap: SPACING.lg,
    },
    avatarRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2.5,
        borderColor: COLORS.primary,
        padding: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 78,
        height: 78,
        borderRadius: 39,
    },
    avatarBadge: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarBadgeText: {
        fontSize: 30,
        fontWeight: '700',
        color: COLORS.black,
        letterSpacing: 0.5,
    },
    profileInfo: {
        flex: 1,
        gap: 6,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.white,
    },
    userEmail: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: '500',
    },
    habitSubtitle: {
        fontSize: 14,
        color: '#AAA',
    },
    memberBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(44, 232, 198, 0.12)',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginTop: 4,
    },
    memberBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    /* ── Quick Progress Card ── */
    progressCard: {
        backgroundColor: '#111',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.25)',
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
        gap: SPACING.md,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.white,
    },
    progressStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    progressStatText: {
        fontSize: 14,
        color: '#CCC',
    },
    habitHealthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    habitHealthLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.white,
    },
    habitHealthValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
    },
    healthBarTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.08)',
        flexDirection: 'row',
        overflow: 'hidden',
        position: 'relative',
    },
    healthBarSegmentOrange: {
        height: '100%',
        backgroundColor: '#F5A623',
    },
    healthBarSegmentGreen: {
        height: '100%',
        backgroundColor: '#4CD964',
    },
    healthBarSegmentTeal: {
        height: '100%',
        backgroundColor: COLORS.primary,
    },
    healthBarDot: {
        position: 'absolute',
        top: 1,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#000',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        marginLeft: -4,
    },
    viewProgressBtn: {
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    viewProgressText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
    },
    /* ── Menu Items ── */
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.25)',
        padding: SPACING.md,
        paddingVertical: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(44, 232, 198, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.white,
    },
    /* ── Logout ── */
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: '#111',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.25)',
        paddingVertical: SPACING.lg,
        marginTop: SPACING.md,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#1A1A1A',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.lg,
    },
    modalLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: SPACING.xs,
    },
    modalInput: {
        backgroundColor: '#0C0C0C',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        padding: SPACING.md,
        fontSize: 16,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    modalCancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },
    modalSaveBtn: {
        flex: 1,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSaveText: {
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '600',
    },
});

export default ProfileScreen;
