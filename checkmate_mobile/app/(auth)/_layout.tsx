import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

export default function AuthLayout() {
    const theme = {
        ...useTheme(),
        colors: {
            ...useTheme().colors,
            primary: '#8B7355',
            secondary: '#D2B48C',
            accent: '#6B4423',
            background: '#1A1612',
            surface: '#2A241E',
            text: '#E8DCC4',
        },
    };

    return (
        <Stack
            initialRouteName="login"
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                    color: theme.colors.secondary,
                },
                headerBackTitleStyle: {
                    color: theme.colors.secondary,
                },
                headerShadowVisible: false,
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    title: '',
                }}
            />
            <Stack.Screen
                name="signup"
                options={{
                    title: 'Sign Up',
                }}
            />
            <Stack.Screen
                name="forgot-password"
                options={{
                    title: 'Reset Password',
                }}
            />
        </Stack>
    );
}