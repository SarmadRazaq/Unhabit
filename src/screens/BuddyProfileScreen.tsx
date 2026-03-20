import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { useGetBuddyProfileQuery, useNudgeBuddyMutation, useRemoveBuddyMutation } from '../services/api/buddiesApi';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { extractImageUri } from '../utils';

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard = ({ icon, iconColor, value, label }: {
    icon: keyof typeof Ionicons.glyphMap; iconColor: string;
    value: string | number; label: string;
}) => (
    <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={icon} size={22} color={iconColor} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

// ============================================================================
// MAIN SCREEN
// ============================================================================
const BuddyProfileScreen = () => {
    const navigation = useNavigation();
    const { alert } = useThemedAlert();
    const route = useRoute<any>();
    const buddyId = route.params?.buddyId;
    const buddyName = route.params?.buddyName ?? 'Buddy';
    const buddyAvatar = route.params?.buddyAvatar;

    const { data: profileData, isLoading } = useGetBuddyProfileQuery(buddyId, { skip: !buddyId });
    const [nudgeBuddy, { isLoading: isNudging }] = useNudgeBuddyMutation();
    const [removeBuddy] = useRemoveBuddyMutation();

    const profile = profileData;

    const handleNudge = async () => {
        try {
            await nudgeBuddy(buddyId).unwrap();
            alert('Nudge Sent! 👋', `You nudged ${buddyName} to stay on track!`);
        } catch {
            alert('Error', 'Failed to send nudge.');
        }
    };

    const handleRemove = () => {
        alert(
            'Remove Buddy',
            `Are you sure you want to remove ${buddyName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive', onPress: async () => {
                        try {
                            await removeBuddy(buddyId).unwrap();
                            navigation.goBack();
                        } catch { alert('Error', 'Failed to remove buddy.'); }
                    },
                },
            ],
        );
    };

    const avatarUri = extractImageUri(buddyAvatar) || extractImageUri(profile?.avatar_url)
        || `https://ui-avatars.com/api/?name=${encodeURIComponent(buddyName)}&background=2CE8C6&color=000`;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Buddy Profile</Text>
                <TouchableOpacity onPress={handleRemove}>
                    <Ionicons name="person-remove-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Profile Hero */}
                    <LinearGradient
                        colors={['rgba(44,232,198,0.12)', 'rgba(12,12,12,0)']}
                        style={styles.heroCard}
                    >
                        <Image source={{ uri: avatarUri }} style={styles.avatar} />
                        <Text style={styles.buddyName}>{profile?.name ?? buddyName}</Text>
                        {profile?.member_since && (
                            <Text style={styles.buddyBio}>Member since {profile.member_since}</Text>
                        )}
                        <View style={styles.statusRow}>
                            <View style={[
                                styles.statusBadge,
                                { backgroundColor: profile?.journey?.completed_today ? 'rgba(52,199,89,0.15)' : 'rgba(255,204,0,0.15)' },
                            ]}>
                                <Text style={[
                                    styles.statusText,
                                    { color: profile?.journey?.completed_today ? '#34C759' : '#FFCC00' },
                                ]}>
                                    {profile?.journey?.completed_today ? 'COMPLETED' : 'IN PROGRESS'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <StatCard
                            icon="flame"
                            iconColor="#FFD60A"
                            value={profile?.streak?.current ?? 0}
                            label="Day Streak"
                        />
                        <StatCard
                            icon="checkmark-circle"
                            iconColor="#34C759"
                            value={`${profile?.habit_health ?? 0}%`}
                            label="Habit Health"
                        />
                        <StatCard
                            icon="star"
                            iconColor={COLORS.primary}
                            value={profile?.level?.total_xp ?? 0}
                            label="Total XP"
                        />
                        <StatCard
                            icon="calendar"
                            iconColor="#5AC8FA"
                            value={`Day ${profile?.journey?.current_day ?? 1}`}
                            label="Journey"
                        />
                    </View>

                    {/* Habit Info */}
                    {profile?.habit && (
                        <View style={styles.habitCard}>
                            <Text style={styles.sectionTitle}>Working On</Text>
                            <View style={styles.habitRow}>
                                <Ionicons name="leaf-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.habitName}>{profile.habit}</Text>
                            </View>
                        </View>
                    )}

                    {/* Buddy Message */}
                    <View style={styles.messageCard}>
                        <View style={styles.mascotRow}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.messageTitle}>
                                Build habits together.
                            </Text>
                        </View>
                        <Text style={styles.messageText}>
                            Keep supporting {buddyName} on their journey. A little nudge can make a big difference!
                        </Text>
                    </View>

                    {/* Actions */}
                    <TouchableOpacity
                        style={styles.nudgeBtn}
                        onPress={handleNudge}
                        disabled={isNudging}
                    >
                        {isNudging ? (
                            <ActivityIndicator color="black" size="small" />
                        ) : (
                            <>
                                <Ionicons name="hand-left-outline" size={20} color="black" />
                                <Text style={styles.nudgeBtnText}>Send Nudge 👋</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
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
        borderRadius: 16, borderWidth: 1, borderColor: 'rgba(44,232,198,0.15)',
        padding: 28, alignItems: 'center', gap: 8,
    },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        borderWidth: 3, borderColor: COLORS.primary, marginBottom: 8,
    },
    buddyName: { fontSize: 24, fontWeight: '700', color: 'white' },
    buddyBio: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
    statusRow: { marginTop: 4 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '600' },
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    },
    statCard: {
        width: '47%', backgroundColor: '#0C0C0C', borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 16, alignItems: 'center', gap: 6, flexGrow: 1,
    },
    statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '700', color: 'white' },
    statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
    habitCard: {
        backgroundColor: '#0C0C0C', borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
        padding: 16, gap: 10,
    },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: 'white' },
    habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    habitName: { fontSize: 15, color: 'rgba(255,255,255,0.7)' },
    messageCard: {
        backgroundColor: 'rgba(44,232,198,0.06)', borderRadius: 14,
        borderWidth: 1, borderColor: 'rgba(44,232,198,0.1)',
        padding: 16, gap: 8,
    },
    mascotRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    messageTitle: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
    messageText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 22 },
    nudgeBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 14,
    },
    nudgeBtnText: { fontSize: 17, fontWeight: '700', color: 'black' },
});

export default BuddyProfileScreen;
