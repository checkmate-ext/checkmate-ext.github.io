import { Stack } from 'expo-router';
import { AuthProvider } from "@/app/context/AuthContext";
import { DeepLinkProvider } from "@/app/context/DeepLinkContext";
import { Provider as PaperProvider } from 'react-native-paper';
import {THEME_COLORS} from "@/app/constants/Config";
import {StatusBar} from "react-native";

export default function RootLayout() {
    return (
        <PaperProvider>
            <StatusBar style="light" backgroundColor={THEME_COLORS.background} translucent={true} />
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