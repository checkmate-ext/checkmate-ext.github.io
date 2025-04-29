import {View, Animated, KeyboardAvoidingView, Platform, ScrollView, Dimensions, StyleSheet, SafeAreaView} from 'react-native';
import {Link, router} from 'expo-router';
import {useState, useRef, useEffect} from 'react';
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
import ResponsiveUtils from '../utils/ResponsiveUtils';
import createResponsiveStyles from '../styles/responsive-styles';

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

    // Get responsive styles and track dimensions
    const responsiveStyles = createResponsiveStyles(theme);
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });

        return () => {
            if (typeof subscription?.remove === 'function') {
                subscription.remove();
            }
        };
    }, []);

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
    const slideAnim = useRef(new Animated.Value(ResponsiveUtils.moderateScale(50))).current;
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

    // Create responsive styles specific to this component
    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: ResponsiveUtils.moderateScale(24),
            paddingTop: dimensions.height > 700
                ? ResponsiveUtils.moderateScale(30)
                : ResponsiveUtils.moderateScale(15),
            width: '100%',
            maxWidth: 600,
            alignSelf: 'center',
            justifyContent: 'center',
        },
        logoContainer: {
            alignItems: 'center',
            marginBottom: dimensions.height > 700
                ? ResponsiveUtils.moderateScale(40)
                : ResponsiveUtils.moderateScale(20),
        },
        title: {
            fontSize: ResponsiveUtils.normalizeFont(28),
            fontWeight: 'bold',
            marginTop: ResponsiveUtils.moderateScale(16),
        },
        inputContainer: {
            marginBottom: ResponsiveUtils.moderateScale(16),
            backgroundColor: theme.colors.surface,
        },
        stepIndicator: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginBottom: ResponsiveUtils.moderateScale(10)
        },
        stepDot: {
            width: ResponsiveUtils.moderateScale(10),
            height: ResponsiveUtils.moderateScale(10),
            borderRadius: ResponsiveUtils.moderateScale(5),
            margin: ResponsiveUtils.moderateScale(5),
        },
        backButton: {
            position: 'absolute',
            top: ResponsiveUtils.moderateScale(10),
            left: ResponsiveUtils.moderateScale(10),
            zIndex: 10,
        },
        actionButton: {
            borderRadius: ResponsiveUtils.moderateScale(12),
            marginTop: ResponsiveUtils.moderateScale(20),
            marginBottom: ResponsiveUtils.moderateScale(20),
            paddingVertical: ResponsiveUtils.moderateScale(8),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        instructionText: {
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: ResponsiveUtils.moderateScale(20),
            fontSize: ResponsiveUtils.normalizeFont(14),
        },
        emailHighlight: {
            color: theme.colors.secondary,
            textAlign: 'center',
            fontWeight: 'bold',
            marginBottom: ResponsiveUtils.moderateScale(20),
            fontSize: ResponsiveUtils.normalizeFont(14),
        },
        footer: {
            marginTop: 'auto',
            paddingTop: ResponsiveUtils.moderateScale(20),
        },
        divider: {
            backgroundColor: theme.colors.primary,
            opacity: 0.3,
            marginVertical: ResponsiveUtils.moderateScale(20)
        },
        formContent: {
            width: '100%',
        },
        iconContainer: {
            transform: [{scale: 1}], // Will be animated
            shadowColor: theme.colors.secondary,
            shadowOffset: {width: 0, height: 0},
            shadowRadius: ResponsiveUtils.moderateScale(20),
            shadowOpacity: 0.3,
        },
        iconSize: {
            width: ResponsiveUtils.moderateScale(90),
            height: ResponsiveUtils.moderateScale(90),
        },
        errorText: {
            color: theme.colors.error,
            textAlign: 'center',
            marginTop: ResponsiveUtils.moderateScale(8),
        },
        successText: {
            color: '#4CAF50',
            textAlign: 'center',
            marginTop: ResponsiveUtils.moderateScale(8),
        }
    });

    // Render different content based on the current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Email input step
                return (
                    <>
                        <View style={styles.logoContainer}>
                            <Animated.View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name="lock-reset"
                                    size={ResponsiveUtils.moderateScale(90)}
                                    color={theme.colors.secondary}
                                />
                            </Animated.View>
                            <Text
                                variant="displaySmall"
                                style={[
                                    styles.title,
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

                        <Text style={styles.instructionText}>
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
                            style={styles.inputContainer}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                            placeholderTextColor={theme.colors.placeholder}
                        />

                        <Button
                            mode="contained"
                            onPress={handleSendVerificationCode}
                            loading={loading}
                            contentStyle={{paddingVertical: ResponsiveUtils.moderateScale(8)}}
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={styles.actionButton}
                        >
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </Button>
                    </>
                );

            case 2: // Verification code step
                return (
                    <>
                        <View style={styles.logoContainer}>
                            <Animated.View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name="numeric"
                                    size={ResponsiveUtils.moderateScale(90)}
                                    color={theme.colors.secondary}
                                />
                            </Animated.View>
                            <Text
                                variant="displaySmall"
                                style={[
                                    styles.title,
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

                        <Text style={styles.instructionText}>
                            We've sent a verification code to:
                        </Text>
                        <Text style={styles.emailHighlight}>
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
                            style={styles.inputContainer}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                            placeholderTextColor={theme.colors.placeholder}
                        />

                        <Button
                            mode="contained"
                            onPress={handleVerifyCode}
                            loading={loading}
                            contentStyle={{paddingVertical: ResponsiveUtils.moderateScale(8)}}
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={styles.actionButton}
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
                        <View style={styles.logoContainer}>
                            <Animated.View style={styles.iconContainer}>
                                <MaterialCommunityIcons
                                    name="form-textbox-password"
                                    size={ResponsiveUtils.moderateScale(90)}
                                    color={theme.colors.secondary}
                                />
                            </Animated.View>
                            <Text
                                variant="displaySmall"
                                style={[
                                    styles.title,
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

                        <Text style={styles.instructionText}>
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
                            style={styles.inputContainer}
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
                                styles.inputContainer,
                                {marginTop: ResponsiveUtils.moderateScale(10)}
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
                            contentStyle={{paddingVertical: ResponsiveUtils.moderateScale(8)}}
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={styles.actionButton}
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
            <SafeAreaView style={{flex: 1}}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{flex: 1}}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
                >
                    <ScrollView
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: dimensions.height < 700 ? 'flex-start' : 'center'
                        }}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Animated.View
                            style={[
                                styles.container,
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
                                size={ResponsiveUtils.moderateScale(28)}
                                style={styles.backButton}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/login');
                                }}
                            />

                            {/* Step indicator */}
                            <View style={styles.stepIndicator}>
                                {[1, 2, 3].map((step) => (
                                    <View
                                        key={step}
                                        style={[
                                            styles.stepDot,
                                            {
                                                backgroundColor: step === currentStep
                                                    ? theme.colors.secondary
                                                    : theme.colors.primary,
                                            }
                                        ]}
                                    />
                                ))}
                            </View>

                            <View style={styles.formContent}>
                                {renderStepContent()}

                                {errorMessage ? (
                                    <Text style={styles.errorText}>
                                        {errorMessage}
                                    </Text>
                                ) : null}

                                {successMessage ? (
                                    <Text style={styles.successText}>
                                        {successMessage}
                                    </Text>
                                ) : null}
                            </View>

                            <View style={styles.footer}>
                                <Divider style={styles.divider} />

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
            </SafeAreaView>
        </LinearGradient>
    );
}