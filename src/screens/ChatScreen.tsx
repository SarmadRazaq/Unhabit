import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    Share,
    Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Crypto from 'expo-crypto';
import {
    GiftedChat,
    Bubble,
    Avatar,
    Message,
    IMessage,
} from 'react-native-gifted-chat';
import { COLORS, SPACING } from '../constants/theme';
import Mascot from '../components/common/Mascot';
import { useAppSelector } from '../store/hooks';
import { useAiCoachMessageMutation, useGetAiHealthQuery } from '../services/api/aiApi';
import {
    useCreateCoachSessionMutation,
    useSendCoachMessageMutation,
    useGetCoachSessionsQuery,
    useGetCoachSessionQuery,
    useEndCoachSessionMutation,
} from '../services/api/coachApi';
import { useAcceptChallengeMutation, useGetDailyChallengeQuery } from '../services/api/challengesApi';
import { useThemedAlert } from '../components/common/ThemedAlert';
import { formatDateTime } from '../utils/date';

// AI Coach user
const AI_COACH = {
    _id: 2,
    name: 'Coach Nudge',
    avatar: 'ai_coach',
};

// Default current user (overridden by Redux auth state at runtime)
const DEFAULT_CURRENT_USER = {
    _id: 1,
    name: 'You',
    avatar: undefined as string | undefined,
};

// Quick help options
const QUICK_HELP_OPTIONS = [
    { id: '1', text: "I'm struggling today 😔" },
    { id: '2', text: 'Motivate me 💪' },
    { id: '3', text: 'Help me finish today 🏁' },
    { id: '4', text: 'I missed a day 😟' },
];

// Fallback response when AI service is unavailable
const FALLBACK_RESPONSE = "I'm having trouble connecting right now. Please try again in a moment. 🔄";

// Welcome message shown when starting a new session
const WELCOME_MESSAGE: IMessage = {
    _id: 'welcome',
    text: "Hi! I'm Coach Nudge. I'm here to help you stay on track with your habits. How are you feeling today? 💙",
    createdAt: new Date(),
    user: AI_COACH,
};

// Header Component
const ChatHeader = ({ onBack, onMenu, aiStatus }: { onBack: () => void; onMenu: () => void; aiStatus?: string }) => (
    <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
            <View style={styles.aiAvatarContainer}>
                <Mascot size={48} />
            </View>
            <View style={styles.aiInfo}>
                <Text style={styles.aiName}>Coach Nudge</Text>
                <Text style={styles.aiStatus}>{aiStatus ?? 'Offline'}</Text>
            </View>
        </View>
        <TouchableOpacity onPress={onMenu} style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={24} color={COLORS.white} />
        </TouchableOpacity>
    </View>
);

