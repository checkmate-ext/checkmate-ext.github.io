import {View, Animated, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Dimensions, StyleSheet} from 'react-native';
import {Link} from 'expo-router';
import {useAuth} from '../context/AuthContext';
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
import ResponsiveUtils from '../utils/ResponsiveUtils';
import createResponsiveStyles from '../styles/responsive-styles';

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

    // Get responsive styles
    const responsiveStyles = createResponsiveStyles(theme);

    // Get screen dimensions
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });

        return () => {
            // Clean up based on RN version
            if (typeof subscription?.remove === 'function') {
                subscription.remove();
            }
        };
    }, []);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const {signIn} = useAuth();

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

    // Create responsive styles for this component
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
        form: {
            width: '100%',
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
        buttonContainer: {
            marginTop: ResponsiveUtils.moderateScale(20),
        },
        divider: {
            backgroundColor: theme.colors.primary,
            opacity: 0.2,
            marginVertical: ResponsiveUtils.moderateScale(20),
        },
        socialButtonsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            marginVertical: ResponsiveUtils.moderateScale(16),
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: ResponsiveUtils.moderateScale(20),
        },
        errorText: {
            color: theme.colors.error,
            marginTop: ResponsiveUtils.moderateScale(8),
        },
        iconContainer: {
            transform: [{scale: 1}], // Will be animated
            shadowColor: theme.colors.secondary,
            shadowOffset: {width: 0, height: 0},
            shadowRadius: ResponsiveUtils.moderateScale(20),
            shadowOpacity: 0.3,
        },
        actionButton: {
            borderRadius: ResponsiveUtils.moderateScale(12),
            paddingVertical: ResponsiveUtils.moderateScale(8),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
    });

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
                            <View style={styles.logoContainer}>
                                <Animated.View style={styles.iconContainer}>
                                    <MaterialCommunityIcons
                                        name="magnify"
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
                                    Welcome
                                </Text>
                            </View>

                            <View style={styles.form}>
                                <TextInput
                                    mode="outlined"
                                    label="Email"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    error={!!errorMessage && errorMessage.includes('email')}
                                    left={<TextInput.Icon icon="email" color={theme.colors.secondary}/>}
                                    style={styles.inputContainer}
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
                                    style={styles.inputContainer}
                                    textColor={theme.colors.text}
                                    outlineColor={theme.colors.primary}
                                    activeOutlineColor={theme.colors.secondary}
                                    placeholderTextColor={theme.colors.placeholder}
                                />

                                {errorMessage ? (
                                    <HelperText type="error" visible={!!errorMessage} style={styles.errorText}>
                                        {errorMessage}
                                    </HelperText>
                                ) : null}

                                <View style={styles.buttonContainer}>
                                    <Button
                                        mode="contained"
                                        onPress={handleLogin}
                                        loading={loading}
                                        contentStyle={{paddingVertical: ResponsiveUtils.moderateScale(8)}}
                                        buttonColor={theme.colors.accent}
                                        textColor={theme.colors.text}
                                        style={styles.actionButton}
                                    >
                                        {loading ? 'Logging in' : 'Login'}
                                    </Button>

                                    <Link href="/forgot-password" asChild>
                                        <Button
                                            mode="text"
                                            onPress={() => Haptics.selectionAsync()}
                                            textColor={theme.colors.secondary}
                                            style={{marginTop: ResponsiveUtils.moderateScale(8)}}
                                        >
                                            Forgot Password?
                                        </Button>
                                    </Link>
                                </View>

                                <Divider style={styles.divider}/>

                                <View style={styles.socialButtonsContainer}>
                                    <IconButton
                                        icon="google"
                                        mode="contained-tonal"
                                        size={ResponsiveUtils.moderateScale(24)}
                                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                        containerColor={theme.colors.surface}
                                        iconColor={theme.colors.secondary}
                                    />
                                </View>

                                <View style={styles.footer}>
                                    <Text
                                        variant="bodyLarge"
                                        style={{
                                            color: theme.colors.text,
                                            fontSize: ResponsiveUtils.normalizeFont(16)
                                        }}
                                    >
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
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}