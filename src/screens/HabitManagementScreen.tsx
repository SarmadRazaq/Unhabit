import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
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
    useGetHabitsQuery,
    useCreateHabitMutation,
    useUpdateHabitMutation,
    useDeleteHabitMutation,
    useGetHabitTemplatesQuery,
} from '../services/api/habitsApi';

// ============================================================================
// HABIT CARD
// ============================================================================
interface HabitCardProps {
    habit: any;
    onEdit: () => void;
    onDelete: () => void;
}

const HabitCard = ({ habit, onEdit, onDelete }: HabitCardProps) => (
    <View style={styles.habitCard}>
        <View style={styles.habitCardLeft}>
            <View style={styles.habitIcon}>
                <Ionicons
                    name={'leaf-outline'}
                    size={24}
                    color={COLORS.primary}
                />
            </View>
            <View style={styles.habitInfo}>
                <Text style={styles.habitName}>{habit.goal_text ?? habit.name}</Text>
                {habit.status && habit.status !== 'active' ? (
                    <Text style={styles.habitDescription}>
                        {habit.status}
                    </Text>
                ) : null}
                <View style={styles.habitMeta}>
                    {habit.habit_templates?.habit_categories?.name && (
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryText}>{habit.habit_templates.habit_categories.name}</Text>
                        </View>
                    )}
                </View>
            </View>
        </View>
        <View style={styles.habitActions}>
            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                <Ionicons name="pencil" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </TouchableOpacity>
        </View>
    </View>
);

// ============================================================================
// ADD/EDIT MODAL
// ============================================================================
interface HabitModalProps {
    visible: boolean;
    onClose: () => void;
    onSave: (data: { name: string; description: string; category: string }) => void;
    initialData?: { name: string; description: string; category: string };
    isEditing: boolean;
    isLoading: boolean;
}

