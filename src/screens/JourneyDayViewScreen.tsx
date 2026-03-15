import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING } from '../constants/theme';
import { useThemedAlert } from '../components/common/ThemedAlert';
import {
    useGetActiveJourneyQuery,
    useGetJourneyDaysQuery,
    useGetJourneyDayQuery,
    useGetJourneyCalendarQuery,
    useGetJourneyTodayQuery,
    usePauseJourneyMutation,
    useResumeJourneyMutation,
} from '../services/api/journeysApi';
import {
    useCompleteTaskMutation,
    useUncompleteTaskMutation,
    useCreateReflectionMutation,
    useReportSlipMutation,
} from '../services/api/progressApi';

// ============================================================================
// DAY CIRCLE (Calendar row)
// ============================================================================
const DayCircle = ({ day, isActive, isCompleted, isCurrent, onPress }: {
    day: number; isActive: boolean; isCompleted: boolean; isCurrent: boolean;
    onPress: () => void;
}) => (
    <TouchableOpacity
        onPress={onPress}
        style={[
            styles.dayCircle,
            isCompleted && styles.dayCircleCompleted,
            isCurrent && styles.dayCircleCurrent,
            !isActive && !isCompleted && styles.dayCircleLocked,
        ]}
    >
        <Text style={[
            styles.dayCircleText,
            isCurrent && styles.dayCircleTextCurrent,
            isCompleted && styles.dayCircleTextCompleted,
        ]}>
            {day}
        </Text>
    </TouchableOpacity>
);

// ============================================================================
// TASK ITEM
// ============================================================================
const TaskItem = ({ task, onToggle }: { task: any; onToggle: () => void }) => (
    <TouchableOpacity style={styles.taskItem} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxChecked]}>
            {task.completed && <Ionicons name="checkmark" size={16} color="black" />}
        </View>
        <View style={styles.taskContent}>
            <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                {task.title || task.name}
            </Text>
            {task.description && (
                <Text style={styles.taskDescription} numberOfLines={2}>{task.description}</Text>
            )}
        </View>
        {task.xp_reward && (
            <View style={styles.taskXP}>
                <Text style={styles.taskXPText}>+{task.xp_reward} XP</Text>
            </View>
        )}
    </TouchableOpacity>
);