// Quick Help Section
const QuickHelpSection = ({ onSelect }: { onSelect: (text: string) => void }) => (
    <View style={styles.quickHelpSection}>
        <Text style={styles.quickHelpTitle}>Quick Help</Text>
        <View style={styles.quickHelpOptions}>
            <View style={styles.quickHelpRow}>
                {QUICK_HELP_OPTIONS.slice(0, 2).map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={styles.quickHelpChip}
                        onPress={() => onSelect(option.text)}
                    >
                        <Text style={styles.quickHelpChipText}>{option.text}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={styles.quickHelpRow}>
                {QUICK_HELP_OPTIONS.slice(2, 4).map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={styles.quickHelpChip}
                        onPress={() => onSelect(option.text)}
                    >
                        <Text style={styles.quickHelpChipText}>{option.text}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    </View>
);

// Service Section
const ServiceSection = ({ onPress }: { onPress: (service: string) => void }) => (
    <View style={styles.serviceSection}>
        <Text style={styles.serviceSectionTitle}>Service</Text>
        <View style={styles.serviceOptions}>
            {[
                { id: 'habit_tips', label: 'Habit Tips', icon: 'bulb-outline' },
                { id: 'progress_review', label: 'Progress Review', icon: 'analytics-outline' },
                { id: 'accountability', label: 'Accountability', icon: 'people-outline' },
            ].map(service => (
                <TouchableOpacity
                    key={service.id}
                    style={styles.serviceChip}
                    onPress={() => onPress(service.label)}
                >
                    <Ionicons name={service.icon as any} size={18} color={COLORS.primary} />
                    <Text style={styles.serviceChipText}>{service.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    </View>
);

// Mood Tracker
const MoodTracker = ({ onSelect }: { onSelect: (mood: string) => void }) => {
    const moods = [
        { emoji: '😊', label: 'Great' },
        { emoji: '🙂', label: 'Good' },
        { emoji: '😐', label: 'Okay' },
        { emoji: '😔', label: 'Low' },
        { emoji: '😢', label: 'Bad' },
    ];
    return (
        <View style={styles.moodTracker}>
            <Text style={styles.moodTrackerTitle}>How are you feeling?</Text>
            <View style={styles.moodRow}>
                {moods.map(m => (
                    <TouchableOpacity
                        key={m.label}
                        style={styles.moodItem}
                        onPress={() => onSelect(m.label)}
                    >
                        <Text style={styles.moodEmoji}>{m.emoji}</Text>
                        <Text style={styles.moodLabel}>{m.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// Today's Challenge Card
interface ChallengeData {
    id: string;
    title: string;
    description: string;
    reward_xp: number;
}
const TodaysChallengeCard = ({ challenge, onAccept }: { challenge: ChallengeData; onAccept: () => void }) => (
    <LinearGradient
        colors={['rgba(44, 232, 198, 0.15)', 'rgba(12, 12, 12, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.challengeCard}
    >
        <View style={styles.challengeContent}>
            <Text style={styles.challengeTitle}>{challenge.title} ⚡</Text>
            <Text style={styles.challengeDescription}>
                {challenge.description} — Reward: +{challenge.reward_xp} XP
            </Text>
        </View>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>Accept Challenge</Text>
        </TouchableOpacity>
    </LinearGradient>
);

// Custom Avatar Rendering
const renderAvatar = (props: any) => {
    const { currentMessage } = props;
    
    if (currentMessage?.user?._id === AI_COACH._id) {
        return (
            <View style={styles.aiAvatarSmall}>
                <Mascot size={40} />
            </View>
        );
    }
    
    return (
        <Avatar
            {...props}
            imageStyle={{
                left: { width: 40, height: 40, borderRadius: 20 },
                right: { width: 40, height: 40, borderRadius: 20 },
            }}
        />
    );
};

// Custom Bubble
const renderBubble = (props: any) => {
    return (
        <Bubble
            {...props}
            wrapperStyle={{
                left: {
                    backgroundColor: 'rgba(44, 232, 198, 0.1)',
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 10,
                    borderBottomRightRadius: 10,
                    borderBottomLeftRadius: 10,
                    marginBottom: 4,
                },
                right: {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    borderBottomRightRadius: 0,
                    borderBottomLeftRadius: 10,
                    marginBottom: 4,
                },
            }}
            textStyle={{
                left: {
                    color: COLORS.white,
                    fontSize: 14,
                    lineHeight: 20,
                },
                right: {
                    color: COLORS.white,
                    fontSize: 14,
                    lineHeight: 20,
                },
            }}
            timeTextStyle={{
                left: { color: '#8A8A8A', fontSize: 11 },
                right: { color: '#8A8A8A', fontSize: 11 },
            }}
        />
    );
};

// Custom Input Toolbar – replaces GiftedChat's default toolbar
// to give full control over layout and fix iOS keyboard / text-entry issues.
const CustomInputToolbar = ({ onSend, bottomPadding = 0 }: { onSend: (messages: IMessage[]) => void; bottomPadding?: number }) => {
    const [text, setText] = React.useState('');

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const msg: IMessage = {
            _id: Date.now().toString(),
            text: trimmed,
            createdAt: new Date(),
            user: { _id: 1 }, // will be overridden by GiftedChat
        };
        onSend([msg]);
        setText('');
    };

    return (
        <View style={[styles.inputToolbar, { paddingBottom: 8 + bottomPadding }]}>
            <View style={styles.composerContainer}>
                <TextInput
                    style={styles.textInput}
                    placeholder="Type message"
                    placeholderTextColor="#585858"
                    value={text}
                    onChangeText={setText}
                    multiline={false}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    blurOnSubmit={false}
                    selectionColor={COLORS.primary}
                    autoCorrect
                    autoCapitalize="sentences"
                />
            </View>
            <TouchableOpacity onPress={handleSend} activeOpacity={0.7}>
                <LinearGradient
                    colors={[COLORS.primary, '#1E90FF']}
                    style={styles.sendButtonGradient}
                >
                    <Ionicons name="send" size={20} color="#000" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

// Chat Header List Component (for showing challenge at top)
const renderChatHeader = (challenge: ChallengeData | null, onAcceptChallenge: () => void) => {
    if (!challenge) return null;
    return (
        <View style={styles.chatHeader}>
            <TodaysChallengeCard challenge={challenge} onAccept={onAcceptChallenge} />
        </View>
    );
};

// Chat Footer (Quick Help, Service & Motivation - only shown before user starts chatting)
const renderChatFooter = (
    onQuickHelp: (text: string) => void,
    showExtras: boolean,
    onMoodSelect: (mood: string) => void,
) => {
    if (!showExtras) return null;
    return (
        <View style={styles.chatFooter}>
            <QuickHelpSection onSelect={onQuickHelp} />
            <ServiceSection onPress={onQuickHelp} />
            <MoodTracker onSelect={onMoodSelect} />
        </View>
    );
};

const ChatScreen = () => {
    const navigation = useNavigation();
    const { alert } = useThemedAlert();
    const insets = useSafeAreaInsets();
    const authUser = useAppSelector((state) => state.auth.user);
    const CURRENT_USER = useMemo(() => ({
        _id: authUser?.id || DEFAULT_CURRENT_USER._id,
        name: authUser?.name || DEFAULT_CURRENT_USER.name,
        avatar: authUser?.avatar_url || DEFAULT_CURRENT_USER.avatar,
    }), [authUser]);
    const [messages, setMessages] = useState<IMessage[]>([{ ...WELCOME_MESSAGE, createdAt: new Date() }]);
    const [isTyping, setIsTyping] = useState(false);
    const [chatStarted, setChatStarted] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Track keyboard visibility for bottom safe area padding
    useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
        return () => { showSub.remove(); hideSub.remove(); };
    }, []);

    // API hooks
    const [aiCoachMessage] = useAiCoachMessageMutation();
    const [createCoachSession] = useCreateCoachSessionMutation();
    const [sendCoachMessage] = useSendCoachMessageMutation();
    const [endCoachSession] = useEndCoachSessionMutation();
    const [acceptChallengeApi] = useAcceptChallengeMutation();
    const { data: dailyChallenge } = useGetDailyChallengeQuery(undefined);
    const { data: aiHealthData } = useGetAiHealthQuery(undefined);
    const { data: existingSessions } = useGetCoachSessionsQuery(undefined);
    const [challengeAccepted, setChallengeAccepted] = useState(false);

    const aiStatusText = aiHealthData ? 'Online' : 'Offline (fallback mode)';

    // Resume latest active session or create a new one
    useEffect(() => {
        const initSession = async () => {
            setSessionLoading(true);
            try {
                // Check for an existing active (non-ended) session
                const sessions = existingSessions as any[] | undefined;
                const activeSession = sessions?.find((s: any) => !s.ended_at);

                if (activeSession) {
                    setSessionId(activeSession.id);
                } else {
                    // Create a new session
                    const res = await createCoachSession({}).unwrap();
                    setSessionId((res as any)?.id);
                }
            } catch {
                // Session API failed — will fall back to /ai/coach
            } finally {
                setSessionLoading(false);
            }
        };

        // Only init once sessions query has resolved
        if (existingSessions !== undefined) {
            initSession();
        }
    }, [existingSessions]);

    // Load message history when session is set
    const { data: sessionData } = useGetCoachSessionQuery(sessionId!, { skip: !sessionId });

    useEffect(() => {
        if (!sessionData) {
            return;
        }

        const session = sessionData as any;
        const coachMessages = session?.coach_messages as any[] | undefined;

        if (coachMessages && coachMessages.length > 0) {
            // Convert backend messages to GiftedChat format
            const loadedMessages: IMessage[] = coachMessages
                .map((msg: any) => ({
                    _id: msg.id,
                    text: msg.content,
                    createdAt: new Date(msg.created_at),
                    user: msg.role === 'user' ? CURRENT_USER : AI_COACH,
                }))
                .reverse(); // GiftedChat expects newest first

            setMessages(loadedMessages);
            setChatStarted(true);
        }
        // If session exists but has no messages, keep the welcome message that's already shown
    }, [sessionData]);

    // Build session history from current messages for AI context
    const buildSessionHistory = useCallback(() => {
        return [...messages]
            .reverse() // chronological order
            .filter(m => m._id !== 'welcome') // exclude welcome message
            .map(m => ({
                role: (m.user._id === AI_COACH._id ? 'assistant' : 'user') as 'user' | 'assistant',
                content: m.text || '',
            }));
    }, [messages]);

    const onSend = useCallback(async (newMessages: IMessage[] = []) => {
        // Hide extras once chat starts
        setChatStarted(true);

        // Add user message
        setMessages(previousMessages =>
            GiftedChat.append(previousMessages, newMessages)
        );

        // Show typing indicator
        setIsTyping(true);

        const userMessage = newMessages[0]?.text || '';
        let aiText = FALLBACK_RESPONSE;

        try {
            if (sessionId) {
                // Use coach session API (backend stores messages & proxies to AI)
                const res = await sendCoachMessage({ sessionId, message: userMessage }).unwrap();
                aiText = (res as any)?.message?.content ?? (res as any)?.coach_reply ?? aiText;
            } else {
                // Fallback: direct AI endpoint with session history for context
                const sessionHistory = buildSessionHistory();
                const res = await aiCoachMessage({
                    message: userMessage,
                    session_history: sessionHistory,
                }).unwrap();
                aiText = (res as any)?.coach_reply ?? aiText;
            }
        } catch {
            // Use fallback response
        }

        const aiResponse: IMessage = {
            _id: Crypto.randomUUID(),
            text: aiText,
            createdAt: new Date(),
            user: AI_COACH,
        };

        setIsTyping(false);
        setMessages(previousMessages =>
            GiftedChat.append(previousMessages, [aiResponse])
        );
    }, [sessionId, sendCoachMessage, aiCoachMessage, buildSessionHistory]);

    const handleQuickHelp = useCallback((text: string) => {
        const quickMessage: IMessage = {
            _id: Crypto.randomUUID(),
            text,
            createdAt: new Date(),
            user: CURRENT_USER,
        };
        onSend([quickMessage]);
    }, [onSend, CURRENT_USER]);

    const handleAcceptChallenge = async () => {
        const challenge = dailyChallenge as ChallengeData | undefined;
        if (!challenge?.id) {
            alert('Oops', 'No challenge available right now.');
            return;
        }
        try {
            await acceptChallengeApi(challenge.id).unwrap();
            setChallengeAccepted(true);
            alert(
                'Challenge Accepted! ⚡',
                `${challenge.description} — Reward: +${challenge.reward_xp} XP. You've got this!`,
                [{ text: "Let's Go!" }]
            );
        } catch {
            alert('Oops', 'Could not accept the challenge right now. Try again later.');
            return;
        }
        
        const challengeMessage: IMessage = {
            _id: Crypto.randomUUID(),
            text: "I'll take on today's challenge! 💪",
            createdAt: new Date(),
            user: CURRENT_USER,
        };
        onSend([challengeMessage]);
    };

    const handleMenu = () => {
        Keyboard.dismiss();
        alert('Chat Options', 'Choose an action', [
            {
                text: 'Clear Chat',
                style: 'destructive',
                onPress: async () => {
                    // End current session and start a fresh one
                    if (sessionId) {
                        try { await endCoachSession(sessionId).unwrap(); } catch {}
                    }
                    try {
                        const res = await createCoachSession({}).unwrap();
                        setSessionId((res as any)?.id);
                    } catch {}
                    setMessages([{ ...WELCOME_MESSAGE, createdAt: new Date() }]);
                    setChatStarted(false);
                },
            },
            { 
                text: 'Export Chat', 
                onPress: async () => {
                    try {
                        const chatText = [...messages]
                            .reverse()
                            .map(m => {
                                const sender = m.user._id === CURRENT_USER._id ? 'You' : 'Coach Nudge';
                                const time = formatDateTime(m.createdAt as Date | string);
                                return `[${time}] ${sender}: ${m.text}`;
                            })
                            .join('\n');
                        await Share.share({
                            message: chatText,
                            title: 'Unhabit Coach Nudge Chat',
                        });
                    } catch {
                        // User cancelled or share failed — ignore
                    }
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const handleMoodSelect = useCallback((mood: string) => {
        const moodMessage: IMessage = {
            _id: Crypto.randomUUID(),
            text: `I'm feeling ${mood.toLowerCase()} today`,
            createdAt: new Date(),
            user: CURRENT_USER,
        };
        onSend([moodMessage]);
    }, [onSend, CURRENT_USER]);

    const handleBack = useCallback(() => {
        Keyboard.dismiss();
        navigation.goBack();
    }, [navigation]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />
            
            <ChatHeader
                onBack={handleBack}
                onMenu={handleMenu}
                aiStatus={aiStatusText}
            />

            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={CURRENT_USER}
                renderBubble={renderBubble}
                renderAvatar={renderAvatar}
                renderInputToolbar={() => (
                    <CustomInputToolbar
                        onSend={onSend}
                        bottomPadding={keyboardVisible ? 0 : insets.bottom}
                    />
                )}
                renderChatFooter={() => renderChatFooter(handleQuickHelp, !chatStarted, handleMoodSelect)}
                renderMessage={(props: any) => (
                    <Message {...props} />
                )}
                renderChatEmpty={() => null}
                listViewProps={
                    {
                        keyboardShouldPersistTaps: 'handled',
                        scrollEnabled: true,
                        ListFooterComponent: () => renderChatHeader(
                            challengeAccepted ? null : (dailyChallenge as ChallengeData | null) ?? null,
                            handleAcceptChallenge,
                        ),
                    } as any
                }
                isTyping={isTyping}
                scrollToBottomComponent={() => (
                    <Ionicons name="chevron-down" size={24} color={COLORS.primary} />
                )}
                minInputToolbarHeight={56}
                bottomOffset={0}
                messagesContainerStyle={styles.messagesContainer}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    // Header
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
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginLeft: 10,
    },
    aiAvatarContainer: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiInfo: {
        gap: 4,
    },
    aiName: {
        fontSize: 20,
        fontWeight: '500',
        color: COLORS.white,
    },
    aiStatus: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.primary,
    },
    menuButton: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Messages Container
    messagesContainer: {
        backgroundColor: COLORS.background,
        paddingBottom: 10,
    },
    // Chat Header (at top of messages)
    chatHeader: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
    },
    // Chat Footer (Quick Help & Motivation)
    chatFooter: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 15,
        gap: 20,
    },
    // Quick Help
    quickHelpSection: {
        gap: 15,
    },
    quickHelpTitle: {
        fontSize: 20,
        fontWeight: '500',
        color: COLORS.white,
    },
    quickHelpOptions: {
        gap: 10,
    },
    quickHelpRow: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    quickHelpChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 20,
    },
    quickHelpChipText: {
        fontSize: 14,
        color: COLORS.white,
    },
    // AI Avatar
    aiAvatarSmall: {
        width: 40,
        height: 40,
        marginRight: 8,
    },
    // Challenge Card
    challengeCard: {
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        borderRadius: 12,
        padding: 19,
        gap: 16,
    },
    challengeContent: {
        gap: 8,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
    challengeDescription: {
        fontSize: 14,
        color: COLORS.white,
    },
    acceptButton: {
        backgroundColor: COLORS.white,
        height: 48,
        width: 190,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    // Input Toolbar
    inputToolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: COLORS.background,
        gap: 10,
    },
    inputPrimary: {
        alignItems: 'center',
    },
    composerContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0C0C0C',
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        borderRadius: 28,
        height: 48,
        paddingHorizontal: 16,
    },
    emojiButton: {
        marginRight: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 14,
        color: COLORS.white,
        height: 48,
        paddingHorizontal: 0,
        textAlignVertical: 'center',
        backgroundColor: 'transparent',
        includeFontPadding: false,
    },
    attachButton: {
        marginLeft: 8,
    },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Service Section
    serviceSection: {
        gap: 12,
    },
    serviceSectionTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: COLORS.white,
    },
    serviceOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    serviceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(44, 232, 198, 0.2)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
    },
    serviceChipText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
    },
    // Mood Tracker
    moodTracker: {
        gap: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    moodTrackerTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.white,
    },
    moodRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    moodItem: {
        alignItems: 'center',
        gap: 4,
    },
    moodEmoji: {
        fontSize: 28,
    },
    moodLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
    },
});

export default ChatScreen;
