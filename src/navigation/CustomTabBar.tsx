import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants/theme';

type TabIconName = 'home' | 'chatbubble' | 'stats-chart' | 'trophy' | 'people';

const TAB_CONFIG: { name: string; icon: TabIconName; label: string }[] = [
    { name: 'Dashboard', icon: 'home', label: 'Home' },
    { name: 'Chat', icon: 'chatbubble', label: 'Chat' },
    { name: 'Stats', icon: 'stats-chart', label: 'Stats' },
    { name: 'Achievements', icon: 'trophy', label: 'Rewards' },
    { name: 'Buddies', icon: 'people', label: 'Buddies' },
];

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;
                    
                    const tabConfig = TAB_CONFIG.find(tab => tab.name === route.name);
                    if (!tabConfig) return null;
                    
                    const iconName = isFocused 
                        ? tabConfig.icon 
                        : `${tabConfig.icon}-outline` as keyof typeof Ionicons.glyphMap;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={[
                                styles.tabItem,
                                isFocused && styles.tabItemActive,
                            ]}
                        >
                            <Ionicons
                                name={iconName}
                                size={20}
                                color={isFocused ? COLORS.black : COLORS.primary}
                            />
                            {isFocused && (
                                <Text style={styles.tabLabel}>{tabConfig.label}</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.background,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    backgroundColor: '#141414',
        borderRadius: 50,
        paddingVertical: SPACING.sm,
    },
    tabItem: {
        padding: SPACING.sm,
        alignItems: 'center',
        justifyContent: 'center',
        // borderWidth: 1,
        backgroundColor: 'rgba(44, 232, 198, 0.1)',
        borderRadius: 50
    },
    tabItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 20,
        gap: 6,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.black,
    },
});
