// app/_layout.tsx - Fixed navigation structure
import { Stack } from 'expo-router';
import { AuthProvider } from "@/app/context/AuthContext";
import { DeepLinkProvider } from "@/app/context/DeepLinkContext";
import { Provider as PaperProvider } from 'react-native-paper';

export default function RootLayout() {
    return (
        <PaperProvider>
            <AuthProvider>
                <DeepLinkProvider>
                    <Stack
                        screenOptions={{
                            headerShown: false
                        }}
                    >
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="new-search" />
                        <Stack.Screen name="article/[id]" />
                    </Stack>
                </DeepLinkProvider>
            </AuthProvider>
        </PaperProvider>
    );
}