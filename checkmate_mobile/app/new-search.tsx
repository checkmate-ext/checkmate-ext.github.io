import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, useTheme, ActivityIndicator, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from './context/AuthContext';
import { moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import { API_URL } from './constants/Config';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { authStyles } from './styles/auth';

export default function NewSearch() {
    const { token } = useAuth();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
    });

    const validateUrl = (input) => {
        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
        return urlPattern.test(input);
    };

    const handleAnalyzeArticle = async () => {
        if (!url) {
            setError('Please enter a URL');
            return;
        }

        if (!validateUrl(url)) {
            setError('Please enter a valid URL');
            return;
        }

        try {
            setLoading(true);
            setError('');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const response = await axios.post(
                `${API_URL}/scrap_and_search`,
                { url },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data && response.data.article) {
                // Find the article ID from the backend response
                // This depends on how your backend structures the response
                const articleId = response.data.article_id || "1"; // Fallback ID
                console.log('article_id: ', articleId);
                // Navigate to the article detail screen
                router.push(`/article/${articleId}`);

                // Reset the form
                setUrl('');
            } else {
                setError('Failed to analyze the article. Please try again.');
            }

        } catch (error) {
            console.error('Error analyzing article:', error);
            setError('An error occurred while analyzing the article. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const handleExampleUrl = (exampleUrl) => {
        setUrl(exampleUrl);
        setError('');
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
                                }}
                                mode="outlined"
                                style={styles.input}
                                placeholder="https://example.com/article"
                                left={<TextInput.Icon icon="link" color={theme.colors.secondary} />}
                                textColor={theme.colors.text}
                                outlineColor={theme.colors.primary}
                                activeOutlineColor={theme.colors.secondary}
                                error={!!error}
                            />

                            {error ? <Text style={styles.error}>{error}</Text> : null}

                            <Button
                                mode="contained"
                                onPress={handleAnalyzeArticle}
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
        </LinearGradient>
    );
}