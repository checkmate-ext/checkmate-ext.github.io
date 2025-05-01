// app/article/[id].tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Linking,
    Share,
    Platform
} from 'react-native';
import {
    Text,
    Card,
    useTheme,
    ActivityIndicator,
    Button,
    Divider,
    IconButton,
    ProgressBar
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useDeepLinkContext } from '../context/DeepLinkContext';
import { useLocalSearchParams, router } from 'expo-router';
import { moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import * as Haptics from 'expo-haptics';
import { authStyles } from '../styles/auth';
import ShareExtension from '../components/ShareExtension';

export default function ArticleDetailScreen() {
    const { id } = useLocalSearchParams();
    const { token } = useAuth();
    const { generateShareUrl } = useDeepLinkContext();

    const [articleData, setArticleData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedSimilar, setExpandedSimilar] = useState(false);

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
        },
        title: {
            fontSize: moderateScale(22),
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: moderateScale(15),
        },
        articleUrl: {
            fontSize: moderateScale(14),
            color: theme.colors.secondary,
            marginBottom: moderateScale(5),
            textDecorationLine: 'underline',
        },
        card: {
            backgroundColor: theme.colors.surface,
            marginBottom: moderateScale(20),
            borderRadius: moderateScale(15),
            padding: moderateScale(15),
            shadowColor: theme.colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
        },
        cardTitle: {
            fontSize: moderateScale(18),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: moderateScale(10),
        },
        scoreContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: moderateScale(15),
        },
        objectivityScoreBox: {
            flex: 1,
            alignItems: 'center',
            padding: moderateScale(10),
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: moderateScale(8),
            marginTop: moderateScale(10),
        },
        biasContainer: {
            marginTop: moderateScale(15),
            padding: moderateScale(10),
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: moderateScale(8),
        },
        sectionTitle: {
            fontSize: moderateScale(16),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginVertical: moderateScale(10),
        },
        similarArticleCard: {
            backgroundColor: 'rgba(0,0,0,0.1)',
            padding: moderateScale(12),
            borderRadius: moderateScale(8),
            marginBottom: moderateScale(10),
        },
        similarArticleTitle: {
            fontSize: moderateScale(14),
            color: theme.colors.text,
            marginBottom: moderateScale(5),
        },
        similarArticleUrl: {
            fontSize: moderateScale(12),
            color: theme.colors.secondary,
            marginBottom: moderateScale(5),
        },
        similarityScore: {
            fontSize: moderateScale(12),
            fontWeight: 'bold',
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: moderateScale(15),
        },
        backButton: {
            position: 'absolute',
            top: moderateScale(10),
            left: moderateScale(10),
            zIndex: 10,
        },
        credibilityBanner: {
            alignItems: 'center',
            justifyContent: 'center',
            padding: moderateScale(10),
            marginBottom: moderateScale(15),
            borderRadius: moderateScale(8),
            borderWidth: 1,
        },
        credibilityBannerGreen: {
            backgroundColor: 'rgba(46, 204, 113, 0.15)',
            borderColor: 'rgba(46, 204, 113, 0.3)',
        },
        credibilityBannerNeutral: {
            backgroundColor: 'rgba(241, 196, 15, 0.15)',
            borderColor: 'rgba(241, 196, 15, 0.3)',
        },
        credibilityBannerRed: {
            backgroundColor: 'rgba(231, 76, 60, 0.15)',
            borderColor: 'rgba(231, 76, 60, 0.3)',
        },
        credibilityText: {
            fontSize: moderateScale(13),
            fontWeight: '600',
            textAlign: 'center',
        },
        credibilityTextGreen: { color: '#27ae60' },
        credibilityTextNeutral: { color: '#f39c12' },
        credibilityTextRed: { color: '#c0392b' },
    });

    useEffect(() => {
        if (id) fetchArticle();
    }, [id]);

    const fetchArticle = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/article/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setArticleData(res.data);
        } catch (e) {
            console.error('Error fetching article data:', e);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 0.8) return '#4CAF50';
        if (score >= 0.6) return '#FFC107';
        return '#F44336';
    };

    const getCredibilityStatus = (val: number) => {
        switch (val) {
            case 0:
                return {
                    status: 'Credible',
                    style: [styles.credibilityBanner, styles.credibilityBannerGreen],
                    textStyle: [styles.credibilityText, styles.credibilityTextGreen],
                };
            case 2:
                return {
                    status: 'Unreliable',
                    style: [styles.credibilityBanner, styles.credibilityBannerRed],
                    textStyle: [styles.credibilityText, styles.credibilityTextRed],
                };
            default:
                return {
                    status: 'Mixed',
                    style: [styles.credibilityBanner, styles.credibilityBannerNeutral],
                    textStyle: [styles.credibilityText, styles.credibilityTextNeutral],
                };
        }
    };

    const handleOpen = async (link: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await Linking.openURL(link);
    };

    const handleShareArticle = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const link = articleData.article.url;
        const deepLink = generateShareUrl(link);
        const baseMsg = `Check the reliability of this article with CheckMate:\n\n${articleData.article.title}\n\n`;

        try {
            if (Platform.OS === 'ios') {
                await Share.share({
                    title: 'Article Analysis from CheckMate',
                    message: baseMsg,
                    url: deepLink || link,
                });
            } else {
                await Share.share({
                    title: 'Article Analysis from CheckMate',
                    message: `${baseMsg}${deepLink || link}`,
                });
            }
        } catch (e) {
            console.error('Error sharing article:', e);
        }
    };

    if (loading) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            >
                <ActivityIndicator size="large" color={theme.colors.secondary} />
            </LinearGradient>
        );
    }

    if (!articleData?.article) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: moderateScale(20) }}
            >
                <Text style={{ color: theme.colors.text, textAlign: 'center', marginBottom: moderateScale(20) }}>
                    Unable to load article details.
                </Text>
                <Button
                    mode="contained"
                    onPress={fetchArticle}
                    buttonColor={theme.colors.accent}
                    textColor={theme.colors.text}
                    style={authStyles.primaryButton}
                >
                    Try Again
                </Button>
            </LinearGradient>
        );
    }

    const { status, style: bannerStyle, textStyle } =
        getCredibilityStatus(articleData.website_credibility);

    return (
        <LinearGradient colors={['#1A1612', '#241E19', '#2A241E']} style={{ flex: 1 }}>
            <IconButton
                icon="chevron-left"
                iconColor={theme.colors.secondary}
                size={28}
                style={styles.backButton}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                }}
            />

            <ScrollView style={{ marginTop: moderateScale(40) }}>
                <View style={styles.container}>
                    <Text style={styles.title}>{articleData.article.title}</Text>

                    <TouchableOpacity onPress={() => handleOpen(articleData.article.url)}>
                        <Text style={styles.articleUrl} numberOfLines={1}>
                            {articleData.article.url}
                        </Text>
                    </TouchableOpacity>

                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Reliability Analysis</Text>

                        <View style={bannerStyle}>
                            <Text style={textStyle}>Website Credibility: {status}</Text>
                        </View>

                        <View style={styles.scoreContainer}>
                            <View style={styles.objectivityScoreBox}>
                                <Text
                                    style={{
                                        fontSize: moderateScale(24),
                                        fontWeight: 'bold',
                                        color: getScoreColor(articleData.reliability_score),
                                    }}
                                >
                                    {Math.round(articleData.reliability_score * 100)}%
                                </Text>
                                <Text style={{ fontSize: moderateScale(12), color: theme.colors.text }}>
                                    Reliability
                                </Text>
                            </View>
                        </View>

                        {articleData.objectivity_score != null && (
                            <View style={styles.objectivityScoreBox}>
                                <Text
                                    style={{
                                        fontSize: moderateScale(24),
                                        fontWeight: 'bold',
                                        color: getScoreColor(articleData.objectivity_score),
                                    }}
                                >
                                    {Math.round(articleData.objectivity_score * 100)}%
                                </Text>
                                <Text style={{ fontSize: moderateScale(12), color: theme.colors.text }}>
                                    Objectivity
                                </Text>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>Analysis Summary</Text>
                        <Text style={{ color: theme.colors.text, marginBottom: moderateScale(10) }}>
                            This article has a{' '}
                            {articleData.reliability_score >= 0.8
                                ? 'high'
                                : articleData.reliability_score >= 0.6
                                    ? 'moderate'
                                    : 'low'}{' '}
                            reliability score, indicating{' '}
                            {articleData.reliability_score >= 0.8
                                ? 'trustworthy content.'
                                : articleData.reliability_score >= 0.6
                                    ? 'generally reliable content.'
                                    : 'potential issues with accuracy or bias.'}
                        </Text>

                        <View style={styles.buttonRow}>
                            <Button
                                mode="outlined"
                                icon="open-in-new"
                                onPress={() => handleOpen(articleData.article.url)}
                                style={{ flex: 1, marginRight: moderateScale(5) }}
                                textColor={theme.colors.secondary}
                            >
                                Open Article
                            </Button>
                            <Button
                                mode="outlined"
                                icon="share-variant"
                                onPress={handleShareArticle}
                                style={{ flex: 1, marginLeft: moderateScale(5) }}
                                textColor={theme.colors.secondary}
                            >
                                Share
                            </Button>
                        </View>
                    </Card>

                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Similar Articles</Text>
                        {articleData.similar_articles?.length > 0 ? (
                            <>
                                {(expandedSimilar
                                        ? articleData.similar_articles
                                        : articleData.similar_articles.slice(0, 3)
                                ).map((sim, idx) => (
                                    <TouchableOpacity
                                        key={idx}
                                        onPress={() => handleOpen(sim.url)}
                                        style={styles.similarArticleCard}
                                    >
                                        <Text style={styles.similarArticleTitle} numberOfLines={2}>
                                            {sim.title}
                                        </Text>
                                        <Text style={styles.similarArticleUrl} numberOfLines={1}>
                                            {sim.url}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Text
                                                style={[
                                                    styles.similarityScore,
                                                    { color: getScoreColor(sim.similarity_score) }
                                                ]}
                                            >
                                                Similarity: {Math.round(sim.similarity_score * 100)}%
                                            </Text>
                                            <ShareExtension url={sim.url} title={sim.title} compact />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                                {articleData.similar_articles.length > 3 && (
                                    <Button
                                        mode="text"
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setExpandedSimilar((v) => !v);
                                        }}
                                        textColor={theme.colors.secondary}
                                    >
                                        {expandedSimilar ? 'Show Less' : `Show All (${articleData.similar_articles.length})`}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Text style={{ color: theme.colors.text, textAlign: 'center', padding: moderateScale(10) }}>
                                No similar articles found.
                            </Text>
                        )}
                    </Card>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}
