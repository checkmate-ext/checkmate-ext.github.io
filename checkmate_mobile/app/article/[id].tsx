import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking, Share } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button, Divider, IconButton, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import * as Haptics from 'expo-haptics';
import { authStyles } from '../styles/auth';

export default function ArticleDetailScreen() {
    const { id } = useLocalSearchParams();
    const { token } = useAuth();
    const [articleData, setArticleData] = useState(null);
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
            shadowOffset: {width: 0, height: 4},
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
        scoreBox: {
            flex: 1,
            alignItems: 'center',
            padding: moderateScale(10),
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: moderateScale(8),
            marginHorizontal: moderateScale(5),
        },
        scoreValue: {
            fontSize: moderateScale(24),
            fontWeight: 'bold',
            marginBottom: moderateScale(5),
        },
        scoreLabel: {
            fontSize: moderateScale(12),
            color: theme.colors.text,
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
        actionButton: {
            flex: 1,
            marginHorizontal: moderateScale(5),
        },
        backButton: {
            position: 'absolute',
            top: moderateScale(10),
            left: moderateScale(10),
            zIndex: 10,
        }
    });

    useEffect(() => {
        fetchArticleData();
    }, [id]);

    const fetchArticleData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/article/${id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setArticleData(response.data);
        } catch (error) {
            console.error('Error fetching article data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#4CAF50'; // Green
        if (score >= 60) return '#FFC107'; // Yellow/Amber
        return '#F44336'; // Red
    };

    const handleOpenArticle = async (url) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await Linking.openURL(url);
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    const handleShareArticle = async () => {
        if (!articleData || !articleData.article) return;

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await Share.share({
                message: `Check out this article: ${articleData.article.title}\n${articleData.article.url}\n\nReliability Score: ${articleData.reliability_score}%`,
                url: articleData.article.url,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    if (loading) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
            >
                <ActivityIndicator color={theme.colors.secondary} size="large" />
            </LinearGradient>
        );
    }

    if (!articleData || !articleData.article) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: moderateScale(20)}}
            >
                <Text style={{color: theme.colors.text, textAlign: 'center', marginBottom: moderateScale(20)}}>
                    Unable to load article details.
                </Text>
                <Button
                    mode="contained"
                    onPress={fetchArticleData}
                    buttonColor={theme.colors.accent}
                    textColor={theme.colors.text}
                    style={authStyles.primaryButton}
                >
                    Try Again
                </Button>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
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

            <ScrollView style={{marginTop: moderateScale(40)}}>
                <View style={styles.container}>
                    <Text style={styles.title}>
                        {articleData.article.title}
                    </Text>

                    <TouchableOpacity onPress={() => handleOpenArticle(articleData.article.url)}>
                        <Text style={styles.articleUrl} numberOfLines={1}>
                            {articleData.article.url}
                        </Text>
                    </TouchableOpacity>

                    {/* Reliability Scores Card */}
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Reliability Analysis</Text>

                        <View style={styles.scoreContainer}>
                            <View style={styles.scoreBox}>
                                <Text
                                    style={[
                                        styles.scoreValue,
                                        {color: getScoreColor(articleData.reliability_score)}
                                    ]}
                                >
                                    {articleData.reliability_score}%
                                </Text>
                                <Text style={styles.scoreLabel}>Reliability</Text>
                            </View>

                            <View style={styles.scoreBox}>
                                <Text
                                    style={[
                                        styles.scoreValue,
                                        {color: getScoreColor(articleData.website_credibility || 70)}
                                    ]}
                                >
                                    {articleData.website_credibility || '—'}%
                                </Text>
                                <Text style={styles.scoreLabel}>Credibility</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Analysis Summary</Text>
                        <Text style={{color: theme.colors.text, marginBottom: moderateScale(10)}}>
                            This article has a {articleData.reliability_score >= 80 ? 'high' :
                            articleData.reliability_score >= 60 ? 'moderate' : 'low'} reliability score,
                            indicating {articleData.reliability_score >= 80 ? 'trustworthy content with well-verified information.' :
                            articleData.reliability_score >= 60 ? 'generally reliable content with some potential concerns.' :
                                'potential issues with accuracy or bias in the information presented.'}
                        </Text>

                        <View style={styles.buttonRow}>
                            <Button
                                mode="outlined"
                                icon="open-in-new"
                                onPress={() => handleOpenArticle(articleData.article.url)}
                                style={[styles.actionButton, {borderColor: theme.colors.secondary}]}
                                textColor={theme.colors.secondary}
                            >
                                Open
                            </Button>

                            <Button
                                mode="outlined"
                                icon="share-variant"
                                onPress={handleShareArticle}
                                style={[styles.actionButton, {borderColor: theme.colors.secondary, marginLeft: moderateScale(10)}]}
                                textColor={theme.colors.secondary}
                            >
                                Share
                            </Button>
                        </View>
                    </Card>

                    {/* Similar Articles Card */}
                    <Card style={styles.card}>
                        <Text style={styles.cardTitle}>Similar Articles</Text>

                        {articleData.similar_articles && articleData.similar_articles.length > 0 ? (
                            <>
                                {(expandedSimilar ? articleData.similar_articles : articleData.similar_articles.slice(0, 3)).map((article, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handleOpenArticle(article.url)}
                                        style={styles.similarArticleCard}
                                    >
                                        <Text style={styles.similarArticleTitle} numberOfLines={2}>
                                            {article.title}
                                        </Text>
                                        <Text style={styles.similarArticleUrl} numberOfLines={1}>
                                            {article.url}
                                        </Text>
                                        <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                                            <Text
                                                style={[
                                                    styles.similarityScore,
                                                    {color: getScoreColor(article.similarity_score * 100)}
                                                ]}
                                            >
                                                Similarity: {Math.round(article.similarity_score * 100)}%
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}

                                {articleData.similar_articles.length > 3 && (
                                    <Button
                                        mode="text"
                                        onPress={() => {
                                            Haptics.selectionAsync();
                                            setExpandedSimilar(!expandedSimilar);
                                        }}
                                        textColor={theme.colors.secondary}
                                    >
                                        {expandedSimilar ? 'Show Less' : `Show All (${articleData.similar_articles.length})`}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Text style={{color: theme.colors.text, textAlign: 'center', padding: moderateScale(10)}}>
                                No similar articles found.
                            </Text>
                        )}
                    </Card>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}