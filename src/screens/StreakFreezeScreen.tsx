import React from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { useThemedAlert } from '../components/common/ThemedAlert';
import {
    useGetStreakDetailsQuery,
    useFreezeStreakMutation,
    usePurchaseStreakFreezeMutation,
    useGetAvailableFreezesQuery,
} from '../services/api/streaksApi';
import { useGetLevelQuery } from '../services/api/rewardsApi';

// ============================================================================
// MAIN SCREEN
// ============================================================================
const StreakFreezeScreen = () => {
    const navigation = useNavigation();
    const { alert } = useThemedAlert();
    const { data: streakData, isLoading: streakLoading } = useGetStreakDetailsQuery(undefined);
    const { data: freezeData, isLoading: freezeLoading, refetch } = useGetAvailableFreezesQuery(undefined);
    const [freezeStreak, { isLoading: isFreezing }] = useFreezeStreakMutation();
    const [purchaseStreakFreeze, { isLoading: isPurchasing }] = usePurchaseStreakFreezeMutation();
    const { data: levelData } = useGetLevelQuery(undefined);

    const streak = streakData;
    const freezes = freezeData;
    const available = freezes?.available_freezes ?? 0;
    const freezeCost = (freezes as any)?.cost ?? 50;
    const userXP = (levelData as any)?.total_xp ?? 0;
    const canAffordFreeze = userXP >= freezeCost;
    const isLoading = streakLoading || freezeLoading;

    const handleFreeze = async () => {
        if (available <= 0) {
            alert('No Freezes', 'You don\'t have any streak freezes available. Purchase one first!');
            return;
        }
        alert(
            'Activate Streak Freeze',
            'This will protect your streak for one missed day. Use it now?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Activate', onPress: async () => {
                        try {
                            await freezeStreak(undefined).unwrap();
                            refetch();
                            alert('🧊 Streak Frozen!', 'Your streak is protected for today.');
                        } catch (err: any) {
                            const msg = err?.data?.detail || err?.data?.message || err?.data?.error || 'Failed to activate freeze.';
                            alert('Error', typeof msg === 'string' ? msg : 'Failed to activate freeze.');
                        }
                    },
                },
            ],
        );
    };

    const handlePurchase = async () => {
        if (!canAffordFreeze) {
            alert('Insufficient XP', `You need ${freezeCost} XP but only have ${userXP} XP. Keep completing tasks to earn more!`);
            return;
        }
        alert(
            'Purchase Streak Freeze',
            `Spend ${freezeCost} XP to buy a streak freeze?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy', onPress: async () => {
                        try {
                            await purchaseStreakFreeze(undefined).unwrap();
                            refetch();
                            alert('✅ Purchased!', 'Streak freeze added to your inventory.');
                        } catch (err: any) {
                            const msg = err?.data?.detail || err?.data?.message || err?.data?.error || 'Not enough XP or purchase failed.';
                            alert('Error', typeof msg === 'string' ? msg : 'Purchase failed.');
                        }
                    },
                },
            ],
        );
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
                <Text style={styles.headerTitle}>Streak Freeze</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Current Streak Card */}
                <LinearGradient
                    colors={['rgba(255,214,10,0.15)', 'rgba(12,12,12,0)']}
                    style={styles.streakHero}
                >
                    <View style={styles.fireCircle}>
                        <Ionicons name="flame" size={48} color="#FFD60A" />
                    </View>
                    <Text style={styles.streakCount}>{streak?.current_streak ?? 0}</Text>
                    <Text style={styles.streakLabel}>Day Streak</Text>
                    <View style={styles.longestRow}>
                        <Ionicons name="trophy-outline" size={14} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.longestText}>
                            Longest: {streak?.longest_streak ?? 0} days
                        </Text>
                    </View>
                </LinearGradient>

                {/* Freeze Inventory */}
                <View style={styles.inventoryCard}>
                    <View style={styles.inventoryHeader}>
                        <Ionicons name="snow-outline" size={22} color="#5AC8FA" />
                        <Text style={styles.inventoryTitle}>Freeze Inventory</Text>
                    </View>
                    <View style={styles.inventoryRow}>
                        {[...Array(Math.max(3, available))].map((_, i) => (
                            <View
                                key={i}
                                style={[styles.freezeSlot, i < available && styles.freezeSlotActive]}
                            >
                                <Ionicons
                                    name="snow"
                                    size={24}
                                    color={i < available ? '#5AC8FA' : 'rgba(255,255,255,0.1)'}
                                />
                            </View>
                        ))}
                    </View>
                    <Text style={styles.inventoryCount}>
                        {available} freeze{available !== 1 ? 's' : ''} available
                    </Text>
                </View>

                {/* Actions */}
                <TouchableOpacity
                    style={[styles.actionBtn, styles.freezeBtn]}
                    onPress={handleFreeze}
                    disabled={isFreezing || available <= 0}
                >
                    {isFreezing ? (
                        <ActivityIndicator color="black" size="small" />
                    ) : (
                        <>
                            <Ionicons name="snow" size={20} color="black" />
                            <Text style={styles.actionBtnText}>
                                Activate Freeze ({available} left)
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.purchaseBtn, !canAffordFreeze && { opacity: 0.5 }]}
                    onPress={handlePurchase}
                    disabled={isPurchasing || !canAffordFreeze}
                >
                    {isPurchasing ? (
                        <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : (
                        <>
                            <Ionicons name="cart-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.purchaseBtnText}>
                                Purchase Freeze ({freezes?.cost ?? 50} XP)
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>How Streak Freezes Work</Text>
                    <View style={styles.infoItem}>
                        <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.infoText}>
                            A streak freeze protects your streak for one missed day.
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.infoText}>
                            Activate before midnight to prevent streak loss.
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Ionicons name="wallet-outline" size={18} color={COLORS.primary} />
                        <Text style={styles.infoText}>
                            Purchase extras with your earned XP points.
                        </Text>
                    </View>
                </View>

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
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    streakHero: {
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,214,10,0.2)',
        padding: 30, alignItems: 'center', gap: 6, marginBottom: 20,
    },
    fireCircle: {
        width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,214,10,0.1)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 4,
    },
    streakCount: { fontSize: 48, fontWeight: '800', color: 'white' },
    streakLabel: { fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
    longestRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    longestText: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
    inventoryCard: {
        backgroundColor: '#0C0C0C', borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', padding: 20, gap: 14, marginBottom: 20,
    },
    inventoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inventoryTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
    inventoryRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    freezeSlot: {
        width: 52, height: 52, borderRadius: 12, borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center',
    },
    freezeSlotActive: {
        borderColor: 'rgba(90,200,250,0.4)', backgroundColor: 'rgba(90,200,250,0.08)',
    },
    inventoryCount: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 16, borderRadius: 12, marginBottom: 12,
    },
    freezeBtn: { backgroundColor: '#5AC8FA' },
    purchaseBtn: {
        backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.primary,
    },
    actionBtnText: { fontSize: 16, fontWeight: '600', color: 'black' },
    purchaseBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
    infoCard: {
        backgroundColor: '#0C0C0C', borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', padding: 18, gap: 12, marginTop: 8,
    },
    infoTitle: { fontSize: 15, fontWeight: '600', color: 'white' },
    infoItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    infoText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 20, flex: 1 },
});

export default StreakFreezeScreen;
