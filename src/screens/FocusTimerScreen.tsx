import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Vibration,
    ScrollView,
    Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/theme';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { formatDateTime } from '../utils/date';
import {
    useStartFocusMutation,
    useStopFocusMutation,
    useCancelFocusMutation,
    useGetFocusHistoryQuery,
    useGetFocusStatsQuery,
    useGetActiveFocusQuery,
} from '../services/api/focusApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIMER_SIZE = SCREEN_WIDTH * 0.7;
const STROKE_WIDTH = 8;
const RADIUS = (TIMER_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Preset durations in minutes
const PRESETS = [
    { label: '15 min', minutes: 15 },
    { label: '25 min', minutes: 25 },
    { label: '45 min', minutes: 45 },
    { label: '60 min', minutes: 60 },
];

const FOCUS_TIMER_SNAPSHOT_KEY = '@unhabit/focus_timer_snapshot';

type FocusTimerSnapshot = {
    version: 1;
    selectedMinutes: number;
    timeLeft: number;
    isRunning: boolean;
    isPaused: boolean;
    activeSessionId: string | null;
    savedAtMs: number;
};

const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
    <View style={styles.statCard}>
        <Ionicons name={icon as any} size={20} color={COLORS.primary} />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ============================================================================
// HISTORY ITEM
// ============================================================================
    const HistoryItem = ({ session }: { session: any }) => (
    <View style={styles.historyItem}>
        <View style={styles.historyIcon}>
            <Ionicons name="timer-outline" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.historyInfo}>
            <Text style={styles.historyDuration}>
                {session.duration_mins ?? Math.round((session.duration ?? 0) / 60)} min
            </Text>
            <Text style={styles.historyDate}>
                {session.started_at ? formatDateTime(session.started_at) : session.created_at ? formatDateTime(session.created_at) : 'Recent'}
            </Text>
        </View>
        {(session.xp_awarded != null && session.xp_awarded > 0) && (
            <Text style={styles.historyXP}>+{session.xp_awarded} XP</Text>
        )}
    </View>
);

