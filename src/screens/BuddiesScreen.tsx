import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Modal,
    FlatList,
    TextInput,
    Share,
    ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import Mascot from '../components/common/Mascot';
import { InitialsAvatar } from '../components/common';
import { useGetBuddiesQuery, useNudgeBuddyMutation, useInviteBuddyMutation, useAcceptInviteMutation } from '../services/api/buddiesApi';
import { useGetFriendsLeaderboardQuery } from '../services/api/leaderboardApi';
import { useThemedAlert } from '../components/common/ThemedAlert';

// Types
type BuddyStatus = 'pending' | 'completed' | 'missed';

interface Buddy {
    id: string;
    name: string;
    avatar: string;
    streak: number;
    status: BuddyStatus;
}

const extractInviteCode = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    const invitePathMatch = trimmed.match(/\/invite\/([A-Za-z0-9_-]+)/i);
    if (invitePathMatch?.[1]) return invitePathMatch[1];

    const tokenMatch = trimmed.match(/[A-Za-z0-9_-]{8,}/);
    return tokenMatch?.[0] ?? null;
};

// Mock buddy data removed — real data from API

// Status badge component
const StatusBadge = ({ status }: { status: BuddyStatus }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'pending':
                return {
                    text: 'PENDING',
                    color: '#FFCC00',
                    bgColor: 'rgba(255, 204, 0, 0.1)',
                };
            case 'completed':
                return {
                    text: 'COMPLETED',
                    color: '#34C759',
                    bgColor: 'rgba(52, 199, 89, 0.1)',
                };
            case 'missed':
                return {
                    text: 'MISSED',
                    color: '#FF4C0D',
                    bgColor: 'rgba(255, 76, 13, 0.1)',
                };
        }
    };

    const config = getStatusConfig();

    return (
        <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.text}</Text>
        </View>
    );
};

// Streak badge component
const StreakBadge = ({ streak }: { streak: number }) => (
    <View style={styles.streakBadge}>
        <Ionicons name="flame" size={18} color="#FC9502" />
        <Text style={styles.streakText}>Streak: {streak} days</Text>
    </View>
);

// Buddy card component
const BuddyCard = ({
    buddy,
    onNudge,
    onViewProfile,
}: {
    buddy: Buddy;
    onNudge: () => void;
    onViewProfile: () => void;
}) => (
    <View style={styles.buddyCard}>
        <View style={styles.buddyInfo}>
            <InitialsAvatar uri={buddy.avatar} name={buddy.name} size={50} style={styles.avatar} />
            <View style={styles.buddyDetails}>
                <View style={styles.nameRow}>
                    <Text style={styles.buddyName}>{buddy.name}</Text>
                    <StatusBadge status={buddy.status} />
                </View>
                <StreakBadge streak={buddy.streak} />
            </View>
        </View>
        <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.nudgeButton} onPress={onNudge}>
                <Text style={styles.nudgeButtonText}>Nudge</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewProfileButton} onPress={onViewProfile}>
                <Text style={styles.viewProfileButtonText}>View Profile</Text>
            </TouchableOpacity>
        </View>
    </View>
);

// Leaderboard Modal
type LeaderboardEntry = { id: string; name: string; avatar: string | null; xp: number; rank: number };

const LeaderboardModal = ({
    visible,
    onClose,
    data,
}: {
    visible: boolean;
    onClose: () => void;
    data: LeaderboardEntry[];
}) => {
    const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
        const isTop3 = item.rank <= 3;
        const isUser = item.name === 'You';

        return (
            <View style={[styles.leaderboardItem, isUser && styles.leaderboardItemUser]}>
                <View style={styles.leaderboardRank}>
                    {isTop3 ? (
                        <View style={[styles.rankBadge, { backgroundColor: item.rank === 1 ? '#FFD700' : item.rank === 2 ? '#C0C0C0' : '#CD7F32' }]}>
                            <Text style={styles.rankBadgeText}>{item.rank}</Text>
                        </View>
                    ) : (
                        <Text style={styles.rankText}>{item.rank}</Text>
                    )}
                </View>
                <View style={styles.leaderboardAvatar}>
                    <InitialsAvatar uri={item.avatar} name={item.name} size={44} style={styles.leaderboardAvatarImage} />
                </View>
                <Text style={[styles.leaderboardName, isUser && styles.leaderboardNameUser]}>{item.name}</Text>
                <Text style={styles.leaderboardXP}>{item.xp.toLocaleString()} XP</Text>
            </View>
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Leaderboard</Text>
                        <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                            <Ionicons name="close" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={data}
                        renderItem={renderLeaderboardItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.leaderboardList}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </View>
        </Modal>
    );
};

