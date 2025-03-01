import {View, Animated, ScrollView, Image, RefreshControl, TouchableOpacity, StyleSheet} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useState, useRef, useEffect} from 'react';
import {
    Button,
    Text,
    useTheme,
    Card,
    FAB,
    ActivityIndicator,
    Divider,
    IconButton,
    ProgressBar
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';
import {moderateScale} from 'react-native-size-matters';
import {authStyles} from '../styles/auth';
import axios from 'axios';
import {API_URL} from '../constants/Config';
import {router} from 'expo-router';

// Helper function to format dates
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

export default function Home() {
    const {signOut, user, token, validateToken} = useAuth();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState(null);
    const [recentArticles, setRecentArticles] = useState([]);

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
        },
    };

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

        // Fetch user stats when component mounts
        if(token){
            fetchUserStats();
        }
    }, [token]);

    const fetchUserStats = async () => {
        try {
            setLoading(true);
            console.log('home token:',token)

            const response = await axios.get(`${API_URL}/user/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Ensure numeric values are proper numbers
            const processedData = {
                ...response.data,
                articles_analyzed_daily: Number(response.data.articles_analyzed_daily) || 0,
                total_articles: Number(response.data.total_articles) || 0,
                daily_limit: Number(response.data.daily_limit) || 1, // Default to 1 to avoid division by zero
                weekly_accuracy: Number(response.data.weekly_accuracy) || 0
            };

            setStats(processedData);
            setRecentArticles(response.data.articles || []);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchUserStats();
    };

    const handleLogout = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setLoading(true);
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Logout error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    const handleArticlePress = (articleId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/article/${articleId}`);
    };

    const handleStatisticsPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/stats');
    };

    // Safe calculation for progress value
    const calculateProgress = () => {
        if (!stats || !stats.daily_limit || stats.daily_limit === 0) {
            return 0;
        }

        const articlesAnalyzed = Number(stats.articles_analyzed_daily) || 0;
        const dailyLimit = Number(stats.daily_limit);

        // Ensure the progress is between 0 and 1
        return Math.min(Math.max(articlesAnalyzed / dailyLimit, 0), 1);
    };

    // Safe calculation for progress color
    const getProgressColor = () => {
        if (!stats || !stats.daily_limit || stats.daily_limit === 0) {
            return theme.colors.secondary;
        }

        const articlesAnalyzed = Number(stats.articles_analyzed_daily) || 0;
        const dailyLimit = Number(stats.daily_limit);

        return (articlesAnalyzed / dailyLimit > 0.8) ? '#F44336' : theme.colors.secondary;
    };

    // Function to safely get the weekly accuracy with fallback
    const getWeeklyAccuracy = () => {
        if (!stats || stats.weekly_accuracy === undefined || stats.weekly_accuracy === null) {
            return 0;
        }
        return Number(stats.weekly_accuracy);
    };

    const renderArticleCard = (article) => (
        <TouchableOpacity
            key={article.id}
            onPress={() => handleArticlePress(article.id)}
            activeOpacity={0.7}
        >
            <Card
                style={[
                    styles.articleCard,
                    {
                        borderLeftColor: getScoreColor(article.reliability_score),
                    }
                ]}
            >
                <Card.Content>
                    <Text
                        variant="titleMedium"
                        style={{
                            color: theme.colors.text,
                            marginBottom: 4,
                            fontWeight: '500'
                        }}
                        numberOfLines={2}
                    >
                        {article.title}
                    </Text>
                    <Text
                        variant="bodySmall"
                        style={{
                            color: theme.colors.placeholder,
                            marginBottom: 8,
                        }}
                    >
                        {formatDate(article.created_at)}
                    </Text>
                    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                            <Text
                                variant="labelMedium"
                                style={{color: theme.colors.secondary}}
                            >
                                Reliability:
                            </Text>
                            <Text
                                variant="bodyMedium"
                                style={{
                                    color: getScoreColor(article.reliability_score),
                                    marginLeft: 4,
                                    fontWeight: 'bold'
                                }}
                            >
                                {article.reliability_score}%
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

    // Function to determine color based on score - safely handle non-numeric values
    const getScoreColor = (score) => {
        const numericScore = Number(score) || 0;
        if (numericScore >= 80) return '#4CAF50'; // Green
        if (numericScore >= 60) return '#FFC107'; // Yellow/Amber
        return '#F44336'; // Red
    };

    const styles = StyleSheet.create({
        container: {
            opacity: 1,
            padding: moderateScale(24),
        },
        sectionTitle: {
            fontSize: moderateScale(22),
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: moderateScale(15),
        },
        card: {
            backgroundColor: theme.colors.surface,
            marginBottom: moderateScale(20),
            borderRadius: moderateScale(15),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
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
        statContainer: {
            flex: 1,
            alignItems: 'center',
            padding: moderateScale(10),
        },
        statValue: {
            fontSize: moderateScale(28),
            fontWeight: 'bold',
            color: theme.colors.secondary,
        },
        statLabel: {
            fontSize: moderateScale(14),
            color: theme.colors.text,
        },
        divider: {
            backgroundColor: theme.colors.primary,
            opacity: 0.3,
            marginVertical: moderateScale(10),
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: moderateScale(15),
        },
        usageLabel: {
            fontSize: moderateScale(14),
            color: theme.colors.text,
        },
        button: {
            borderRadius: moderateScale(12),
            marginTop: moderateScale(15),
        },
        viewAllButton: {
            color: theme.colors.secondary,
        },
        fab: {
            position: 'absolute',
            margin: moderateScale(16),
            right: 0,
            bottom: 0,
            backgroundColor: theme.colors.accent,
        }
    });

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.secondary}
                        colors={[theme.colors.secondary]}
                    />
                }
            >
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: fadeAnim,
                            transform: [
                                {translateY: slideAnim},
                                {scale: scaleAnim}
                            ],
                        }
                    ]}
                >
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: moderateScale(15)
                    }}>
                        <Animated.View
                            style={{
                                transform: [{scale: scaleAnim}],
                                shadowColor: theme.colors.secondary,
                                shadowOffset: {width: 0, height: 0},
                                shadowRadius: moderateScale(8),
                                shadowOpacity: 0.2,
                            }}
                        >
                            <Image
                                source={require('../../assets/images/logo_no_title.png')}
                                style={{
                                    width: moderateScale(40),
                                    height: moderateScale(40),
                                }}
                                resizeMode="contain"
                            />
                        </Animated.View>
                        <Text
                            variant="titleMedium"
                            style={{
                                color: theme.colors.secondary,
                                marginLeft: moderateScale(10),
                                textShadowColor: theme.colors.accent,
                                textShadowOffset: {width: 0, height: 0},
                                textShadowRadius: 2,
                            }}
                        >
                            Welcome, {user?.email?.split('@')[0] || 'User'}
                        </Text>
                    </View>

                    {/* Statistics Overview Card */}
                    <Card
                        style={styles.card}
                    >
                        <Card.Content>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <Text
                                    variant="titleLarge"
                                    style={{color: theme.colors.text, marginBottom: 10}}
                                >
                                    Dashboard
                                </Text>
                                <IconButton
                                    icon="chart-bar"
                                    mode="contained-tonal"
                                    size={20}
                                    onPress={handleStatisticsPress}
                                    containerColor={theme.colors.accent}
                                    iconColor={theme.colors.text}
                                />
                            </View>

                            {loading && !stats ? (
                                <ActivityIndicator
                                    color={theme.colors.secondary}
                                    style={{marginVertical: 20}}
                                />
                            ) : stats ? (
                                <>
                                    <View style={styles.statsRow}>
                                        <View style={styles.statContainer}>
                                            <Text
                                                variant="displaySmall"
                                                style={styles.statValue}
                                            >
                                                {stats.articles_analyzed_daily}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.statLabel}>
                                                Today
                                            </Text>
                                        </View>
                                        <View style={{width: 1, backgroundColor: theme.colors.primary, opacity: 0.3}} />
                                        <View style={styles.statContainer}>
                                            <Text
                                                variant="displaySmall"
                                                style={styles.statValue}
                                            >
                                                {stats.total_articles}
                                            </Text>
                                            <Text variant="bodySmall" style={styles.statLabel}>
                                                Total
                                            </Text>
                                        </View>
                                    </View>

                                    <Divider style={styles.divider} />

                                    <View style={{marginVertical: moderateScale(10)}}>
                                        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                            <Text variant="bodyMedium" style={styles.usageLabel}>
                                                Daily Usage
                                            </Text>
                                            <Text
                                                variant="bodyMedium"
                                                style={{color: theme.colors.secondary}}
                                            >
                                                {stats.articles_analyzed_daily}/{stats.daily_limit}
                                            </Text>
                                        </View>
                                        <ProgressBar
                                            progress={calculateProgress()}
                                            color={getProgressColor()}
                                            style={{height: moderateScale(6), marginTop: moderateScale(6), borderRadius: moderateScale(3)}}
                                        />
                                    </View>

                                    <View style={{marginTop: 10}}>
                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                            <Text variant="bodyMedium" style={{color: theme.colors.text}}>
                                                Weekly Accuracy
                                            </Text>
                                            <Text
                                                variant="bodyMedium"
                                                style={{color: getScoreColor(getWeeklyAccuracy())}}
                                            >
                                                {getWeeklyAccuracy().toFixed(1)}%
                                            </Text>
                                        </View>
                                    </View>
                                </>
                            ) : (
                                <Text
                                    variant="bodyLarge"
                                    style={{color: theme.colors.text, marginVertical: 10}}
                                >
                                    No stats available
                                </Text>
                            )}

                            <Button
                                mode="outlined"
                                onPress={handleStatisticsPress}
                                icon="chart-line"
                                style={[
                                    styles.button,
                                    {
                                        borderColor: theme.colors.secondary,
                                    }
                                ]}
                                textColor={theme.colors.secondary}
                            >
                                View Full Statistics
                            </Button>
                        </Card.Content>
                    </Card>

                    {/* Recent Articles Section */}
                    <View style={{marginBottom: moderateScale(20)}}>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: moderateScale(15)
                        }}>
                            <Text
                                variant="titleLarge"
                                style={styles.sectionTitle}
                            >
                                Recent Articles
                            </Text>
                            <Button
                                mode="text"
                                onPress={() => router.push('/(tabs)/history')}
                                textColor={theme.colors.secondary}
                            >
                                See All
                            </Button>
                        </View>

                        {loading && recentArticles.length === 0 ? (
                            <ActivityIndicator color={theme.colors.secondary} style={{marginVertical: moderateScale(20)}} />
                        ) : recentArticles.length > 0 ? (
                            recentArticles.slice(0, 3).map(article => renderArticleCard(article))
                        ) : (
                            <Card style={[styles.card, {padding: moderateScale(15)}]}>
                                <Text style={{color: theme.colors.text, textAlign: 'center'}}>
                                    No recent articles found
                                </Text>
                            </Card>
                        )}
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleLogout}
                        loading={loading}
                        icon="logout"
                        contentStyle={{paddingVertical: moderateScale(8)}}
                        buttonColor={theme.colors.accent}
                        textColor={theme.colors.text}
                        style={[
                            authStyles.primaryButton,
                            {
                                marginTop: moderateScale(10),
                                marginBottom: moderateScale(20)
                            }
                        ]}
                    >
                        {loading ? 'Logging out...' : 'Logout'}
                    </Button>
                </Animated.View>
            </ScrollView>

            <FAB
                icon="magnify"
                style={styles.fab}
                color={theme.colors.text}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/new-search');
                }}
            />
        </LinearGradient>
    );
}