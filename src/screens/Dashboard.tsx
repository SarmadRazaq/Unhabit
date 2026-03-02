import React, { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, G, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../constants/theme';
import { Button } from '../components/common';
import { Mascot } from '../components/common';
import { InitialsAvatar } from '../components/common';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { useGetDashboardQuery } from '../services/api/homeApi';
import { useGetBuddyQuickViewQuery } from '../services/api/buddiesApi';
import { useGetLevelQuery, useGetBadgesQuery, useGetBadgeGalleryQuery } from '../services/api/rewardsApi';
import { useCompleteTaskMutation } from '../services/api/progressApi';
import { useSelector } from 'react-redux';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * ============================================================================
 * HABIT HEALTH GAUGE
 * ============================================================================
 */
// ... (Keep existing HabitGauge component as is, it's pure UI)

interface HabitGaugeProps {
    percentage?: number;
}

const HabitGauge = ({ percentage = 78 }: HabitGaugeProps) => {
    // ========== DIMENSIONS ==========
    const size = SCREEN_WIDTH - 48;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 40; // Leave padding for stroke and thumb
    const strokeWidth = 18;

    // ========== GAUGE ARC GEOMETRY ==========
    // Semi-circle from 180° (left/9 o'clock) to 0° (right/3 o'clock)
    const startAngleDeg = 180; // 9 o'clock (left)
    const endAngleDeg = 360;   // 3 o'clock (right) - going clockwise
    const totalArcDeg = 180;   // Semi-circle

    // Gap between segments in degrees - wider gaps like in screenshot
    const gapDeg = 12;

    // 4 segments with 3 gaps
    const segmentDeg = (totalArcDeg - (gapDeg * 3)) / 4;

    // ========== HELPER FUNCTIONS ==========
    const degToRad = (deg: number) => (deg * Math.PI) / 180;

    // Calculate point on circle given angle in degrees
    const polarToCartesian = (angleDeg: number, r: number = radius) => {
        const angleRad = degToRad(angleDeg);
        return {
            x: centerX + r * Math.cos(angleRad),
            y: centerY + r * Math.sin(angleRad),
        };
    };

    // Create arc path between two angles
    const createArcPath = (startDeg: number, endDeg: number, r: number = radius) => {
        const start = polarToCartesian(startDeg, r);
        const end = polarToCartesian(endDeg, r);
        const largeArcFlag = (endDeg - startDeg) > 180 ? 1 : 0;

        return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
    };

    // ========== SEGMENT DEFINITIONS ==========
    // Colors matching the screenshot exactly
    const segmentColors = [
        '#E74C3C', // Red (left - low health)
        '#F1C40F', // Yellow/Gold
        '#E67E22', // Orange  
        '#2CE8C6', // Teal (right - high health)
    ];

    // Calculate segment paths
    const segments = segmentColors.map((color, index) => {
        const segStart = startAngleDeg + index * (segmentDeg + gapDeg);
        const segEnd = segStart + segmentDeg;
        return {
            color,
            path: createArcPath(segStart, segEnd),
            startAngle: segStart,
            endAngle: segEnd,
        };
    });

    // ========== THUMB POSITION ==========
    const thumbAngleDeg = startAngleDeg + (percentage / 100) * totalArcDeg;
    const thumbPos = polarToCartesian(thumbAngleDeg);

    // Determine which segment the thumb is in for color
    const getThumbColor = () => {
        for (let i = 0; i < segments.length; i++) {
            if (thumbAngleDeg >= segments[i].startAngle && thumbAngleDeg <= segments[i].endAngle + gapDeg) {
                return segments[i].color;
            }
        }
        return segmentColors[segmentColors.length - 1];
    };

    const thumbColor = getThumbColor();

    return (
        <View style={gaugeStyles.container}>
            <Svg width={size} height={size * 0.52} viewBox={`0 0 ${size} ${size * 0.55}`}>
                <Defs>
                    <RadialGradient id="gaugeGlow" cx="50%" cy="100%" r="80%">
                        <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.08" />
                        <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                {/* Subtle background glow */}
                <Circle cx={centerX} cy={centerY} r={radius + 30} fill="url(#gaugeGlow)" />

                {/* Colored Segments - no background track, just the colored arcs */}
                {segments.map((segment, index) => (
                    <Path
                        key={index}
                        d={segment.path}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                ))}

                {/* Thumb Glow */}
                <Circle cx={thumbPos.x} cy={thumbPos.y} r={18} fill={thumbColor} opacity={0.35} />

                {/* Thumb Outer Ring */}
                <Circle cx={thumbPos.x} cy={thumbPos.y} r={13} fill="white" />

                {/* Thumb Inner Dot */}
                <Circle cx={thumbPos.x} cy={thumbPos.y} r={5} fill={thumbColor} />
            </Svg>

            {/* Center Content */}
            <View style={gaugeStyles.centerContent}>
                <Text style={gaugeStyles.label}>Habit Health</Text>
                <Text style={gaugeStyles.value}>{percentage}%</Text>
            </View>
        </View>
    );
};

const gaugeStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: SPACING.md,
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        bottom: '5%',
    },
    mascot: {
        width: 60,
        height: 60,
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: 14,
        color: COLORS.white,
        marginTop: SPACING.xs,
    },
    value: {
        fontSize: 48,
        color: COLORS.primary,
        fontWeight: '600',
        letterSpacing: -2,
    },
});

