import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Dimensions, StyleSheet } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator, Button, Divider, SegmentedButtons } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { moderateScale } from 'react-native-size-matters';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import * as Haptics from 'expo-haptics';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { authStyles } from '../styles/auth';

export default function Stats() {
    const { token } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'year'

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

    const screenWidth = Dimensions.get("window").width - moderateScale(40);

    const styles = StyleSheet.create({
        container: {
            padding: moderateScale(20),
            flex: 1,
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
        statRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: moderateScale(8),
        },
        statLabel: {
            fontSize: moderateScale(14),
            color: theme.colors.text,
        },
        statValue: {
            fontSize: moderateScale(14),
            fontWeight: 'bold',
            color: theme.colors.secondary,
        },
        divider: {
            backgroundColor: theme.colors.primary,
            opacity: 0.3,
            marginVertical: moderateScale(10),
        },
        chartCard: {
            backgroundColor: theme.colors.surface,
            marginBottom: moderateScale(20),
            borderRadius: moderateScale(15),
            padding: moderateScale(15),
            alignItems: 'center',
        },
        chartTitle: {
            fontSize: moderateScale(16),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: moderateScale(15),
            alignSelf: 'flex-start',
        },
        noDataContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: moderateScale(20),
        },
        noDataText: {
            color: theme.colors.text,
            fontSize: moderateScale(16),
            textAlign: 'center',
            marginBottom: moderateScale(20),
        },
        timeframeSelector: {
            marginBottom: moderateScale(20),
        }
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/user/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    // Function to determine color based on score
    const getScoreColor = (score) => {
        if (score >= 80) return '#4CAF50'; // Green
        if (score >= 60) return '#FFC107'; // Yellow/Amber
        return '#F44336'; // Red
    };

    // Helper function to format date for display
    const formatDate = (dateString, format) => {
        const date = new Date(dateString);
        if (format === 'month') {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (format === 'week') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    // Convert distribution data to chart format
    const prepareChartData = (distributionData, format) => {
        if (!stats || !distributionData) return null;

        // Sort the dates
        const sortedDates = Object.keys(distributionData).sort();

        // If we don't have enough data
        if (sortedDates.length < 2) return null;

        // Format dates to be more readable
        const formattedDates = sortedDates.map(date => formatDate(date, format));

        // Get corresponding values
        const values = sortedDates.map(date => distributionData[date] || 0);

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
        let articlesAnalyzed = stats.articles_analyzed_daily;
        let averageAccuracy = stats.daily_accuracy;

        if (timeframe === 'week') {
            articlesAnalyzed = stats.articles_analyzed_weekly;
            averageAccuracy = stats.weekly_accuracy;
        } else if (timeframe === 'month') {
            articlesAnalyzed = stats.articles_analyzed_monthly;
            averageAccuracy = stats.monthly_accuracy;
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
                    <Text style={styles.statValue}>{stats.daily_limit}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Total Articles Analyzed</Text>
                    <Text style={styles.statValue}>{stats.total_articles}</Text>
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
                        {stats.subscription_plan}
                    </Text>
                </View>
            </Card>
        );
    };

    const renderDistributionChart = () => {
        let distributionData;
        let chartTitle;
        let format;

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

        const data = prepareChartData(distributionData, format);

        if (!data || data.labels.length < 2) {
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
                <BarChart
                    data={data}
                    width={screenWidth * 0.9}
                    height={220}
                    chartConfig={chartConfig}
                    verticalLabelRotation={30}
                    fromZero
                    showValuesOnTopOfBars
                />
            </Card>
        );
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

    if (!stats) {
        return (
            <LinearGradient
                colors={['#1A1612', '#241E19', '#2A241E']}
                style={{flex: 1}}
            >
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>
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
                            Haptics.selectionAsync(); // Add haptic feedback on selection
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
        </LinearGradient>
    );
}