// ============================================================================
// INVITE BUDDY MODAL
// ============================================================================
const InviteBuddyModal = ({ visible, onClose, onInvite, onAcceptCode }: {
    visible: boolean; onClose: () => void;
    onInvite: () => Promise<string | null>;
    onAcceptCode: (code: string) => Promise<void>;
}) => {
    const [inviteCode, setInviteCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const code = await onInvite();
            if (code) setGeneratedCode(code);
        } finally { setIsGenerating(false); }
    };

    const handleCopy = async () => {
        if (generatedCode) {
            await Clipboard.setStringAsync(generatedCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (!generatedCode) {
            return;
        }

        const code = generatedCode;
        await Share.share({
            message: `Join me on Unhabit! Use my invite code: ${code}\nhttps://unhabit.app/invite/${code}`,
            title: 'Join Unhabit',
        });
    };

    const handleAccept = async () => {
        if (!inviteCode.trim()) return;
        setIsAccepting(true);
        try {
            await onAcceptCode(inviteCode.trim());
            setInviteCode('');
            onClose();
        } catch { /* handled upstream */ }
        setIsAccepting(false);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={invStyles.overlay}>
                <View style={invStyles.container}>
                    <View style={invStyles.header}>
                        <Text style={invStyles.title}>Invite a Buddy</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={invStyles.body}>
                        <Text style={invStyles.sectionLabel}>Generate an invite link</Text>
                        {generatedCode ? (
                            <View style={invStyles.codeBox}>
                                <Text style={invStyles.codeText}>{generatedCode}</Text>
                                <TouchableOpacity onPress={handleCopy} style={invStyles.copyBtn}>
                                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={COLORS.primary} />
                                    <Text style={invStyles.copyText}>{copied ? 'Copied!' : 'Copy'}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity style={invStyles.generateBtn} onPress={handleGenerate} disabled={isGenerating}>
                                {isGenerating ? (
                                    <ActivityIndicator color="black" size="small" />
                                ) : (
                                    <Text style={invStyles.generateText}>Generate Invite Code</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[invStyles.shareBtn, !generatedCode && { opacity: 0.4 }]}
                            onPress={handleShare}
                            disabled={!generatedCode}
                        >
                            <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                            <Text style={invStyles.shareBtnText}>Share Invite Link</Text>
                        </TouchableOpacity>

                        <View style={invStyles.divider}>
                            <View style={invStyles.dividerLine} />
                            <Text style={invStyles.dividerText}>OR</Text>
                            <View style={invStyles.dividerLine} />
                        </View>

                        <Text style={invStyles.sectionLabel}>Have a code? Enter it below</Text>
                        <TextInput
                            style={invStyles.input}
                            value={inviteCode}
                            onChangeText={setInviteCode}
                            placeholder="Enter invite code"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity
                            style={[invStyles.acceptBtn, !inviteCode.trim() && { opacity: 0.4 }]}
                            onPress={handleAccept}
                            disabled={isAccepting || !inviteCode.trim()}
                        >
                            {isAccepting ? (
                                <ActivityIndicator color={COLORS.primary} size="small" />
                            ) : (
                                <Text style={invStyles.acceptText}>Accept Invite</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const invStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    container: { backgroundColor: '#0C0C0C', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: { fontSize: 22, fontWeight: '700', color: 'white' },
    body: { padding: 20, gap: 16 },
    sectionLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
    codeBox: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(44,232,198,0.08)', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: 'rgba(44,232,198,0.2)',
    },
    codeText: { fontSize: 20, fontWeight: '700', color: COLORS.primary, letterSpacing: 2 },
    copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    copyText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
    generateBtn: {
        backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    },
    generateText: { fontSize: 16, fontWeight: '600', color: 'black' },
    shareBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary,
    },
    shareBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
    dividerText: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16,
        fontSize: 16, color: 'white', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        textAlign: 'center', letterSpacing: 2,
    },
    acceptBtn: {
        paddingVertical: 14, borderRadius: 12, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.primary,
    },
    acceptText: { fontSize: 16, fontWeight: '600', color: COLORS.primary },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================
const BuddiesScreen = () => {
    const navigation = useNavigation<any>();
    const { alert } = useThemedAlert();
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showInvite, setShowInvite] = useState(false);

    // API hooks
    const { data: buddiesApiData, isLoading: buddiesLoading, isError: buddiesError } = useGetBuddiesQuery(undefined);
    const { data: leaderboardApiData } = useGetFriendsLeaderboardQuery(undefined);
    const [nudgeBuddy] = useNudgeBuddyMutation();
    const [inviteBuddyApi] = useInviteBuddyMutation();
    const [acceptInvite] = useAcceptInviteMutation();

    // Map API data to Buddy interface
    const buddies: Buddy[] = (Array.isArray(buddiesApiData) ? buddiesApiData : []).map((b: any) => ({
        id: b.buddy_link_id ?? b.id,
        name: b.buddy_name ?? b.name ?? 'Buddy',
        avatar: b.buddy_avatar ?? b.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(b.buddy_name ?? 'B')}&background=2CE8C6&color=000`,
        streak: b.streak_days ?? b.streak ?? 0,
        status: (b.daily_status?.toLowerCase() ?? b.status ?? 'pending') as BuddyStatus,
    }));

    const handleNudge = async (buddy: Buddy) => {
        try {
            await nudgeBuddy(buddy.id).unwrap();
            alert(
                'Nudge Sent! 👋',
                `You've sent a friendly nudge to ${buddy.name} to remind them about their habits!`,
                [{ text: 'OK' }]
            );
        } catch {
            alert('Error', 'Failed to send nudge. Please try again.');
        }
    };

    const handleViewProfile = (buddy: Buddy) => {
        navigation.navigate('BuddyProfile', {
            buddyId: buddy.id,
            buddyName: buddy.name,
            buddyAvatar: buddy.avatar,
        });
    };

    const handleInviteBuddy = () => setShowInvite(true);

    const handleGenerateInvite = async (): Promise<string | null> => {
        try {
            const result = await inviteBuddyApi({}).unwrap();
            const extracted =
                extractInviteCode((result as any)?.invite_code) ??
                extractInviteCode((result as any)?.code) ??
                extractInviteCode((result as any)?.invite_url) ??
                extractInviteCode((result as any)?.url);

            return extracted ?? null;
        } catch {
            alert('Error', 'Could not generate invite link.');
            return null;
        }
    };

    const handleAcceptCode = async (code: string) => {
        try {
            const normalizedCode = extractInviteCode(code);
            if (!normalizedCode) {
                throw new Error('Invalid invite format');
            }

            await acceptInvite(normalizedCode).unwrap();
            alert('Success! 🎉', 'Buddy added successfully!');
        } catch {
            alert('Error', 'Invalid or expired invite code.');
            throw new Error();
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Buddies</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroLabel}>Your Buddies</Text>
                        <Text style={styles.heroTitle}>Habits grow better together.</Text>
                    </View>
                    <View style={styles.mascotContainer}>
                        <Mascot size={90} />
                    </View>
                </View>

                {/* Buddies List Card */}
                <View style={styles.buddiesListContainer}>
                    {/* Dot indicator */}
                    <View style={styles.dotIndicator} />

                    {/* Buddies List */}
                    <View style={styles.buddiesCard}>
                        {buddiesLoading ? (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Loading buddies...</Text>
                            </View>
                        ) : buddiesError ? (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <Ionicons name="alert-circle-outline" size={32} color="#FF4C0D" />
                                <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>Failed to load buddies</Text>
                            </View>
                        ) : buddies.length === 0 ? (
                            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                                <Ionicons name="people-outline" size={32} color={COLORS.textSecondary} />
                                <Text style={{ color: COLORS.textSecondary, marginTop: 12 }}>No buddies yet — invite a friend!</Text>
                            </View>
                        ) : (
                            buddies.map((buddy) => (
                                <BuddyCard
                                    key={buddy.id}
                                    buddy={buddy}
                                    onNudge={() => handleNudge(buddy)}
                                    onViewProfile={() => handleViewProfile(buddy)}
                                />
                            ))
                        )}

                        {/* Invite Section */}
                        <View style={styles.inviteSection}>
                            <Text style={styles.inviteTitle}>Stay accountable with friends.</Text>
                            <TouchableOpacity style={styles.inviteButton} onPress={handleInviteBuddy}>
                                <Text style={styles.inviteButtonText}>Invite Buddy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* View Leaderboard Button */}
                <TouchableOpacity
                    style={styles.leaderboardButton}
                    onPress={() => setShowLeaderboard(true)}
                >
                    <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Invite Buddy Modal */}
            <InviteBuddyModal
                visible={showInvite}
                onClose={() => setShowInvite(false)}
                onInvite={handleGenerateInvite}
                onAcceptCode={handleAcceptCode}
            />

            {/* Leaderboard Modal */}
            <LeaderboardModal
                visible={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                data={(leaderboardApiData?.entries ?? []).map((e: any) => ({
                    id: e.user_id ?? String(e.rank),
                    name: e.is_current_user ? 'You' : (e.name ?? 'User'),
                    avatar: e.avatar_url ?? null,
                    xp: e.score ?? 0,
                    rank: e.rank ?? 0,
                }))}
            />
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
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.white,
    },
    headerSpacer: {
        width: 30,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    heroSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    heroTextContainer: {
        flex: 1,
    },
    heroLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.primary,
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
        maxWidth: 262,
    },
    mascotContainer: {
        width: 93,
        height: 89,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buddiesListContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dotIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        marginBottom: 6,
    },
    buddiesCard: {
        width: '100%',
        backgroundColor: 'rgba(15, 32, 29, 0.6)',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.15)',
        padding: 16,
        gap: 16,
    },
    buddyCard: {
        backgroundColor: '#0F201D',
        borderRadius: 20,
        padding: 14,
        gap: 15,
    },
    buddyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1A1A2E',
    },
    buddyDetails: {
        flex: 1,
        gap: 10,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    buddyName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
        flexShrink: 1,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        textTransform: 'uppercase',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(252, 149, 2, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(252, 149, 2, 0.3)',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 5,
        alignSelf: 'flex-start',
    },
    streakText: {
        fontSize: 14,
        color: '#FC9502',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    nudgeButton: {
        flex: 1,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nudgeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.primary,
    },
    viewProfileButton: {
        flex: 1,
        height: 48,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewProfileButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    inviteSection: {
        alignItems: 'center',
        gap: 20,
        paddingTop: 10,
    },
    inviteTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
        textAlign: 'center',
    },
    inviteButton: {
        width: '100%',
        height: 65,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
    },
    leaderboardButton: {
        marginHorizontal: 20,
        marginTop: 16,
        height: 65,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leaderboardButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#0F201D',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.white,
    },
    modalCloseButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leaderboardList: {
        paddingHorizontal: 20,
        gap: 12,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 12,
        gap: 12,
    },
    leaderboardItemUser: {
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    leaderboardRank: {
        width: 32,
        alignItems: 'center',
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    rankText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    leaderboardAvatar: {
        width: 44,
        height: 44,
    },
    leaderboardAvatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    leaderboardAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    leaderboardName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.white,
    },
    leaderboardNameUser: {
        color: COLORS.primary,
    },
    leaderboardXP: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
});

export default BuddiesScreen;
