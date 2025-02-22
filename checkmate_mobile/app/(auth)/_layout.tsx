import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AuthLayout() {
    const colorScheme = useColorScheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
                },
                headerTintColor: colorScheme === 'dark' ? '#8B6B44' : '#1A1A1A',
                headerBackTitle: 'Back',
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    title: 'Login',
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
