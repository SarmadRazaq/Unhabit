import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, Line } from 'react-native-svg';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { Mascot } from '../components/common';
import { useGetHabitHealthTrendQuery, useGetMissedDaysQuery } from '../services/api/analyticsApi';
import { useGetStreakDetailsQuery, useGetAvailableFreezesQuery } from '../services/api/streaksApi';
import { useGetLevelQuery, useGetBadgeGalleryQuery } from '../services/api/rewardsApi';
import { useGetRecoveryStatusQuery } from '../services/api/recoveryApi';
import { useGetDashboardQuery } from '../services/api/homeApi';
import { useGetJourneyCalendarQuery } from '../services/api/journeysApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;

// ============================================================================
// DATA DEFAULTS - Replace with real data from API/State
// ============================================================================
interface DayData {
    date: number;
    isoDate?: string;
    dayName: string;
    completed: boolean;
    isToday: boolean;
    isFuture?: boolean;
}

interface StreakData {
    current: number;
    longest: number;
}

interface HabitHealthData {
    dataPoints: number[];
    currentHealth: number;
    weeklyChange: number;
}

interface StepsData {
    currentStreak: number;
    longestStreak: number;
    weeklyProgress: boolean[];
}

interface XPData {
    totalXP: number;
    currentLevel: number;
    xpForNextLevel: number;
    currentLevelXP: number;
    dailyXP: number[];
}

interface MissedDaysData {
    totalMissed: number;
    daysSinceLastMissed: number;
}

interface RecoveryData {
    penaltyApplied: boolean;
    streakProtectionUsed: boolean;
}

interface BadgeData {
    id: string;
    name: string;
    daysRequired: number;
    daysCompleted: number;
    progressUnit: 'days' | 'xp';
    status: 'unlocked' | 'inProgress' | 'locked';
    badgeType: 'silver' | 'bronze' | 'gold';
}

interface StatsData {
    currentDay: number;
    totalDays: number;
    calendarDays: DayData[];
    streak: StreakData;
    habitHealth: HabitHealthData;
    steps: StepsData;
    xp: XPData;
    missedDays: MissedDaysData;
    recovery: RecoveryData;
    badges: BadgeData[];
}

// Generate current week calendar (no mock completions — API data fills in)
const generateCalendarDays = (): DayData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    return days.map((dayName, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + mondayOffset + index);
        const dayOfMonth = date.getDate();
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;

        return {
            date: dayOfMonth,
            isoDate: date.toISOString().split('T')[0],
            dayName,
            completed: false,
            isToday,
            isFuture,
        };
    });
};

// Default empty state — real data comes from API hooks
const DEFAULT_STATS_DATA: StatsData = {
    currentDay: 0,
    totalDays: 0,
    calendarDays: generateCalendarDays(),
    streak: { current: 0, longest: 0 },
    habitHealth: { dataPoints: [], currentHealth: 0, weeklyChange: 0 },
    steps: { currentStreak: 0, longestStreak: 0, weeklyProgress: [] },
    xp: { totalXP: 0, currentLevel: 1, xpForNextLevel: 100, currentLevelXP: 0, dailyXP: [] },
    missedDays: { totalMissed: 0, daysSinceLastMissed: 0 },
    recovery: { penaltyApplied: false, streakProtectionUsed: false },
    badges: [],
};

// ============================================================================
// COMPLETION CALENDAR COMPONENT
// ============================================================================
interface CalendarDayProps {
    day: number;
    isCompleted: boolean;
    isToday: boolean;
    isFuture: boolean;
    onPress: () => void;
}

const CalendarDay = ({ day, isCompleted, isToday, isFuture, onPress }: CalendarDayProps) => (
    <TouchableOpacity 
        onPress={onPress}
        style={[
            calendarStyles.dayCircle,
            isCompleted && calendarStyles.dayCircleCompleted,
            !isCompleted && calendarStyles.dayCircleUncompleted,
        ]}
        activeOpacity={0.7}
    >
        <Text style={[
            calendarStyles.dayText,
            isCompleted && calendarStyles.dayTextCompleted,
            !isCompleted && calendarStyles.dayTextUncompleted,
        ]}>
            {day}
        </Text>
    </TouchableOpacity>
);

const calendarStyles = StyleSheet.create({
    dayCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayCircleCompleted: {
        backgroundColor: 'rgba(44, 232, 198, 0.25)',
        borderWidth: 1.5,
        borderColor: '#2CE8C6',
    },
    dayCircleUncompleted: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
    },
    dayTextCompleted: {
        color: '#2CE8C6',
        fontWeight: '600',
    },
    dayTextUncompleted: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
});

// ============================================================================
// STREAK CARD COMPONENT
// ============================================================================
interface StreakCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
}

const StreakCard = ({ icon, label, value }: StreakCardProps) => (
    <View style={streakCardStyles.container}>
        <View style={streakCardStyles.row}>
            <Ionicons name={icon} size={24} color="#2CE8C6" />
            <Text style={streakCardStyles.label}>{label}</Text>
        </View>
        <Text style={streakCardStyles.value}>{value}</Text>
    </View>
);

