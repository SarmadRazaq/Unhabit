import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import { useGetActiveFocusQuery, useStopFocusMutation } from '../../services/api/focusApi';
import { useThemedAlert } from './ThemedAlert';

const formatCountdown = (seconds: number): string => {
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface GlobalFocusTimerBannerProps {
    navigationRef: NavigationContainerRefWithCurrent<any>;
}

export const GlobalFocusTimerBanner = ({ navigationRef }: GlobalFocusTimerBannerProps) => {
    const { alert } = useThemedAlert();
    const { data: activeSession, refetch } = useGetActiveFocusQuery(undefined, {
        pollingInterval: 10000,
        refetchOnFocus: true,
        refetchOnReconnect: true,
    });
    const [stopFocusApi] = useStopFocusMutation();

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const completionHandledForSessionRef = useRef<string | null>(null);

    const isNavigationReady = navigationRef.isReady();
    const currentRouteName = isNavigationReady ? navigationRef.getCurrentRoute()?.name : undefined;
    const isOnFocusTimerScreen = currentRouteName === 'FocusTimer';

    useEffect(() => {
        const session = activeSession as any;

        if (!session?.id || !session?.started_at || !session?.duration_mins) {
            setSessionId(null);
            setSecondsLeft(null);
            return;
        }

        const startedAtMs = new Date(session.started_at).getTime();
        const totalSeconds = Number(session.duration_mins) * 60;
        if (Number.isNaN(startedAtMs) || !totalSeconds) {
            setSessionId(null);
            setSecondsLeft(null);
            return;
        }

        const elapsed = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
        const remaining = Math.max(0, totalSeconds - elapsed);

        setSessionId(session.id);
        setSecondsLeft(remaining);
    }, [activeSession]);

    useEffect(() => {
        if (secondsLeft == null || secondsLeft <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev == null) return prev;
                return Math.max(0, prev - 1);
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [secondsLeft]);

    useEffect(() => {
        const finalizeSessionIfNeeded = async () => {
            if (!sessionId || secondsLeft !== 0) return;
            if (completionHandledForSessionRef.current === sessionId) return;
            if (isOnFocusTimerScreen) return;

            completionHandledForSessionRef.current = sessionId;
            try {
                await stopFocusApi({ session_id: sessionId } as any).unwrap();
            } catch {
                // ignore stop errors; session may already be completed elsewhere
            }
            setSessionId(null);
            setSecondsLeft(null);
            refetch();
            alert('🎉 Focus Complete!', 'Great job! Your focus session is completed.');
        };

        finalizeSessionIfNeeded();
    }, [sessionId, secondsLeft, isOnFocusTimerScreen, stopFocusApi, refetch, alert]);

    const visible = useMemo(() => {
        return !isOnFocusTimerScreen && !!sessionId && secondsLeft != null && secondsLeft > 0;
    }, [isOnFocusTimerScreen, sessionId, secondsLeft]);

    if (!visible) {
        return null;
    }

    return (
        <View pointerEvents="box-none" style={styles.overlay}>
            <TouchableOpacity
                style={styles.banner}
                activeOpacity={0.85}
                onPress={() => {
                    if (!isNavigationReady) return;
                    navigationRef.navigate('FocusTimer');
                }}
            >
                <View style={styles.leftGroup}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="timer-outline" size={16} color={COLORS.black} />
                    </View>
                    <View>
                        <Text style={styles.title}>Focus session running</Text>
                        <Text style={styles.subtitle}>Tap to open timer</Text>
                    </View>
                </View>

                <Text style={styles.timeText}>{formatCountdown(secondsLeft ?? 0)}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 88,
        zIndex: 50,
    },
    banner: {
        minHeight: 54,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(44, 232, 198, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    leftGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginRight: 8,
    },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    title: {
        color: COLORS.black,
        fontSize: 14,
        fontWeight: '700',
    },
    subtitle: {
        color: 'rgba(0,0,0,0.65)',
        fontSize: 11,
        marginTop: 1,
    },
    timeText: {
        color: COLORS.black,
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
        fontVariant: ['tabular-nums'],
    },
});
