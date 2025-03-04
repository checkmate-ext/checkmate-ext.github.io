// app/_layout.tsx
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
                        initialRouteName="(auth)"
                    >
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="article" />
                    </Stack>
                </DeepLinkProvider>
            </AuthProvider>
        </PaperProvider>
    );
}