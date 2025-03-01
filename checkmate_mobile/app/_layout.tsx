import { Stack } from 'expo-router';
import { AuthProvider } from "@/app/context/AuthContext";
import { Provider as PaperProvider } from 'react-native-paper';


export default function RootLayout() {
    return (
        <PaperProvider>
        <AuthProvider>
            <Stack
                screenOptions={{
                    headerShown: false
                }}
                initialRouteName="(auth)"  // Set initial route to auth group
            >r
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="article" />
            </Stack>
        </AuthProvider>
        </PaperProvider>
    );
}