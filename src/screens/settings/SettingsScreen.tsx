import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { useGetMeQuery, useUpdateProfileMutation, useResetPasswordMutation, useDeleteAccountMutation } from '../../services/api/auth';
import { useThemedAlert } from '../../components/common/ThemedAlert';

export const SettingsScreen = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const { alert } = useThemedAlert();

    // API Hooks
    const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined);
    const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
    const [resetPassword] = useResetPasswordMutation();
    const [deleteAccount] = useDeleteAccountMutation();

    // Local State
    const [editProfileVisible, setEditProfileVisible] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);

    // Form State
    const [editName, setEditName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // --- Actions ---

    const handleEditProfile = () => {
        setEditName(meData?.profile?.full_name || meData?.user?.full_name || meData?.user?.name || '');
        setEditProfileVisible(true);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            alert('Error', 'Name cannot be empty.');
            return;
        }
        try {
            await updateProfile({ full_name: editName.trim() }).unwrap();
            refetchMe();
            setEditProfileVisible(false);
            alert('Success', 'Profile updated successfully.');
        } catch (err: any) {
            alert('Error', err?.data?.message || 'Failed to update profile.');
        }
    };

    const handleChangePassword = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setChangePasswordVisible(true);
    };

    const handleSavePassword = async () => {
        if (!currentPassword.trim()) {
            alert('Error', 'Please enter your current password.');
            return;
        }
        if (newPassword.length < 8) {
            alert('Error', 'New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('Error', 'Passwords do not match.');
            return;
        }
        try {
            await resetPassword({ current_password: currentPassword, new_password: newPassword }).unwrap();
            setChangePasswordVisible(false);
            alert('Success', 'Password changed successfully.');
        } catch (err: any) {
            alert('Error', err?.data?.message || 'Failed to change password.');
        }
    };

    const handleLinkedAccounts = () => {
        const provider = meData?.user?.app_metadata?.provider || 'email';
        alert(
            'Linked Accounts',
            `You are signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}.`,
            [{ text: 'OK' }]
        );
    };

    const handleDeleteAccount = () => {
        alert(
            'Delete Account',
            'This will permanently delete your account and all data. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteAccount(undefined).unwrap();
                        } catch (err: any) {
                            alert('Error', err?.data?.message || 'Failed to delete account.');
                        }
                    },
                },
            ]
        );
    };

    // --- Render Helpers ---

    const RenderSectionHeader = ({ title }: { title: string }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    const RenderItem = ({
        icon,
        label,
        onPress,
        isDestructive = false,
        value
    }: {
        icon: any,
        label: string,
        onPress: () => void,
        isDestructive?: boolean,
        value?: string
    }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, isDestructive && styles.destructiveIcon]}>
                    <Ionicons name={icon} size={20} color={isDestructive ? COLORS.error : COLORS.primary} />
                </View>
                <Text style={[styles.itemLabel, isDestructive && styles.destructiveLabel]}>
                    {label}
                </Text>
            </View>
            <View style={styles.itemRight}>
                {value && <Text style={styles.itemValue}>{value}</Text>}
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                {/* Account Section */}
                <RenderSectionHeader title="Account" />
                <View style={styles.section}>
                    <RenderItem
                        icon="person-outline"
                        label="Edit Profile"
                        onPress={handleEditProfile}
                        value={meData?.profile?.full_name || meData?.user?.full_name}
                    />
                    <View style={styles.separator} />
                    <RenderItem
                        icon="link-outline"
                        label="Linked Accounts"
                        onPress={handleLinkedAccounts}
                        value={meData?.user?.app_metadata?.provider}
                    />
                </View>

                {/* Security Section */}
                <RenderSectionHeader title="Security" />
                <View style={styles.section}>
                    <RenderItem
                        icon="lock-closed-outline"
                        label="Change Password"
                        onPress={handleChangePassword}
                    />
                </View>

                {/* Notifications Link (Optional redundancy since it's in Profile menu too) */}
                <RenderSectionHeader title="Preferences" />
                <View style={styles.section}>
                    <RenderItem
                        icon="notifications-outline"
                        label="Notification Settings"
                        onPress={() => navigation.navigate('Notifications')}
                    />
                    <View style={styles.separator} />
                    <RenderItem
                        icon="sparkles-outline"
                        label="AI Coach Preferences"
                        onPress={() => navigation.navigate('Chat')} // Or dedicated prefs screen if exists
                    />
                </View>

                {/* Danger Zone */}
                <RenderSectionHeader title="Danger Zone" />
                <View style={styles.section}>
                    <RenderItem
                        icon="trash-outline"
                        label="Delete Account"
                        onPress={handleDeleteAccount}
                        isDestructive
                    />
                </View>

                <Text style={styles.versionText}>UnHabit v1.0.0 (Build 100)</Text>

            </ScrollView>

            {/* ── Edit Profile Modal ── */}
            <Modal visible={editProfileVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <Text style={styles.modalLabel}>Full Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter your name"
                            placeholderTextColor="#666"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setEditProfileVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSaveBtn, isUpdatingProfile && { opacity: 0.6 }]}
                                onPress={handleSaveProfile}
                                disabled={isUpdatingProfile}
                            >
                                <Text style={styles.modalSaveText}>
                                    {isUpdatingProfile ? 'Saving...' : 'Save'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Change Password Modal ── */}
            <Modal visible={changePasswordVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Change Password</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Current Password"
                            placeholderTextColor="#666"
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="New Password"
                            placeholderTextColor="#666"
                            secureTextEntry
                        />
                        <TextInput
                            style={styles.modalInput}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm New Password"
                            placeholderTextColor="#666"
                            secureTextEntry
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setChangePasswordVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalSaveBtn}
                                onPress={handleSavePassword}
                            >
                                <Text style={styles.modalSaveText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '600',
        color: COLORS.white,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    sectionHeader: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        marginTop: SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        backgroundColor: '#111',
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        marginBottom: SPACING.lg,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        minHeight: 56,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    destructiveIcon: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    itemLabel: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.white,
        fontWeight: '500',
    },
    destructiveLabel: {
        color: COLORS.error,
    },
    itemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    itemValue: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 56, // indent to align with text
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: TYPOGRAPHY.fontSize.sm,
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl,
    },
    // Modal Styles (Copied from ProfileScreen for consistency)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#1A1A1A',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.white,
        marginBottom: SPACING.lg,
    },
    modalLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: SPACING.xs,
    },
    modalInput: {
        backgroundColor: '#0C0C0C',
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        padding: SPACING.md,
        fontSize: 16,
        color: COLORS.white,
        marginBottom: SPACING.md,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.sm,
    },
    modalCancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: 'rgba(129, 129, 129, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },
    modalSaveBtn: {
        flex: 1,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSaveText: {
        fontSize: 16,
        color: COLORS.black,
        fontWeight: '600',
    },
});
