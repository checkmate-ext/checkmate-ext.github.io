// app/new-search.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, ActivityIndicator, IconButton, Banner, Snackbar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './context/AuthContext';
import { useDeepLinkContext } from './context/DeepLinkContext';
import { useLocalSearchParams } from 'expo-router';
import { moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import { API_URL } from './constants/Config';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { authStyles } from './styles/auth';

export default function NewSearch() {
    const { token } = useAuth();
    const { handleAnalyzeUrl } = useDeepLinkContext();
    const { sharedUrl } = useLocalSearchParams();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSharedUrl, setIsSharedUrl] = useState(false);
    const [showBanner, setShowBanner] = useState(false);
    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');

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
        },
    };

    const styles = StyleSheet.create({
        container: {
            padding: moderateScale(20),
            flex: 1,
            justifyContent: 'center',
        },
        title: {
            fontSize: moderateScale(24),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            textAlign: 'center',
            marginBottom: moderateScale(30),
        },
        subtitle: {
            fontSize: moderateScale(16),
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: moderateScale(30),
        },
        input: {
            marginBottom: moderateScale(20),
            backgroundColor: theme.colors.surface,
        },
        card: {
            backgroundColor: theme.colors.surface,
            marginBottom: moderateScale(20),
            borderRadius: moderateScale(15),
            padding: moderateScale(15),
        },
        cardTitle: {
            fontSize: moderateScale(18),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: moderateScale(10),
        },
        buttonContainer: {
            marginTop: moderateScale(10),
        },
        error: {
            color: '#F44336',
            textAlign: 'center',
            marginTop: moderateScale(10),
        },
        exampleUrl: {
            color: theme.colors.secondary,
            textDecorationLine: 'underline',
            padding: moderateScale(5),
        },
        recentHeader: {
            fontSize: moderateScale(18),
            fontWeight: 'bold',
            color: theme.colors.text,
            marginTop: moderateScale(30),
            marginBottom: moderateScale(15),
        },
        banner: {
            backgroundColor: theme.colors.surface,
            marginBottom: moderateScale(15),
            borderRadius: moderateScale(8),
        },
        bannerContent: {
            backgroundColor: theme.colors.surface,
        },
    });

    // Handle shared URLs
    useEffect(() => {
        // Handle the case where sharedUrl might be an array
        const urlToUse = Array.isArray(sharedUrl) ? sharedUrl[0] : sharedUrl;

        if (urlToUse) {
            const decodedUrl = decodeURIComponent(urlToUse);
            setUrl(decodedUrl);
            setIsSharedUrl(true);
            setShowBanner(true);
            setSnackMessage('URL received from another app');
            setSnackVisible(true);

            // Optionally auto-analyze
            if (token && decodedUrl) {
                handleAnalyzeArticle(decodedUrl);
            }
        }

        // Check for initial URL (in case deep linking opened the app)
        const checkInitialUrl = async () => {
            try {
                const initialUrl = await Linking.getInitialURL();
                if (initialUrl) {
                    console.log('App opened with URL:', initialUrl);

                    // Extract actual URL from deep link
                    let extractedUrl = initialUrl;
                    if (initialUrl.startsWith('checkmate://')) {
                        extractedUrl = initialUrl.replace('checkmate://', '');
                        extractedUrl = decodeURIComponent(extractedUrl);

                        setUrl(extractedUrl);
                        setIsSharedUrl(true);
                        setShowBanner(true);
                        setSnackMessage('URL received via deep link');
                        setSnackVisible(true);

                        // Optionally auto-analyze
                        if (token) {
                            handleAnalyzeArticle(extractedUrl);
                        }
                    }
                }
            } catch (e) {
                console.error('Error checking initial URL:', e);
            }
        };

        checkInitialUrl();

        // Set up listener for incoming links while app is open
        const subscription = Linking.addEventListener('url', (event) => {
            if (event.url) {
                console.log('Received URL while app is running:', event.url);

                let extractedUrl = event.url;
                if (event.url.startsWith('checkmate://')) {
                    extractedUrl = event.url.replace('checkmate://', '');
                    extractedUrl = decodeURIComponent(extractedUrl);

                    setUrl(extractedUrl);
                    setIsSharedUrl(true);
                    setShowBanner(true);
                    setSnackMessage('URL received via deep link');
                    setSnackVisible(true);
                }
            }
        });

        // Use the proper cleanup method depending on what Linking.addEventListener returns
        return () => {
            // If subscription has a remove method
            if (subscription && typeof subscription.remove === 'function') {
                subscription.remove();
            }
            // For newer Expo versions (SDK 48+)
            else if (subscription) {
                subscription();
            }
        };
    }, [sharedUrl, token]);

    // Removed validateUrl function

    const handleAnalyzeArticle = async (articleUrl = null) => {
        const urlToAnalyze = articleUrl || url;

        if (!urlToAnalyze) {
            setError('Please enter something to analyze');
            return;
        }

        // Removed URL validation check

        try {
            setLoading(true);
            setError('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const response = await axios.post(
                `${API_URL}/scrap_and_search`,
                { url: urlToAnalyze },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Always check for article_id in the response
            if (response.data && response.data.article_id) {
                console.log('Article analyzed successfully, ID:', response.data.article_id);

                // Provide success feedback
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Navigate to the article detail screen with the correct ID
                router.push(`/article/${response.data.article_id}`);

                // Reset the form if it wasn't a shared URL
                if (!isSharedUrl) {
                    setUrl('');
                }

                setIsSharedUrl(false);
                setShowBanner(false);
            } else {
                console.error('Missing article_id in response:', response.data);
                setError('Failed to analyze the article. Please try again.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }

        } catch (error) {
            console.error('Error analyzing article:', error);
            setError(error.response?.data?.error || 'An error occurred while analyzing the article. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const handleExampleUrl = (exampleUrl) => {
        setUrl(exampleUrl);
        setError('');
        setIsSharedUrl(false);
    };

    const handleClearUrl = () => {
        setUrl('');
        setError('');
        setIsSharedUrl(false);
        setShowBanner(false);
    };

    const handlePasteUrl = async () => {
        try {
            // Use getStringAsync instead of getString
            const clipboardContent = await Clipboard.getStringAsync();
            // Removed validation check for clipboard content
            setUrl(clipboardContent);
            setError('');
            Haptics.selectionAsync();
        } catch (error) {
            console.error('Error accessing clipboard:', error);
            setError('Failed to paste from clipboard');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
                    <View style={styles.container}>
                        <IconButton
                            icon="chevron-left"
                            iconColor={theme.colors.secondary}
                            size={30}
                            style={{position: 'absolute', top: moderateScale(10), left: moderateScale(10)}}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.back();
                            }}
                        />

                        {/* Add a banner for shared URLs */}
                        {showBanner && (
                            <Banner
                                visible={showBanner}
                                icon="link-variant"
                                actions={[
                                    {
                                        label: 'Clear',
                                        onPress: handleClearUrl,
                                    },
                                    {
                                        label: 'Analyze',
                                        onPress: () => handleAnalyzeArticle(),
                                    }
                                ]}
                                style={styles.banner}
                                contentStyle={styles.bannerContent}
                            >
                                <Text style={{color: theme.colors.text}}>
                                    URL shared from external app
                                </Text>
                            </Banner>
                        )}

                        <Text style={styles.title}>Analyze Article</Text>
                        <Text style={styles.subtitle}>
                            Enter the URL of an article to analyze its reliability and credibility
                        </Text>

                        <Card style={styles.card}>
                            <TextInput
                                label="Article URL"
                                value={url}
                                onChangeText={(text) => {
                                    setUrl(text);
                                    setError('');
                                    if (isSharedUrl) {
                                        setIsSharedUrl(false);
                                    }
                                }}
                                mode="outlined"
                                style={styles.input}
                                placeholder="https://example.com/article"
                                left={<TextInput.Icon icon="link" color={theme.colors.secondary} />}
                                right={
                                    url ? (
                                        <TextInput.Icon
                                            icon="close-circle"
                                            color={theme.colors.secondary}
                                            onPress={handleClearUrl}
                                        />
                                    ) : (
                                        <TextInput.Icon
                                            icon="content-paste"
                                            color={theme.colors.secondary}
                                            onPress={handlePasteUrl}
                                        />
                                    )
                                }
                                textColor={theme.colors.text}
                                outlineColor={theme.colors.primary}
                                activeOutlineColor={theme.colors.secondary}
                                error={!!error}
                            />

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <Button
                                mode="contained"
                                onPress={() => handleAnalyzeArticle()}
                                loading={loading}
                                disabled={loading}
                                style={[authStyles.primaryButton, styles.buttonContainer]}
                                buttonColor={theme.colors.accent}
                                textColor={theme.colors.text}
                                icon="magnify"
                            >
                                {loading ? 'Analyzing...' : 'Analyze'}
                            </Button>
                        </Card>

                        <Card style={styles.card}>
                            <Text style={styles.cardTitle}>Example URLs</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <Text
                                    style={styles.exampleUrl}
                                    onPress={() => handleExampleUrl('https://www.bbc.com/news/world-us-canada-60485943')}
                                >
                                    https://www.bbc.com/news
                                </Text>
                                <Text
                                    style={styles.exampleUrl}
                                    onPress={() => handleExampleUrl('https://www.nytimes.com/2023/05/15/world/europe/ukraine-russia-war.html')}
                                >
                                    https://www.nytimes.com
                                </Text>
                                <Text
                                    style={styles.exampleUrl}
                                    onPress={() => handleExampleUrl('https://edition.cnn.com/2023/05/15/politics/biden-debt-ceiling-meeting-preview/index.html')}
                                >
                                    https://edition.cnn.com
                                </Text>
                            </ScrollView>
                        </Card>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Snackbar
                visible={snackVisible}
                onDismiss={() => setSnackVisible(false)}
                duration={3000}
                style={{
                    backgroundColor: theme.colors.surface,
                }}
                action={{
                    label: 'OK',
                    onPress: () => setSnackVisible(false),
                    color: theme.colors.secondary,
                }}
            >
                <Text style={{color: theme.colors.text}}>
                    {snackMessage}
                </Text>
            </Snackbar>
        </LinearGradient>
    );
}