const streakCardStyles = StyleSheet.create({
    container: {
        flex: 1,
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    value: {
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.white,
        textAlign: 'center',
        width: 92,
    },
});

// ============================================================================
// HABIT HEALTH CHART COMPONENT
// ============================================================================
interface HabitHealthChartProps {
    data: HabitHealthData;
    onPress?: () => void;
}

const HabitHealthChart = ({ data, onPress }: HabitHealthChartProps) => {
    const chartWidth = CARD_WIDTH - 40;
    const chartHeight = 140;
    const { dataPoints, currentHealth, weeklyChange } = data;
    const maxValue = 100;
    
    // Calculate path
    const getPath = () => {
        if (dataPoints.length < 2) return '';
        const points = dataPoints.map((value, index) => {
            const x = (index / (dataPoints.length - 1)) * chartWidth;
            const y = chartHeight - (value / maxValue) * chartHeight;
            return { x, y };
        });
        
        // Create smooth curve
        let path = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx1 = prev.x + (curr.x - prev.x) / 3;
            const cpx2 = prev.x + 2 * (curr.x - prev.x) / 3;
            path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
        }
        return path;
    };
    
    // Create fill path
    const getFillPath = () => {
        const linePath = getPath();
        if (!linePath) return '';
        return `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
    };
    
    const currentX = chartWidth * ((dataPoints.length - 1) / dataPoints.length);
    const currentY = chartHeight - (currentHealth / maxValue) * chartHeight;
    
    return (
        <TouchableOpacity 
            style={chartStyles.container} 
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={chartStyles.header}>
                <View>
                    <Text style={chartStyles.subtitle}>Habit Health Trend</Text>
                    <Text style={chartStyles.title}>Habit Health Over Time</Text>
                </View>
                <View style={chartStyles.trendBadge}>
                    <Ionicons 
                        name={weeklyChange >= 0 ? "trending-up" : "trending-down"} 
                        size={16} 
                        color={weeklyChange >= 0 ? "#2CE8C6" : "#FF6B6B"} 
                    />
                    <Text style={[
                        chartStyles.trendText,
                        { color: weeklyChange >= 0 ? "#2CE8C6" : "#FF6B6B" }
                    ]}>
                        {weeklyChange >= 0 ? '+' : ''}{weeklyChange}%
                    </Text>
                </View>
            </View>
            
            <View style={chartStyles.chartContainer}>
                <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                        <SvgLinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0%" stopColor="#2CE8C6" stopOpacity="0.4" />
                            <Stop offset="100%" stopColor="#2CE8C6" stopOpacity="0" />
                        </SvgLinearGradient>
                    </Defs>
                    
                    {/* Fill area */}
                    <Path
                        d={getFillPath()}
                        fill="url(#chartGradient)"
                    />
                    
                    {/* Line */}
                    <Path
                        d={getPath()}
                        stroke="#2CE8C6"
                        strokeWidth={2}
                        fill="none"
                    />
                    
                    {/* Vertical indicator line */}
                    <Line
                        x1={currentX}
                        y1={0}
                        x2={currentX}
                        y2={chartHeight}
                        stroke="#E7EEF6"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                    />
                    
                    {/* Current position dot */}
                    <Circle
                        cx={currentX}
                        cy={currentY}
                        r={6}
                        fill="#2CE8C6"
                        stroke="#fff"
                        strokeWidth={2}
                    />
                </Svg>
            </View>
            
            <View style={chartStyles.footer}>
                <View style={chartStyles.healthBadge}>
                    <Ionicons name="trending-up" size={22} color="#000" />
                </View>
                <View>
                    <Text style={chartStyles.footerSubtitle}>
                        Last 7 Days: {weeklyChange >= 0 ? '+' : ''}{weeklyChange}%
                    </Text>
                    <Text style={chartStyles.footerTitle}>Current Health: {currentHealth}%</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const chartStyles = StyleSheet.create({
    container: {
        backgroundColor: '#0C0C0C',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        padding: 20,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    subtitle: {
        fontSize: 12,
        color: '#2CE8C6',
        marginBottom: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: COLORS.white,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 14,
        fontWeight: '600',
    },
    chartContainer: {
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    healthBadge: {
        width: 43,
        height: 43,
        borderRadius: 22,
        backgroundColor: '#2CE8C6',
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerSubtitle: {
        fontSize: 12,
        color: '#2CE8C6',
        marginBottom: 5,
    },
    footerTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: COLORS.white,
    },
});

// ============================================================================
// STEPS STREAK CARD COMPONENT
// ============================================================================
interface StepsStreakCardProps {
    data: StepsData;
    onPress?: () => void;
}

const StepsStreakCard = ({ data, onPress }: StepsStreakCardProps) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const { currentStreak, longestStreak, weeklyProgress } = data;
    const completedCount = weeklyProgress.filter(Boolean).length;
    const progressPercent = (completedCount / 7) * 100;
    
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={['rgba(44, 232, 198, 0.15)', 'rgba(12, 12, 12, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={stepsStyles.container}
            >
                <View style={stepsStyles.leftSection}>
                    <View style={stepsStyles.iconBox}>
                        <Ionicons name="footsteps" size={34} color="#2CE8C6" />
                        <View style={stepsStyles.streakInfo}>
                            <Text style={stepsStyles.streakDays}>
                                {String(currentStreak).padStart(2, '0')} days
                            </Text>
                            <Text style={stepsStyles.streakLabel}>Steps Streak</Text>
                        </View>
                    </View>
                </View>
                
                <View style={stepsStyles.rightSection}>
                    <View>
                        <Text style={stepsStyles.longestText}>Longest: {longestStreak} Days</Text>
                        <Text style={stepsStyles.currentText}>Current Streak: {currentStreak} Days</Text>
                    </View>
                    
                    {/* Progress bar */}
                    <View style={stepsStyles.progressContainer}>
                        <View style={stepsStyles.progressBackground}>
                            <View style={[stepsStyles.progressFill, { width: `${progressPercent}%` }]} />
                            {/* Dots on the progress bar */}
                            <View style={stepsStyles.dotsContainer}>
                                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                    <View 
                                        key={i} 
                                        style={[
                                            stepsStyles.dot,
                                            weeklyProgress[i] && stepsStyles.dotCompleted
                                        ]} 
                                    />
                                ))}
                            </View>
                        </View>
                    </View>
                    
                    {/* Days with checkmarks */}
                    <View style={stepsStyles.daysRow}>
                        {days.map((day, index) => (
                            <View key={day} style={stepsStyles.dayItem}>
                                <View style={[
                                    stepsStyles.checkCircle,
                                    weeklyProgress[index] && stepsStyles.checkCircleCompleted
                                ]}>
                                    {weeklyProgress[index] ? (
                                        <Ionicons name="checkmark" size={14} color="#000" />
                                    ) : (
                                        <Ionicons name="close" size={14} color="rgba(255,255,255,0.3)" />
                                    )}
                                </View>
                                <Text style={[
                                    stepsStyles.dayText,
                                    weeklyProgress[index] && stepsStyles.dayTextCompleted
                                ]}>{day}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const stepsStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        padding: 15,
        gap: 14,
    },
    leftSection: {
        width: 100,
    },
    iconBox: {
        width: 100,
        height: 134,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    streakInfo: {
        alignItems: 'center',
        gap: 2,
    },
    streakDays: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    streakLabel: {
        fontSize: 12,
        color: '#2CE8C6',
    },
    rightSection: {
        flex: 1,
        gap: 12,
    },
    longestText: {
        fontSize: 14,
        color: COLORS.white,
    },
    currentText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2CE8C6',
    },
    progressContainer: {
        height: 16,
    },
    progressBackground: {
        flex: 1,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderRadius: 64,
        overflow: 'hidden',
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'rgba(44, 232, 198, 0.8)',
        borderRadius: 64,
    },
    dotsContainer: {
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        top: 6,
        left: 13,
        right: 13,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    dotCompleted: {
        backgroundColor: '#fff',
    },
    daysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayItem: {
        alignItems: 'center',
        gap: 5,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkCircleCompleted: {
        backgroundColor: '#2CE8C6',
    },
    dayText: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    dayTextCompleted: {
        color: '#2CE8C6',
        fontWeight: '600',
    },
});

// ============================================================================
// XP PROGRESS CHART COMPONENT
// ============================================================================
interface XPProgressChartProps {
    data: XPData;
    onPress?: () => void;
}

const XPProgressChart = ({ data, onPress }: XPProgressChartProps) => {
    const chartWidth = CARD_WIDTH - 40;
    const chartHeight = 140;
    const { totalXP, currentLevel, xpForNextLevel, currentLevelXP, dailyXP } = data;
    const levelProgress = xpForNextLevel > 0 ? (currentLevelXP / xpForNextLevel) * 100 : 0;
    
    // Calculate cumulative XP for the chart
    const cumulativeXP = dailyXP.reduce((acc: number[], xp, i) => {
        acc.push((acc[i - 1] || 0) + xp);
        return acc;
    }, []);
    
    const maxCumulativeXP = cumulativeXP.length > 0 ? Math.max(...cumulativeXP) * 1.2 : 1;
    const paddingTop = 35;
    const chartDrawHeight = chartHeight - paddingTop;
    
    // Get points for the curved line
    const getPoints = () => {
        return cumulativeXP.map((xp, i) => {
            const x = (i / (cumulativeXP.length - 1)) * chartWidth;
            const y = paddingTop + chartDrawHeight - (xp / maxCumulativeXP) * chartDrawHeight;
            return { x, y };
        });
    };
    
    const points = getPoints();
    
    // Create smooth bezier curve path
    const getCurvePath = () => {
        if (points.length < 2) return '';
        
        let path = `M ${points[0].x} ${points[0].y}`;
        
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
            const cpy1 = prev.y;
            const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
            const cpy2 = curr.y;
            path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
        }
        
        return path;
    };
    
    // Create fill path (curve + close at bottom)
    const getFillPath = () => {
        if (points.length < 2) return '';
        const curvePath = getCurvePath();
        if (!curvePath) return '';
        return `${curvePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
    };
    
    // Current position (5th point - index 4, clamped to array bounds)
    const currentIndex = Math.min(4, points.length - 1);
    const currentPoint = points.length > 0 ? points[currentIndex] : { x: 0, y: chartHeight };
    
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={['rgba(44, 232, 198, 0.15)', 'rgba(12, 12, 12, 0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={xpStyles.container}
            >
                <View style={xpStyles.header}>
                    <Text style={xpStyles.title}>XP Progress</Text>
                    <View style={xpStyles.levelBadge}>
                        <Text style={xpStyles.levelText}>Level {currentLevel}</Text>
                    </View>
                </View>
                
                {/* Chart */}
                <View style={xpStyles.chartArea}>
                    <Svg width={chartWidth} height={chartHeight}>
                        <Defs>
                            <SvgLinearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0%" stopColor="#2CE8C6" stopOpacity="0.5" />
                                <Stop offset="100%" stopColor="#2CE8C6" stopOpacity="0.02" />
                            </SvgLinearGradient>
                        </Defs>
                        
                        {/* Horizontal dashed line at top */}
                        <Line 
                            x1={0} 
                            y1={paddingTop} 
                            x2={chartWidth} 
                            y2={paddingTop} 
                            stroke="rgba(255,255,255,0.15)" 
                            strokeWidth={1} 
                            strokeDasharray="6,4"
                        />
                        
                        {/* Fill area under curve */}
                        <Path d={getFillPath()} fill="url(#xpGradient)" />
                        
                        {/* Main curve line */}
                        <Path
                            d={getCurvePath()}
                            stroke="#2CE8C6"
                            strokeWidth={2.5}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        
                        {/* Vertical indicator line at current point */}
                        <Line
                            x1={currentPoint.x}
                            y1={currentPoint.y}
                            x2={currentPoint.x}
                            y2={chartHeight}
                            stroke="#2CE8C6"
                            strokeWidth={1}
                        />
                        
                        {/* Current position dot */}
                        <Circle
                            cx={currentPoint.x}
                            cy={currentPoint.y}
                            r={8}
                            fill="#2CE8C6"
                        />
                        <Circle
                            cx={currentPoint.x}
                            cy={currentPoint.y}
                            r={4}
                            fill="#0C0C0C"
                        />
                    </Svg>
                    
                    {/* XP Labels positioned above each point */}
                    {dailyXP.map((xp, i) => {
                        const point = points[i];
                        if (!point) return null;
                        return (
                            <View 
                                key={i} 
                                style={[
                                    xpStyles.xpLabelContainer,
                                    { 
                                        left: point.x - 20,
                                        top: point.y - 22,
                                    }
                                ]}
                            >
                                <Text style={xpStyles.xpLabel}>+{xp}</Text>
                            </View>
                        );
                    })}
                </View>
                
                <View style={xpStyles.footer}>
                    <View>
                        <Text style={xpStyles.totalLabel}>Total XP earned:</Text>
                        <Text style={xpStyles.totalValue}>{totalXP.toLocaleString()}</Text>
                    </View>
                    
                    {/* Level progress circle */}
                    <View style={xpStyles.levelProgressContainer}>
                        <View style={xpStyles.levelProgress}>
                            <Svg width={56} height={56}>
                                {/* Background circle */}
                                <Circle
                                    cx={28}
                                    cy={28}
                                    r={24}
                                    stroke="rgba(44, 232, 198, 0.15)"
                                    strokeWidth={4}
                                    fill="none"
                                />
                                {/* Progress arc */}
                                <Circle
                                    cx={28}
                                    cy={28}
                                    r={24}
                                    stroke="#2CE8C6"
                                    strokeWidth={4}
                                    fill="none"
                                    strokeDasharray={`${(levelProgress / 100) * 151} 151`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 28 28)"
                                />
                            </Svg>
                            <Text style={xpStyles.nextLevel}>{currentLevel + 1}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const xpStyles = StyleSheet.create({
    container: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '500',
        color: COLORS.white,
    },
    levelBadge: {
        backgroundColor: 'rgba(44, 232, 198, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.5)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    levelText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2CE8C6',
    },
    chartArea: {
        marginTop: 16,
        height: 140,
        position: 'relative',
    },
    xpLabelContainer: {
        position: 'absolute',
        width: 40,
        alignItems: 'center',
    },
    xpLabel: {
        fontSize: 12,
        color: COLORS.white,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    totalLabel: {
        fontSize: 12,
        color: '#2CE8C6',
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 28,
        fontWeight: '700',
        color: COLORS.white,
    },
    levelProgressContainer: {
        alignItems: 'center',
    },
    levelProgress: {
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextLevel: {
        position: 'absolute',
        fontSize: 20,
        fontWeight: '700',
        color: '#2CE8C6',
    },
});

// ============================================================================
// MISSED DAYS CARD COMPONENT
// ============================================================================
interface MissedDaysCardProps {
    data: MissedDaysData;
    onPress?: () => void;
}

const MissedDaysCard = ({ data, onPress }: MissedDaysCardProps) => (
    <TouchableOpacity style={missedStyles.container} onPress={onPress} activeOpacity={0.8}>
        <Text style={missedStyles.title}>Missed Days</Text>
        <View style={missedStyles.row}>
            <View style={missedStyles.stat}>
                <View style={missedStyles.labelRow}>
                    <View style={missedStyles.iconCircle}>
                        <Ionicons name="calendar-outline" size={20} color="#2CE8C6" />
                    </View>
                    <Text style={missedStyles.label}>Total missed</Text>
                </View>
                <Text style={missedStyles.value}>{data.totalMissed} Day{data.totalMissed !== 1 ? 's' : ''}</Text>
            </View>
            <View style={missedStyles.divider} />
            <View style={missedStyles.stat}>
                <View style={missedStyles.labelRow}>
                    <View style={missedStyles.iconCircle}>
                        <Ionicons name="time-outline" size={20} color="#2CE8C6" />
                    </View>
                    <Text style={missedStyles.label}>Last missed</Text>
                </View>
                <Text style={missedStyles.value}>{data.daysSinceLastMissed} Day{data.daysSinceLastMissed !== 1 ? 's' : ''} ago</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const missedStyles = StyleSheet.create({
    container: {
        backgroundColor: '#0C0C0C',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        padding: 18,
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.white,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stat: {
        flex: 1,
        gap: 10,
    },
    divider: {
        width: 1,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    value: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2CE8C6',
        marginLeft: 40,
    },
});

// ============================================================================
// RECOVERY STATUS CARD COMPONENT
// ============================================================================
interface RecoveryStatusCardProps {
    data: RecoveryData;
    onPress?: () => void;
}

const RecoveryStatusCard = ({ data, onPress }: RecoveryStatusCardProps) => (
    <TouchableOpacity style={recoveryStyles.container} onPress={onPress} activeOpacity={0.8}>
        <Text style={recoveryStyles.title}>Recovery Status</Text>
        <View style={recoveryStyles.items}>
            <View style={[
                recoveryStyles.item,
                data.penaltyApplied && recoveryStyles.itemWarning
            ]}>
                <View style={recoveryStyles.itemLeft}>
                    <View style={[
                        recoveryStyles.iconCircle, 
                        data.penaltyApplied ? recoveryStyles.iconCircleWarning : recoveryStyles.iconCircleSuccess
                    ]}>
                        <Ionicons 
                            name="warning-outline" 
                            size={18} 
                            color={data.penaltyApplied ? "#FF6B6B" : "#2CE8C6"} 
                        />
                    </View>
                    <Text style={recoveryStyles.itemText}>Penalty applied</Text>
                </View>
                <View style={[
                    recoveryStyles.statusBadge,
                    data.penaltyApplied ? recoveryStyles.statusBadgeActive : recoveryStyles.statusBadgeInactive
                ]}>
                    <Ionicons 
                        name={data.penaltyApplied ? "checkmark" : "close"} 
                        size={16} 
                        color={data.penaltyApplied ? "#000" : "rgba(255,255,255,0.5)"} 
                    />
                </View>
            </View>
            <View style={[
                recoveryStyles.item,
                data.streakProtectionUsed && recoveryStyles.itemSuccess
            ]}>
                <View style={recoveryStyles.itemLeft}>
                    <View style={[
                        recoveryStyles.iconCircle,
                        recoveryStyles.iconCircleSuccess
                    ]}>
                        <Ionicons name="shield-checkmark-outline" size={18} color="#2CE8C6" />
                    </View>
                    <Text style={recoveryStyles.itemText}>Streak protection used</Text>
                </View>
                <View style={[
                    recoveryStyles.statusBadge,
                    data.streakProtectionUsed ? recoveryStyles.statusBadgeActive : recoveryStyles.statusBadgeInactive
                ]}>
                    <Ionicons 
                        name={data.streakProtectionUsed ? "checkmark" : "close"} 
                        size={16} 
                        color={data.streakProtectionUsed ? "#000" : "rgba(255,255,255,0.5)"} 
                    />
                </View>
            </View>
        </View>
    </TouchableOpacity>
);

const recoveryStyles = StyleSheet.create({
    container: {
        backgroundColor: '#0C0C0C',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        padding: 18,
        gap: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.white,
    },
    items: {
        gap: 10,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    itemWarning: {
        borderColor: 'rgba(255, 107, 107, 0.3)',
        backgroundColor: 'rgba(255, 107, 107, 0.05)',
    },
    itemSuccess: {
        borderColor: 'rgba(44, 232, 198, 0.3)',
        backgroundColor: 'rgba(44, 232, 198, 0.05)',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircleWarning: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
    },
    iconCircleSuccess: {
        backgroundColor: 'rgba(44, 232, 198, 0.15)',
    },
    itemText: {
        fontSize: 14,
        color: COLORS.white,
    },
    statusBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadgeActive: {
        backgroundColor: '#2CE8C6',
    },
    statusBadgeInactive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});

// ============================================================================
// BADGE PROGRESS COMPONENT
// ============================================================================
interface BadgeItemComponentProps {
    badge: BadgeData;
    onPress: (badge: BadgeData) => void;
}

const BadgeItem = ({ badge, onPress }: BadgeItemComponentProps) => {
    const { name, status, daysRequired, daysCompleted, badgeType, progressUnit } = badge;
    const daysLeft = daysRequired - daysCompleted;
    const progress = daysRequired > 0 ? (daysCompleted / daysRequired) * 100 : 0;
    const unitLabel = progressUnit === 'xp' ? 'XP' : 'day';
    
    const getBadgeColors = (): [string, string] => {
        switch (badgeType) {
            case 'silver':
                return ['#E8EEF2', '#A8C0D0'];
            case 'bronze':
                return ['#D4A574', '#8B6914'];
            case 'gold':
                return ['#FFD700', '#B8860B'];
            default:
                return ['#E8EEF2', '#A8C0D0'];
        }
    };
    
    const colors = getBadgeColors();
    
    return (
        <TouchableOpacity 
            style={[
                badgeStyles.item,
                status === 'unlocked' && badgeStyles.itemUnlocked,
                status === 'inProgress' && badgeStyles.itemInProgress,
            ]}
            onPress={() => onPress(badge)}
            activeOpacity={0.7}
        >
            <View style={badgeStyles.itemLeft}>
                {/* Diamond badge */}
                <View style={badgeStyles.diamondContainer}>
                    <LinearGradient
                        colors={colors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                            badgeStyles.diamond,
                            status === 'locked' && badgeStyles.diamondLocked
                        ]}
                    >
                        {status === 'unlocked' && (
                            <Ionicons name="checkmark" size={16} color="#000" />
                        )}
                        {status === 'locked' && (
                            <Ionicons name="lock-closed" size={14} color="rgba(255,255,255,0.5)" />
                        )}
                        {status === 'inProgress' && (
                            <Text style={badgeStyles.progressText}>{Math.round(progress)}%</Text>
                        )}
                    </LinearGradient>
                </View>
                <View style={badgeStyles.badgeInfo}>
                    <Text style={badgeStyles.badgeName}>{name}</Text>
                    {status === 'inProgress' && (
                        <View style={badgeStyles.progressBar}>
                            <View style={[badgeStyles.progressFill, { width: `${progress}%` }]} />
                        </View>
                    )}
                </View>
            </View>
            <View style={badgeStyles.statusContainer}>
                <Text style={[
                    badgeStyles.status,
                    status === 'unlocked' && badgeStyles.statusUnlocked,
                    status === 'inProgress' && badgeStyles.statusInProgress,
                    status === 'locked' && badgeStyles.statusLocked,
                ]}>
                    {status === 'unlocked' ? 'Unlocked' : 
                     status === 'inProgress' ? `${daysLeft} ${unitLabel}${daysLeft !== 1 ? 's' : ''} left` : 
                     'Locked'}
                </Text>
                <Ionicons 
                    name="chevron-forward" 
                    size={18} 
                    color="rgba(255, 255, 255, 0.4)" 
                />
            </View>
        </TouchableOpacity>
    );
};

const badgeStyles = StyleSheet.create({
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    itemUnlocked: {
        borderColor: 'rgba(44, 232, 198, 0.5)',
        backgroundColor: 'rgba(44, 232, 198, 0.08)',
    },
    itemInProgress: {
        borderColor: 'rgba(255, 193, 7, 0.3)',
        backgroundColor: 'rgba(255, 193, 7, 0.05)',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    diamondContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    diamond: {
        width: 36,
        height: 36,
        transform: [{ rotate: '45deg' }],
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    diamondLocked: {
        opacity: 0.4,
    },
    progressText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#000',
        transform: [{ rotate: '-45deg' }],
    },
    badgeInfo: {
        flex: 1,
        gap: 6,
    },
    badgeName: {
        fontSize: 15,
        fontWeight: '500',
        color: COLORS.white,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FFC107',
        borderRadius: 2,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    status: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    statusUnlocked: {
        color: '#2CE8C6',
    },
    statusInProgress: {
        color: '#FFC107',
    },
    statusLocked: {
        color: 'rgba(255, 255, 255, 0.4)',
    },
});

// ============================================================================
// MAIN STATS SCREEN
// ============================================================================
const StatsScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const { alert } = useThemedAlert();
    // API data
    const { data: dashboardData, isLoading: dashLoading } = useGetDashboardQuery(undefined, {
        refetchOnFocus: true,
        refetchOnReconnect: true,
        pollingInterval: 15000,
    });
    const { data: healthTrend, isLoading: healthLoading } = useGetHabitHealthTrendQuery(undefined);
    const { data: streakData } = useGetStreakDetailsQuery(undefined);
    const { data: levelData } = useGetLevelQuery(undefined);
    const { data: badgesData } = useGetBadgeGalleryQuery(undefined);
    const { data: missedDaysData } = useGetMissedDaysQuery(undefined);
    const { data: recoveryData } = useGetRecoveryStatusQuery(undefined);
    const { data: freezeData } = useGetAvailableFreezesQuery(undefined);
    const journeyId = dashboardData?.journey?.id;
    const { data: journeyCalendarData } = useGetJourneyCalendarQuery(journeyId, {
        skip: !journeyId,
        refetchOnFocus: true,
        refetchOnReconnect: true,
        pollingInterval: 15000,
    });

    const isLoading = dashLoading || healthLoading;

    // Merge API data with empty defaults
    // Derive stats data from API responses with useMemo
    const statsData = useMemo<StatsData>(() => {
        const completedDateSet = new Set(
            (journeyCalendarData?.days ?? [])
                .filter((day: any) => day?.status === 'completed' && typeof day?.date === 'string')
                .map((day: any) => day.date as string)
        );

        const calendarDays = DEFAULT_STATS_DATA.calendarDays.map((day: DayData) => ({
            ...day,
            completed: !!day.isoDate && completedDateSet.has(day.isoDate),
        }));

        return {
            ...DEFAULT_STATS_DATA,
            currentDay: dashboardData?.journey?.current_day ?? DEFAULT_STATS_DATA.currentDay,
            totalDays: dashboardData?.journey?.total_days ?? DEFAULT_STATS_DATA.totalDays,
            streak: {
                current: streakData?.current_streak ?? DEFAULT_STATS_DATA.streak.current,
                longest: streakData?.longest_streak ?? DEFAULT_STATS_DATA.streak.longest,
            },
            habitHealth: {
                // Backend returns trend as [{date, health}, ...] — extract health values
                dataPoints: Array.isArray(healthTrend?.trend)
                    ? healthTrend.trend.map((t: any) => t.health ?? t)
                    : DEFAULT_STATS_DATA.habitHealth.dataPoints,
                currentHealth: healthTrend?.current_health ?? DEFAULT_STATS_DATA.habitHealth.currentHealth,
                weeklyChange: healthTrend?.change_percent ?? DEFAULT_STATS_DATA.habitHealth.weeklyChange,
            },
            xp: {
                totalXP: levelData?.total_xp ?? DEFAULT_STATS_DATA.xp.totalXP,
                currentLevel: levelData?.level ?? DEFAULT_STATS_DATA.xp.currentLevel,
                xpForNextLevel: levelData?.xp_for_next_level ?? DEFAULT_STATS_DATA.xp.xpForNextLevel,
                currentLevelXP: levelData?.current_level_xp ?? DEFAULT_STATS_DATA.xp.currentLevelXP,
                dailyXP: DEFAULT_STATS_DATA.xp.dailyXP,
            },
            missedDays: {
                totalMissed: missedDaysData?.total_missed ?? DEFAULT_STATS_DATA.missedDays.totalMissed,
                daysSinceLastMissed: missedDaysData?.last_missed_days_ago ?? DEFAULT_STATS_DATA.missedDays.daysSinceLastMissed,
            },
            recovery: {
                penaltyApplied: recoveryData?.needs_recovery ?? DEFAULT_STATS_DATA.recovery.penaltyApplied,
                streakProtectionUsed: (recoveryData?.freeze_tokens_available != null && recoveryData.freeze_tokens_available > 0) ?? DEFAULT_STATS_DATA.recovery.streakProtectionUsed,
            },
            badges: (() => {
                if (!badgesData) return DEFAULT_STATS_DATA.badges;
                const mapBadge = (b: any): BadgeData => ({
                    id: b.id,
                    name: b.name ?? 'Badge',
                    daysRequired: b.required ?? 0,
                    daysCompleted: b.current ?? 0,
                    progressUnit: (() => {
                        const category = String(b.category ?? '').toLowerCase();
                        const name = String(b.name ?? '').toLowerCase();
                        if (category.includes('xp') || name.includes('xp')) return 'xp';
                        return 'days';
                    })(),
                    status: b.earned ? 'unlocked' : (b.progress > 0 ? 'inProgress' : 'locked'),
                    badgeType: b.tier === 'gold' ? 'gold' : b.tier === 'bronze' ? 'bronze' : 'silver',
                });
                const earned = (badgesData.earned ?? []).map(mapBadge);
                const locked = (badgesData.locked ?? []).map(mapBadge);
                return [...earned, ...locked];
            })(),
            calendarDays,
        };
    }, [dashboardData, streakData, healthTrend, levelData, missedDaysData, recoveryData, badgesData, journeyCalendarData]);
    
    // Calculate completion count
    const completedDays = useMemo(() => {
        if (journeyCalendarData?.days?.length) {
            return journeyCalendarData.days.filter((day: any) => day?.status === 'completed').length;
        }
        return statsData.calendarDays.filter(d => d.completed).length;
    }, [statsData.calendarDays, journeyCalendarData]);
    
    // Handlers
    const handleDayPress = (day: DayData) => {
        if (day.isToday) {
            alert(
                'Today\'s Progress',
                day.completed 
                    ? '✅ Great job! You\'ve completed today\'s habit!'
                    : '⏳ You haven\'t completed today\'s habit yet. Keep going!',
                [{ text: 'OK' }]
            );
        } else if (day.isFuture) {
            alert(
                `Day ${day.date}`,
                '🔒 Upcoming',
                [{ text: 'OK' }]
            );
        } else {
            alert(
                `Day ${day.date}`,
                day.completed 
                    ? '✅ Completed'
                    : '❌ Missed',
                [{ text: 'OK' }]
            );
        }
    };
    
    const handleHealthChartPress = () => {
        alert(
            'Habit Health Details',
            `Your current habit health is ${statsData.habitHealth.currentHealth}%.\n\n` +
            `This week you've improved by ${statsData.habitHealth.weeklyChange}%!\n\n` +
            'Keep up the great work to maintain a healthy habit score.',
            [{ text: 'Got it!' }]
        );
    };
    
    const handleStepsPress = () => {
        const { currentStreak, longestStreak } = statsData.steps;
        alert(
            'Steps Streak',
            `Current Streak: ${currentStreak} days\n` +
            `Longest Streak: ${longestStreak} days\n\n` +
            `${currentStreak >= longestStreak 
                ? '🔥 You\'re on your longest streak!' 
                : `${longestStreak - currentStreak} more days to beat your record!`}`,
            [{ text: 'Keep Going!' }]
        );
    };
    
    const handleXPPress = () => {
        const { totalXP, currentLevel, xpForNextLevel, currentLevelXP } = statsData.xp;
        const xpNeeded = xpForNextLevel - currentLevelXP;
        alert(
            'XP Progress',
            `Level ${currentLevel} • ${totalXP.toLocaleString()} Total XP\n\n` +
            `Progress to Level ${currentLevel + 1}:\n` +
            `${currentLevelXP}/${xpForNextLevel} XP (${Math.round((currentLevelXP / xpForNextLevel) * 100)}%)\n\n` +
            `${xpNeeded} XP needed for next level!`,
            [{ text: 'Awesome!' }]
        );
    };
    
    const handleMissedDaysPress = () => {
        alert(
            'Missed Days Summary',
            `Total missed: ${statsData.missedDays.totalMissed} days\n` +
            `Last missed: ${statsData.missedDays.daysSinceLastMissed} days ago\n\n` +
            'Don\'t worry! Consistency is key - just keep showing up! 💪',
            [{ text: 'I\'ll do better!' }]
        );
    };
    
    const handleRecoveryPress = () => {
        alert(
            'Recovery Status',
            `Penalty Applied: ${statsData.recovery.penaltyApplied ? 'Yes' : 'No'}\n` +
            `Streak Protection Used: ${statsData.recovery.streakProtectionUsed ? 'Yes' : 'No'}\n\n` +
            'Streak protection helps you maintain your streak when you miss a day. ' +
            'You earn protection shields as you progress!',
            [{ text: 'Understood' }]
        );
    };
    
    const handleBadgePress = (badge: BadgeData) => {
        const progressPercent = Math.round((badge.daysCompleted / badge.daysRequired) * 100);
        const unitLabel = badge.progressUnit === 'xp' ? 'XP' : 'days';
        alert(
            badge.name,
            badge.status === 'unlocked'
                ? `🎉 Congratulations! You've unlocked this badge!\n\nCompleted: ${badge.daysCompleted}/${badge.daysRequired} ${unitLabel}`
                : badge.status === 'inProgress'
                    ? `📈 Progress: ${progressPercent}%\n\n${badge.daysCompleted}/${badge.daysRequired} ${unitLabel} completed\n\n${badge.daysRequired - badge.daysCompleted} more ${unitLabel} to unlock!`
                    : `🔒 This badge is locked.\n\nComplete ${badge.daysRequired} ${unitLabel} to unlock!`,
            [{ text: 'OK' }]
        );
    };
    
    const handleViewAllBadges = () => {
        // Navigate to the Achievements tab which has the full badge gallery
        navigation.navigate('Achievements');
    };
    
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />
            
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ color: COLORS.textSecondary, marginTop: 12, fontSize: 14 }}>Loading your stats...</Text>
                </View>
            ) : (
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerSubtitle}>Your Progress</Text>
                        <Text style={styles.headerTitle}>
                            Day {statsData.currentDay} of {statsData.totalDays}
                        </Text>
                    </View>
                    <TouchableOpacity 
                        onPress={() => alert('Hey there!', 'Keep up the great work! 🌟')}
                        activeOpacity={0.8}
                    >
                        <Mascot size={48} />
                    </TouchableOpacity>
                </View>
                
                {/* Completion Calendar Card */}
                <LinearGradient
                    colors={['rgba(44, 232, 198, 0.15)', 'rgba(12, 12, 12, 0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.calendarCard}
                >
                    <View style={styles.calendarHeader}>
                        <View>
                            <Text style={styles.calendarTitle}>Completion Calendar</Text>
                            <Text style={styles.calendarSubtitle}>
                                {completedDays} / {statsData.totalDays} Days Completed
                            </Text>
                        </View>
                        <View style={styles.calendarIconContainer}>
                            <Ionicons name="calendar" size={22} color="#2CE8C6" />
                        </View>
                    </View>
                    
                    {/* Week days */}
                    <View style={styles.weekDaysRow}>
                        {statsData.calendarDays.map((day) => (
                            <Text 
                                key={day.dayName} 
                                style={[
                                    styles.weekDay,
                                    day.completed && styles.weekDayCompleted,
                                ]}
                            >
                                {day.dayName}
                            </Text>
                        ))}
                    </View>
                    
                    {/* Calendar days */}
                    <View style={styles.calendarDaysRow}>
                        {statsData.calendarDays.map((day) => (
                            <CalendarDay 
                                key={day.date} 
                                day={day.date}
                                isCompleted={day.completed}
                                isToday={day.isToday}
                                isFuture={day.isFuture || false}
                                onPress={() => handleDayPress(day)}
                            />
                        ))}
                    </View>
                </LinearGradient>
                
                {/* Streak Stats Card */}
                <TouchableOpacity
                    style={styles.streakCard}
                    onPress={() => navigation.navigate('StreakDetails')}
                    activeOpacity={0.8}
                >
                    <View style={styles.streakRow}>
                        <StreakCard 
                            icon="flame" 
                            label="Current Streak" 
                            value={`${statsData.streak.current} Days`} 
                        />
                        <View style={styles.verticalDivider} />
                        <StreakCard 
                            icon="trophy" 
                            label="Longest Streak" 
                            value={`${statsData.streak.longest} Days`} 
                        />
                    </View>
                </TouchableOpacity>
                
                {/* Habit Health Chart */}
                <HabitHealthChart 
                    data={statsData.habitHealth}
                    onPress={handleHealthChartPress}
                />
                
                {/* Impact of Free Days */}
                <TouchableOpacity
                    style={styles.impactCard}
                    onPress={() => navigation.navigate('StreakFreeze')}
                    activeOpacity={0.8}
                >
                    <View style={styles.impactHeader}>
                        <Ionicons name="calendar-outline" size={22} color={COLORS.primary} />
                        <Text style={styles.impactTitle}>Impact of Free Days</Text>
                    </View>
                    <Text style={styles.impactDescription}>
                        Free days let you rest without losing your streak. Using them wisely helps maintain habit momentum.
                    </Text>
                    <View style={styles.impactStatsRow}>
                        <View style={styles.impactStatItem}>
                            <Text style={styles.impactStatValue}>{statsData.recovery?.streakProtectionUsed ? 1 : 0}</Text>
                            <Text style={styles.impactStatLabel}>Used</Text>
                        </View>
                        <View style={styles.impactDivider} />
                        <View style={styles.impactStatItem}>
                            <Text style={styles.impactStatValue}>{freezeData?.available_freezes ?? 0}</Text>
                            <Text style={styles.impactStatLabel}>Available</Text>
                        </View>
                        <View style={styles.impactDivider} />
                        <View style={styles.impactStatItem}>
                            <Text style={[styles.impactStatValue, { color: COLORS.primary }]}>
                                {statsData.recovery?.penaltyApplied ? 'Yes' : 'None'}
                            </Text>
                            <Text style={styles.impactStatLabel}>Penalty</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* XP Progress */}
                <XPProgressChart 
                    data={statsData.xp}
                    onPress={handleXPPress}
                />
                
                {/* Missed Days Summary */}
                <Text style={styles.sectionTitle}>Missed Days Summary</Text>
                <MissedDaysCard 
                    data={statsData.missedDays}
                    onPress={handleMissedDaysPress}
                />
                
                {/* Recovery Status */}
                <RecoveryStatusCard 
                    data={statsData.recovery}
                    onPress={handleRecoveryPress}
                />
                
                {/* Badge Progress */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Badge Progress</Text>
                    <Text style={styles.badgeCount}>
                        {statsData.badges.filter(b => b.status === 'unlocked').length}/{statsData.badges.length}
                    </Text>
                </View>
                <View style={styles.badgeList}>
                    {statsData.badges.map((badge) => (
                        <BadgeItem 
                            key={badge.id} 
                            badge={badge}
                            onPress={handleBadgePress}
                        />
                    ))}
                </View>
                
                {/* View All Badges Button */}
                <TouchableOpacity 
                    style={styles.viewAllButton}
                    onPress={handleViewAllBadges}
                    activeOpacity={0.7}
                >
                    <Text style={styles.viewAllText}>View All Badges</Text>
                    <Ionicons name="arrow-forward" size={20} color="#2CE8C6" />
                </TouchableOpacity>
                
                {/* Bottom spacer for tab bar */}
                <View style={{ height: 30 }} />
            </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: SPACING.md,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2CE8C6',
        marginBottom: 6,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.white,
    },
    calendarCard: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.25)',
        padding: 16,
        gap: 14,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    calendarTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
        marginBottom: 6,
    },
    calendarSubtitle: {
        fontSize: 14,
        color: '#2CE8C6',
        fontWeight: '500',
    },
    calendarIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(44, 232, 198, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    weekDay: {
        fontSize: 13,
        fontWeight: '500',
        color: 'rgba(255, 255, 255, 0.5)',
        width: 40,
        textAlign: 'center',
    },
    weekDayCompleted: {
        color: '#2CE8C6',
        fontWeight: '600',
    },
    calendarDaysRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    streakCard: {
        backgroundColor: '#0C0C0C',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.2)',
        padding: 20,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    verticalDivider: {
        width: 1,
        height: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.white,
        marginTop: 8,
    },
    badgeCount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2CE8C6',
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeList: {
        gap: 12,
    },
    viewAllButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1.5,
        borderColor: '#2CE8C6',
        borderRadius: 14,
        height: 54,
    },
    viewAllText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#2CE8C6',
    },
    impactCard: {
        backgroundColor: '#0C0C0C',
        borderRadius: 16,
        padding: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 16,
    },
    impactHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    impactTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: 'white',
    },
    impactDescription: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        lineHeight: 19,
    },
    impactStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        paddingVertical: 14,
    },
    impactStatItem: {
        alignItems: 'center',
        gap: 4,
    },
    impactStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    impactStatLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
    impactDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
});

export default StatsScreen;
