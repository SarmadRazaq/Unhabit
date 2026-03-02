import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import {
    useGetDailyChallengeQuery,
    useAcceptChallengeMutation,
    useCompleteChallengeMutation,
} from '../services/api/challengesApi';
import { useGetStreakDetailsQuery } from '../services/api/streaksApi';
import { useShareProgressMutation, useShareAchievementMutation } from '../services/api/shareApi';
import { useThemedAlert } from '../components/common/ThemedAlert';

// ============================================================================
// CHALLENGE CARD
// ============================================================================
const ChallengeCard = ({ challenge, onAccept, onComplete, isAccepting, isCompleting }: {
    challenge: any; onAccept: () => void; onComplete: () => void;
    isAccepting: boolean; isCompleting: boolean;
}) => {
    const status = challenge?.status ?? 'available';
    const isAccepted = status === 'accepted' || status === 'in_progress';
    const isCompleted = status === 'completed';

    return (
        <LinearGradient
            colors={isCompleted
                ? ['rgba(52,199,89,0.15)', 'rgba(12,12,12,0)']
                : ['rgba(44,232,198,0.15)', 'rgba(12,12,12,0)']}
            style={styles.challengeCard}
        >
            <View style={styles.challengeHeader}>
                <View style={styles.challengeBadge}>
                    <Ionicons
                        name={isCompleted ? 'checkmark-circle' : 'flash'}
                        size={24}
                        color={isCompleted ? '#34C759' : '#FFD60A'}
                    />
                </View>
                <View style={styles.challengeReward}>
                    <Text style={styles.rewardText}>+{challenge?.reward_xp ?? 15} XP</Text>
                </View>
            </View>

            <Text style={styles.challengeTitle}>{challenge?.title ?? 'Daily Challenge'}</Text>
            <Text style={styles.challengeDesc}>
                {challenge?.description ?? 'Complete your tasks faster today to earn bonus XP!'}
            </Text>

            {challenge?.target_value && (
                <View style={styles.challengeTarget}>
                    <Ionicons name="flag-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.targetText}>Goal: {challenge.target_value}</Text>
                </View>
            )}

            {!isCompleted && (
                <TouchableOpacity
                    style={[styles.challengeBtn, isAccepted && styles.challengeBtnComplete]}
                    onPress={isAccepted ? onComplete : onAccept}
                    disabled={isAccepting || isCompleting}
                >
                    {(isAccepting || isCompleting) ? (
                        <ActivityIndicator color="black" size="small" />
                    ) : (
                        <Text style={styles.challengeBtnText}>
                            {isAccepted ? 'Mark Complete ✓' : 'Accept Challenge ⚡'}
                        </Text>
                    )}
                </TouchableOpacity>
            )}

            {isCompleted && (
                <View style={styles.completedBanner}>
                    <Ionicons name="trophy" size={18} color="#FFD60A" />
                    <Text style={styles.completedText}>Challenge Completed! 🎉</Text>
                </View>
            )}
        </LinearGradient>
    );
};

