import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Dashboard from '@/screens/Dashboard';
import StatsScreen from '@/screens/StatsScreen';
import ChatScreen from '@/screens/ChatScreen';
import AchievementsScreen from '@/screens/AchievementsScreen';
import BuddiesScreen from '@/screens/BuddiesScreen';
import { CustomTabBar } from './CustomTabBar';

export type MainTabParamList = {
    Dashboard: undefined;
    Chat: undefined;
    Stats: undefined;
    Achievements: undefined;
    Buddies: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={Dashboard} />
            <Tab.Screen name="Chat" component={ChatScreen} />
            <Tab.Screen name="Stats" component={StatsScreen} />
            <Tab.Screen name="Achievements" component={AchievementsScreen} />
            <Tab.Screen name="Buddies" component={BuddiesScreen} />
        </Tab.Navigator>
    );
};
