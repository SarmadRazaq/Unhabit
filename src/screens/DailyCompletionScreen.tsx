import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { useShareProgressMutation } from '../services/api/shareApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// CONFETTI PARTICLE
// ============================================================================
const CONFETTI_COLORS = ['#2CE8C6', '#FFD60A', '#FF6B6B', '#5AC8FA', '#34C759', '#FF9500', '#AF52DE'];

const ConfettiParticle = ({ delay, startX }: { delay: number; startX: number }) => {
    const translateY = useRef(new Animated.Value(-20)).current;
    const translateX = useRef(new Animated.Value(0)).current;
    const rotate = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    const size = 6 + Math.random() * 8;

    useEffect(() => {
        const drift = (Math.random() - 0.5) * 120;
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT * 0.7,
                    duration: 2500 + Math.random() * 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: drift,
                    duration: 2500 + Math.random() * 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(rotate, {
                    toValue: 4 + Math.random() * 8,
                    duration: 2500 + Math.random() * 1500,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const spin = rotate.interpolate({
        inputRange: [0, 10],
        outputRange: ['0deg', '3600deg'],
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: startX,
                top: 0,
                width: size,
                height: size * 0.6,
                backgroundColor: color,
                borderRadius: 2,
                opacity,
                transform: [{ translateY }, { translateX }, { rotate: spin }],
            }}
        />
    );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
const DailyCompletionScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const [shareProgress] = useShareProgressMutation();

    const streakCount = route.params?.streakCount ?? 1;
    const xpEarned = route.params?.xpEarned ?? 25;
    const dayCompleted = route.params?.dayCompleted ?? 1;

    // Animations
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const badgeScale = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const buttonsY = useRef(new Animated.Value(40)).current;
    const buttonsOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 60,
                friction: 6,
                useNativeDriver: true,
            }),
            Animated.parallel([
                Animated.spring(badgeScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 5,
                    useNativeDriver: true,
                    delay: 200,
                }),
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(buttonsOpacity, {
                    toValue: 1, duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonsY, {
                    toValue: 0, tension: 50, friction: 8,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, []);

    const handleShare = async () => {
        try {
            await shareProgress({
                type: 'daily_completion',
                day: dayCompleted,
                streak: streakCount,
            }).unwrap();
        } catch { /* ignore */ }
        await Share.share({
            message: `I just completed Day ${dayCompleted} of my Unhabit journey! 🔥 ${streakCount}-day streak and counting!`,
            title: 'My Unhabit Progress',
        });
    };

    const confettiParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: Math.random() * 800,
        startX: Math.random() * SCREEN_WIDTH,
    }));

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Confetti */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {confettiParticles.map(p => (
                    <ConfettiParticle key={p.id} delay={p.delay} startX={p.startX} />
                ))}
            </View>

            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <View style={styles.content}>
                    {/* Celebration Icon */}
                    <Animated.View style={[styles.celebrationIcon, { transform: [{ scale: scaleAnim }] }]}>
                        <LinearGradient
                            colors={['rgba(44,232,198,0.2)', 'rgba(44,232,198,0.05)']}
                            style={styles.iconCircleOuter}
                        >
                            <LinearGradient
                                colors={['rgba(44,232,198,0.3)', 'rgba(44,232,198,0.1)']}
                                style={styles.iconCircleInner}
                            >
                                <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
                            </LinearGradient>
                        </LinearGradient>
                    </Animated.View>

                    {/* Title */}
                    <Animated.View style={{ opacity: textOpacity, alignItems: 'center', gap: 8 }}>
                        <Text style={styles.title}>You did it! 🎉</Text>
                        <Text style={styles.subtitle}>Day {dayCompleted} completed successfully</Text>
                    </Animated.View>

                    {/* Streak Badge */}
                    <Animated.View style={[styles.streakBadge, { transform: [{ scale: badgeScale }] }]}>
                        <LinearGradient
                            colors={['rgba(255,214,10,0.2)', 'rgba(255,149,0,0.1)']}
                            style={styles.streakBadgeInner}
                        >
                            <View style={styles.streakFireRow}>
                                <Ionicons name="flame" size={32} color="#FFD60A" />
                                <Text style={styles.streakNumber}>{streakCount}</Text>
                            </View>
                            <Text style={styles.streakLabel}>{streakCount}-Day Streak</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* XP Earned */}
                    <Animated.View style={[styles.xpCard, { opacity: textOpacity }]}>
                        <Ionicons name="star" size={22} color="#FFD60A" />
                        <Text style={styles.xpText}>+{xpEarned} XP Earned!</Text>
                    </Animated.View>

                    {/* Buttons */}
                    <Animated.View style={[styles.buttons, { opacity: buttonsOpacity, transform: [{ translateY: buttonsY }] }]}>
                        <TouchableOpacity style={styles.keepPushingBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.keepPushingText}>Keep Pushing 💪</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                            <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.shareBtnText}>Share Today's Profile</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    safeArea: { flex: 1 },
    content: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 32, gap: 24,
    },
    celebrationIcon: { marginBottom: 8 },
    iconCircleOuter: {
        width: 140, height: 140, borderRadius: 70,
        justifyContent: 'center', alignItems: 'center',
    },
    iconCircleInner: {
        width: 100, height: 100, borderRadius: 50,
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 32, fontWeight: '800', color: 'white', textAlign: 'center' },
    subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
    streakBadge: { alignItems: 'center' },
    streakBadgeInner: {
        borderRadius: 20, paddingHorizontal: 32, paddingVertical: 20,
        alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: 'rgba(255,214,10,0.3)',
    },
    streakFireRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    streakNumber: { fontSize: 40, fontWeight: '800', color: 'white' },
    streakLabel: { fontSize: 16, fontWeight: '600', color: '#FFD60A' },
    xpCard: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,214,10,0.08)', paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,214,10,0.15)',
    },
    xpText: { fontSize: 16, fontWeight: '600', color: '#FFD60A' },
    buttons: { width: '100%', gap: 12, marginTop: 16 },
    keepPushingBtn: {
        backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 14,
        alignItems: 'center',
    },
    keepPushingText: { fontSize: 18, fontWeight: '700', color: 'black' },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 14,
        borderWidth: 1, borderColor: COLORS.primary,
    },
    shareBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
});

export default DailyCompletionScreen;