// ============================================================================
// SHARE SECTION
// ============================================================================
const ShareSection = ({ onShareProgress, onShareAchievement }: {
    onShareProgress: () => void; onShareAchievement: () => void;
}) => (
    <View style={styles.shareSection}>
        <Text style={styles.sectionTitle}>Share Your Journey</Text>
        <Text style={styles.sectionSubtitle}>Inspire others by sharing your progress</Text>
        <View style={styles.shareRow}>
            <TouchableOpacity style={styles.shareBtn} onPress={onShareProgress}>
                <Ionicons name="trending-up" size={22} color={COLORS.primary} />
                <Text style={styles.shareBtnText}>Share Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={onShareAchievement}>
                <Ionicons name="trophy-outline" size={22} color="#FFD60A" />
                <Text style={styles.shareBtnText}>Share Badge</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// ============================================================================
// MAIN SCREEN
// ============================================================================
const ChallengesScreen = () => {
    const navigation = useNavigation();
    const { alert } = useThemedAlert();
    const { data: challengeData, isLoading, refetch } = useGetDailyChallengeQuery(undefined);
    const { data: streakData } = useGetStreakDetailsQuery(undefined);
    const [acceptChallenge, { isLoading: isAccepting }] = useAcceptChallengeMutation();
    const [completeChallenge, { isLoading: isCompleting }] = useCompleteChallengeMutation();
    const [shareProgress] = useShareProgressMutation();
    const [shareAchievement] = useShareAchievementMutation();

    const challenge = challengeData?.challenge ?? challengeData?.data ?? challengeData;

    const handleAccept = async () => {
        try {
            const id = challenge?.id ?? 'daily';
            await acceptChallenge(id).unwrap();
            refetch();
            alert('Challenge Accepted! ⚡', 'Complete the challenge today to earn bonus XP!');
        } catch {
            alert('Error', 'Failed to accept challenge.');
        }
    };

    const handleComplete = async () => {
        try {
            const id = challenge?.id ?? 'daily';
            await completeChallenge(id).unwrap();
            refetch();
            alert('🎉 Challenge Complete!', `You earned +${challenge?.xp_reward ?? 15} XP!`);
        } catch {
            alert('Error', 'Failed to complete challenge. Make sure you met the goal!');
        }
    };

    const handleShareProgress = async () => {
        try {
            const result = await shareProgress({
                type: 'streak',
                streak: streakData?.current_streak ?? 0,
            }).unwrap();
            const url = (result as any)?.share_url ?? (result as any)?.url ?? '';
            await Share.share({
                message: `I'm on a ${streakData?.current_streak ?? 0}-day streak on Unhabit! 🔥 ${url}`,
                title: 'My Habit Progress',
            });
        } catch {
            await Share.share({
                message: `I'm on a ${streakData?.current_streak ?? 0}-day streak on Unhabit! 🔥`,
                title: 'My Habit Progress',
            });
        }
    };

    const handleShareAchievement = async () => {
        try {
            const result = await shareAchievement({
                type: 'streak_milestone',
                streak: streakData?.current_streak ?? 0,
            }).unwrap();
            const url = (result as any)?.share_url ?? (result as any)?.url ?? '';
            await Share.share({
                message: `I just hit a milestone on Unhabit! 🏆 ${url}`,
                title: 'My Achievement',
            });
        } catch {
            await Share.share({
                message: `I just hit a milestone on Unhabit! 🏆`,
                title: 'My Achievement',
            });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Challenges</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero */}
                <View style={styles.hero}>
                    <Text style={styles.heroLabel}>Daily Challenge</Text>
                    <Text style={styles.heroTitle}>Push yourself a little further each day.</Text>
                </View>

                {isLoading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : challenge ? (
                    <ChallengeCard
                        challenge={challenge}
                        onAccept={handleAccept}
                        onComplete={handleComplete}
                        isAccepting={isAccepting}
                        isCompleting={isCompleting}
                    />
                ) : (
                    <View style={styles.noChallenge}>
                        <Ionicons name="flash-outline" size={48} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.noChallengeText}>No challenge available right now</Text>
                        <Text style={styles.noChallengeSubtext}>Check back tomorrow for a new challenge!</Text>
                    </View>
                )}

                {/* Streak Summary */}
                {streakData && (
                    <LinearGradient
                        colors={['rgba(255,214,10,0.1)', 'rgba(12,12,12,0)']}
                        style={styles.streakCard}
                    >
                        <View style={styles.streakRow}>
                            <View style={styles.streakItem}>
                                <Text style={styles.streakNumber}>{streakData.current_streak ?? 0}</Text>
                                <Text style={styles.streakLabel}>Current Streak</Text>
                            </View>
                            <View style={styles.streakDivider} />
                            <View style={styles.streakItem}>
                                <Text style={styles.streakNumber}>{streakData.longest_streak ?? 0}</Text>
                                <Text style={styles.streakLabel}>Longest Streak</Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}

                {/* Share */}
                <ShareSection
                    onShareProgress={handleShareProgress}
                    onShareAchievement={handleShareAchievement}
                />

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    },
    backBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '500', color: COLORS.white },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    centered: { padding: 40, alignItems: 'center' },
    hero: { marginBottom: 20, gap: 8 },
    heroLabel: { fontSize: 14, fontWeight: '500', color: COLORS.primary },
    heroTitle: { fontSize: 24, fontWeight: '700', color: 'white', maxWidth: 280 },
    challengeCard: {
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(44,232,198,0.2)',
        padding: 20, gap: 12, marginBottom: 20,
    },
    challengeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    challengeBadge: {
        width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,214,10,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    challengeReward: {
        backgroundColor: 'rgba(44,232,198,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    rewardText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    challengeTitle: { fontSize: 20, fontWeight: '700', color: 'white' },
    challengeDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
    challengeTarget: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    targetText: { fontSize: 13, color: COLORS.primary },
    challengeBtn: {
        backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12,
        alignItems: 'center', marginTop: 4,
    },
    challengeBtnComplete: { backgroundColor: '#34C759' },
    challengeBtnText: { fontSize: 16, fontWeight: '600', color: 'black' },
    completedBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: 'rgba(52,199,89,0.1)', paddingVertical: 12, borderRadius: 12,
    },
    completedText: { fontSize: 15, fontWeight: '600', color: '#34C759' },
    noChallenge: { alignItems: 'center', padding: 40, gap: 8 },
    noChallengeText: { fontSize: 18, fontWeight: '600', color: 'white' },
    noChallengeSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
    streakCard: {
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,214,10,0.2)',
        padding: 20, marginBottom: 24,
    },
    streakRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    streakItem: { alignItems: 'center', gap: 4 },
    streakNumber: { fontSize: 32, fontWeight: '700', color: 'white' },
    streakLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
    streakDivider: { width: 1, height: 50, backgroundColor: 'rgba(255,255,255,0.1)' },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 8 },
    sectionSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 16 },
    shareSection: { gap: 4 },
    shareRow: { flexDirection: 'row', gap: 12 },
    shareBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 12, backgroundColor: '#0C0C0C',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    shareBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
});

export default ChallengesScreen;
