import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Image,
    Modal,
    FlatList,
    Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS, SPACING } from '../constants/theme';
import { InitialsAvatar, Mascot } from '../components/common';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { useNavigation } from '@react-navigation/native';
import { useGetLevelQuery, useGetBadgeGalleryQuery, useGetBadgesQuery } from '../services/api/rewardsApi';
import { useGetMyRankQuery, useGetFriendsLeaderboardQuery } from '../services/api/leaderboardApi';
import { useShareProgressMutation } from '../services/api/shareApi';
import { formatDateTime } from '../utils/date';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// INTERFACES
// ============================================================================
interface UserStats {
    currentLevel: number;
    levelName: string;
    nextLevelName: string;
    totalXP: number;
    xpToNextLevel: number;
    currentLevelXP: number;
    levelProgress: number;
}

interface Badge {
    id: string;
    name: string;
    description: string;
    type: 'silver' | 'bronze' | 'gold';
    isLocked: boolean;
    unlockedAt?: string;
    requirement: string;
    daysLeft?: number | null;
}

interface LeaderboardStats {
    rank: number;
    rankType: string;
    weeklyPercentile: number;
    totalParticipants: number;
}

const inferBadgeType = (badge: any): Badge['type'] => {
    const explicitTier = String(badge?.badge_definitions?.tier ?? badge?.tier ?? '').toLowerCase();
    if (explicitTier === 'gold' || explicitTier === 'silver' || explicitTier === 'bronze') {
        return explicitTier as Badge['type'];
    }

    const category = String(badge?.badge_definitions?.category ?? badge?.category ?? '').toLowerCase();
    const name = String(badge?.badge_definitions?.name ?? badge?.name ?? '').toLowerCase();
    const fingerprint = `${category} ${name}`;

    if (fingerprint.includes('xp') || fingerprint.includes('level')) return 'silver';
    if (fingerprint.includes('task') || fingerprint.includes('streak') || fingerprint.includes('day')) return 'gold';
    if (fingerprint.includes('social') || fingerprint.includes('buddy') || fingerprint.includes('community')) return 'bronze';

    // Stable fallback so badges don't all look the same when tier is missing.
    const seed = name || category || 'badge';
    const hash = seed.split('').reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0);
    const bucket = hash % 3;
    return bucket === 0 ? 'gold' : bucket === 1 ? 'silver' : 'bronze';
};

// ============================================================================
// DEFAULT DATA (empty state — real data comes from API hooks)
// ============================================================================
const DEFAULT_USER_STATS: UserStats = {
    currentLevel: 1,
    levelName: 'Beginner',
    nextLevelName: 'Builder',
    totalXP: 0,
    xpToNextLevel: 100,
    currentLevelXP: 0,
    levelProgress: 0,
};

const DEFAULT_BADGES: Badge[] = [];

const DEFAULT_LEADERBOARD: LeaderboardStats = {
    rank: 0,
    rankType: 'Buddies',
    weeklyPercentile: 0,
    totalParticipants: 0,
};

// Leaderboard users type (populated from API)
type LeaderboardUser = { id: string; name: string; xp: number; rank: number; avatar: string | null; isCurrentUser?: boolean };

/**
 * Derive level name from level number — mirrors backend getLevelName()
 * in buddies.service.ts (the /rewards/level endpoint doesn't return level_name).
 */
function getLevelName(level: number): string {
    const names = ['Beginner', 'Builder', 'Warrior', 'Champion', 'Master', 'Legend', 'Elite'];
    if (level <= 3) return names[level - 1] || 'Beginner';
    if (level <= 10) return names[3] || 'Champion';
    if (level <= 20) return names[4] || 'Master';
    if (level <= 50) return names[5] || 'Legend';
    return names[6] || 'Elite';
}

// ============================================================================
// CIRCULAR PROGRESS COMPONENT
// ============================================================================
interface CircularProgressProps {
    percentage: number;
    size: number;
    strokeWidth: number;
    progressColor?: string;
    backgroundColor?: string;
    showPercentage?: boolean;
    textColor?: string;
    fontSize?: number;
}

