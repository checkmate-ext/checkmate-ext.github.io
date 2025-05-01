// app/(tabs)/stats.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, Dimensions, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import * as Haptics from 'expo-haptics';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { authStyles } from '../styles/auth';
import ResponsiveUtils from '../utils/ResponsiveUtils';

export default function Stats() {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'year'
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));
    const [error, setError] = useState(null);

    // Update dimensions when screen size changes (e.g. rotation)
    useEffect(() => {
        // Safe way to handle dimension changes that works in development and production
        const updateDimensions = ({ window }) => {
            setDimensions(window);
        };

        const subscription = Dimensions.addEventListener('change', updateDimensions);

        return () => {
            if (subscription) {
                try {
                    // Handle both older and newer RN versions
                    if (typeof subscription.remove === 'function') {
                        subscription.remove();
                    } else {
                        // Modern approach
                        subscription();
                    }
                } catch (err) {
                    // Silent catch to prevent crashes
                }
            }
        };
    }, []);

    const { width: screenWidth, height: screenHeight } = dimensions;
    // Calculate chart width with safe margins
    const chartWidth = screenWidth - ResponsiveUtils.horizontalScale(40);
    const chartHeight = Math.min(220, screenHeight * 0.25);

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
            padding: ResponsiveUtils.moderateScale(16),
            flex: 1,
        },
        card: {
            backgroundColor: theme.colors.surface,
            marginBottom: ResponsiveUtils.moderateScale(16),
            borderRadius: ResponsiveUtils.moderateScale(15),
            padding: ResponsiveUtils.moderateScale(15),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
        },
        cardTitle: {
            fontSize: ResponsiveUtils.normalizeFont(18),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: ResponsiveUtils.moderateScale(10),
        },
        statRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: ResponsiveUtils.moderateScale(8),
        },
        statLabel: {
            fontSize: ResponsiveUtils.normalizeFont(14),
            color: theme.colors.text,
            flex: 1, // Allow label to wrap on smaller screens
        },
        statValue: {
            fontSize: ResponsiveUtils.normalizeFont(14),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            paddingLeft: ResponsiveUtils.moderateScale(4),
        },
        divider: {
            backgroundColor: theme.colors.primary,
            opacity: 0.3,
            marginVertical: ResponsiveUtils.moderateScale(10),
        },
        chartCard: {
            backgroundColor: theme.colors.surface,
            marginBottom: ResponsiveUtils.moderateScale(20),
            borderRadius: ResponsiveUtils.moderateScale(15),
            padding: ResponsiveUtils.moderateScale(15),
            alignItems: 'center',
        },
        chartTitle: {
            fontSize: ResponsiveUtils.normalizeFont(16),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: ResponsiveUtils.moderateScale(15),
            alignSelf: 'flex-start',
        },
        noDataContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: ResponsiveUtils.moderateScale(20),
        },
        noDataText: {
            color: theme.colors.text,
            fontSize: ResponsiveUtils.normalizeFont(16),
            textAlign: 'center',
            marginBottom: ResponsiveUtils.moderateScale(20),
        },
        timeframeSelector: {
            marginBottom: ResponsiveUtils.moderateScale(16),
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: ResponsiveUtils.moderateScale(20),
        },
        errorText: {
            color: theme.colors.text,
            fontSize: ResponsiveUtils.normalizeFont(16),
            textAlign: 'center',
            marginBottom: ResponsiveUtils.moderateScale(20),
        }
    });

    const fetchStats = useCallback(async () => {
        if (!token) {
            setLoading(false);
            setRefreshing(false);
            setError("No authentication token found. Please login again.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`${API_URL}/user/stats`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 10000 // 10 second timeout
            });

            // Make sure we received valid data
            if (response.data) {
                // Process and clean data to prevent rendering issues
                const cleanedData = {
                    // Apply default values for potentially missing fields
                    articles_analyzed_daily: Number(response.data.articles_analyzed_daily || 0),
                    articles_analyzed_weekly: Number(response.data.articles_analyzed_weekly || 0),
                    articles_analyzed_monthly: Number(response.data.articles_analyzed_monthly || 0),
                    total_articles: Number(response.data.total_articles || 0),
                    daily_limit: Number(response.data.daily_limit || 1),
                    daily_accuracy: Number(response.data.daily_accuracy || 0),
                    weekly_accuracy: Number(response.data.weekly_accuracy || 0),
                    monthly_accuracy: Number(response.data.monthly_accuracy || 0),
                    subscription_plan: response.data.subscription_plan || 'Free',

                    // Handle distribution data with extra care
                    daily_distribution: response.data.daily_distribution || {},
                    weekly_distribution: response.data.weekly_distribution || {},
                    monthly_distribution: response.data.monthly_distribution || {},

                    // Optional fields that might be present
                    articles: response.data.articles || []
                };

                setStats(cleanedData);
            } else {
                setError("Received invalid data format from server");
            }
        } catch (error) {
            // Detailed error handling
            if (error.response) {
                // Server responded with an error status
                setError(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
            } else if (error.request) {
                // Request was made but no response received
                setError("Network error: Could not connect to the server");
            } else {
                // Something else went wrong
                setError(`Error: ${error.message || 'Unknown error occurred'}`);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchStats();
        }
    }, [fetchStats, token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    // Function to determine color based on score
    const getScoreColor = (score) => {
        const numericScore = Number(score) || 0;
        if (numericScore >= 80) return '#4CAF50'; // Green
        if (numericScore >= 60) return '#FFC107'; // Yellow/Amber
        return '#F44336'; // Red
    };

    // Helper function to format date for display
    const formatDate = (dateString, format) => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return ''; // Invalid date

            if (format === 'month') {
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            } else if (format === 'week') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        } catch (e) {
            return ''; // Handle date formatting errors gracefully
        }
    };

    // Convert distribution data to chart format
    const prepareChartData = (distributionData, format) => {
        if (!stats || !distributionData) return null;

        try {
            // Ensure distributionData is an object with date keys
            if (typeof distributionData !== 'object' || distributionData === null) {
                return null;
            }

            // Get array of dates (keys)
            const dates = Object.keys(distributionData);

            // If we don't have enough data
            if (dates.length < 2) return null;

            // Sort the dates chronologically
            const sortedDates = dates.sort((a, b) => new Date(a) - new Date(b));

            // Format dates to be more readable
            const formattedDates = sortedDates.map(date => formatDate(date, format))
                .filter(date => date !== ''); // Remove invalid dates

            // If we don't have enough valid dates after filtering
            if (formattedDates.length < 2) return null;

            // Get corresponding values
            const values = sortedDates.map(date => {
                const value = distributionData[date];
                return typeof value === 'number' ? value : 0;
            });

            return {
                labels: formattedDates,
                datasets: [
                    {
                        data: values,
                        color: (opacity = 1) => `rgba(210, 180, 140, ${opacity})`, // theme.colors.secondary
                        strokeWidth: 2
                    }
                ]
            };
        } catch (error) {
            // Silent error handling to prevent crashes
            return null;
        }
    };

    const chartConfig = {
        backgroundColor: theme.colors.surface,
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(210, 180, 140, ${opacity})`, // theme.colors.secondary
        labelColor: (opacity = 1) => `rgba(232, 220, 196, ${opacity})`, // theme.colors.text
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: "6",
            strokeWidth: "2",
            stroke: theme.colors.accent
        }
    };

    const renderStatCard = () => {
        // Handle potential undefined values safely
        if (!stats) return null;

        // Default values if stats properties are missing
        let articlesAnalyzed = stats.articles_analyzed_daily || 0;
        let averageAccuracy = stats.daily_accuracy || 0;

        if (timeframe === 'week') {
            articlesAnalyzed = stats.articles_analyzed_weekly || 0;
            averageAccuracy = stats.weekly_accuracy || 0;
        } else if (timeframe === 'month') {
            articlesAnalyzed = stats.articles_analyzed_monthly || 0;
            averageAccuracy = stats.monthly_accuracy || 0;
        }

        return (
            <Card style={styles.card}>
                <Text style={styles.cardTitle}>Usage Statistics</Text>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>
                        Articles Analyzed ({timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'Today'})
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
                        {timeframe === 'week' ? 'Weekly' : timeframe === 'month' ? 'Monthly' : 'Daily'} Average Accuracy
                    </Text>
                    <Text style={[
                        styles.statValue,
                        {color: getScoreColor(averageAccuracy)}
                    ]}>
                        {averageAccuracy.toFixed(1)}%
                    </Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Current Subscription Plan</Text>
                    <Text style={[
                        styles.statValue,
                        {color: stats.subscription_plan === 'Premium' ? '#4CAF50' : theme.colors.secondary}
                    ]}>
                        {stats.subscription_plan || 'Free'}
                    </Text>
                </View>
            </Card>
        );
    };

    const renderDistributionChart = () => {
        if (!stats) return null;

        let distributionData;
        let chartTitle;
        let format;

        try {
            if (timeframe === 'week') {
                distributionData = stats.daily_distribution;
                chartTitle = 'Daily Articles';
                format = 'day';
            } else if (timeframe === 'month') {
                distributionData = stats.weekly_distribution;
                chartTitle = 'Weekly Articles';
                format = 'week';
            } else { // year view
                distributionData = stats.monthly_distribution;
                chartTitle = 'Monthly Articles';
                format = 'month';
            }

            // Check if distribution data exists and is not empty
            if (!distributionData || Object.keys(distributionData).length === 0) {
                return (
                    <Card style={styles.chartCard}>
                        <Text style={styles.chartTitle}>{chartTitle}</Text>
                        <Text style={{color: theme.colors.text, textAlign: 'center'}}>
                            No data available for this timeframe
                        </Text>
                    </Card>
                );
            }

            const data = prepareChartData(distributionData, format);

            if (!data || !data.labels || data.labels.length < 2) {
                return (
                    <Card style={styles.chartCard}>
                        <Text style={styles.chartTitle}>{chartTitle}</Text>
                        <Text style={{color: theme.colors.text, textAlign: 'center'}}>
                            Not enough data to display chart
                        </Text>
                    </Card>
                );
            }

            return (
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>{chartTitle}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <BarChart
                            data={data}
                            width={Math.max(chartWidth, data.labels.length * 60)} // Ensure width is enough for all labels
                            height={chartHeight}
                            chartConfig={chartConfig}
                            verticalLabelRotation={30}
                            fromZero
                            showValuesOnTopOfBars
                        />
                    </ScrollView>
                </Card>
            );
        } catch (error) {
            return (
                <Card style={styles.chartCard}>
                    <Text style={styles.chartTitle}>{chartTitle || 'Chart'}</Text>
                    <Text style={{color: theme.colors.text, textAlign: 'center'}}>
                        Unable to display chart data
                    </Text>
                </Card>
            );
        }
    };

    if (loading && !stats) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}
            >
                <ActivityIndicator color={theme.colors.secondary} size="large" />
            </LinearGradient>
        );
    }

    if (error) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{flex: 1}}
            >
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>
                    <Button
                        mode="contained"
                        onPress={fetchStats}
                        loading={loading}
                        buttonColor={theme.colors.accent}
                        textColor={theme.colors.text}
                        style={authStyles.primaryButton}
                    >
                        Try Again
                    </Button>
                </View>
            </LinearGradient>
        );
    }

    if (!stats) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{flex: 1}}
            >
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                        No statistics available. Start analyzing articles to see your statistics.
                    </Text>
                    <Button
                        mode="contained"
                        onPress={fetchStats}
                        loading={loading}
                        buttonColor={theme.colors.accent}
                        textColor={theme.colors.text}
                        style={authStyles.primaryButton}
                    >
                        Try Again
                    </Button>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <SafeAreaView style={{flex: 1}}>
                <ScrollView
                    contentContainerStyle={{flexGrow: 1}}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.secondary}
                            colors={[theme.colors.secondary]}
                        />
                    }
                >
                    <View style={styles.container}>
                        <SegmentedButtons
                            value={timeframe}
                            onValueChange={(value) => {
                                setTimeframe(value);
                                try {
                                    Haptics.selectionAsync(); // Add haptic feedback on selection
                                } catch (e) {
                                    // Silently handle haptics error
                                }
                            }}
                            buttons={[
                                {
                                    value: 'day',
                                    label: 'Day',
                                    style: {
                                        backgroundColor: timeframe === 'day' ? theme.colors.accent : theme.colors.surface
                                    }
                                },
                                {
                                    value: 'week',
                                    label: 'Week',
                                    style: {
                                        backgroundColor: timeframe === 'week' ? theme.colors.accent : theme.colors.surface
                                    }
                                },
                                {
                                    value: 'month',
                                    label: 'Month',
                                    style: {
                                        backgroundColor: timeframe === 'month' ? theme.colors.accent : theme.colors.surface
                                    }
                                },
                            ]}
                            style={styles.timeframeSelector}
                        />

                        {renderStatCard()}
                        {renderDistributionChart()}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}