const HabitModal = ({ visible, onClose, onSave, initialData, isEditing, isLoading }: HabitModalProps) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [category, setCategory] = useState(initialData?.category || '');

    React.useEffect(() => {
        if (visible) {
            setName(initialData?.name || '');
            setDescription(initialData?.description || '');
            setCategory(initialData?.category || '');
        }
    }, [visible, initialData]);

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? 'Edit Habit' : 'New Habit'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        <Text style={styles.inputLabel}>Habit Name</Text>
                        <TextInput
                            style={styles.textInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Stop smoking"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        <Text style={styles.inputLabel}>Description (optional)</Text>
                        <TextInput
                            style={[styles.textInput, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Why this habit matters to you..."
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            numberOfLines={3}
                        />

                        <Text style={styles.inputLabel}>Category</Text>
                        <TextInput
                            style={styles.textInput}
                            value={category}
                            onChangeText={setCategory}
                            placeholder="e.g., Health, Productivity"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, (!name.trim() || isLoading) && styles.saveButtonDisabled]}
                        onPress={() => name.trim() && onSave({ name: name.trim(), description, category })}
                        disabled={!name.trim() || isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <Text style={styles.saveButtonText}>
                                {isEditing ? 'Update Habit' : 'Create Habit'}
                            </Text>
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
const HabitManagementScreen = () => {
    const { alert } = useThemedAlert();
    const navigation = useNavigation();
    const { data: habitsData, isLoading, refetch } = useGetHabitsQuery(undefined);
    const { data: templatesData, isLoading: templatesLoading } = useGetHabitTemplatesQuery(undefined);
    const [createHabit, { isLoading: isCreating }] = useCreateHabitMutation();
    const [updateHabit, { isLoading: isUpdating }] = useUpdateHabitMutation();
    const [deleteHabit] = useDeleteHabitMutation();

    const [showModal, setShowModal] = useState(false);
    const [editingHabit, setEditingHabit] = useState<any>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    const templates = Array.isArray(templatesData) ? templatesData : (templatesData as any)?.templates ?? [];

    const habits = Array.isArray(habitsData) ? habitsData : (habitsData as any)?.habits ?? [];

    const handleCreate = useCallback(async (data: { name: string; description: string; category: string }) => {
        try {
            await createHabit({
                goal_text: data.name,
                description: data.description,
                category: data.category
            }).unwrap();
            setShowModal(false);
            alert('Success', 'Habit created successfully! 🎉');
        } catch {
            alert('Error', 'Failed to create habit. Please try again.');
        }
    }, [createHabit]);

    const handleUpdate = useCallback(async (data: { name: string; description: string; category: string }) => {
        if (!editingHabit) return;
        try {
            await updateHabit({
                id: editingHabit.id,
                goal_text: data.name,
                description: data.description,
                category: data.category
            }).unwrap();
            setShowModal(false);
            setEditingHabit(null);
            alert('Success', 'Habit updated! ✅');
        } catch {
            alert('Error', 'Failed to update habit.');
        }
    }, [updateHabit, editingHabit]);

    const handleDelete = useCallback((habit: any) => {
        alert(
            'Delete Habit',
            `Are you sure you want to delete "${habit.goal_text ?? habit.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteHabit(habit.id).unwrap();
                            alert('Deleted', 'Habit removed.');
                        } catch {
                            alert('Error', 'Failed to delete habit.');
                        }
                    },
                },
            ]
        );
    }, [deleteHabit]);

    const openEdit = (habit: any) => {
        setEditingHabit({ ...habit, name: habit.goal_text ?? habit.name });
        setShowModal(true);
    };

    const openCreate = () => {
        setEditingHabit(null);
        setShowModal(true);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Habits</Text>
                <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
                    <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading habits...</Text>
                </View>
            ) : habits.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="leaf-outline" size={64} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No habits yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Start your journey by adding your first habit
                    </Text>
                    <TouchableOpacity style={styles.emptyButton} onPress={openCreate}>
                        <Text style={styles.emptyButtonText}>Add Habit</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.sectionLabel}>
                        {habits.length} habit{habits.length !== 1 ? 's' : ''} tracked
                    </Text>
                    {habits.map((habit: any) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            onEdit={() => openEdit(habit)}
                            onDelete={() => handleDelete(habit)}
                        />
                    ))}

                    {/* Templates Section */}
                    <TouchableOpacity
                        style={styles.templatesToggle}
                        onPress={() => setShowTemplates(!showTemplates)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.templatesToggleLeft}>
                            <Ionicons name="albums-outline" size={20} color={COLORS.primary} />
                            <Text style={styles.templatesToggleText}>Browse Templates</Text>
                        </View>
                        <Ionicons name={showTemplates ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.primary} />
                    </TouchableOpacity>

                    {showTemplates && (
                        <View style={styles.templatesSection}>
                            {templatesLoading ? (
                                <ActivityIndicator size="small" color={COLORS.primary} style={{ paddingVertical: 16 }} />
                            ) : templates.length === 0 ? (
                                <Text style={styles.templatesEmpty}>No templates available</Text>
                            ) : (
                                templates.map((t: any) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={styles.templateCard}
                                        onPress={() => {
                                            setEditingHabit(null);
                                            setShowModal(true);
                                            // Pre-fill will happen via initialData in the next render
                                            setEditingHabit({
                                                name: t.name ?? t.goal_text ?? '',
                                                description: t.description ?? '',
                                                category: t.category ?? t.habit_categories?.name ?? '',
                                            });
                                            // We set editingHabit but it's a template, so flip back to create mode
                                            setTimeout(() => setEditingHabit((prev: any) => prev ? { ...prev, __template: true } : prev), 0);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.templateInfo}>
                                            <Text style={styles.templateName}>{t.name ?? t.goal_text}</Text>
                                            {t.description ? (
                                                <Text style={styles.templateDesc} numberOfLines={1}>{t.description}</Text>
                                            ) : null}
                                        </View>
                                        <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}

            <HabitModal
                visible={showModal}
                onClose={() => { setShowModal(false); setEditingHabit(null); }}
                onSave={editingHabit ? handleUpdate : handleCreate}
                initialData={editingHabit}
                isEditing={!!editingHabit}
                isLoading={isCreating || isUpdating}
            />
        </SafeAreaView>
    );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    },
    backBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '500', color: COLORS.white },
    addBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    sectionLabel: { fontSize: 14, color: COLORS.primary, fontWeight: '500', marginBottom: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
    loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 8 },
    emptyTitle: { fontSize: 22, fontWeight: '700', color: 'white', marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
    emptyButton: {
        backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 14,
        borderRadius: 12, marginTop: 20,
    },
    emptyButtonText: { color: 'black', fontSize: 16, fontWeight: '600' },
    habitCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#0C0C0C', borderRadius: 12, padding: 16,
        borderWidth: 1, borderColor: 'rgba(44,232,198,0.1)', marginBottom: 12,
    },
    habitCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 },
    habitIcon: {
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: 'rgba(44,232,198,0.1)', justifyContent: 'center', alignItems: 'center',
    },
    habitInfo: { flex: 1, gap: 4 },
    habitName: { fontSize: 16, fontWeight: '600', color: 'white' },
    habitDescription: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
    habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    categoryBadge: {
        backgroundColor: 'rgba(44,232,198,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    },
    categoryText: { fontSize: 11, color: COLORS.primary },
    frequencyText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
    habitActions: { flexDirection: 'row', gap: 12 },
    actionBtn: { padding: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContainer: {
        backgroundColor: '#0C0C0C', borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingBottom: 40,
    },
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
    textArea: { height: 80, textAlignVertical: 'top' },
    saveButton: {
        backgroundColor: COLORS.primary, marginHorizontal: 20, paddingVertical: 16,
        borderRadius: 12, alignItems: 'center', marginTop: 8,
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { fontSize: 16, fontWeight: '600', color: 'black' },
    templatesToggle: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
        borderWidth: 1, borderColor: 'rgba(44,232,198,0.15)', marginTop: 8, marginBottom: 8,
    },
    templatesToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    templatesToggleText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
    templatesSection: { gap: 8, marginBottom: 12 },
    templatesEmpty: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingVertical: 16 },
    templateCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#0C0C0C', borderRadius: 10, padding: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    templateInfo: { flex: 1, gap: 2 },
    templateName: { fontSize: 15, fontWeight: '500', color: 'white' },
    templateDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
});

export default HabitManagementScreen;
