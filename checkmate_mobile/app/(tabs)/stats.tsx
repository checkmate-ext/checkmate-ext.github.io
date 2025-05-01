// app/(tabs)/stats.tsx - Fixed chart labels and distribution data
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import {
    Text,
    Card,
    useTheme,
    ActivityIndicator,
    Button,
    Divider,
    SegmentedButtons,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import * as Haptics from 'expo-haptics';
import { BarChart } from 'react-native-chart-kit';
import { authStyles } from '../styles/auth';
import ResponsiveUtils from '../utils/ResponsiveUtils';

export default function Stats() {
    const { token } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('week');
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));
    const paperTheme = useTheme();

    // Watch for dimension changes
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

    // Fetch stats from API
    const fetchStats = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/user/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) fetchStats();
    }, [fetchStats, token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    // Local color palette
    const colors = {
        primary: '#8B7355',
        secondary: '#D2B48C',
        accent: '#6B4423',
        background: '#1A1612',
        surface: '#2A241E',
        text: '#E8DCC4',
    };

    // Dynamic sizing based on screen dimensions
    const isSmallScreen = dimensions.width < 350;
    const isMediumScreen = dimensions.width >= 350 && dimensions.width < 400;
    const isLowHeight = dimensions.height < 700;

    // Dynamic padding
    const containerPadding = ResponsiveUtils.getResponsivePadding();

    // Chart dimensions - respond to screen size
    const chartWidth = Math.min(dimensions.width * 0.85, 700);
    const chartHeight = isLowHeight ? 180 : Math.min(dimensions.height * 0.25, 220);

    // Vertical spacing adjustment
    const verticalSpacing = isLowHeight ? 12 : 16;

    // Score color helper
    const getScoreColor = (score: number) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FFC107';
        return '#F44336';
    };

    // Enhanced date formatting for limited space
    const formatDate = (dateString: string, format: 'day' | 'week' | 'month' | 'year') => {
        const date = new Date(dateString);

        // For small screens, abbreviate further
        if (isSmallScreen) {
            if (format === 'day') {
                // Just show day number for very small screens
                return date.getDate().toString();
            } else if (format === 'month') {
                // Just month abbreviation for small screens
                return date.toLocaleDateString('en-US', { month: 'short' });
            }
        } else if (isMediumScreen) {
            if (format === 'day') {
                // Short month + day for medium screens
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '\n');
            } else if (format === 'month') {
                // Just month for medium screens
                return date.toLocaleDateString('en-US', { month: 'short' });
            }
        }

        // Normal formatting for larger screens
        if (format === 'month') {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (format === 'year') {
            // For quarterly data, we expect the key to be in format "Q1 2023"
            return dateString; // Already formatted on the backend
        } else if (format === 'day') {
            // Break the date onto multiple lines to fit better
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).replace(' ', '\n');
        }

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Prepare chart data
    const prepareChartData = (dataObj: Record<string, number> | undefined, format: 'day' | 'week' | 'month' | 'year') => {
        if (!dataObj) return null;
        const dates = Object.keys(dataObj).sort();
        if (dates.length < 2) return null;

        // For small screens, limit the number of labels shown
        let labels;
        if ((isSmallScreen || isMediumScreen) && dates.length > 4) {
            // For many data points on small screens, show fewer labels
            const step = Math.ceil(dates.length / 4);
            labels = dates.filter((_, i) => i % step === 0 || i === dates.length - 1).map(d => formatDate(d, format));
        } else {
            labels = dates.map(d => formatDate(d, format));
        }

        const values = dates.map(d => dataObj[d] || 0);
        return { labels, datasets: [{ data: values }] };
    };

    // Determine the appropriate bar width based on screen size and data length
    const getBarWidth = (dataLength: number) => {
        if (isSmallScreen) {
            return dataLength > 5 ? 15 : 20;
        } else if (isMediumScreen) {
            return dataLength > 6 ? 20 : 30;
        }
        return dataLength > 8 ? 30 : 40;
    };

    const chartConfig = {
        backgroundColor: colors.surface,
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 0,
        color: () => colors.secondary,
        labelColor: () => colors.text,
        style: { borderRadius: 16 },
        propsForDots: { r: '6', strokeWidth: '2', stroke: colors.accent },
        // Adjust for smaller screens
        propsForLabels: {
            fontSize: isSmallScreen ? 8 : isMediumScreen ? 9 : 10,
            // Determine label width based on screen size
            width: isSmallScreen ? 30 : isMediumScreen ? 35 : 40,
            // Allow labels to wrap onto multiple lines
            allowFontScaling: false,
        },
        // Improve bar spacing
        barPercentage: 0.7,
    };

    // Render statistics card
    const renderStatCard = () => {
        if (!stats) return null;
        let articlesAnalyzed = stats.articles_analyzed_daily || 0;
        let avgAccuracy = stats.daily_accuracy || 0;

        if (timeframe === 'week') {
            articlesAnalyzed = stats.articles_analyzed_weekly || 0;
            avgAccuracy = stats.weekly_accuracy || 0;
        } else if (timeframe === 'month') {
            articlesAnalyzed = stats.articles_analyzed_monthly || 0;
            avgAccuracy = stats.monthly_accuracy || 0;
        } else if (timeframe === 'year') {
            articlesAnalyzed = stats.articles_analyzed_yearly || 0;
            avgAccuracy = stats.yearly_accuracy || 0;
        }

        return (
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.cardTitle}>Usage Statistics</Text>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>
                            Articles Analyzed ({timeframe === 'week' ? 'This Week' :
                            timeframe === 'month' ? 'This Month' :
                                timeframe === 'year' ? 'This Year' : 'Today'})
                        </Text>
                        <Text style={styles.statValue}>{articlesAnalyzed}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Daily Limit</Text>
                        <Text style={styles.statValue}>{stats.daily_limit || 0}</Text>
                    </View>
                    <Divider style={styles.divider} />
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Total Articles Analyzed</Text>
                        <Text style={styles.statValue}>{stats.total_articles || 0}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>
                            {timeframe === 'week' ? 'Weekly' :
                                timeframe === 'month' ? 'Monthly' :
                                    timeframe === 'year' ? 'Yearly' : 'Daily'} Average Accuracy
                        </Text>
                        <Text style={[
                            styles.statValue,
                            { color: getScoreColor(avgAccuracy * 100) }
                        ]}>
                            {(avgAccuracy * 100).toFixed(1)}%
                        </Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Subscription Plan</Text>
                        <Text style={[
                            styles.statValue,
                            { color: stats.subscription_plan === 'Premium' ? '#4CAF50' : colors.secondary }
                        ]}>
                            {stats.subscription_plan || 'Free'}
                        </Text>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    // Render distribution chart
    const renderDistributionChart = () => {
        if (!stats) return null;
        let dataObj, title, format;

        // Match frontend timeframes with the correct backend data objects
        if (timeframe === 'day') {
            // Daily timeframe shows daily_distribution which contains data from the past week
            dataObj = stats.daily_distribution;
            title = 'Daily Articles (Past Week)';
            format = 'day';
        } else if (timeframe === 'week') {
            // Weekly timeframe shows weekly_distribution which contains data from the past 4 weeks
            dataObj = stats.weekly_distribution;
            title = 'Weekly Articles (Past Month)';
            format = 'week';
        } else if (timeframe === 'month') {
            // Monthly timeframe shows monthly_distribution which contains data from the past year
            dataObj = stats.monthly_distribution;
            title = 'Monthly Articles (Past Year)';
            format = 'month';
        } else if (timeframe === 'year') {
            // Yearly timeframe shows quarterly_distribution which groups data by quarters
            dataObj = stats.quarterly_distribution;
            title = 'Quarterly Articles (Past Year)';
            format = 'year';
        }

        if (!dataObj) {
            return (
                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>{title}</Text>
                        <Text style={styles.noDataText}>No data available</Text>
                    </Card.Content>
                </Card>
            );
        }

        const data = prepareChartData(dataObj, format);

        if (!data) {
            return (
                <Card style={styles.chartCard}>
                    <Card.Content>
                        <Text style={styles.chartTitle}>{title}</Text>
                        <Text style={styles.noDataText}>Not enough data</Text>
                    </Card.Content>
                </Card>
            );
        }

        // Calculate chart width based on number of data points and screen size
        const dateCount = Object.keys(dataObj).length;
        const barWidth = getBarWidth(dateCount);
        const minWidth = Math.max(chartWidth, dateCount * barWidth);

        const verticalLabelRotation = isSmallScreen ? 0 : 0; // No rotation allows multi-line labels to work

        return (
            <Card style={styles.chartCard}>
                <Card.Content>
                    <Text style={styles.chartTitle}>{title}</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={styles.chartContainer}
                    >
                        <BarChart
                            data={data}
                            width={minWidth}
                            height={chartHeight}
                            chartConfig={chartConfig}
                            verticalLabelRotation={verticalLabelRotation}
                            fromZero
                            showValuesOnTopOfBars
                            withInnerLines={!isSmallScreen}
                            yAxisLabel=""
                            yAxisSuffix=""
                        />
                    </ScrollView>
                </Card.Content>
            </Card>
        );
    };

    const styles = StyleSheet.create({
        flex: {
            flex: 1
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
        },
        container: {
            flexGrow: 1,
            padding: containerPadding
        },
        card: {
            backgroundColor: colors.surface,
            marginBottom: verticalSpacing,
            borderRadius: ResponsiveUtils.moderateScale(12),
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5
        },
        cardTitle: {
            fontSize: ResponsiveUtils.normalizeFont(isSmallScreen ? 16 : 18),
            fontWeight: 'bold',
            color: colors.secondary,
            marginBottom: verticalSpacing * 0.8
        },
        statRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginVertical: isLowHeight ? 4 : 8,
            flexWrap: 'wrap'  // Allow wrapping on very small screens
        },
        statLabel: {
            fontSize: ResponsiveUtils.normalizeFont(isSmallScreen ? 12 : 14),
            color: colors.text,
            flex: 1,
            paddingRight: 8  // Give space for the value
        },
        statValue: {
            fontSize: ResponsiveUtils.normalizeFont(isSmallScreen ? 12 : 14),
            fontWeight: 'bold',
            color: colors.secondary,
            textAlign: 'right'
        },
        divider: {
            backgroundColor: colors.primary,
            opacity: 0.3,
            marginVertical: verticalSpacing * 0.75
        },
        chartCard: {
            backgroundColor: colors.surface,
            marginBottom: verticalSpacing,
            borderRadius: ResponsiveUtils.moderateScale(12),
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
            overflow: 'hidden'  // Ensure content doesn't overflow rounded corners
        },
        chartTitle: {
            fontSize: ResponsiveUtils.normalizeFont(isSmallScreen ? 14 : 16),
            fontWeight: 'bold',
            color: colors.secondary,
            marginBottom: verticalSpacing * 0.8
        },
        chartContainer: {
            paddingBottom: isLowHeight ? 8 : 12,
            alignItems: 'center',
            paddingHorizontal: 4
        },
        noDataText: {
            color: colors.text,
            textAlign: 'center',
            padding: verticalSpacing,
            fontSize: ResponsiveUtils.normalizeFont(isSmallScreen ? 12 : 14)
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: containerPadding
        },
        errorText: {
            color: colors.text,
            fontSize: ResponsiveUtils.normalizeFont(16),
            textAlign: 'center',
            marginBottom: verticalSpacing * 1.2
        },
        segment: {
            marginBottom: verticalSpacing,
            backgroundColor: colors.surface,
            borderRadius: ResponsiveUtils.moderateScale(8),
            // Adjust for small screens
            height: isSmallScreen ? 36 : undefined
        },
        segmentButton: (active: boolean) => ({
            backgroundColor: active ? colors.accent : colors.surface,
            // For smaller screens, reduce padding
            paddingHorizontal: isSmallScreen ? 4 : 8,
        }),
        segmentLabel: {
            fontSize: ResponsiveUtils.normalizeFont(isSmallScreen ? 10 : 12),
        }
    });

    // Loading or error states
    if (loading && !stats) {
        return (
            <LinearGradient
                colors={[colors.background, colors.surface]}
                style={styles.centered}
            >
                <ActivityIndicator color={colors.secondary} size="large" />
            </LinearGradient>
        );
    }

    if (!stats) {
        return (
            <LinearGradient
                colors={[colors.background, colors.surface]}
                style={styles.flex}
            >
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No statistics available.</Text>
                    <Button
                        mode="contained"
                        onPress={fetchStats}
                        loading={loading}
                        buttonColor={colors.accent}
                        textColor={colors.text}
                        style={[authStyles.primaryButton, {width: dimensions.width * 0.6}]} // Responsive width
                    >
                        Try Again
                    </Button>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={[colors.background, colors.surface]}
            style={styles.flex}
        >
            <SafeAreaView style={styles.flex}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.secondary}
                            colors={[colors.secondary]}
                        />
                    }
                >
                    <SegmentedButtons
                        value={timeframe}
                        onValueChange={value => {
                            setTimeframe(value as any);
                            Haptics.selectionAsync();
                        }}
                        buttons={[
                            {
                                value: 'day',
                                label: 'Day',
                                style: styles.segmentButton(timeframe === 'day'),
                                labelStyle: styles.segmentLabel
                            },
                            {
                                value: 'week',
                                label: 'Week',
                                style: styles.segmentButton(timeframe === 'week'),
                                labelStyle: styles.segmentLabel
                            },
                            {
                                value: 'month',
                                label: 'Month',
                                style: styles.segmentButton(timeframe === 'month'),
                                labelStyle: styles.segmentLabel
                            },
                            {
                                value: 'year',
                                label: 'Year',
                                style: styles.segmentButton(timeframe === 'year'),
                                labelStyle: styles.segmentLabel
                            },
                        ]}
                        style={styles.segment}
                        density={isSmallScreen ? "small" : "medium"}
                    />

                    {renderStatCard()}
                    {renderDistributionChart()}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}