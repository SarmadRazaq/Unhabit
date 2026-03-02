import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../constants/theme';
import { useRequestExportMutation } from '../../services/api/settingsApi';
import { useThemedAlert } from '../../components/common/ThemedAlert';

export const SupportScreen = () => {
    const navigation = useNavigation();
    const { alert } = useThemedAlert();
    const [requestExport, { isLoading: isExporting }] = useRequestExportMutation();

    // --- Actions ---

    const handleEmailSupport = () => {
        Linking.openURL('mailto:support@unhabit.app?subject=Help%20Request');
    };

    const handleFeedback = () => {
        Linking.openURL('mailto:feedback@unhabit.app?subject=Unhabit%20Feedback');
    };

    const handleRateUs = () => {
        const storeUrl = Platform.select({
            ios: 'https://apps.apple.com/app/unhabit',
            android: 'https://play.google.com/store/apps/details?id=com.sulemanahmadzai.Unhabit',
            default: 'https://unhabit.app',
        });
        Linking.openURL(storeUrl);
    };

    const handlePrivacyPolicy = () => {
        Linking.openURL('https://unhabit.app/privacy');
    };

    const handleExportData = async () => {
        try {
            await requestExport({}).unwrap();
            alert('Export Requested', 'Your data export has been queued. You will receive an email shortly.');
        } catch {
            alert('Export Failed', 'Could not request data export. Please try again later.');
        }
    };

    // --- Render Helpers ---

    const RenderItem = ({
        icon,
        label,
        onPress,
        color = COLORS.primary,
        subtitle
    }: {
        icon: any,
        label: string,
        onPress: () => void,
        color?: string,
        subtitle?: string
    }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.itemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={22} color={color} />
                </View>
                <View>
                    <Text style={styles.itemLabel}>{label}</Text>
                    {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <Ionicons name="arrow-forward" size={20} color={COLORS.textSecondary} />
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
                <Text style={styles.headerTitle}>Support & Info</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

                <Text style={styles.sectionHeader}>Contact Us</Text>
                <View style={styles.section}>
                    <RenderItem
                        icon="mail-outline"
                        label="Help Center"
                        subtitle="Get help with issues"
                        onPress={handleEmailSupport}
                    />
                    <View style={styles.separator} />
                    <RenderItem
                        icon="chatbubbles-outline"
                        label="Send Feedback"
                        subtitle="Feature requests & bugs"
                        onPress={handleFeedback}
                    />
                </View>

                <Text style={styles.sectionHeader}>About</Text>
                <View style={styles.section}>
                    <RenderItem
                        icon="star-outline"
                        label="Rate Us"
                        onPress={handleRateUs}
                        color="#F5A623"
                    />
                    <View style={styles.separator} />
                    <RenderItem
                        icon="document-text-outline"
                        label="Privacy Policy"
                        onPress={handlePrivacyPolicy}
                        color={COLORS.textSecondary}
                    />
                </View>

                <Text style={styles.sectionHeader}>Data</Text>
                <View style={styles.section}>
                    <RenderItem
                        icon="download-outline"
                        label={isExporting ? "Exporting..." : "Export My Data"}
                        onPress={handleExportData}
                    />
                </View>

            </ScrollView>
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
        minHeight: 64,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemLabel: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.white,
        fontWeight: '500',
    },
    itemSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 64,
    },
});
