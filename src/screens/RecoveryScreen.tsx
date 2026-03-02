import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { useThemedAlert } from '../components/common/ThemedAlert';
import {
    useGetRecoveryStatusQuery,
    useContinueWithPenaltyMutation,
    useUseProtectionMutation,
    useRestartPlanMutation,
} from '../services/api/recoveryApi';

// ============================================================================
// RECOVERY OPTION CARD
// ============================================================================
const RecoveryOption = ({ icon, iconColor, title, description, buttonLabel, buttonColor, onPress, loading, disabled }: {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    title: string;
    description: string;
    buttonLabel: string;
    buttonColor: string;
    onPress: () => void;
    loading: boolean;
    disabled?: boolean;
}) => (
    <View style={[styles.optionCard, disabled && styles.optionCardDisabled]}>
        <View style={[styles.optionIcon, { backgroundColor: `${iconColor}20` }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
        </View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
        <TouchableOpacity
            style={[styles.optionBtn, { backgroundColor: buttonColor }, disabled && styles.optionBtnDisabled]}
            onPress={onPress}
            disabled={loading || disabled}
        >
            {loading ? (
                <ActivityIndicator size="small" color="black" />
            ) : (
                <Text style={styles.optionBtnText}>{buttonLabel}</Text>
            )}
        </TouchableOpacity>
    </View>
);

// ============================================================================
// MAIN SCREEN
// ============================================================================
const RecoveryScreen = () => {
    const navigation = useNavigation();
    const { alert } = useThemedAlert();
    const { data: recovery, isLoading, refetch } = useGetRecoveryStatusQuery(undefined);
    const [continueWithPenalty, { isLoading: isPenalty }] = useContinueWithPenaltyMutation();
    const [useProtection, { isLoading: isProtecting }] = useUseProtectionMutation();
    const [restartPlan, { isLoading: isRestarting }] = useRestartPlanMutation();

    const status = recovery;
    const hasProtection = status?.freeze_tokens_available != null && status.freeze_tokens_available > 0;

    const handlePenalty = async () => {
        alert(
            'Continue with Penalty',
            'Your streak will be reduced and you\'ll lose some XP. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue', style: 'destructive', onPress: async () => {
                        try {
                            await continueWithPenalty(undefined).unwrap();
                            alert('Done', 'You can continue your journey. Stay strong! 💪');
                            navigation.goBack();
                        } catch { alert('Error', 'Failed to apply penalty.'); }
                    },
                },
            ],
        );
    };

    const handleProtection = async () => {
        try {
            await useProtection(undefined).unwrap();
            alert('🛡️ Protection Used!', 'Your streak is safe! Keep going!');
            navigation.goBack();
        } catch {
            alert('Error', 'No protection available.');
        }
    };

    const handleRestart = async () => {
        alert(
            'Restart Plan',
            'This will reset your journey from Day 1. All progress will be lost. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Restart', style: 'destructive', onPress: async () => {
                        try {
                            await restartPlan(undefined).unwrap();
                            alert('Fresh Start! 🌱', 'Your plan has been restarted from Day 1.');
                            navigation.goBack();
                        } catch { alert('Error', 'Failed to restart plan.'); }
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
                <Text style={styles.headerTitle}>Recovery</Text>
                <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
                {/* Hero */}
                <LinearGradient
                    colors={['rgba(239,68,68,0.15)', 'rgba(12,12,12,0)']}
                    style={styles.heroCard}
                >
                    <Ionicons name="heart-dislike-outline" size={48} color="#EF4444" />
                    <Text style={styles.heroTitle}>You Missed a Day</Text>
                    <Text style={styles.heroSubtitle}>
                        {status?.message ?? 'Don\'t worry — everyone slips up. Choose how you\'d like to recover.'}
                    </Text>
                    {status?.days_missed && (
                        <View style={styles.daysMissedBadge}>
                            <Text style={styles.daysMissedText}>
                                {status.days_missed} day{status.days_missed > 1 ? 's' : ''} missed
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                {/* Options */}
                <RecoveryOption
                    icon="shield-checkmark-outline"
                    iconColor="#34C759"
                    title="Use Streak Protection"
                    description={hasProtection
                        ? 'Your streak stays intact. No penalty applied.'
                        : 'No protections available. Earn or purchase more.'}
                    buttonLabel="Use Protection 🛡️"
                    buttonColor="#34C759"
                    onPress={handleProtection}
                    loading={isProtecting}
                    disabled={!hasProtection}
                />

                <RecoveryOption
                    icon="arrow-forward-outline"
                    iconColor="#FFD60A"
                    title="Continue with Penalty"
                    description="Lose some XP and streak points, but keep going on your current day."
                    buttonLabel="Accept Penalty"
                    buttonColor="#FFD60A"
                    onPress={handlePenalty}
                    loading={isPenalty}
                />

                <RecoveryOption
                    icon="refresh-outline"
                    iconColor="#EF4444"
                    title="Restart Plan"
                    description="Start fresh from Day 1. All current journey progress will reset."
                    buttonLabel="Restart from Day 1"
                    buttonColor="#EF4444"
                    onPress={handleRestart}
                    loading={isRestarting}
                />
            </View>
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
    content: { flex: 1, paddingHorizontal: 20, gap: 12 },
    heroCard: {
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        padding: 24, alignItems: 'center', gap: 10, marginBottom: 8,
    },
    heroTitle: { fontSize: 22, fontWeight: '700', color: 'white' },
    heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 21 },
    daysMissedBadge: {
        backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    },
    daysMissedText: { fontSize: 13, fontWeight: '600', color: '#EF4444' },
    optionCard: {
        backgroundColor: '#0C0C0C', borderRadius: 14, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', padding: 16, gap: 8,
    },
    optionCardDisabled: { opacity: 0.45 },
    optionIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    optionTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
    optionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },
    optionBtn: {
        paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4,
    },
    optionBtnDisabled: { opacity: 0.4 },
    optionBtnText: { fontSize: 15, fontWeight: '600', color: 'black' },
});

export default RecoveryScreen;
