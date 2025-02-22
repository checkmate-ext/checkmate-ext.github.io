import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return (
        <Tabs
            screenOptions={{
                // Tab bar styling
                tabBarStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
                    borderTopColor: colorScheme === 'dark' ? '#333333' : '#EEEEEE',
                },
                tabBarActiveTintColor: '#8B6B44',
                tabBarInactiveTintColor: colorScheme === 'dark' ? '#888888' : '#999999',

                // Header styling
                headerStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
                },
                headerTintColor: colorScheme === 'dark' ? '#8B6B44' : '#1A1A1A',

                // Animation
                tabBarHideOnKeyboard: true,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome name="home" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}