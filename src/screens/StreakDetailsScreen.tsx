import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Share,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import {
    useGetStreakDetailsQuery,
    useGetStreakStatusDetailsQuery,
    useGetAvailableFreezesQuery,
} from '../services/api/streaksApi';
import { useShareProgressMutation } from '../services/api/shareApi';
import { formatMonthYear } from '../utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 40 - 6 * 6) / 7); // 7 columns, 6 gaps, 40px padding

// ============================================================================
// CALENDAR GRID
// ============================================================================
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const StreakCalendar = ({ currentStreak, startDate }: { currentStreak: number; startDate?: string }) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const todayDate = today.getDate();

    // Build streak days set (last N days counting back from today)
    const streakDays = useMemo(() => {
        const days = new Set<string>();
        for (let i = 0; i < currentStreak; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            if (d.getMonth() === month && d.getFullYear() === year) {
                days.add(String(d.getDate()));
            }
        }
        return days;
    }, [currentStreak, month, year]);

    const monthName = formatMonthYear(today, 'en-US', 'long');

    // Build grid rows
    const cells: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDayOfWeek).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        week.push(d);
        if (week.length === 7) { cells.push(week); week = []; }
    }
    if (week.length > 0) {
        while (week.length < 7) week.push(null);
        cells.push(week);
    }

    return (
        <View style={calStyles.container}>
            <Text style={calStyles.monthLabel}>{monthName}</Text>
            <View style={calStyles.weekdayRow}>
                {WEEKDAYS.map(d => (
                    <View key={d} style={calStyles.cell}>
                        <Text style={calStyles.weekdayText}>{d}</Text>
                    </View>
                ))}
            </View>
            {cells.map((row, ri) => (
                <View key={ri} style={calStyles.weekRow}>
                    {row.map((day, ci) => {
                        if (day === null) return <View key={ci} style={calStyles.cell} />;
                        const isStreak = streakDays.has(String(day));
                        const isToday = day === todayDate;
                        const isPast = day < todayDate;
                        return (
                            <View
                                key={ci}
                                style={[
                                    calStyles.cell,
                                    isStreak && calStyles.cellStreak,
                                    isToday && calStyles.cellToday,
                                ]}
                            >
                                <Text style={[
                                    calStyles.dayText,
                                    isStreak && calStyles.dayTextStreak,
                                    isToday && calStyles.dayTextToday,
                                    !isPast && !isToday && calStyles.dayTextFuture,
                                ]}>
                                    {day}
                                </Text>
                                {isStreak && !isToday && (
                                    <View style={calStyles.streakDot} />
                                )}
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

const calStyles = StyleSheet.create({
    container: { gap: 4 },
    monthLabel: { fontSize: 16, fontWeight: '600', color: 'white', marginBottom: 12, textAlign: 'center' },
    weekdayRow: { flexDirection: 'row', justifyContent: 'space-between' },
    weekdayText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.4)', width: CELL_SIZE, textAlign: 'center' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
    cell: {
        width: CELL_SIZE, height: CELL_SIZE, justifyContent: 'center', alignItems: 'center',
        borderRadius: CELL_SIZE / 2,
    },
    cellStreak: { backgroundColor: 'rgba(44,232,198,0.15)' },
    cellToday: {
        backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.primary,
    },
    dayText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
    dayTextStreak: { color: COLORS.primary, fontWeight: '600' },
    dayTextToday: { color: 'black', fontWeight: '700' },
    dayTextFuture: { color: 'rgba(255,255,255,0.25)' },
    streakDot: {
        position: 'absolute', bottom: 3, width: 4, height: 4,
        borderRadius: 2, backgroundColor: COLORS.primary,
    },
});

// ============================================================================
// COUNTDOWN TIMER (time until midnight)
// ============================================================================
const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight.getTime() - now.getTime();
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(
                `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            );
        };
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={timerStyles.container}>
            <Text style={timerStyles.label}>Time Remaining Today</Text>
            <Text style={timerStyles.time}>{timeLeft}</Text>
        </View>
    );
};

const timerStyles = StyleSheet.create({
    container: { alignItems: 'center', gap: 6 },
    label: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
    time: { fontSize: 42, fontWeight: '700', color: 'white', letterSpacing: 2, fontVariant: ['tabular-nums'] },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================
const StreakDetailsScreen = () => {
    const navigation = useNavigation();
    const { data: streakData, isLoading } = useGetStreakDetailsQuery(undefined);
    const { data: statusData } = useGetStreakStatusDetailsQuery(undefined);
    const { data: freezeData } = useGetAvailableFreezesQuery(undefined);
    const [shareProgress] = useShareProgressMutation();

    const streak = streakData;
    const status = statusData;
    const currentStreak = streak?.current_streak ?? 0;
    const longestStreak = streak?.longest_streak ?? 0;
    const isAtRisk = status?.at_risk ?? status?.streak_at_risk ?? false;
    const freezesAvailable = freezeData?.available_freezes ?? 0;

    const handleShare = async () => {
        try {
            await shareProgress({ type: 'streak', streak: currentStreak }).unwrap();
        } catch { /* ignore */ }
        await Share.share({
            message: `I'm on a ${currentStreak}-day streak on Unhabit! 🔥 Can you beat mine?`,
            title: 'My Streak',
        });
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar style="light" />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Streak Details</Text>
                <TouchableOpacity onPress={() => (navigation as any).navigate('StreakFreeze')}>
                    <Ionicons name="snow-outline" size={24} color="#5AC8FA" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Streak Hero */}
                <LinearGradient
                    colors={['rgba(255,214,10,0.15)', 'rgba(12,12,12,0)']}
                    style={styles.heroCard}
                >
                    <View style={styles.fireCircle}>
                        <Ionicons name="flame" size={48} color="#FFD60A" />
                    </View>
                    <Text style={styles.heroLabel}>Streak at</Text>
                    <Text style={styles.heroCount}>{currentStreak}</Text>
                    <Text style={styles.heroSubtitle}>
                        Consecutive {currentStreak === 1 ? 'Day' : 'Days'}
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{longestStreak}</Text>
                            <Text style={styles.statLabel}>Longest</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{freezesAvailable}</Text>
                            <Text style={styles.statLabel}>Freezes</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Streak at Risk Warning */}
                {isAtRisk && (
                    <LinearGradient
                        colors={['rgba(239,68,68,0.15)', 'rgba(12,12,12,0)']}
                        style={styles.riskCard}
                    >
                        <View style={styles.riskRow}>
                            <Ionicons name="warning" size={24} color="#EF4444" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.riskTitle}>Streak at Risk!</Text>
                                <Text style={styles.riskText}>
                                    Complete today's tasks before midnight to keep your streak alive!
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Countdown Timer */}
                <View style={styles.timerCard}>
                    <CountdownTimer />
                </View>

                {/* Calendar */}
                <View style={styles.calendarCard}>
                    <StreakCalendar
                        currentStreak={currentStreak}
                    />
                </View>

                {/* Share Button */}
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.shareBtnText}>Share Today's Profile</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    },
    backBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '500', color: COLORS.white },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10, gap: 16 },
    heroCard: {
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,214,10,0.2)',
        padding: 28, alignItems: 'center', gap: 4,
    },
    fireCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,214,10,0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    heroLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
    heroCount: { fontSize: 56, fontWeight: '800', color: 'white' },
    heroSubtitle: { fontSize: 16, fontWeight: '500', color: '#FFD60A', marginBottom: 12 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 32 },
    statItem: { alignItems: 'center', gap: 2 },
    statValue: { fontSize: 22, fontWeight: '700', color: 'white' },
    statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
    statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
    riskCard: {
        borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
        padding: 16,
    },
    riskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    riskTitle: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
    riskText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 20 },
    timerCard: {
        backgroundColor: '#0C0C0C', borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', padding: 24, alignItems: 'center',
    },
    calendarCard: {
        backgroundColor: '#0C0C0C', borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', padding: 16,
    },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 14,
        borderWidth: 1, borderColor: COLORS.primary,
    },
    shareBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
});

export default StreakDetailsScreen;
