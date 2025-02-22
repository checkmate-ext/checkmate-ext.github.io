import { Stack } from 'expo-router';
import { AuthProvider } from "@/app/context/AuthContext";

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack
                screenOptions={{
                    headerShown: false
                }}
                initialRouteName="(auth)"  // Set initial route to auth group
            >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </AuthProvider>
    );
}