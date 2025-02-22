import {View, Animated} from 'react-native';
import {Link} from 'expo-router';
import {useAuth} from '../context/AuthContext';
import {useState, useRef, useEffect} from 'react';
import {authStyles} from '../styles/auth';
import {
    TextInput,
    Button,
    Text,
    useTheme,
    HelperText,
    IconButton,
    Divider
} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';

export default function Login() {
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
            placeholder: '#A89880',
            backdrop: 'rgba(26, 22, 18, 0.5)',
            error: '#FF6B6B',
        },
    };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const {signIn} = useAuth();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Clear error message when input changes
    useEffect(() => {
        if (errorMessage) {
            setErrorMessage('');
        }
    }, [email, password]);

    const handleLogin = async () => {
        try {
            // Input validation
            if (!email || !password) {
                setErrorMessage('Please enter both email and password');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setErrorMessage('Please enter a valid email address');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setLoading(true);
            setErrorMessage('');

            const result = await signIn(email, password);

            if (!result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

                // Map backend errors to user-friendly messages
                if (result.error?.includes('Invalid email or password')) {
                    setErrorMessage('Incorrect email or password. Please try again.');
                } else if (result.error?.includes('Missing credentials')) {
                    setErrorMessage('Please fill in all required fields.');
                } else {
                    setErrorMessage(result.error || 'Unable to log in. Please try again.');
                }
                return;
            }

            // Success haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage('An unexpected error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <Animated.View
                style={[
                    authStyles.container,
                    {
                        opacity: fadeAnim,
                        transform: [
                            {translateY: slideAnim},
                            {scale: scaleAnim}
                        ]
                    }
                ]}
            >
                <View style={[authStyles.logoContainer, {marginBottom: 40}]}>
                    <Animated.View
                        style={{
                            transform: [{scale: scaleAnim}],
                            shadowColor: theme.colors.secondary,
                            shadowOffset: {width: 0, height: 0},
                            shadowRadius: 20,
                            shadowOpacity: 0.3,
                        }}
                    >
                        <MaterialCommunityIcons
                            name="magnify"
                            size={90}
                            color={theme.colors.secondary}
                        />
                    </Animated.View>
                    <Text
                        variant="displaySmall"
                        style={[
                            authStyles.title,
                            {
                                color: theme.colors.secondary,
                                textShadowColor: theme.colors.accent,
                                textShadowOffset: {width: 0, height: 0},
                                textShadowRadius: 8,
                            }
                        ]}
                    >
                        Welcome
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
                        error={!!errorMessage && errorMessage.includes('email')}
                        left={<TextInput.Icon icon="email" color={theme.colors.secondary}/>}
                        style={[authStyles.inputContainer, {backgroundColor: theme.colors.surface}]}
                        textColor={theme.colors.text}
                        outlineColor={theme.colors.primary}
                        activeOutlineColor={theme.colors.secondary}
                        placeholderTextColor={theme.colors.placeholder}
                    />

                    <TextInput
                        mode="outlined"
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        error={!!errorMessage && errorMessage.includes('password')}
                        left={<TextInput.Icon icon="lock" color={theme.colors.secondary}/>}
                        right={
                            <TextInput.Icon
                                icon={showPassword ? "eye-off" : "eye"}
                                onPress={() => setShowPassword(!showPassword)}
                                color={theme.colors.secondary}
                            />
                        }
                        style={[authStyles.inputContainer, {backgroundColor: theme.colors.surface}]}
                        textColor={theme.colors.text}
                        outlineColor={theme.colors.primary}
                        activeOutlineColor={theme.colors.secondary}
                        placeholderTextColor={theme.colors.placeholder}
                    />

                    {errorMessage ? (
                        <HelperText type="error" visible={!!errorMessage} style={{color: theme.colors.error}}>
                            {errorMessage}
                        </HelperText>
                    ) : null}

                    <View style={authStyles.buttonContainer}>
                        <Button
                            mode="contained"
                            onPress={handleLogin}
                            loading={loading}
                            contentStyle={{paddingVertical: 8}}
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={{
                                borderRadius: 12,
                                shadowColor: theme.colors.accent,
                                shadowOffset: {width: 0, height: 4},
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            {loading ? 'Logging in' : 'Login'}
                        </Button>

                        <Link href="/forgot-password" asChild>
                            <Button
                                mode="text"
                                onPress={() => Haptics.selectionAsync()}
                                textColor={theme.colors.secondary}
                            >
                                Forgot Password?
                            </Button>
                        </Link>
                    </View>

                    <Divider style={[authStyles.divider, {backgroundColor: theme.colors.primary, opacity: 0.2}]}/>

                    <View style={authStyles.socialButtonsContainer}>
                        <IconButton
                            icon="google"
                            mode="contained-tonal"
                            size={24}
                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                            containerColor={theme.colors.surface}
                            iconColor={theme.colors.secondary}
                        />
                    </View>

                    <View style={authStyles.footer}>
                        <Text variant="bodyLarge" style={{color: theme.colors.text}}>
                            Don't have an account?
                        </Text>
                        <Link href="/signup" asChild>
                            <Button
                                mode="text"
                                compact
                                onPress={() => Haptics.selectionAsync()}
                                textColor={theme.colors.secondary}
                            >
                                Sign Up!
                            </Button>
                        </Link>
                    </View>
                </View>
            </Animated.View>
        </LinearGradient>
    );
}