const CircularProgress = ({
    percentage,
    size,
    strokeWidth,
    progressColor = '#2CE8C6',
    backgroundColor = 'rgba(44, 232, 198, 0.2)',
    showPercentage = true,
    textColor = '#F5F5F5',
    fontSize = 24,
    useGradient = false,
}: CircularProgressProps & { useGradient?: boolean }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const gradientId = `gradient-${size}-${percentage}`;
    
    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Svg width={size} height={size}>
                <Defs>
                    <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#0066FF" />
                        <Stop offset="50%" stopColor="#2CE8C6" />
                        <Stop offset="100%" stopColor="#7FFF00" />
                    </SvgLinearGradient>
                </Defs>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={backgroundColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={useGradient ? `url(#${gradientId})` : progressColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>
            {showPercentage && (
                <Text style={[styles.circularProgressText, { color: textColor, fontSize }]}>
                    {percentage}%
                </Text>
            )}
        </View>
    );
};

// ============================================================================
// DIAMOND BADGE COMPONENT
// ============================================================================
interface DiamondBadgeProps {
    type: 'silver' | 'bronze' | 'gold';
    size?: number;
    isLocked?: boolean;
}

const DiamondBadge = ({ type, size, isLocked = false }: DiamondBadgeProps) => {
    const getColors = (): [string, string, string, string] => {
        switch (type) {
            case 'silver':
                return ['#8EA2B8', '#F4F8FC', '#C9D6E3', '#7C8FA5'];
            case 'bronze':
                return ['#A66D3B', '#F2B37E', '#D3874B', '#8D562B'];
            case 'gold':
                return ['#E5B800', '#FFF2A6', '#F7D14E', '#A87A00'];
            default:
                return ['#8EA2B8', '#F4F8FC', '#C9D6E3', '#7C8FA5'];
        }
    };

    const getFrameStyle = () => {
        switch (type) {
            case 'gold':
                return { backgroundColor: 'rgba(255, 204, 0, 0.16)', borderColor: 'rgba(255, 204, 0, 0.45)' };
            case 'bronze':
                return { backgroundColor: 'rgba(216, 130, 65, 0.16)', borderColor: 'rgba(216, 130, 65, 0.45)' };
            case 'silver':
            default:
                return { backgroundColor: 'rgba(166, 184, 205, 0.16)', borderColor: 'rgba(166, 184, 205, 0.45)' };
        }
    };
    
    const colors = getColors();
    const frameStyle = getFrameStyle();
    const iconName =
        type === 'gold' ? 'flame' :
        type === 'bronze' ? 'people' :
        'flash';
    
    return (
        <View style={[diamondStyles.container, frameStyle, isLocked && { opacity: 0.8 }]}>
            <View style={[diamondStyles.outerDiamond, isLocked && { opacity: 0.65 }]}>
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={diamondStyles.diamondGradient}
                />
            </View>
            {!isLocked && (
                <View style={diamondStyles.typeIcon}>
                    <Ionicons name={iconName} size={11} color="rgba(0,0,0,0.75)" />
                </View>
            )}
            {isLocked && (
                <View style={diamondStyles.lockIcon}>
                    <Ionicons name="lock-closed" size={16} color="white" />
                </View>
            )}
        </View>
    );
};

const diamondStyles = StyleSheet.create({
    container: {
        width: 54,
        height: 54,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderRadius: 8,
        borderWidth: 1.2,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerDiamond: {
        width: 28,
        height: 28,
        transform: [{ rotate: '45deg' }],
        borderRadius: 5,
        overflow: 'hidden',
        borderWidth: 0.7,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    diamondGradient: {
        flex: 1,
    },
    lockIcon: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeIcon: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: 'rgba(255,255,255,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// ============================================================================
// XP & LEVEL SUMMARY CARD
// ============================================================================
interface XPLevelSummaryCardProps {
    stats: UserStats;
    onPress: () => void;
}

const XPLevelSummaryCard = ({ stats, onPress }: XPLevelSummaryCardProps) => {
    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
            <LinearGradient
                colors={['rgba(44, 232, 198, 0.15)', 'rgba(12, 12, 12, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={summaryStyles.container}
            >
                {/* Header Row */}
                <View style={summaryStyles.headerRow}>
                    <View style={summaryStyles.headerLeft}>
                        <View style={summaryStyles.summaryBadge}>
                            <Text style={summaryStyles.summaryBadgeText}>Summary</Text>
                        </View>
                        <Text style={summaryStyles.title}>Xp & Level Summary</Text>
                    </View>
                    <View style={summaryStyles.starIcon}>
                        <Ionicons name="star" size={20} color="#EEFF01" />
                    </View>
                </View>
                
                {/* Divider */}
                <View style={summaryStyles.divider} />
                
                {/* Content Row */}
                <View style={summaryStyles.contentRow}>
                    <View style={summaryStyles.statsColumn}>
                        <View style={summaryStyles.statItem}>
                            <Text style={summaryStyles.statLabel}>Current Level:</Text>
                            <Text style={summaryStyles.statValue}>Level {stats.currentLevel} {stats.levelName}</Text>
                        </View>
                        <View style={summaryStyles.statItem}>
                            <Text style={summaryStyles.statLabel}>Total XP:</Text>
                            <Text style={summaryStyles.statValue}>{stats.totalXP.toLocaleString()} XP</Text>
                        </View>
                    </View>
                    <CircularProgress
                        percentage={stats.levelProgress}
                        size={94}
                        strokeWidth={8}
                        progressColor="#2CE8C6"
                        backgroundColor="rgba(44, 232, 198, 0.15)"
                        useGradient={true}
                    />
                </View>
                
                {/* Progress Bar */}
                <View style={summaryStyles.progressSection}>
                    <View style={summaryStyles.progressBar}>
                        <View style={[summaryStyles.progressFill, { width: `${stats.xpToNextLevel > 0 ? (stats.currentLevelXP / stats.xpToNextLevel) * 100 : 0}%` }]} />
                        {/* Section markers */}
                        <View style={[summaryStyles.sectionMarker, { left: '10%' }]} />
                        <View style={[summaryStyles.sectionMarker, { left: '27%' }]} />
                        <View style={[summaryStyles.sectionMarker, summaryStyles.sectionMarkerLight, { left: '44%' }]} />
                        <View style={[summaryStyles.sectionMarker, summaryStyles.sectionMarkerLight, { left: '69%' }]} />
                    </View>
                    <View style={summaryStyles.progressLabels}>
                        <Text style={summaryStyles.progressLabelLeft}>Progress to Next Level</Text>
                        <Text style={summaryStyles.progressLabelRight}>Level {stats.currentLevel + 1} — {stats.nextLevelName}</Text>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const summaryStyles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        padding: 20,
        gap: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        gap: 9,
    },
    summaryBadge: {
        backgroundColor: 'rgba(195, 219, 214, 0.18)',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
        alignSelf: 'flex-start',
    },
    summaryBadgeText: {
        fontSize: 12,
        color: 'white',
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: 'white',
    },
    starIcon: {
        width: 43,
        height: 43,
        borderRadius: 138,
        backgroundColor: 'rgba(238, 255, 1, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    contentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsColumn: {
        gap: 12,
    },
    statItem: {
        gap: 3,
    },
    statLabel: {
        fontSize: 14,
        color: '#2CE8C6',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    progressSection: {
        gap: 12,
    },
    progressBar: {
        height: 19,
        backgroundColor: 'rgba(151, 192, 185, 0.16)',
        borderRadius: 64,
        overflow: 'hidden',
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'rgba(44, 232, 198, 0.8)',
        borderRadius: 64,
    },
    sectionMarker: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(44, 232, 198, 0.6)',
        top: '50%',
        marginTop: -2,
    },
    sectionMarkerLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressLabelLeft: {
        fontSize: 14,
        color: 'white',
    },
    progressLabelRight: {
        fontSize: 14,
        color: '#FC9502',
    },
});

// ============================================================================
// BADGE COLLECTION CARD
// ============================================================================
interface BadgeCollectionCardProps {
    badges: Badge[];
    onBadgePress: (badge: Badge) => void;
    onViewGallery: () => void;
    nextBadgeProgress: number;
    daysLeft: number;
}

const BadgeCollectionCard = ({ badges, onBadgePress, onViewGallery, nextBadgeProgress, daysLeft }: BadgeCollectionCardProps) => {
    const nextLockedBadge = badges.find(b => b.isLocked);
    const nextBadgeName = nextLockedBadge?.name ?? 'Next Badge';
    const lockedCount = badges.filter(b => b.isLocked).length;
    const unlockedCount = badges.filter(b => !b.isLocked).length;
    
    return (
        <View style={badgeStyles.container}>
            {/* Header */}
            <View style={badgeStyles.header}>
                <Text style={badgeStyles.title}>Badge Collection</Text>
                <TouchableOpacity 
                    style={badgeStyles.headerIcon}
                    onPress={onViewGallery}
                    activeOpacity={0.7}
                >
                    <Ionicons name="shield-checkmark" size={24} color="#0CB8BE" />
                </TouchableOpacity>
            </View>
            
            {/* Badge Stats */}
            <View style={badgeStyles.statsRow}>
                <View style={badgeStyles.statBadge}>
                    <Ionicons name="lock-closed-outline" size={20} color="#2CE8C6" />
                    <Text style={badgeStyles.statText}>Locked: {lockedCount}</Text>
                </View>
                <View style={badgeStyles.statBadge}>
                    <Ionicons name="lock-open-outline" size={20} color="#2CE8C6" />
                    <Text style={badgeStyles.statText}>Unlocked: {unlockedCount}</Text>
                </View>
            </View>
            
            {/* Diamond Badges Row */}
            <View style={badgeStyles.badgesRow}>
                {badges.slice(0, 5).map((badge) => (
                    <TouchableOpacity 
                        key={badge.id} 
                        onPress={() => onBadgePress(badge)}
                        activeOpacity={0.7}
                    >
                        <DiamondBadge type={badge.type} isLocked={badge.isLocked} />
                    </TouchableOpacity>
                ))}
            </View>
            
            {/* Next Badge Banner */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => {
                const nextLockedBadge = badges.find(b => b.isLocked);
                if (nextLockedBadge) onBadgePress(nextLockedBadge);
            }}>
                <LinearGradient
                    colors={['#2CE8C6', '#C19B00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={badgeStyles.nextBadgeBanner}
                >
                    <View style={badgeStyles.nextBadgeContent}>
                        <Text style={badgeStyles.nextBadgeLabel}>Next Badge:</Text>
                        <Text style={badgeStyles.nextBadgeTitle}>{nextBadgeName} — {daysLeft} Day{daysLeft !== 1 ? 's' : ''} Left</Text>
                    </View>
                    <View style={badgeStyles.nextBadgeProgress}>
                        <CircularProgress
                            percentage={nextBadgeProgress}
                            size={46}
                            strokeWidth={4}
                            progressColor="rgba(0, 0, 0, 0.3)"
                            backgroundColor="rgba(255, 255, 255, 0.3)"
                            textColor="black"
                            fontSize={12.5}
                        />
                    </View>
                </LinearGradient>
            </TouchableOpacity>
            
            {/* View Badge Gallery Button */}
            <TouchableOpacity 
                style={badgeStyles.galleryButton}
                onPress={onViewGallery}
                activeOpacity={0.7}
            >
                <Text style={badgeStyles.galleryButtonText}>View Badge Gallery</Text>
            </TouchableOpacity>
        </View>
    );
};

const badgeStyles = StyleSheet.create({
    container: {
        backgroundColor: '#0C0C0C',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        padding: 20,
        gap: 19,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: 'white',
    },
    headerIcon: {
        width: 43,
        height: 43,
        borderRadius: 138,
        backgroundColor: 'rgba(12, 184, 190, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.1)',
        borderRadius: 10,
        padding: 10,
    },
    statText: {
        fontSize: 14,
        color: 'white',
    },
    badgesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    nextBadgeBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        height: 71,
    },
    nextBadgeContent: {
        gap: 4,
    },
    nextBadgeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
    },
    nextBadgeTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
    },
    nextBadgeProgress: {
        width: 46,
    },
    galleryButton: {
        height: 55,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2CE8C6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2CE8C6',
    },
});

// ============================================================================
// LEADERBOARD SECTION
// ============================================================================
interface LeaderboardSectionProps {
    stats: LeaderboardStats;
    onViewLeaderboard: () => void;
    onRankPress: () => void;
}

const LeaderboardSection = ({ stats, onViewLeaderboard, onRankPress }: LeaderboardSectionProps) => {
    return (
        <View style={leaderboardStyles.section}>
            {/* Header */}
            <View style={leaderboardStyles.header}>
                <Text style={leaderboardStyles.title}>Leaderboard</Text>
                <TouchableOpacity 
                    style={leaderboardStyles.headerIcon}
                    onPress={onViewLeaderboard}
                    activeOpacity={0.7}
                >
                    <Ionicons name="podium-outline" size={26} color="#2CE8C6" />
                </TouchableOpacity>
            </View>
            
            {/* Stats Card */}
            <TouchableOpacity 
                style={leaderboardStyles.statsCard}
                onPress={onRankPress}
                activeOpacity={0.8}
            >
                <View style={leaderboardStyles.statsContent}>
                    {/* Your Rank */}
                    <View style={leaderboardStyles.statColumn}>
                        <View style={leaderboardStyles.statLabel}>
                            <Ionicons name="trophy-outline" size={20} color="#2CE8C6" />
                            <Text style={leaderboardStyles.statLabelText}>Your Rank</Text>
                        </View>
                        <Text style={leaderboardStyles.statValue}>{stats.rank} ({stats.rankType})</Text>
                    </View>
                    
                    {/* Divider */}
                    <View style={leaderboardStyles.verticalDivider} />
                    
                    {/* This Week */}
                    <View style={leaderboardStyles.statColumn}>
                        <View style={leaderboardStyles.statLabel}>
                            <Ionicons name="trending-up-outline" size={20} color="#2CE8C6" />
                            <Text style={leaderboardStyles.statLabelText}>This Week</Text>
                        </View>
                        <Text style={leaderboardStyles.statValue}>Top {stats.weeklyPercentile}%</Text>
                    </View>
                </View>
            </TouchableOpacity>
            
            {/* Go to Leaderboard Button */}
            <TouchableOpacity 
                style={leaderboardStyles.button}
                onPress={onViewLeaderboard}
                activeOpacity={0.8}
            >
                <Text style={leaderboardStyles.buttonText}>Go to Leaderboard</Text>
            </TouchableOpacity>
        </View>
    );
};

const leaderboardStyles = StyleSheet.create({
    section: {
        gap: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: 'white',
    },
    headerIcon: {
        width: 47,
        height: 47,
        borderRadius: 151,
        backgroundColor: 'rgba(44, 232, 198, 0.17)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsCard: {
        backgroundColor: '#0C0C0C',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        height: 110,
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    statsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statColumn: {
        gap: 10,
    },
    statLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statLabelText: {
        fontSize: 14,
        color: '#CECECE',
    },
    statValue: {
        fontSize: 26,
        fontWeight: '700',
        color: 'white',
    },
    verticalDivider: {
        width: 1,
        height: 69,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    button: {
        height: 65,
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'black',
    },
});

// ============================================================================
// BADGE GALLERY MODAL
// ============================================================================
interface BadgeGalleryModalProps {
    visible: boolean;
    onClose: () => void;
    badges: Badge[];
    onBadgePress: (badge: Badge) => void;
}

const BadgeGalleryModal = ({ visible, onClose, badges, onBadgePress }: BadgeGalleryModalProps) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>Badge Gallery</Text>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={modalStyles.statsRow}>
                        <View style={modalStyles.statItem}>
                            <Text style={modalStyles.statValue}>{badges.filter(b => !b.isLocked).length}</Text>
                            <Text style={modalStyles.statLabel}>Unlocked</Text>
                        </View>
                        <View style={modalStyles.statDivider} />
                        <View style={modalStyles.statItem}>
                            <Text style={modalStyles.statValue}>{badges.filter(b => b.isLocked).length}</Text>
                            <Text style={modalStyles.statLabel}>Locked</Text>
                        </View>
                        <View style={modalStyles.statDivider} />
                        <View style={modalStyles.statItem}>
                            <Text style={modalStyles.statValue}>{badges.length}</Text>
                            <Text style={modalStyles.statLabel}>Total</Text>
                        </View>
                    </View>
                    
                    <ScrollView style={modalStyles.badgesList} showsVerticalScrollIndicator={false}>
                        {badges.map((badge) => (
                            <TouchableOpacity
                                key={badge.id}
                                style={[
                                    modalStyles.badgeItem,
                                    badge.isLocked && modalStyles.badgeItemLocked,
                                ]}
                                onPress={() => onBadgePress(badge)}
                                activeOpacity={0.7}
                            >
                                <View style={modalStyles.badgeIconContainer}>
                                    <DiamondBadge type={badge.type} isLocked={badge.isLocked} />
                                </View>
                                <View style={modalStyles.badgeContent}>
                                    <Text style={modalStyles.badgeName}>{badge.name}</Text>
                                    <Text style={modalStyles.badgeDescription}>{badge.description}</Text>
                                    {badge.isLocked ? (
                                        <Text style={modalStyles.badgeRequirement}>🔒 {badge.requirement}</Text>
                                    ) : (
                                        <Text style={modalStyles.badgeUnlocked}>✅ Unlocked {formatDateTime(badge.unlockedAt)}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// ============================================================================
// LEADERBOARD MODAL
// ============================================================================
interface LeaderboardModalProps {
    visible: boolean;
    onClose: () => void;
    users: LeaderboardUser[];
}

const LeaderboardModal = ({ visible, onClose, users }: LeaderboardModalProps) => {
    const getRankColor = (rank: number) => {
        if (rank === 1) return '#FFD700';
        if (rank === 2) return '#C0C0C0';
        if (rank === 3) return '#CD7F32';
        return '#2CE8C6';
    };
    
    const getRankIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };
    
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={modalStyles.overlay}>
                <View style={modalStyles.container}>
                    <View style={modalStyles.header}>
                        <Text style={modalStyles.title}>Leaderboard</Text>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={modalStyles.leaderboardHeader}>
                        <Text style={modalStyles.leaderboardSubtitle}>This Week's Rankings</Text>
                        <View style={modalStyles.totalParticipants}>
                            <Ionicons name="people" size={16} color="#2CE8C6" />
                            <Text style={modalStyles.participantsText}>{users.length} participants</Text>
                        </View>
                    </View>
                    
                    <ScrollView style={modalStyles.leaderboardList} showsVerticalScrollIndicator={false}>
                        {users.map((user) => (
                            <View
                                key={user.id}
                                style={[
                                    modalStyles.leaderboardItem,
                                    user.isCurrentUser && modalStyles.leaderboardItemCurrent,
                                ]}
                            >
                                <View style={[
                                    modalStyles.rankBadge,
                                    { backgroundColor: user.rank <= 3 ? `${getRankColor(user.rank)}20` : 'rgba(44, 232, 198, 0.1)' }
                                ]}>
                                    <Text style={[
                                        modalStyles.rankText,
                                        { color: getRankColor(user.rank) }
                                    ]}>
                                        {getRankIcon(user.rank)}
                                    </Text>
                                </View>
                                <View style={modalStyles.userInfo}>
                                    <InitialsAvatar uri={user.avatar ?? undefined} name={user.name} size={38} />
                                    <View>
                                        <Text style={[
                                            modalStyles.userName,
                                            user.isCurrentUser && modalStyles.userNameCurrent,
                                        ]}>
                                            {user.name}
                                        </Text>
                                        <Text style={modalStyles.userXP}>{user.xp.toLocaleString()} XP</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#0C0C0C',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2CE8C6',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    badgesList: {
        paddingHorizontal: 20,
    },
    badgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    badgeItemLocked: {
        opacity: 0.6,
    },
    badgeIconContainer: {
        width: 60,
        height: 60,
    },
    badgeContent: {
        flex: 1,
        gap: 4,
    },
    badgeName: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    badgeDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    badgeRequirement: {
        fontSize: 12,
        color: '#FC9502',
        marginTop: 4,
    },
    badgeUnlocked: {
        fontSize: 12,
        color: '#2CE8C6',
        marginTop: 4,
    },
    leaderboardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    leaderboardSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        color: 'white',
    },
    totalParticipants: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    participantsText: {
        fontSize: 13,
        color: '#2CE8C6',
    },
    leaderboardList: {
        paddingHorizontal: 20,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    leaderboardItemCurrent: {
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    rankBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        fontSize: 16,
        fontWeight: '700',
    },
    userInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: 'white',
    },
    userNameCurrent: {
        color: '#2CE8C6',
    },
    userXP: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.6)',
    },
});

// ============================================================================
// MAIN SCREEN
// ============================================================================
const AchievementsScreen = () => {
    const navigation = useNavigation();
    const { alert } = useThemedAlert();

    // API data
    const { data: levelApiData } = useGetLevelQuery(undefined);
    const { data: badgesApiData } = useGetBadgesQuery(undefined);
    const { data: badgeGalleryApiData } = useGetBadgeGalleryQuery(undefined);
    const { data: myRankData } = useGetMyRankQuery(undefined);
    const { data: friendsLeaderboardData } = useGetFriendsLeaderboardQuery(undefined);
    const [shareProgressApi] = useShareProgressMutation();
    
    // State - derive from API data with useMemo
    const userStats = useMemo<UserStats>(() => {
        const level = levelApiData?.level ?? DEFAULT_USER_STATS.currentLevel;
        return {
            currentLevel: level,
            levelName: getLevelName(level),
            nextLevelName: getLevelName(level + 1),
            totalXP: levelApiData?.total_xp ?? DEFAULT_USER_STATS.totalXP,
            xpToNextLevel: levelApiData?.xp_for_next_level ?? DEFAULT_USER_STATS.xpToNextLevel,
            currentLevelXP: levelApiData?.current_level_xp ?? DEFAULT_USER_STATS.currentLevelXP,
            levelProgress: levelApiData?.progress_percent ?? DEFAULT_USER_STATS.levelProgress,
        };
    }, [levelApiData]);

    const badges = useMemo<Badge[]>(() => {
        const mapBadge = (b: any, isLocked: boolean): Badge => ({
            id: b.badge_id ?? b.id,
            name: b.badge_definitions?.name ?? b.name ?? 'Badge',
            description: b.badge_definitions?.description ?? b.description ?? '',
            type: inferBadgeType(b),
            isLocked,
            unlockedAt: b.earned_at,
            requirement: b.badge_definitions?.category ?? b.category ?? '',
            daysLeft: b.days_left ?? null,
        });

        if (badgeGalleryApiData) {
            const earned = Array.isArray(badgeGalleryApiData.earned) ? badgeGalleryApiData.earned : [];
            const locked = Array.isArray(badgeGalleryApiData.locked) ? badgeGalleryApiData.locked : [];

            const mapped = [
                ...earned.map((b: any) => mapBadge(b, false)),
                ...locked.map((b: any) => mapBadge(b, true)),
            ];

            if (mapped.length > 0) {
                return mapped;
            }
        }

        if (!Array.isArray(badgesApiData) || badgesApiData.length === 0) return DEFAULT_BADGES;

        return badgesApiData.map((b: any) => mapBadge(b, false));
    }, [badgesApiData, badgeGalleryApiData]);

    const nextLockedBadge = useMemo(() => badges.find((badge) => badge.isLocked), [badges]);

    const nextBadgeDaysLeft = useMemo(() => {
        if (typeof nextLockedBadge?.daysLeft === 'number') {
            return Math.max(0, nextLockedBadge.daysLeft);
        }

        return Math.max(0, Math.ceil((userStats.xpToNextLevel - userStats.currentLevelXP) / Math.max(1, userStats.currentLevelXP > 0 ? userStats.totalXP / Math.max(1, userStats.currentLevel) : 50)));
    }, [nextLockedBadge, userStats]);

    const leaderboardStats = useMemo<LeaderboardStats>(() => {
        // Backend returns: daily_rank, weekly_rank, friends_rank, total_friends
        const totalFriends = myRankData?.total_friends ?? 0;
        const friendsRank = myRankData?.friends_rank ?? DEFAULT_LEADERBOARD.rank;
        return {
            rank: friendsRank,
            rankType: 'Buddies',
            // Compute percentile from rank / total (higher rank = top %)
            weeklyPercentile: totalFriends > 0
                ? Math.round(((totalFriends - friendsRank + 1) / totalFriends) * 100)
                : DEFAULT_LEADERBOARD.weeklyPercentile,
            totalParticipants: totalFriends,
        };
    }, [myRankData]);

    // Map backend leaderboard entries to LeaderboardUser shape
    const leaderboardUsers = useMemo<LeaderboardUser[]>(() => {
        const entries = friendsLeaderboardData?.entries ?? [];
        return entries.map((e: any) => ({
            id: e.user_id ?? e.id ?? String(e.rank),
            name: e.is_current_user ? 'You' : (e.name ?? 'User'),
            xp: e.score ?? 0,
            rank: e.rank ?? 0,
            avatar: e.avatar_url ?? null,
            isCurrentUser: e.is_current_user ?? false,
        }));
    }, [friendsLeaderboardData]);

    const [showBadgeGallery, setShowBadgeGallery] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showRankingModal, setShowRankingModal] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    
    // Handlers
    const handleXPSummaryPress = useCallback(() => {
        alert(
            '📊 XP & Level Details',
            `🎮 Current Level: ${userStats.currentLevel} (${userStats.levelName})\n\n` +
            `⭐ Total XP: ${userStats.totalXP.toLocaleString()}\n\n` +
            `📈 Progress: ${userStats.currentLevelXP}/${userStats.xpToNextLevel} XP (${userStats.levelProgress}%)\n\n` +
            `🎯 Next Level: ${userStats.currentLevel + 1} (${userStats.nextLevelName})\n\n` +
            `💡 Keep completing tasks to level up faster!`,
            [{ text: 'Got it!' }]
        );
    }, [userStats]);
    
    const handleBadgePress = useCallback((badge: Badge) => {
        setSelectedBadge(badge);
    }, []);
    
    const handleViewBadgeGallery = useCallback(() => {
        setShowBadgeGallery(true);
    }, []);
    
    const handleViewLeaderboard = useCallback(() => {
        setShowLeaderboard(true);
    }, []);
    
    const handleRankPress = useCallback(() => {
        setShowRankingModal(true);
    }, []);
    
    const handleMascotPress = useCallback(() => {
        const tips = [
            "Keep up the great work! You're doing amazing! 🌟",
            "Every small step counts towards your goal! 💪",
            "Consistency is key to building habits! 🔑",
            "You're closer to the next level than you think! 🚀",
            "Believe in yourself - you've got this! ✨",
        ];
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        alert('💚 Motivation', randomTip, [{ text: 'Thanks!' }]);
    }, []);
    
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rewards Hub</Text>
                <View style={{ width: 30 }} />
            </View>
            
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Your Rewards Section */}
                <View style={styles.rewardsHeader}>
                    <View style={styles.rewardsHeaderText}>
                        <Text style={styles.rewardsLabel}>Your Rewards</Text>
                        <Text style={styles.rewardsTitle}>Every streak, every task it all counts.</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.mascotContainer}
                        onPress={handleMascotPress}
                        activeOpacity={0.8}
                    >
                        <Mascot size={88} />
                    </TouchableOpacity>
                </View>
                
                {/* XP & Level Summary */}
                <XPLevelSummaryCard 
                    stats={userStats}
                    onPress={handleXPSummaryPress}
                />
                
                {/* Badge Collection */}
                <BadgeCollectionCard
                    badges={badges}
                    onBadgePress={handleBadgePress}
                    onViewGallery={handleViewBadgeGallery}
                    nextBadgeProgress={userStats.levelProgress || 0}
                    daysLeft={nextBadgeDaysLeft}
                />
                
                {/* Leaderboard */}
                <LeaderboardSection
                    stats={leaderboardStats}
                    onViewLeaderboard={handleViewLeaderboard}
                    onRankPress={handleRankPress}
                />
                
                {/* Share Progress */}
                <TouchableOpacity
                    style={styles.shareButton}
                    onPress={async () => {
                        try {
                            await Share.share({
                                message: `I'm Level ${userStats.currentLevel} ${userStats.levelName} on Unhabit with ${userStats.totalXP} XP! 🏆 Join me at https://unhabit.app`,
                                title: 'My Unhabit Progress',
                            });
                            shareProgressApi({ type: 'achievement', level: userStats.currentLevel, xp: userStats.totalXP }).catch(() => {});
                        } catch {
                            // User cancelled share
                        }
                    }}
                >
                    <Ionicons name="share-outline" size={20} color={COLORS.primary} />
                    <Text style={styles.shareButtonText}>Share Progress</Text>
                </TouchableOpacity>

                {/* Bottom spacer for tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>
            
            {/* Modals */}
            <BadgeGalleryModal
                visible={showBadgeGallery}
                onClose={() => setShowBadgeGallery(false)}
                badges={badges}
                onBadgePress={handleBadgePress}
            />
            
            {/* Badge Detail Modal */}
            <Modal
                visible={selectedBadge !== null}
                animationType="fade"
                transparent
                onRequestClose={() => setSelectedBadge(null)}
            >
                <TouchableOpacity
                    style={badgeDetailStyles.overlay}
                    activeOpacity={1}
                    onPress={() => setSelectedBadge(null)}
                >
                    <View style={badgeDetailStyles.container}>
                        <View style={badgeDetailStyles.header}>
                            <TouchableOpacity onPress={() => setSelectedBadge(null)}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={badgeDetailStyles.body}>
                            <View style={[
                                badgeDetailStyles.badgeIconWrap,
                                selectedBadge?.isLocked && badgeDetailStyles.badgeIconLocked,
                            ]}>
                                <DiamondBadge
                                    type={selectedBadge?.type || 'bronze'}
                                    size={80}
                                    isLocked={selectedBadge?.isLocked}
                                />
                            </View>
                            <Text style={badgeDetailStyles.badgeName}>
                                {selectedBadge?.isLocked ? '🔒 ' : '🏆 '}{selectedBadge?.name}
                            </Text>
                            <Text style={badgeDetailStyles.badgeDesc}>{selectedBadge?.description}</Text>
                            <View style={badgeDetailStyles.infoCard}>
                                {selectedBadge?.isLocked ? (
                                    <>
                                        <View style={badgeDetailStyles.infoRow}>
                                            <Ionicons name="list-outline" size={18} color={COLORS.primary} />
                                            <Text style={badgeDetailStyles.infoLabel}>Requirement</Text>
                                        </View>
                                        <Text style={badgeDetailStyles.infoValue}>{selectedBadge?.requirement}</Text>
                                        <Text style={badgeDetailStyles.infoMotivation}>💪 Keep going to unlock this badge!</Text>
                                    </>
                                ) : (
                                    <>
                                        <View style={badgeDetailStyles.infoRow}>
                                            <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                                            <Text style={badgeDetailStyles.infoLabel}>Unlocked</Text>
                                        </View>
                                        <Text style={badgeDetailStyles.infoValue}>{formatDateTime(selectedBadge?.unlockedAt)}</Text>
                                        <Text style={badgeDetailStyles.infoMotivation}>🎉 Great achievement!</Text>
                                    </>
                                )}
                            </View>
                        </View>
                        <TouchableOpacity
                            style={badgeDetailStyles.closeBtn}
                            onPress={() => setSelectedBadge(null)}
                        >
                            <Text style={badgeDetailStyles.closeBtnText}>
                                {selectedBadge?.isLocked ? 'Got it' : 'Awesome!'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <LeaderboardModal
                visible={showLeaderboard}
                onClose={() => setShowLeaderboard(false)}
                users={leaderboardUsers}
            />

            <Modal
                visible={showRankingModal}
                animationType="fade"
                transparent
                onRequestClose={() => setShowRankingModal(false)}
            >
                <TouchableOpacity
                    style={rankingModalStyles.overlay}
                    activeOpacity={1}
                    onPress={() => setShowRankingModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={rankingModalStyles.container}
                        onPress={() => {}}
                    >
                        <View style={rankingModalStyles.header}>
                            <View style={rankingModalStyles.headerIconWrap}>
                                <Ionicons name="trophy" size={18} color={COLORS.primary} />
                            </View>
                            <View style={rankingModalStyles.headerTextWrap}>
                                <Text style={rankingModalStyles.title}>Your Ranking</Text>
                                <Text style={rankingModalStyles.subtitle}>Leaderboard snapshot</Text>
                            </View>
                        </View>

                        <View style={rankingModalStyles.statsWrap}>
                            <View style={rankingModalStyles.statRow}>
                                <Ionicons name="stats-chart" size={16} color={COLORS.primary} />
                                <Text style={rankingModalStyles.statLabel}>Current Rank</Text>
                                <Text style={rankingModalStyles.statValue}>#{leaderboardStats.rank} in {leaderboardStats.rankType}</Text>
                            </View>

                            <View style={rankingModalStyles.statRow}>
                                <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                                <Text style={rankingModalStyles.statLabel}>This Week</Text>
                                <Text style={rankingModalStyles.statValue}>Top {leaderboardStats.weeklyPercentile}%</Text>
                            </View>

                            <View style={rankingModalStyles.statRow}>
                                <Ionicons name="people" size={16} color={COLORS.primary} />
                                <Text style={rankingModalStyles.statLabel}>Participants</Text>
                                <Text style={rankingModalStyles.statValue}>{leaderboardStats.totalParticipants}</Text>
                            </View>
                        </View>

                        <Text style={rankingModalStyles.tipText}>Keep earning XP to climb faster 🚀</Text>

                        <View style={rankingModalStyles.buttonsRow}>
                            <TouchableOpacity
                                style={rankingModalStyles.secondaryButton}
                                onPress={() => {
                                    setShowRankingModal(false);
                                    handleViewLeaderboard();
                                }}
                            >
                                <Text style={rankingModalStyles.secondaryButtonText}>View Leaderboard</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={rankingModalStyles.primaryButton}
                                onPress={() => setShowRankingModal(false)}
                            >
                                <Text style={rankingModalStyles.primaryButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginTop: 16,
    },
    shareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 17,
        paddingVertical: 10,
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
        color: 'white',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
        gap: 30,
    },
    rewardsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rewardsHeaderText: {
        flex: 1,
        gap: 13,
    },
    rewardsLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2CE8C6',
    },
    rewardsTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        maxWidth: 262,
    },
    mascotContainer: {
        width: 92,
        height: 88,
    },
    circularProgressText: {
        position: 'absolute',
        fontWeight: '700',
    },
});

const badgeDetailStyles = StyleSheet.create({
    overlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center', alignItems: 'center', padding: 30,
    },
    container: {
        backgroundColor: '#0C0C0C', borderRadius: 24, width: '100%',
        borderWidth: 1, borderColor: 'rgba(44,232,198,0.15)',
    },
    header: { alignItems: 'flex-end', padding: 16, paddingBottom: 0 },
    body: { alignItems: 'center', paddingHorizontal: 24, gap: 16, paddingBottom: 8 },
    badgeIconWrap: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(44,232,198,0.08)', justifyContent: 'center', alignItems: 'center',
    },
    badgeIconLocked: { opacity: 0.5 },
    badgeName: { fontSize: 22, fontWeight: '700', color: 'white', textAlign: 'center' },
    badgeDesc: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 21 },
    infoCard: {
        width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
        padding: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoLabel: { fontSize: 13, fontWeight: '500', color: COLORS.primary },
    infoValue: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginLeft: 26 },
    infoMotivation: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
    closeBtn: {
        margin: 20, marginTop: 12, backgroundColor: COLORS.primary,
        paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    },
    closeBtnText: { fontSize: 16, fontWeight: '600', color: 'black' },
});

const rankingModalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    container: {
        width: '100%',
        backgroundColor: '#0C0C0C',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(44,232,198,0.2)',
        padding: 18,
        gap: 14,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(44,232,198,0.14)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextWrap: {
        flex: 1,
    },
    title: {
        color: COLORS.white,
        fontSize: 20,
        fontWeight: '700',
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    statsWrap: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        overflow: 'hidden',
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 11,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    statLabel: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    statValue: {
        marginLeft: 'auto',
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
    },
    tipText: {
        color: COLORS.primary,
        fontSize: 13,
        textAlign: 'center',
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 2,
    },
    secondaryButton: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        flex: 1,
        borderRadius: 10,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: COLORS.black,
        fontSize: 14,
        fontWeight: '700',
    },
});

export default AchievementsScreen;