// ============================================================================
// MAIN SCREEN
// ============================================================================
const FocusTimerScreen = () => {
    const { alert } = useThemedAlert();
    const navigation = useNavigation();

    // API
    const { data: statsData } = useGetFocusStatsQuery(undefined);
    const { data: historyData } = useGetFocusHistoryQuery(undefined);
    const { data: activeSessionData, refetch: refetchActiveSession } = useGetActiveFocusQuery(undefined, {
        pollingInterval: 15000,
    });
    const [startFocusApi] = useStartFocusMutation();
    const [stopFocusApi] = useStopFocusMutation();
    const [cancelFocusApi] = useCancelFocusMutation();

    // Timer state
    const [selectedMinutes, setSelectedMinutes] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [snapshotHydrated, setSnapshotHydrated] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<Date | null>(null);
    const handleCompleteRef = useRef<() => void>(() => {});

    const totalSeconds = selectedMinutes * 60;
    const progress = 1 - timeLeft / totalSeconds;
    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    const stats = statsData ?? {};
    const allTimeStats = (stats as any)?.all_time ?? {};
    const history = Array.isArray(historyData) ? historyData : (historyData?.sessions ?? []);

    useEffect(() => {
        let mounted = true;

        const hydrateSnapshot = async () => {
            try {
                const raw = await AsyncStorage.getItem(FOCUS_TIMER_SNAPSHOT_KEY);
                if (!raw) return;

                const snapshot = JSON.parse(raw) as FocusTimerSnapshot;
                if (!mounted || !snapshot || snapshot.version !== 1) return;

                const minutes = Number(snapshot.selectedMinutes) || 25;
                const baseTime = Number(snapshot.timeLeft) || minutes * 60;
                const safeTimeLeft = Math.max(0, baseTime);

                setSelectedMinutes(minutes);
                setActiveSessionId(snapshot.activeSessionId ?? null);

                if (!snapshot.isRunning) {
                    setIsRunning(false);
                    setIsPaused(false);
                    setTimeLeft(safeTimeLeft || minutes * 60);
                    return;
                }

                if (snapshot.isPaused) {
                    setIsRunning(true);
                    setIsPaused(true);
                    setTimeLeft(safeTimeLeft || minutes * 60);
                    return;
                }

                const elapsed = Math.max(0, Math.floor((Date.now() - (snapshot.savedAtMs || Date.now())) / 1000));
                const remaining = Math.max(0, safeTimeLeft - elapsed);

                if (remaining > 0) {
                    setIsRunning(true);
                    setIsPaused(false);
                    setTimeLeft(remaining);
                } else {
                    setIsRunning(false);
                    setIsPaused(false);
                    setTimeLeft(minutes * 60);
                    await AsyncStorage.removeItem(FOCUS_TIMER_SNAPSHOT_KEY);
                }
            } catch {
                // ignore snapshot parse/storage issues
            } finally {
                if (mounted) {
                    setSnapshotHydrated(true);
                }
            }
        };

        hydrateSnapshot();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!snapshotHydrated) return;

        const snapshot: FocusTimerSnapshot = {
            version: 1,
            selectedMinutes,
            timeLeft,
            isRunning,
            isPaused,
            activeSessionId,
            savedAtMs: Date.now(),
        };

        AsyncStorage.setItem(FOCUS_TIMER_SNAPSHOT_KEY, JSON.stringify(snapshot)).catch(() => {
            // ignore snapshot write failures
        });
    }, [snapshotHydrated, selectedMinutes, timeLeft, isRunning, isPaused, activeSessionId]);

    const restoreFromActiveSession = useCallback(async (session: any) => {
        if (!session?.started_at || !session?.duration_mins) {
            return;
        }

        const durationMins = Number(session.duration_mins);
        const startedAtMs = new Date(session.started_at).getTime();
        if (!durationMins || Number.isNaN(startedAtMs)) {
            return;
        }

        const total = durationMins * 60;
        const elapsed = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
        const remaining = Math.max(0, total - elapsed);

        setSelectedMinutes(durationMins);
        setActiveSessionId(session.id ?? null);
        startTimeRef.current = new Date(startedAtMs);

        if (remaining <= 0) {
            setIsRunning(false);
            setIsPaused(false);
            setTimeLeft(durationMins * 60);
            if (session.id) {
                try {
                    await stopFocusApi({ session_id: session.id } as any).unwrap();
                    setActiveSessionId(null);
                } catch {
                    // ignore
                }
            }
            return;
        }

        setTimeLeft(remaining);
        setIsRunning(true);
        setIsPaused(false);
    }, [stopFocusApi]);

    useEffect(() => {
        if (activeSessionData) {
            restoreFromActiveSession(activeSessionData);
        }
    }, [activeSessionData, restoreFromActiveSession]);

    useFocusEffect(
        useCallback(() => {
            refetchActiveSession();
            return undefined;
        }, [refetchActiveSession])
    );

    // Timer logic
    useEffect(() => {
        if (isRunning && !isPaused) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current!);
                        handleCompleteRef.current();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, isPaused]);

    const handleStart = async () => {
        try {
            const result = await startFocusApi({ duration_mins: selectedMinutes }).unwrap();
            setActiveSessionId((result as any)?.id ?? null);
            setTimeLeft(selectedMinutes * 60);
            setIsRunning(true);
            setIsPaused(false);
            startTimeRef.current = new Date();
        } catch (e: any) {
            const active = e?.data?.active_session;
            if (active) {
                await restoreFromActiveSession(active);
                return;
            }
            alert('Could not start focus', 'Please try again.');
        }
    };

    const handlePause = () => {
        setIsPaused(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };

    const handleResume = () => {
        setIsPaused(false);
    };

    const handleStop = async () => {
        if (!activeSessionId) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsRunning(false);
            setIsPaused(false);
            setTimeLeft(selectedMinutes * 60);
            return;
        }

        try {
            await cancelFocusApi({ session_id: activeSessionId } as any).unwrap();
        } catch (error: any) {
            const status = error?.status || error?.originalStatus;
            if (status === 404) {
                try {
                    await stopFocusApi({ session_id: activeSessionId } as any).unwrap();
                    alert(
                        'Backend update required',
                        'Your backend does not support /focus/cancel yet. Session was ended via /focus/stop.'
                    );
                } catch {
                    alert('Could not stop session', 'Please try again.');
                    return;
                }
            } else {
                alert('Could not stop session', 'Please try again.');
                return;
            }
        }

        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsRunning(false);
        setIsPaused(false);
        setTimeLeft(selectedMinutes * 60);
        setActiveSessionId(null);
    };

    const handleComplete = async () => {
        Vibration.vibrate([500, 200, 500]);
        setIsRunning(false);
        setIsPaused(false);
        try {
            if (activeSessionId) {
                await stopFocusApi({ session_id: activeSessionId } as any).unwrap();
                setActiveSessionId(null);
            }
        } catch { /* ignore */ }
        alert('🎉 Focus Complete!', `Great job! You stayed focused for ${selectedMinutes} minutes.`);
        setTimeLeft(selectedMinutes * 60);
    };

    // Keep the ref in sync so the interval closure always calls the latest version
    handleCompleteRef.current = handleComplete;

    const selectPreset = (minutes: number) => {
        if (isRunning) return;
        setSelectedMinutes(minutes);
        setTimeLeft(minutes * 60);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Focus Timer</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Timer */}
                <View style={styles.timerContainer}>
                    <Svg width={TIMER_SIZE} height={TIMER_SIZE}>
                        <Circle
                            cx={TIMER_SIZE / 2} cy={TIMER_SIZE / 2} r={RADIUS}
                            stroke="rgba(44,232,198,0.1)" strokeWidth={STROKE_WIDTH} fill="none"
                        />
                        <Circle
                            cx={TIMER_SIZE / 2} cy={TIMER_SIZE / 2} r={RADIUS}
                            stroke={COLORS.primary} strokeWidth={STROKE_WIDTH} fill="none"
                            strokeDasharray={CIRCUMFERENCE}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${TIMER_SIZE / 2} ${TIMER_SIZE / 2})`}
                        />
                    </Svg>
                    <View style={styles.timerTextContainer}>
                        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                        <Text style={styles.timerLabel}>
                            {isRunning ? (isPaused ? 'PAUSED' : 'FOCUSING') : 'READY'}
                        </Text>
                    </View>
                </View>

                {/* Presets */}
                {!isRunning && (
                    <View style={styles.presetsRow}>
                        {PRESETS.map(p => (
                            <TouchableOpacity
                                key={p.minutes}
                                style={[styles.presetBtn, selectedMinutes === p.minutes && styles.presetBtnSelected]}
                                onPress={() => selectPreset(p.minutes)}
                            >
                                <Text style={[styles.presetText, selectedMinutes === p.minutes && styles.presetTextSelected]}>
                                    {p.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Controls */}
                <View style={styles.controlsRow}>
                    {!isRunning ? (
                        <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
                            <Ionicons name="play" size={32} color="black" />
                            <Text style={styles.startBtnText}>Start Focus</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={styles.controlBtn}
                                onPress={isPaused ? handleResume : handlePause}
                            >
                                <Ionicons name={isPaused ? 'play' : 'pause'} size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
                                <Ionicons name="stop" size={24} color="white" />
                                <Text style={styles.stopBtnText}>Stop</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Stats */}
                <Text style={styles.sectionTitle}>Your Stats</Text>
                <View style={styles.statsRow}>
                    <StatCard icon="flame" label="Sessions" value={String(allTimeStats.sessions ?? 0)} />
                    <StatCard icon="time" label="Total Hours" value={String(Math.round((allTimeStats.minutes ?? 0) / 60))} />
                    <StatCard icon="star" label="XP Earned" value={String(allTimeStats.xp ?? 0)} />
                </View>

                {/* History */}
                {history.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Recent Sessions</Text>
                        {history.slice(0, 5).map((s: any, i: number) => (
                            <HistoryItem key={s.id || i} session={s} />
                        ))}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    },
    backBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '500', color: COLORS.white },
    scrollContent: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    timerContainer: { justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    timerTextContainer: {
        position: 'absolute', justifyContent: 'center', alignItems: 'center',
    },
    timerText: { fontSize: 48, fontWeight: '700', color: 'white', fontVariant: ['tabular-nums'] },
    timerLabel: { fontSize: 14, fontWeight: '500', color: COLORS.primary, marginTop: 4, letterSpacing: 2 },
    presetsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    presetBtn: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    presetBtnSelected: { backgroundColor: 'rgba(44,232,198,0.15)', borderColor: COLORS.primary },
    presetText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
    presetTextSelected: { color: COLORS.primary, fontWeight: '600' },
    controlsRow: { flexDirection: 'row', gap: 16, marginBottom: 32, alignItems: 'center' },
    startBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: COLORS.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30,
    },
    startBtnText: { fontSize: 18, fontWeight: '700', color: 'black' },
    controlBtn: {
        width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(44,232,198,0.15)', borderWidth: 1, borderColor: COLORS.primary,
    },
    stopBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,100,100,0.2)', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28,
        borderWidth: 1, borderColor: 'rgba(255,100,100,0.3)',
    },
    stopBtnText: { fontSize: 16, fontWeight: '600', color: 'white' },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: 'white', alignSelf: 'flex-start', marginBottom: 12 },
    statsRow: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 24 },
    statCard: {
        flex: 1, alignItems: 'center', gap: 6, padding: 16, borderRadius: 12,
        backgroundColor: '#0C0C0C', borderWidth: 1, borderColor: 'rgba(44,232,198,0.1)',
    },
    statValue: { fontSize: 22, fontWeight: '700', color: 'white' },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    historyItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
        backgroundColor: '#0C0C0C', borderRadius: 12, marginBottom: 8, width: '100%',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    historyIcon: {
        width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(44,232,198,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    historyInfo: { flex: 1, gap: 2 },
    historyDuration: { fontSize: 15, fontWeight: '500', color: 'white' },
    historyDate: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
    historyXP: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
});

export default FocusTimerScreen;
