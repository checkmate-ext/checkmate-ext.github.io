// app/(auth)/signup.tsx
import {View, Animated, ScrollView} from 'react-native';
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
import {router} from 'expo-router';
import {API_URL} from '../constants/Config';

export default function SignUp() {
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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

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
    }, [email, password, confirmPassword]);

    const handleSignUp = async () => {
        try {
            // Input validation
            if (!email || !password || !confirmPassword) {
                setErrorMessage('Please fill in all fields');
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

            // Password validation
            if (password.length < 8) {
                setErrorMessage('Password must be at least 8 characters long');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            // Password matching
            if (password !== confirmPassword) {
                setErrorMessage('Passwords do not match');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setLoading(true);
            setErrorMessage('');

            // Make API request to register the user
            try {
                const response = await fetch(`${API_URL}/user/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        password,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // Handle API errors
                    setErrorMessage(data.message || 'Registration failed. Please try again.');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    return;
                }

                // Registration successful - show confirmation dialog
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setLoading(false);

                // Show success message and navigate to login
                setErrorMessage(''); // Clear any previous errors
                setSuccessMessage('Registration successful! Please check your email to confirm your account before logging in.');

                // After a delay, navigate to login page
                setTimeout(() => {
                    router.replace('/login');
                }, 5000);
            } catch (error) {
                console.error('API error during registration:', error);
                setErrorMessage('Network error. Please try again later.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }

        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage('An unexpected error occurred. Please try again later.');
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <ScrollView contentContainerStyle={{flexGrow: 1}}>
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
                                name="account-plus"
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
                            Create Account
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
                            error={!!errorMessage && errorMessage.includes('Password')}
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

                        <TextInput
                            mode="outlined"
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            error={!!errorMessage && errorMessage.includes('match')}
                            left={<TextInput.Icon icon="lock-check" color={theme.colors.secondary}/>}
                            right={
                                <TextInput.Icon
                                    icon={showConfirmPassword ? "eye-off" : "eye"}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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

                        {successMessage ? (
                            <Text style={{
                                color: '#4CAF50',
                                marginVertical: 16,
                                textAlign: 'center',
                                fontWeight: '500'
                            }}>
                                {successMessage}
                            </Text>
                        ) : null}

                        <View style={authStyles.buttonContainer}>
                            <Button
                                mode="contained"
                                onPress={handleSignUp}
                                loading={loading}
                                disabled={loading || !!successMessage}
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
                                    marginTop: 8,
                                }}
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </Button>
                        </View>

                        <Divider style={[authStyles.divider, {backgroundColor: theme.colors.primary, opacity: 0.2, marginVertical: 20}]}/>

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
                                Already have an account?
                            </Text>
                            <Link href="/login" asChild>
                                <Button
                                    mode="text"
                                    compact
                                    onPress={() => Haptics.selectionAsync()}
                                    textColor={theme.colors.secondary}
                                >
                                    Log In
                                </Button>
                            </Link>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </LinearGradient>
    );
}