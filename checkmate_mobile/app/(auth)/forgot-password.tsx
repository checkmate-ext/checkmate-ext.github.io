import {View, Animated, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {Link, router} from 'expo-router';
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
import axios from 'axios';
import {API_URL} from '../constants/Config';

export default function ForgotPassword() {
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

    // Form states
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // UI states
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: Code, 3: New Password
    const [showPassword, setShowPassword] = useState(false);

    // Animation refs
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
    }, [email, verificationCode, newPassword, confirmPassword]);

    const handleSendVerificationCode = async () => {
        try {
            // Basic email validation
            if (!email) {
                setErrorMessage('Please enter your email address');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setErrorMessage('Please enter a valid email address');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLoading(true);
            setErrorMessage('');

            // Call API to send verification code
            const response = await axios.post(`${API_URL}/user/send-verification-code`, {
                email: email
            });

            // Success
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSuccessMessage('Verification code sent! Please check your email.');

            // Move to code verification step after a brief delay
            setTimeout(() => {
                setCurrentStep(2);
                setSuccessMessage('');
            }, 1000);

        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage(error.response?.data?.message || 'Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        try {
            if (!verificationCode || verificationCode.length < 6) {
                setErrorMessage('Please enter the 6-digit verification code');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLoading(true);
            setErrorMessage('');

            // Call API to verify the code
            const response = await axios.post(`${API_URL}/user/verify-code`, {
                email: email,
                code: verificationCode
            });

            // Success
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSuccessMessage('Code verified successfully!');

            // Move to password reset step
            setTimeout(() => {
                setCurrentStep(3);
                setSuccessMessage('');
            }, 1000);

        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage(error.response?.data?.message || 'Invalid verification code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            // Password validation
            if (!newPassword) {
                setErrorMessage('Please enter a new password');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            if (newPassword.length < 8) {
                setErrorMessage('Password must be at least 8 characters long');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            if (newPassword !== confirmPassword) {
                setErrorMessage('Passwords do not match');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setLoading(true);
            setErrorMessage('');

            // Call API to update the password
            const response = await axios.post(`${API_URL}/user/update-forgotten-password`, {
                email: email,
                new_password: newPassword
            });

            // Success
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSuccessMessage('Password has been successfully reset!');

            // Navigate back to login after brief delay
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setErrorMessage(error.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Render different content based on the current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Email input step
                return (
                    <>
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
                                    name="lock-reset"
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
                                Reset Password
                            </Text>
                        </View>

                        <Text
                            style={{
                                color: theme.colors.text,
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            Enter your email to receive a verification code
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            error={!!errorMessage}
                            left={<TextInput.Icon icon="email" color={theme.colors.secondary}/>}
                            style={[authStyles.inputContainer, {backgroundColor: theme.colors.surface}]}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                            placeholderTextColor={theme.colors.placeholder}
                        />

                        <Button
                            mode="contained"
                            onPress={handleSendVerificationCode}
                            loading={loading}
                            contentStyle={{paddingVertical: 8}}
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={{
                                borderRadius: 12,
                                marginTop: 20,
                                marginBottom: 20,
                                shadowColor: theme.colors.accent,
                                shadowOffset: {width: 0, height: 4},
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                    </>
                );

            case 2: // Verification code step
                return (
                    <>
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
                                    name="numeric"
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
                                Verification
                            </Text>
                        </View>

                        <Text
                            style={{
                                color: theme.colors.text,
                                textAlign: 'center',
                                marginBottom: 10,
                            }}
                        >
                            We've sent a verification code to:
                        </Text>
                        <Text
                            style={{
                                color: theme.colors.secondary,
                                textAlign: 'center',
                                fontWeight: 'bold',
                                marginBottom: 20,
                            }}
                        >
                            {email}
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Verification Code"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            keyboardType="number-pad"
                            maxLength={6}
                            error={!!errorMessage}
                            left={<TextInput.Icon icon="key" color={theme.colors.secondary}/>}
                            style={[authStyles.inputContainer, {backgroundColor: theme.colors.surface}]}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                            placeholderTextColor={theme.colors.placeholder}
                        />

                        <Button
                            mode="contained"
                            onPress={handleVerifyCode}
                            loading={loading}
                            contentStyle={{paddingVertical: 8}}
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={{
                                borderRadius: 12,
                                marginTop: 20,
                                marginBottom: 10,
                                shadowColor: theme.colors.accent,
                                shadowOffset: {width: 0, height: 4},
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </Button>

                        <Button
                            mode="text"
                            onPress={() => {
                                Haptics.selectionAsync();
                                setCurrentStep(1);
                            }}
                            textColor={theme.colors.secondary}
                        >
                            Change Email
                        </Button>
                    </>
                );

            case 3: // New password step
                return (
                    <>
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
                                    name="form-textbox-password"
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
                                New Password
                            </Text>
                        </View>

                        <Text
                            style={{
                                color: theme.colors.text,
                                textAlign: 'center',
                                marginBottom: 20,
                            }}
                        >
                            Create a new password for your account
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
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

                        <TextInput
                            mode="outlined"
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            error={!!errorMessage && errorMessage.includes('match')}
                            left={<TextInput.Icon icon="lock-check" color={theme.colors.secondary}/>}
                            style={[
                                authStyles.inputContainer,
                                {backgroundColor: theme.colors.surface, marginTop: 10}
                            ]}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                            placeholderTextColor={theme.colors.placeholder}
                        />

                        <Button
                            mode="contained"
                            onPress={handleResetPassword}
                            loading={loading}
                            contentStyle={{paddingVertical: 8}}
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={{
                                borderRadius: 12,
                                marginTop: 20,
                                marginBottom: 10,
                                shadowColor: theme.colors.accent,
                                shadowOffset: {width: 0, height: 4},
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            {loading ? 'Updating...' : 'Reset Password'}
                        </Button>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                        <IconButton
                            icon="chevron-left"
                            iconColor={theme.colors.secondary}
                            size={28}
                            style={{position: 'absolute', top: 10, left: 10}}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push('/login');
                            }}
                        />

                        {/* Step indicator */}
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                            {[1, 2, 3].map((step) => (
                                <View
                                    key={step}
                                    style={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: step === currentStep ? theme.colors.secondary : theme.colors.primary,
                                        margin: 5,
                                    }}
                                />
                            ))}
                        </View>

                        {renderStepContent()}

                        {errorMessage ? (
                            <HelperText type="error" visible={!!errorMessage} style={{color: theme.colors.error}}>
                                {errorMessage}
                            </HelperText>
                        ) : null}

                        {successMessage ? (
                            <HelperText type="info" visible={!!successMessage} style={{color: '#4CAF50'}}>
                                {successMessage}
                            </HelperText>
                        ) : null}

                        <View style={{ marginTop: 'auto' }}>
                            <Divider style={{ backgroundColor: theme.colors.primary, opacity: 0.3, marginVertical: 20 }} />

                            <Link href="/login" asChild>
                                <Button
                                    mode="text"
                                    onPress={() => Haptics.selectionAsync()}
                                    textColor={theme.colors.secondary}
                                >
                                    Back to Login
                                </Button>
                            </Link>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}