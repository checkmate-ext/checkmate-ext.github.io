import { Stack } from 'expo-router';
import { useTheme, IconButton } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function Layout() {
    const { signOut } = useAuth();

    // Using the same theme colors as defined in login screen
    const theme = {
        ...useTheme(),
        colors: {
            ...useTheme().colors,
            primary: '#8B7355', // Warm brown
            secondary: '#D2B48C', // Light brown
            accent: '#6B4423', // Dark brown
            background: '#1A1612', // Very dark brown
            surface: '#2A241E', // Dark brown surface
            text: '#E8DCC4', // Light cream text
        },
    };

    const handleLogout = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await signOut();
    };

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                    color: theme.colors.secondary,
                },
                headerRight: () => (
                    <IconButton
                        icon="logout"
                        iconColor={theme.colors.secondary}
                        size={24}
                        onPress={handleLogout}
                    />
                ),
                headerShadowVisible: false,
                headerTitle: '', // This removes the title text
            }}
        >
            <Stack.Screen
                name="index"
            />
            {/* Add other screens here */}
        </Stack>
    );
}