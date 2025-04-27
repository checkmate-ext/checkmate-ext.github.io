import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Text, Card, useTheme, Searchbar, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { moderateScale } from 'react-native-size-matters';

// Helper function to format dates
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export default function History() {
    const { token } = useAuth();
    const [articles, setArticles] = useState([]);
    const [filteredArticles, setFilteredArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

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
            paddingBottom: 0,
            flex: 1,
        },
        title: {
            fontSize: moderateScale(28),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: moderateScale(20),
        },
        searchBar: {
            backgroundColor: theme.colors.surface,
            marginBottom: moderateScale(15),
            borderRadius: moderateScale(12),
        },
        chipsContainer: {
            flexDirection: 'row',
            marginBottom: moderateScale(15),
            flexWrap: 'wrap',
        },
        chip: {
            marginRight: moderateScale(8),
            marginBottom: moderateScale(8),
        },
        articleCard: {
            backgroundColor: theme.colors.surface,
            marginBottom: moderateScale(12),
            borderRadius: moderateScale(12),
            borderLeftWidth: 4,
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        articleTitle: {
            color: theme.colors.text,
            marginBottom: moderateScale(4),
            fontWeight: '500',
        },
        articleDate: {
            color: theme.colors.placeholder,
            marginBottom: moderateScale(8),
        },
        statsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        reliabilityLabel: {
            color: theme.colors.secondary,
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: moderateScale(50),
        },
        emptyText: {
            color: theme.colors.text,
            fontSize: moderateScale(16),
            textAlign: 'center',
        },
    });

    useEffect(() => {
        fetchArticles();
    }, []);

    useEffect(() => {
        filterArticles();
    }, [searchQuery, activeFilter, articles]);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/user/searches`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && response.data.data) {
                // Sort by date (newest first)
                const sortedArticles = response.data.data.sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at)
                );
                setArticles(sortedArticles);
                setFilteredArticles(sortedArticles);
            }
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchArticles();
    };

    const filterArticles = () => {
        let filtered = [...articles];

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply reliability filter
        if (activeFilter === 'high') {
            filtered = filtered.filter(article => article.reliability_score >= 75);
        } else if (activeFilter === 'medium') {
            filtered = filtered.filter(article => article.reliability_score >= 50 && article.reliability_score < 75);
        } else if (activeFilter === 'low') {
            filtered = filtered.filter(article => article.reliability_score < 50);
        }

        setFilteredArticles(filtered);
    };

    const handleArticlePress = (articleId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/article/${articleId}`);
    };

    // Function to determine color based on score
    const getScoreColor = (score) => {
        if (score >= 75) return '#4CAF50'; // Green
        if (score >= 50) return '#FFC107'; // Yellow/Amber
        return '#F44336'; // Red
    };

    const renderArticleItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => handleArticlePress(item.id)}
            activeOpacity={0.7}
        >
            <Card
                style={[
                    styles.articleCard,
                    { borderLeftColor: getScoreColor((item.reliability_score*100).toFixed(2)) }
                ]}
            >
                <Card.Content>
                    <Text
                        variant="titleMedium"
                        style={styles.articleTitle}
                        numberOfLines={2}
                    >
                        {item.title}
                    </Text>
                    <Text
                        variant="bodySmall"
                        style={styles.articleDate}
                    >
                        {formatDate(item.created_at)}
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text
                                variant="labelMedium"
                                style={styles.reliabilityLabel}
                            >
                                Reliability:
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={{
                                    color: getScoreColor((item.reliability_score*100).toFixed(2)),
                                    marginLeft: moderateScale(4),
                                    fontWeight: 'bold'
                                }}
                            >
                                {(item.reliability_score*100).toFixed(2)}%
                            </Text>
                        </View>
                        <IconButton
                            icon="chevron-right"
                            iconColor={theme.colors.secondary}
                            size={20}
                        />
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                {searchQuery || activeFilter !== 'all'
                    ? 'No articles match your search criteria'
                    : 'No articles found. Start analyzing articles to see them here!'}
            </Text>
        </View>
    );

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <View style={styles.container}>
                <Searchbar
                    placeholder="Search articles"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor={theme.colors.placeholder}
                    iconColor={theme.colors.secondary}
                    inputStyle={{color: theme.colors.text}}
                    style={styles.searchBar}
                />

                <View style={styles.chipsContainer}>
                    <Chip
                        selected={activeFilter === 'all'}
                        onPress={() => setActiveFilter('all')}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: activeFilter === 'all'
                                    ? theme.colors.accent
                                    : theme.colors.surface
                            }
                        ]}
                        textStyle={{
                            color: theme.colors.text
                        }}
                    >
                        All
                    </Chip>
                    <Chip
                        selected={activeFilter === 'high'}
                        onPress={() => setActiveFilter('high')}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: activeFilter === 'high'
                                    ? '#4CAF50'
                                    : theme.colors.surface
                            }
                        ]}
                        textStyle={{
                            color: activeFilter === 'high'
                                ? '#fff'
                                : theme.colors.text
                        }}
                    >
                        High Reliability
                    </Chip>
                    <Chip
                        selected={activeFilter === 'medium'}
                        onPress={() => setActiveFilter('medium')}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: activeFilter === 'medium'
                                    ? '#FFC107'
                                    : theme.colors.surface
                            }
                        ]}
                        textStyle={{
                            color: activeFilter === 'medium'
                                ? '#000'
                                : theme.colors.text
                        }}
                    >
                        Medium Reliability
                    </Chip>
                    <Chip
                        selected={activeFilter === 'low'}
                        onPress={() => setActiveFilter('low')}
                        style={[
                            styles.chip,
                            {
                                backgroundColor: activeFilter === 'low'
                                    ? '#F44336'
                                    : theme.colors.surface
                            }
                        ]}
                        textStyle={{
                            color: activeFilter === 'low'
                                ? '#fff'
                                : theme.colors.text
                        }}
                    >
                        Low Reliability
                    </Chip>
                </View>

                {loading && !refreshing ? (
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <ActivityIndicator color={theme.colors.secondary} size="large" />
                    </View>
                ) : (
                    <FlatList
                        data={filteredArticles}
                        renderItem={renderArticleItem}
                        keyExtractor={(item) => item.id.toString()}
                        ListEmptyComponent={renderEmptyList}
                        contentContainerStyle={{paddingBottom: moderateScale(80)}}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.colors.secondary}
                                colors={[theme.colors.secondary]}
                            />
                        }
                    />
                )}
            </View>
        </LinearGradient>
    );
}