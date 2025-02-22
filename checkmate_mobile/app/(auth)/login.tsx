// app/(auth)/login.tsx
import { View, Animated } from 'react-native';
import { Link, router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { authStyles } from '../styles/auth';
import {
    TextInput,
    Button,
    Text,
    useTheme,
    MD3Colors,
    IconButton,
    Divider
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function Login() {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLoading(false);
        router.replace('/(tabs)/home');
    };

    return (
        <Animated.View
            style={[
                authStyles.container,
                {
                    backgroundColor: theme.colors.background,
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={authStyles.logoContainer}>
                <MaterialCommunityIcons
                    name="magnify"
                    size={80}
                    color={theme.colors.primary}
                />
                <Text
                    variant="displaySmall"
                    style={[authStyles.title, { color: theme.colors.primary }]}
                >
                    Welcome Back
                </Text>
            </View>

            <View style={authStyles.form}>
                <TextInput
                    mode="outlined"
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    left={<TextInput.Icon icon="email" />}
                    style={authStyles.inputContainer}
                />

                <TextInput
                    mode="outlined"
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    left={<TextInput.Icon icon="lock" />}
                    right={
                        <TextInput.Icon
                            icon={showPassword ? "eye-off" : "eye"}
                            onPress={() => setShowPassword(!showPassword)}
                        />
                    }
                    style={authStyles.inputContainer}
                />

                <View style={authStyles.buttonContainer}>
                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={loading}
                        contentStyle={{ paddingVertical: 8 }}
                    >
                        Log In
                    </Button>

                    <Link href="/forgot-password" asChild>
                        <Button
                            mode="text"
                            onPress={() => Haptics.selectionAsync()}
                        >
                            Forgot Password?
                        </Button>
                    </Link>
                </View>

                <Divider style={authStyles.divider} />

                <View style={authStyles.socialButtonsContainer}>
                    <IconButton
                        icon="google"
                        mode="contained-tonal"
                        size={24}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    />
                    <IconButton
                        icon="apple"
                        mode="contained-tonal"
                        size={24}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    />
                    <IconButton
                        icon="facebook"
                        mode="contained-tonal"
                        size={24}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    />
                </View>

                <View style={authStyles.footer}>
                    <Text variant="bodyLarge">Don't have an account? </Text>
                    <Link href="/signup" asChild>
                        <Button
                            mode="text"
                            compact
                            onPress={() => Haptics.selectionAsync()}
                        >
                            Sign Up
                        </Button>
                    </Link>
                </View>
            </View>
        </Animated.View>
    );
}