interface DashboardProps {
    navigation?: any;
}

// Checklist items - now typed for API integration
interface Task {
    id: string;
    title: string;
    xp: number;
    progress: number;
    completed: boolean;
}

export const Dashboard = ({ navigation }: DashboardProps) => {
    const { data: dashboardData, isLoading, isError, error, refetch, isFetching } = useGetDashboardQuery(undefined);
    const { data: buddyData } = useGetBuddyQuickViewQuery(undefined);
    const { data: levelData } = useGetLevelQuery(undefined);
    const { data: badgesData } = useGetBadgesQuery(undefined);
    const { data: badgeGalleryData } = useGetBadgeGalleryQuery(undefined);
    const [completeTask, { isLoading: isCompletingDay }] = useCompleteTaskMutation();
    const authUser = useSelector((state: any) => state.auth.user);
    const { alert } = useThemedAlert();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    if (isLoading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.content, { justifyContent: 'center' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (isError && !dashboardData) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                            progressBackgroundColor={COLORS.surface}
                        />
                    }
                >
                    <Ionicons name="cloud-offline-outline" size={48} color={COLORS.primary} />
                    <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: '600', marginTop: SPACING.md, textAlign: 'center' }}>
                        Couldn't load your dashboard
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.sm, textAlign: 'center' }}>
                        {(error as any)?.data?.message || 'Pull down to retry or check your connection.'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.primaryButton, { marginTop: SPACING.lg, width: '100%' }]}
                        onPress={onRefresh}
                    >
                        <Text style={styles.primaryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Use API data — no fake fallbacks
    const habitHealth = dashboardData?.habit_health ?? 0;
    const user = dashboardData?.user ?? {
        name: authUser?.name || authUser?.full_name || 'User',
        avatar_url: authUser?.avatar_url ?? null,
    };
    const xp = dashboardData?.xp ?? { today: 0, total: 0, level: 1 };
    const nextBadge = dashboardData?.rewards?.next_badge ?? badgeGalleryData?.locked?.[0] ?? null;
    const nextBadgeName = nextBadge?.name ?? nextBadge?.badge_definitions?.name ?? null;
    const checklistItems = dashboardData?.todays_checklist ?? [];
    const journey = dashboardData?.journey ?? { current_day: 1, total_days: 21 };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                        progressBackgroundColor={COLORS.surface}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            style={styles.avatarContainer}
                            onPress={() => navigation?.navigate('Profile')}
                        >
                            <View style={styles.avatarRing}>
                                <InitialsAvatar
                                    uri={user.avatar_url}
                                    name={user.name}
                                    size={43}
                                    style={styles.avatar}
                                />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.headerText}>
                            <Text style={styles.greeting}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; })()}, {user.name}</Text>
                            <Text style={styles.dayCount}>Day {journey.current_day} of {journey.total_days}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.notificationBtn}
                        onPress={() => navigation?.navigate('Notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>

                {/* Habit Health Gauge */}
                <HabitGauge percentage={habitHealth} />

                {/* XP Card */}
                <View style={styles.card}>
                    <View style={styles.xpHeader}>
                        <Text style={styles.xpLabel}>XP Today:</Text>
                        <Text style={styles.xpValue}>+{xp.today}</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressTrack}>
                            {/* Visualizing rough level progress */}
                            <View style={[styles.progressFill, { width: `${xp.level_progress || 0}%` }]} />
                        </View>
                    </View>
                    <View style={styles.levelRow}>
                        <Text style={styles.levelInactive}>Level {Math.max(1, xp.level - 1)}</Text>
                        <Text style={styles.levelActive}>Level {xp.level}</Text>
                        <Text style={styles.levelInactive}>Level {xp.level + 1}</Text>
                        <Text style={styles.levelInactive}>Level {xp.level + 2}</Text>
                    </View>
                </View>

                {/* Next Badge */}
                {nextBadgeName && (
                <View style={styles.badgeCard}>
                    <View style={styles.badgeLeft}>
                        <Text style={styles.badgeIcon}>🏅</Text>
                        <Text style={styles.badgeLabel}>Next Badge:</Text>
                    </View>
                    <View style={styles.badgeRight}>
                        <Text style={styles.badgeTitle}>{nextBadgeName}</Text>
                        <View style={styles.badgeCircle}>
                            <Ionicons name="arrow-forward" size={16} color={COLORS.black} />
                        </View>
                    </View>
                </View>
                )}

                {/* Today's Checklist */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Today's Checklist</Text>
                    <View style={styles.checklistContainer}>
                        {checklistItems.length === 0 ? (
                            <View style={styles.checklistEmpty}>
                                <Ionicons name="clipboard-outline" size={32} color="rgba(255,255,255,0.3)" />
                                <Text style={styles.checklistEmptyText}>No tasks for today yet</Text>
                                <Text style={styles.checklistEmptySubtext}>Start a journey to get daily tasks</Text>
                            </View>
                        ) : (
                            checklistItems.map((item: any) => (
                                <View key={item.id} style={styles.checklistItem}>
                                    <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
                                        {item.completed && (
                                            <Ionicons name="checkmark" size={14} color={COLORS.black} />
                                        )}
                                    </View>
                                    <View style={styles.checklistContent}>
                                        <View style={styles.checklistHeader}>
                                            <Text style={styles.checklistTitle}>{item.title}</Text>
                                            <Text style={styles.checklistXp}>+{item.xp} XP</Text>
                                        </View>
                                        <View style={styles.checklistProgressTrack}>
                                            <View
                                                style={[
                                                    styles.checklistProgressFill,
                                                    { width: `${item.completed ? 100 : 0}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                    {journey?.id && checklistItems.length > 0 && (
                        <TouchableOpacity style={styles.outlineButton} onPress={() => {
                            navigation?.navigate('JourneyDayView' as never, { journeyId: journey.id } as never);
                        }}>
                            <Text style={styles.outlineButtonText}>View Today Details</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Complete Today Button */}
                {checklistItems.length > 0 && (
                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        (isCompletingDay || checklistItems.every((t: any) => t.completed)) && { opacity: 0.6 },
                    ]}
                    onPress={async () => {
                        try {
                            if (checklistItems.every((t: any) => t.completed)) {
                                return;
                            }

                            // Complete each uncompleted task individually so the backend
                            // awards XP, updates the streak, and checks badges per task
                            const uncompleted = checklistItems.filter((t: any) => !t.completed);

                            for (const task of uncompleted) {
                                await completeTask(task.id).unwrap();
                            }

                            // Refetch dashboard to get fresh streak/XP after completions
                            const freshResult = await refetch();
                            const fresh = freshResult.data;

                            const streakCount = fresh?.streak?.current ?? (dashboardData?.streak?.current ?? 0) + 1;
                            // Use fresh XP today from backend (accounts for all tasks completed today)
                            // Fallback: count all checklist tasks * 10 XP each
                            const xpEarned = fresh?.xp?.today ?? (checklistItems.length * 10);
                            const dayCompleted = fresh?.journey?.current_day ?? dashboardData?.journey?.current_day ?? 1;
                            navigation?.navigate('DailyCompletion' as never, {
                                streakCount,
                                xpEarned,
                                dayCompleted,
                            } as never);
                        } catch {
                            alert('Error', 'Failed to complete today. Please try again.');
                        }
                    }}
                    disabled={isCompletingDay || checklistItems.every((t: any) => t.completed)}
                >
                    <Text style={styles.primaryButtonText}>
                        {isCompletingDay ? 'Completing...' : (checklistItems.every((t: any) => t.completed) ? 'Day Complete ✓' : 'Complete Today')}
                    </Text>
                </TouchableOpacity>
                )}

                {/* Buddy Quick View */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Buddy Quick View</Text>
                    <View style={styles.buddyRow}>
                        <View>
                            <Text style={styles.buddyCount}>{buddyData?.total_buddies ?? 0} Buddies</Text>
                            <Text style={styles.buddySubtext}>{buddyData?.completed_today ?? 0} Completed Today</Text>
                        </View>
                        <View style={styles.buddyAvatars}>
                            {(buddyData?.buddy_avatars || []).slice(0, 2).map((avatar: any, i: number) => (
                                <InitialsAvatar
                                    key={i}
                                    uri={avatar?.avatar_url || avatar}
                                    name={avatar?.name || avatar?.full_name}
                                    email={avatar?.email}
                                    size={35}
                                    style={[styles.buddyAvatar, i === 0 && styles.buddyAvatarFirst]}
                                />
                            ))}
                            {(!buddyData?.buddy_avatars || buddyData.buddy_avatars.length === 0) && (
                                <>
                                    <View style={[styles.buddyAvatar, styles.buddyAvatarFirst]} />
                                    <View style={styles.buddyAvatar} />
                                </>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.outlineButton} onPress={() => navigation?.navigate('Buddies')}>
                        <Text style={styles.outlineButtonText}>Invite a buddy</Text>
                    </TouchableOpacity>
                </View>

                {/* Rewards Card */}
                <LinearGradient
                    colors={['rgba(44, 232, 198, 0.15)', 'rgba(12, 12, 12, 0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.rewardsCard}
                >
                    <Text style={styles.cardTitle}>Rewards</Text>
                    <View style={styles.rewardRow}>
                        <View style={styles.rewardLeft}>
                            <Ionicons name="bar-chart-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.rewardLabel}>Level {levelData?.level ?? xp.level}:</Text>
                        </View>
                        <Text style={styles.rewardValue}>{levelData?.total_xp?.toLocaleString() ?? xp.total?.toLocaleString() ?? '0'} XP</Text>
                    </View>
                    <View style={styles.rewardRow}>
                        <View style={styles.rewardLeft}>
                            <Ionicons name="ribbon-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.rewardLabel}>{badgesData?.earned?.length ?? 0} Badges unlocked:</Text>
                        </View>
                        <Text style={styles.rewardValue}>{badgesData?.next_soon ? '1 Next soon' : ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.outlineButton} onPress={() => navigation?.navigate('MainTabs', { screen: 'Achievements' })}>
                        <Text style={styles.outlineButtonText}>View Rewards</Text>
                    </TouchableOpacity>
                </LinearGradient>

                {/* View Plan Button */}
                <TouchableOpacity style={styles.primaryButton} onPress={() => navigation?.navigate('JourneyDayView' as never, { journeyId: journey?.id } as never)}>
                    <Text style={styles.primaryButtonText}>View Plan / Calendar</Text>
                </TouchableOpacity>

                {/* Bottom Nav Spacer */}
                <View style={{ height: 20 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    avatarContainer: {
        width: 55,
        height: 55,
    },
    avatarRing: {
        width: 55,
        height: 55,
        borderRadius: 27.5,
        borderWidth: 2,
        borderColor: COLORS.primary,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: 43,
        height: 43,
        borderRadius: 21.5,
        backgroundColor: COLORS.gray[600],
    },
    headerText: {
        gap: 4,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    dayCount: {
        fontSize: 24,
        color: COLORS.white,
        fontWeight: '700',
    },
    notificationBtn: {
        width: 39,
        height: 39,
        borderRadius: 19.5,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#0C0C0C',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    xpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    xpLabel: {
        fontSize: 14,
        color: COLORS.white,
    },
    xpValue: {
        fontSize: 20,
        color: COLORS.white,
        fontWeight: '700',
    },
    progressBarContainer: {
        marginBottom: SPACING.md,
    },
    progressTrack: {
        height: 12,
        borderRadius: 64,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 64,
        backgroundColor: 'rgba(44, 232, 198, 0.8)',
    },
    levelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    levelActive: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    levelInactive: {
        fontSize: 14,
        color: COLORS.white,
    },
    badgeCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.1)',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    badgeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    badgeIcon: {
        fontSize: 24,
    },
    badgeLabel: {
        fontSize: 14,
        color: COLORS.white,
    },
    badgeRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    badgeTitle: {
        fontSize: 20,
        color: COLORS.white,
        fontWeight: '700',
    },
    badgeCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 20,
        color: COLORS.white,
        fontWeight: '500',
        marginBottom: SPACING.md,
    },
    checklistContainer: {
        gap: SPACING.md,
        marginBottom: SPACING.md,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING.sm,
        overflow: 'hidden',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        backgroundColor: '#FFF8E9',
        borderWidth: 1,
        borderColor: 'rgba(246, 207, 125, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxCompleted: {
        backgroundColor: '#FFF8E9',
    },
    checklistContent: {
        flex: 1,
        gap: SPACING.sm,
    },
    checklistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: SPACING.sm,
    },
    checklistTitle: {
        fontSize: 14,
        color: COLORS.white,
        fontWeight: '500',
        flex: 1,
        flexShrink: 1,
    },
    checklistXp: {
        fontSize: 14,
        color: COLORS.white,
        flexShrink: 0,
        minWidth: 50,
        textAlign: 'right',
    },
    checklistProgressTrack: {
        height: 12,
        borderRadius: 64,
        backgroundColor: 'rgba(246, 207, 125, 0.1)',
        overflow: 'hidden',
    },
    checklistProgressFill: {
        height: '100%',
        borderRadius: 64,
        backgroundColor: 'rgba(246, 207, 125, 0.8)',
    },
    checklistEmpty: {
        alignItems: 'center',
        paddingVertical: SPACING.lg,
        gap: SPACING.sm,
    },
    checklistEmptyText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
    },
    checklistEmptySubtext: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.3)',
    },
    outlineButton: {
        height: 55,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outlineButtonText: {
        fontSize: 18,
        color: COLORS.primary,
        fontWeight: '600',
    },
    primaryButton: {
        height: 65,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    primaryButtonText: {
        fontSize: 18,
        color: COLORS.black,
        fontWeight: '600',
    },
    buddyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    buddyCount: {
        fontSize: 20,
        color: COLORS.primary,
        fontWeight: '600',
    },
    buddySubtext: {
        fontSize: 14,
        color: COLORS.white,
    },
    buddyAvatars: {
        flexDirection: 'row',
    },
    buddyAvatar: {
        width: 43,
        height: 43,
        borderRadius: 21.5,
        backgroundColor: COLORS.gray[600],
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    buddyAvatarFirst: {
        marginRight: -15,
        zIndex: 1,
    },
    rewardsCard: {
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        padding: SPACING.lg,
        marginBottom: SPACING.lg,
    },
    rewardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    rewardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rewardLabel: {
        fontSize: 14,
        color: COLORS.white,
    },
    rewardValue: {
        fontSize: 20,
        color: COLORS.primary,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Dashboard;
