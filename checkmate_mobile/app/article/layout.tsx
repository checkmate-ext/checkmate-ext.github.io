import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { IconButton } from 'react-native-paper';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

// This file should be placed at app/article/_layout.tsx
export default function ArticleLayout() {
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
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                    color: theme.colors.secondary,
                },
                headerShadowVisible: false,
                headerLeft: () => (
                    <IconButton
                        icon="chevron-left"
                        iconColor={theme.colors.secondary}
                        size={24}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.back();
                        }}
                    />
                ),
            }}
        >
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Article Analysis',
                }}
            />
        </Stack>
    );
}