// ============================================================================
// REFLECTION MODAL
// ============================================================================
const ReflectionModal = ({ visible, onClose, onSave, isLoading, dayId }: {
    visible: boolean; onClose: () => void;
    onSave: (data: { journeyDayId: string; mood: string; text: string }) => void;
    isLoading: boolean; dayId: string;
}) => {
    const [mood, setMood] = useState('');
    const [text, setText] = useState('');
    const moods = ['😊', '😐', '😔', '😤', '🤩', '😴'];

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Daily Reflection</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        <Text style={styles.inputLabel}>How are you feeling?</Text>
                        <View style={styles.moodRow}>
                            {moods.map(m => (
                                <TouchableOpacity
                                    key={m}
                                    style={[styles.moodBtn, mood === m && styles.moodBtnSelected]}
                                    onPress={() => setMood(m)}
                                >
                                    <Text style={styles.moodEmoji}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>Reflection</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={text}
                            onChangeText={setText}
                            placeholder="How did today go? What did you learn?"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.saveButton, (!text.trim() || isLoading) && styles.saveButtonDisabled]}
                        disabled={!text.trim() || isLoading}
                        onPress={() => onSave({ journeyDayId: dayId, mood, text: text.trim() })}
                    >
                        {isLoading ? <ActivityIndicator color="black" /> : (
                            <Text style={styles.saveButtonText}>Save Reflection</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ============================================================================
// SLIP REPORT MODAL
// ============================================================================
const SlipModal = ({ visible, onClose, onReport, isLoading }: {
    visible: boolean; onClose: () => void;
    onReport: (data: { reason: string; trigger: string; severity: string }) => void;
    isLoading: boolean;
}) => {
    const [reason, setReason] = useState('');
    const [trigger, setTrigger] = useState('');
    const [severity, setSeverity] = useState<'minor' | 'moderate' | 'major'>('minor');

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Report a Slip</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        <Text style={styles.slipNote}>
                            It's okay — slips happen. Tracking them helps you find patterns and recover faster. 💙
                        </Text>

                        <Text style={styles.inputLabel}>What triggered the slip?</Text>
                        <TextInput
                            style={styles.textInput}
                            value={trigger}
                            onChangeText={setTrigger}
                            placeholder="e.g., Stress, social pressure..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        <Text style={styles.inputLabel}>What happened?</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={reason}
                            onChangeText={setReason}
                            placeholder="Describe what happened..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                        />

                        <Text style={styles.inputLabel}>Severity</Text>
                        <View style={styles.severityRow}>
                            {(['minor', 'moderate', 'major'] as const).map(s => (
                                <TouchableOpacity
                                    key={s}
                                    style={[styles.severityBtn, severity === s && styles.severityBtnSelected]}
                                    onPress={() => setSeverity(s)}
                                >
                                    <Text style={[styles.severityText, severity === s && styles.severityTextSelected]}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                        disabled={isLoading}
                        onPress={() => onReport({ reason, trigger, severity })}
                    >
                        {isLoading ? <ActivityIndicator color="black" /> : (
                            <Text style={styles.saveButtonText}>Submit Report</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// ============================================================================
// MAIN SCREEN
// ============================================================================
const JourneyDayViewScreen = () => {
    const { alert } = useThemedAlert();
    const navigation = useNavigation();
    const route = useRoute<any>();

    const { data: activeJourney, isLoading: journeyLoading } = useGetActiveJourneyQuery(undefined);
    const journeyId = route.params?.journeyId || activeJourney?.journey?.id || activeJourney?.id;

    const { data: calendarData } = useGetJourneyCalendarQuery(journeyId, { skip: !journeyId });
    const { data: daysData } = useGetJourneyDaysQuery(journeyId, { skip: !journeyId });
    const { data: todayData, refetch: refetchToday, isLoading: todayLoading, isError: todayError, error: todayErrDetail } = useGetJourneyTodayQuery(journeyId, { skip: !journeyId });

    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const { data: dayDetail, isFetching: dayDetailLoading } = useGetJourneyDayQuery(
        { id: journeyId, dayNumber: selectedDay ?? 0 },
        { skip: !journeyId || selectedDay === null }
    );

    const [completeTask] = useCompleteTaskMutation();
    const [uncompleteTask] = useUncompleteTaskMutation();
    const [createReflection, { isLoading: reflectionLoading }] = useCreateReflectionMutation();
    const [reportSlip, { isLoading: slipLoading }] = useReportSlipMutation();
    const [pauseJourney] = usePauseJourneyMutation();
    const [resumeJourney] = useResumeJourneyMutation();

    const [showReflection, setShowReflection] = useState(false);
    const [showSlip, setShowSlip] = useState(false);

    const journey = activeJourney?.journey || activeJourney;
    const currentDay = todayData?.day_number ?? journey?.current_day ?? 1;
    const totalDays = todayData?.total_days ?? journey?.planned_days ?? journey?.total_days ?? 21;
    const tasks = (selectedDay !== null ? dayDetail?.tasks : todayData?.tasks) ?? [];
    const viewingDay = selectedDay ?? currentDay;
    const dayId = dayDetail?.id ?? todayData?.day_id ?? '';
    const dayTheme = (selectedDay !== null ? dayDetail?.theme : todayData?.theme) as string | null ?? null;
    const dayPrompts = (selectedDay !== null ? dayDetail?.prompts : todayData?.prompts) as string[] | null ?? null;

    const completedCount = tasks.filter((t: any) => t.completed).length;
    const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    // Calendar days array
    const calendarDays = useMemo(() => {
        const days = calendarData?.days ?? [];
        if (days.length > 0) {
            // API returns status string, normalize to boolean for DayCircle
            return days.map((d: any) => ({
                ...d,
                completed: d.completed ?? d.status === 'completed',
                is_current: d.status === 'today',
            }));
        }
        return Array.from({ length: totalDays }, (_, i) => ({
            day_number: i + 1,
            completed: i + 1 < currentDay,
            is_current: i + 1 === currentDay,
        }));
    }, [calendarData, totalDays, currentDay]);

    const handleToggleTask = async (task: any) => {
        try {
            if (task.completed) {
                await uncompleteTask(task.id).unwrap();
            } else {
                await completeTask(task.id).unwrap();
            }
            refetchToday();
        } catch {
            alert('Error', 'Failed to update task.');
        }
    };

    const handleReflection = async (data: { journeyDayId: string; mood: string; text: string }) => {
        try {
            await createReflection({
                journey_day_id: data.journeyDayId,
                content: data.text,
                answers: data.mood ? { mood: data.mood } : undefined,
            }).unwrap();
            setShowReflection(false);
            alert('Saved! 📝', 'Your reflection has been recorded.');
        } catch {
            alert('Error', 'Failed to save reflection.');
        }
    };

    const handleSlip = async (data: { reason: string; trigger: string; severity: string }) => {
        try {
            await reportSlip({
                happened_at: new Date().toISOString(),
                context: { reason: data.reason, trigger: data.trigger, severity: data.severity },
            }).unwrap();
            setShowSlip(false);
            alert('Recorded 💙', 'Thank you for being honest. Every setback is a setup for a comeback.');
        } catch {
            alert('Error', 'Failed to report slip.');
        }
    };

    if (journeyLoading || todayLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Journey</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!journeyId) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centered}>
                    <Ionicons name="map-outline" size={64} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No Active Journey</Text>
                    <Text style={styles.emptySubtitle}>Start a journey to see your daily tasks</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.primaryBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (todayError) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Journey</Text>
                    <View style={{ width: 28 }} />
                </View>
                <View style={styles.centered}>
                    <Ionicons name="alert-circle-outline" size={64} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>Could Not Load Today</Text>
                    <Text style={styles.emptySubtitle}>There was a problem loading your daily tasks</Text>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => refetchToday()}>
                        <Text style={styles.primaryBtnText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: 'transparent', marginTop: 8 }]} onPress={() => navigation.goBack()}>
                        <Text style={[styles.primaryBtnText, { color: COLORS.primary }]}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Journey — Day {viewingDay}</Text>
                <TouchableOpacity
                    onPress={() => alert('Actions', '', [
                        { text: journey?.status === 'paused' ? 'Resume Journey' : 'Pause Journey',
                          onPress: async () => {
                              try {
                                  if (journey?.status === 'paused') await resumeJourney(journeyId).unwrap();
                                  else await pauseJourney(journeyId).unwrap();
                              } catch { alert('Error', 'Action failed.'); }
                          }
                        },
                        { text: 'Cancel', style: 'cancel' },
                    ])}
                >
                    <Ionicons name="ellipsis-horizontal" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Progress Header */}
                <LinearGradient
                    colors={['rgba(44,232,198,0.15)', 'rgba(12,12,12,0)']}
                    style={styles.progressCard}
                >
                    <View style={styles.progressHeader}>
                        <View>
                            <Text style={styles.progressLabel}>Day {viewingDay} of {totalDays}</Text>
                            <Text style={styles.progressTitle}>{journey?.name || todayData?.habit_goal || 'Your Journey'}</Text>
                        </View>
                        <View style={styles.progressCircle}>
                            <Text style={styles.progressPercent}>{progress}%</Text>
                        </View>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressSubtext}>
                        {completedCount}/{tasks.length} tasks completed
                    </Text>
                </LinearGradient>

                {/* Day Calendar */}
                <Text style={styles.sectionTitle}>Journey Calendar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll}>
                    <View style={styles.calendarRow}>
                        {calendarDays.map((d: any) => (
                            <DayCircle
                                key={d.day_number}
                                day={d.day_number}
                                isActive={d.day_number <= currentDay}
                                isCompleted={d.completed}
                                isCurrent={d.day_number === currentDay}
                                onPress={() => d.day_number <= currentDay && setSelectedDay(d.day_number)}
                            />
                        ))}
                    </View>
                </ScrollView>

                {/* Day Phase & Advice */}
                {(dayTheme || (dayPrompts && dayPrompts.length > 0)) && (
                    <View style={styles.dayAdviceCard}>
                        {dayTheme && (
                            <View style={styles.phaseRow}>
                                <View style={styles.phaseBadge}>
                                    <Ionicons
                                        name={dayTheme.includes('Awareness') ? 'eye-outline' : dayTheme.includes('Pattern') ? 'shuffle-outline' : 'diamond-outline'}
                                        size={14}
                                        color={COLORS.primary}
                                    />
                                    <Text style={styles.phaseBadgeText}>{dayTheme}</Text>
                                </View>
                            </View>
                        )}
                        {dayPrompts && dayPrompts.length > 0 && dayPrompts.map((prompt: string, idx: number) => (
                            <Text key={idx} style={styles.dayAdviceText}>{prompt}</Text>
                        ))}
                    </View>
                )}

                {/* Tasks */}
                <Text style={styles.sectionTitle}>
                    {viewingDay === currentDay ? "Today's Tasks" : `Day ${viewingDay} Tasks`}
                </Text>
                {(selectedDay !== null && dayDetailLoading) ? (
                    <View style={styles.noTasks}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                ) : tasks.length === 0 ? (
                    <View style={styles.noTasks}>
                        <Text style={styles.noTasksText}>No tasks for this day</Text>
                    </View>
                ) : (
                    tasks.map((task: any) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={() => handleToggleTask(task)}
                        />
                    ))
                )}

                {/* Inline Focus Timer Widget */}
                <TouchableOpacity
                    style={styles.timerWidget}
                    onPress={() => (navigation as any).navigate('FocusTimer')}
                    activeOpacity={0.7}
                >
                    <View style={styles.timerLeft}>
                        <View style={styles.timerIconWrap}>
                            <Ionicons name="timer-outline" size={24} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.timerLabel}>Focus Timer</Text>
                            <Text style={styles.timerSubtext}>Stay focused on your tasks</Text>
                        </View>
                    </View>
                    <View style={styles.timerTimeBox}>
                        <Text style={styles.timerTime}>Start</Text>
                        <Ionicons name="play" size={16} color={COLORS.primary} />
                    </View>
                </TouchableOpacity>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setShowReflection(true)}>
                        <Ionicons name="journal-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.actionButtonText}>Write Reflection</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => setShowSlip(true)}
                    >
                        <Ionicons name="alert-circle-outline" size={20} color="#FF6B6B" />
                        <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>Report Slip</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Modals */}
            <ReflectionModal
                visible={showReflection}
                onClose={() => setShowReflection(false)}
                onSave={handleReflection}
                isLoading={reflectionLoading}
                dayId={dayId}
            />
            <SlipModal
                visible={showSlip}
                onClose={() => setShowSlip(false)}
                onReport={handleSlip}
                isLoading={slipLoading}
            />
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    },
    backBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '500', color: COLORS.white },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    progressCard: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(44,232,198,0.2)', padding: 20, gap: 12 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressLabel: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
    progressTitle: { fontSize: 20, fontWeight: '700', color: 'white', marginTop: 4 },
    progressCircle: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(44,232,198,0.15)',
        justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary,
    },
    progressPercent: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
    progressBarBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.1)' },
    progressBarFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.primary },
    progressSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: 'white', marginTop: 24, marginBottom: 12 },
    calendarScroll: { marginBottom: 8 },
    calendarRow: { flexDirection: 'row', gap: 8 },
    dayAdviceCard: {
        backgroundColor: 'rgba(44,232,198,0.06)', borderRadius: 12, padding: 16, marginTop: 16,
        borderWidth: 1, borderColor: 'rgba(44,232,198,0.12)', gap: 10,
    },
    phaseRow: { flexDirection: 'row' },
    phaseBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(44,232,198,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    },
    phaseBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
    dayAdviceText: { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 21 },
    dayCircle: {
        width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    dayCircleCompleted: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dayCircleCurrent: { borderColor: COLORS.primary, borderWidth: 2 },
    dayCircleLocked: { opacity: 0.3 },
    dayCircleText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
    dayCircleTextCompleted: { color: 'black' },
    dayCircleTextCurrent: { color: COLORS.primary },
    taskItem: {
        flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
        backgroundColor: '#0C0C0C', borderRadius: 12, marginBottom: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    taskCheckbox: {
        width: 28, height: 28, borderRadius: 8, borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
    },
    taskCheckboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    taskContent: { flex: 1, gap: 4 },
    taskTitle: { fontSize: 15, fontWeight: '500', color: 'white' },
    taskTitleCompleted: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.4)' },
    taskDescription: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
    taskXP: { backgroundColor: 'rgba(44,232,198,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    taskXPText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    actionButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 12, backgroundColor: 'rgba(44,232,198,0.1)',
        borderWidth: 1, borderColor: 'rgba(44,232,198,0.2)',
    },
    actionButtonDanger: { backgroundColor: 'rgba(255,107,107,0.1)', borderColor: 'rgba(255,107,107,0.2)' },
    actionButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: 'white', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
    primaryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 20 },
    primaryBtnText: { color: 'black', fontSize: 16, fontWeight: '600' },
    noTasks: { padding: 24, alignItems: 'center' },
    noTasksText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
    timerWidget: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(44,232,198,0.06)', borderRadius: 16, padding: 16,
        marginTop: 20, borderWidth: 1, borderColor: 'rgba(44,232,198,0.15)',
    },
    timerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    timerIconWrap: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(44,232,198,0.12)',
        justifyContent: 'center', alignItems: 'center',
    },
    timerLabel: { fontSize: 15, fontWeight: '600', color: 'white' },
    timerSubtext: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    timerTimeBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timerTime: { fontSize: 22, fontWeight: '700', color: COLORS.primary, fontVariant: ['tabular-nums'] },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#0C0C0C', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    modalTitle: { fontSize: 22, fontWeight: '700', color: 'white' },
    modalBody: { padding: 20, gap: 16 },
    inputLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
    textInput: {
        backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16,
        fontSize: 16, color: 'white', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    textArea: { height: 100, textAlignVertical: 'top' },
    moodRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
    moodBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    moodBtnSelected: { backgroundColor: 'rgba(44,232,198,0.2)', borderWidth: 2, borderColor: COLORS.primary },
    moodEmoji: { fontSize: 24 },
    slipNote: { fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 22 },
    severityRow: { flexDirection: 'row', gap: 8 },
    severityBtn: {
        flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    severityBtnSelected: { backgroundColor: 'rgba(44,232,198,0.15)', borderColor: COLORS.primary },
    severityText: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
    severityTextSelected: { color: COLORS.primary, fontWeight: '600' },
    saveButton: { backgroundColor: COLORS.primary, marginHorizontal: 20, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: 'black' },
});

export default JourneyDayViewScreen;
