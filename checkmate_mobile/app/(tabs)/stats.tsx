// app/(tabs)/stats.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, SafeAreaView } from 'react-native';
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
    const paperTheme = useTheme();

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

    // Chart dimensions from utility
    const { width: chartWidth, height: chartHeight } = ResponsiveUtils.getChartDimensions();

    // Score color helper
    const getScoreColor = (score: number) => {
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FFC107';
        return '#F44336';
    };

    // Date formatting
    const formatDate = (dateString: string, format: 'day' | 'week' | 'month' | 'year') => {
        const date = new Date(dateString);
        if (format === 'month') {
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (format === 'year') {
            // For quarterly data, we expect the key to be in format "Q1 2023"
            return dateString; // Already formatted on the backend
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Prepare chart data
    const prepareChartData = (dataObj: Record<string, number> | undefined, format: 'day' | 'week' | 'month' | 'year') => {
        if (!dataObj) return null;
        const dates = Object.keys(dataObj).sort();
        if (dates.length < 2) return null;
        const labels = dates.map(d => formatDate(d, format));
        const values = dates.map(d => dataObj[d] || 0);
        return { labels, datasets: [{ data: values }] };
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
            <Card style={styles.card(colors)}>
                <Text style={styles.cardTitle(colors)}>Usage Statistics</Text>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel(colors)}>
                        Articles Analyzed ({timeframe === 'week' ? 'This Week' :
                        timeframe === 'month' ? 'This Month' :
                            timeframe === 'year' ? 'This Year' : 'Today'})
                    </Text>
                    <Text style={styles.statValue(colors)}>{articlesAnalyzed}</Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel(colors)}>Daily Limit</Text>
                    <Text style={styles.statValue(colors)}>{stats.daily_limit || 0}</Text>
                </View>
                <Divider style={styles.divider(colors)} />
                <View style={styles.statRow}>
                    <Text style={styles.statLabel(colors)}>Total Articles Analyzed</Text>
                    <Text style={styles.statValue(colors)}>{stats.total_articles || 0}</Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel(colors)}>
                        {timeframe === 'week' ? 'Weekly' :
                            timeframe === 'month' ? 'Monthly' :
                                timeframe === 'year' ? 'Yearly' : 'Daily'} Average Accuracy
                    </Text>
                    <Text style={[
                        styles.statValue(colors),
                        { color: getScoreColor(avgAccuracy) }
                    ]}>
                        {avgAccuracy.toFixed(1)}%
                    </Text>
                </View>
                <View style={styles.statRow}>
                    <Text style={styles.statLabel(colors)}>Subscription Plan</Text>
                    <Text style={[
                        styles.statValue(colors),
                        { color: stats.subscription_plan === 'Premium' ? '#4CAF50' : colors.secondary }
                    ]}>
                        {stats.subscription_plan || 'Free'}
                    </Text>
                </View>
            </Card>
        );
    };

    // Render distribution chart
    const renderDistributionChart = () => {
        if (!stats) return null;
        let dataObj, title, format;

        if (timeframe === 'week') {
            dataObj = stats.daily_distribution;
            title = 'Daily Articles';
            format = 'day';
        } else if (timeframe === 'month') {
            dataObj = stats.weekly_distribution;
            title = 'Weekly Articles';
            format = 'week';
        } else if (timeframe === 'year') {
            dataObj = stats.quarterly_distribution;
            title = 'Quarterly Articles';
            format = 'year';
        } else {
            dataObj = stats.monthly_distribution;
            title = 'Monthly Articles';
            format = 'month';
        }

        if (!dataObj) {
            return (
                <Card style={styles.chartCard(colors)}>
                    <Text style={styles.chartTitle(colors)}>{title}</Text>
                    <Text style={styles.noDataText(colors)}>No data available</Text>
                </Card>
            );
        }

        const data = prepareChartData(dataObj, format);

        if (!data) {
            return (
                <Card style={styles.chartCard(colors)}>
                    <Text style={styles.chartTitle(colors)}>{title}</Text>
                    <Text style={styles.noDataText(colors)}>Not enough data</Text>
                </Card>
            );
        }

        return (
            <Card style={styles.chartCard(colors)}>
                <Text style={styles.chartTitle(colors)}>{title}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <BarChart
                        data={data}
                        width={Math.max(chartWidth, data.labels.length * 60)}
                        height={chartHeight}
                        chartConfig={chartConfig}
                        verticalLabelRotation={30}
                        fromZero
                        showValuesOnTopOfBars
                    />
                </ScrollView>
            </Card>
        );
    };

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
                    <Text style={styles.errorText(colors)}>No statistics available.</Text>
                    <Button
                        mode="contained"
                        onPress={fetchStats}
                        loading={loading}
                        buttonColor={colors.accent}
                        textColor={colors.text}
                        style={authStyles.primaryButton}
                    >Try Again</Button>
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
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
                                                    tintColor={colors.secondary} colors={[colors.secondary]} />}
                >
                    <SegmentedButtons
                        value={timeframe}
                        onValueChange={value => { setTimeframe(value); Haptics.selectionAsync(); }}
                        buttons={[
                            { value: 'day', label: 'Day', buttonStyle: { backgroundColor: timeframe === 'day' ? colors.accent : colors.surface } },
                            { value: 'week', label: 'Week', buttonStyle: { backgroundColor: timeframe === 'week' ? colors.accent : colors.surface } },
                            { value: 'month', label: 'Month', buttonStyle: { backgroundColor: timeframe === 'month' ? colors.accent : colors.surface } },
                            { value: 'year', label: 'Year', buttonStyle: { backgroundColor: timeframe === 'year' ? colors.accent : colors.surface } },
                        ]}
                        style={styles.segment(colors)}
                    />

                    {renderStatCard()}
                    {renderDistributionChart()}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flexGrow: 1, padding: ResponsiveUtils.moderateScale(16) },
    card: (c: any) => ({ backgroundColor: c.surface, marginBottom: ResponsiveUtils.moderateScale(16), borderRadius: ResponsiveUtils.moderateScale(15), padding: ResponsiveUtils.moderateScale(15), shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 }),
    cardTitle: (c: any) => ({ fontSize: ResponsiveUtils.normalizeFont(18), fontWeight: 'bold', color: c.secondary, marginBottom: ResponsiveUtils.moderateScale(10) }),
    statRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: ResponsiveUtils.moderateScale(8) },
    statLabel: (c: any) => ({ fontSize: ResponsiveUtils.normalizeFont(14), color: c.text, flex: 1 }),
    statValue: (c: any) => ({ fontSize: ResponsiveUtils.normalizeFont(14), fontWeight: 'bold', color: c.secondary, paddingLeft: ResponsiveUtils.moderateScale(4) }),
    divider: (c: any) => ({ backgroundColor: c.primary, opacity: 0.3, marginVertical: ResponsiveUtils.moderateScale(10) }),
    chartCard: (c: any) => ({ backgroundColor: c.surface, marginBottom: ResponsiveUtils.moderateScale(20), borderRadius: ResponsiveUtils.moderateScale(15), padding: ResponsiveUtils.moderateScale(15), alignItems: 'center' }),
    chartTitle: (c: any) => ({ fontSize: ResponsiveUtils.normalizeFont(16), fontWeight: 'bold', color: c.secondary, marginBottom: ResponsiveUtils.moderateScale(15), alignSelf: 'flex-start' }),
    noDataText: (c: any) => ({ color: c.text, textAlign: 'center' }),
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: ResponsiveUtils.moderateScale(20) },
    errorText: (c: any) => ({ color: c.text, fontSize: ResponsiveUtils.normalizeFont(16), textAlign: 'center', marginBottom: ResponsiveUtils.moderateScale(20) }),
    segment: (c: any) => ({ marginBottom: ResponsiveUtils.moderateScale(16), backgroundColor: c.surface, borderRadius: ResponsiveUtils.moderateScale(8) }),
});