// Constants
const API_BASE_URL = 'http://localhost:5000';
const REFRESH_INTERVAL = 300000; // 5 minutes
const ANIMATION_DURATION = 1500;
const CHART_COLORS = {
    primary: '#3cb371',
    secondary: '#2e8b57',
    background: '#f8f9fa'
};

class DashboardManager {
    constructor() {
        this.weeklyChart = null;
        this.statsData = null;
        this.isLoading = false;
        this.currentTimeRange = 'week'; // Default to weekly view
        
        // Make accessible globally for theme script
        window.dashboardManager = this;
        this.init();
    }

    async init() {
        try {
            this.showLoadingState();
            await this.fetchDashboardData();
            this.updateUI();
            this.initializeChart();
            this.setupEventListeners();
            this.setupAutoRefresh();
            this.hideLoadingState();
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Unable to load dashboard data. Please try again later.');
            this.hideLoadingState();
            
            // Create mock data as fallback
            this.statsData = this.createMockData();
            this.updateUI();
            try {
                this.initializeChart();
            } catch(chartError) {
                console.error('Failed to initialize chart with fallback data:', chartError);
            }
        }
    }

    createMockData() {
        return {
            articles_analyzed: 0,
            daily_limit: 5,
            daily_usage_left: 5,
            weekly_accuracy: 0,
            monthly_accuracy: 0,
            yearly_accuracy: 0,
            total_articles: 0,
            articles: [],
            daily_distribution: {},
            weekly_distribution: {},
            monthly_distribution: {},
            quarterly_distribution: {}
        };
    }

    showLoadingState() {
        this.isLoading = true;
        document.body.classList.add('loading');
        const loadingElements = document.querySelectorAll('.stat-value, .progress-label');
        loadingElements.forEach(el => {
            el.dataset.originalText = el.textContent;
            el.textContent = 'Loading...';
        });
    }

    hideLoadingState() {
        this.isLoading = false;
        document.body.classList.remove('loading');
        const loadingElements = document.querySelectorAll('.stat-value, .progress-label');
        loadingElements.forEach(el => {
            if (el.dataset.originalText) {
                el.textContent = el.dataset.originalText;
                delete el.dataset.originalText;
            }
        });
    }

    showError(message) {
        const errorContainer = document.getElementById('errorMessage');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.classList.add('visible');
            setTimeout(() => {
                errorContainer.classList.remove('visible');
            }, 5000);
        }
    }


    async fetchDashboardData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
    
            console.log('Fetching dashboard data...');
            const response = await fetch(`${API_BASE_URL}/user/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status}, ${errorText}`);
            }
            
            this.statsData = await response.json();
            console.log('Received stats data:', this.statsData);
            
            if (!this.statsData) {
                throw new Error('Empty response from API');
            }
            
            // Enhanced normalization of accuracy values
            // These could come in 0-1 range, 0-100 range, or potentially even larger values
            this.statsData.weekly_accuracy = this.normalizePercentage(this.statsData.weekly_accuracy);
            this.statsData.monthly_accuracy = this.normalizePercentage(this.statsData.monthly_accuracy);
            this.statsData.yearly_accuracy = this.normalizePercentage(this.statsData.yearly_accuracy);
            
            return this.statsData;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
        }
    }

    normalizePercentage(value) {
        if (value === undefined || value === null) return 0;
        
        // Convert to number if it's a string
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        
        // Since we know the backend is now consistently returning percentages in 0-100 range,
        // we can simplify this function
        if (numValue >= 0) {
            return numValue * 100; // Values already in 0-100 range from backend
        } else {
            return 0; // Fallback for negative values
        }
    }

    updateUI() {
        if (!this.statsData) return;

        // Update progress bar with animation
        this.updateProgressBar();

        // Update stat cards
        this.updateAllStatCards();

        // Update user info
        this.updateUserInfo();

        // Trigger animations
        this.animateElements();
    }


updateProgressBar() {
    const usageBar = document.getElementById('usageBar');
    const usageLabel = document.querySelector('.progress-label');
    
    if (!usageBar || !usageLabel) {
        console.error('Progress bar elements not found');
        return;
    }
    
    // Ensure articles_analyzed is a number
    let articlesAnalyzed = 0;
    if (this.statsData.articles_analyzed !== undefined && this.statsData.articles_analyzed !== null) {
        articlesAnalyzed = parseInt(this.statsData.articles_analyzed) || 0;
    }
    
    // Ensure daily_limit is a number and not zero
    let dailyLimit = 5; // Default fallback
    if (this.statsData.daily_limit !== undefined && this.statsData.daily_limit !== null) {
        dailyLimit = parseInt(this.statsData.daily_limit) || dailyLimit;
    }
    
    const percentage = Math.min(100, Math.max(0, (articlesAnalyzed / dailyLimit) * 100));
    
    // Direct update without resetting to zero first
    usageBar.style.transition = 'width 1s ease-in-out';
    usageBar.style.width = `${percentage}%`;
    
    // Update color based on usage
    if (percentage > 90) {
        usageBar.style.backgroundColor = '#dc3545'; // Red
    } else if (percentage > 75) {
        usageBar.style.backgroundColor = '#ffc107'; // Yellow
    } else {
        usageBar.style.backgroundColor = CHART_COLORS.primary; // Green
    }
    
    // Update the label with explicit values
    usageLabel.textContent = `${articlesAnalyzed} of ${dailyLimit} articles used today`;
    
    // Log for debugging
    console.log('Updated progress bar:', { articlesAnalyzed, dailyLimit, percentage });
}

    updateAllStatCards() {
        // First 3 stats are fixed
        const stats = [
            {
                title: 'Daily Limit',
                value: this.statsData.daily_limit || 0,
                subtitle: 'articles/day'
            },
            {
                title: 'Articles Today',
                value: this.statsData.articles_analyzed || 0,
                subtitle: 'articles analyzed'
            },
            {
                title: 'Total Articles',
                value: this.statsData.total_articles || 0,
                subtitle: 'all time'
            }
        ];

        stats.forEach(stat => this.updateStatCard(stat.title, stat.value, stat.subtitle));
        
        // Update Reliability based on current time range
        this.updateStatCardsByTimeRange();
    }
    
    updateStatCardsByTimeRange() {
        // Update reliability card based on selected time range
        let accuracy;
        let timeLabel;
        
        switch (this.currentTimeRange) {
            case 'week':
                accuracy = this.statsData.weekly_accuracy || 0;
                timeLabel = 'last 7 days';
                break;
            case 'month':
                accuracy = this.statsData.monthly_accuracy || 0;
                timeLabel = 'last 30 days';
                break;
            case 'year':
                accuracy = this.statsData.yearly_accuracy || 0;
                timeLabel = 'last 365 days';
                break;
            default:
                accuracy = this.statsData.weekly_accuracy || 0;
                timeLabel = 'last 7 days';
        }
        
        // Format accuracy to 1 decimal place
        // We've already normalized it in fetchDashboardData so it should be in the 0-100 range
        const formattedAccuracy = parseFloat(accuracy).toFixed(1);
        
        // Log for debugging
        console.log(`Reliability for ${this.currentTimeRange}: raw=${accuracy}, formatted=${formattedAccuracy}%`);
        
        this.updateStatCard('Reliability', `${formattedAccuracy}%`, timeLabel);
    }


    updateStatCard(title, value, subtitle) {
        const cards = document.querySelectorAll('.stat-card');
        let found = false;
        
        cards.forEach(card => {
            const titleEl = card.querySelector('.stat-title');
            if (titleEl && titleEl.textContent === title) {
                found = true;
                const valueEl = card.querySelector('.stat-value');
                const subtitleEl = card.querySelector('.stat-subtitle');

                // Animate value changes if possible, or set directly
                if (valueEl) {
                    try {
                        this.animateValue(valueEl, value);
                    } catch (e) {
                        valueEl.textContent = value;
                    }
                }
                
                // Update subtitle
                if (subtitleEl && subtitle) {
                    subtitleEl.textContent = subtitle;
                }
            }
        });
        
        return found;
    }

    animateValue(element, newValue) {
        if (!element) return;
        
        // Handle percentage values
        let isPercentage = false;
        let startValue = 0;
        let targetValue = 0;
        
        // Parse current element value
        try {
            const currentText = element.textContent;
            startValue = parseFloat(currentText.replace(/[^\d.-]/g, '')) || 0;
        } catch (e) {
            startValue = 0;
        }
        
        // Parse target value
        try {
            if (typeof newValue === 'string') {
                isPercentage = newValue.includes('%');
                targetValue = parseFloat(newValue.replace(/[^\d.-]/g, '')) || 0;
            } else {
                targetValue = parseFloat(newValue) || 0;
            }
        } catch (e) {
            targetValue = 0;
        }
        
        // Skip animation if values are the same
        if (Math.abs(startValue - targetValue) < 0.1) {
            element.textContent = typeof newValue === 'string' ? newValue : targetValue;
            return;
        }
        
        const duration = 1000; // ms
        const stepTime = 20; // ms
        const steps = duration / stepTime;
        const increment = (targetValue - startValue) / steps;
        
        let currentValue = startValue;
        let currentStep = 0;
        
        const animateStep = () => {
            currentStep++;
            currentValue += increment;
            
            // Ensure we end with exact target
            if (currentStep >= steps) {
                element.textContent = isPercentage ? `${targetValue.toFixed(1)}%` : newValue;
                return;
            }
            
            // Format based on type
            if (isPercentage) {
                element.textContent = `${currentValue.toFixed(1)}%`;
            } else if (Number.isInteger(targetValue)) {
                element.textContent = Math.round(currentValue);
            } else {
                element.textContent = currentValue.toFixed(1);
            }
            
            requestAnimationFrame(animateStep);
        };
        
        requestAnimationFrame(animateStep);
    }

    updateUserInfo() {
        const welcomeText = document.querySelector('.welcome-text');
        if (welcomeText) {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Extract name from JWT token
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.name) {
                        welcomeText.textContent = `Welcome back, ${payload.name}!`;
                    } else if (payload.email) {
                        const username = payload.email.split('@')[0];
                        welcomeText.textContent = `Welcome back, ${username}!`;
                    }
                }
            } catch (e) {
                console.error('Error parsing token for welcome message:', e);
            }
        }
    }

    animateElements() {
        // Optional: Add animations when cards first appear
        document.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    initializeChart() {
        try {
            const chartCanvas = document.getElementById('weeklyChart');
            
            if (!chartCanvas) {
                console.error('Chart canvas element not found');
                return;
            }
            
            // Make sure Chart.js is defined and loaded
            if (typeof Chart === 'undefined') {
                console.error('Chart.js is not loaded');
                this.loadChartJsLibrary();
                return;
            }
            
            const ctx = chartCanvas.getContext('2d');
            if (!ctx) {
                console.error('Could not get 2D context from canvas');
                return;
            }
            
            let chartData;
            try {
                switch (this.currentTimeRange) {
                    case 'week':
                        chartData = this.processWeeklyData();
                        break;
                    case 'month':
                        chartData = this.processMonthlyData();
                        break;
                    case 'year':
                        chartData = this.processYearlyData();
                        break;
                    default:
                        chartData = this.processWeeklyData();
                }
            } catch (error) {
                console.error(`Error processing ${this.currentTimeRange} data:`, error);
                chartData = {
                    labels: ['No Data'],
                    values: [0]
                };
            }
            
            if (this.weeklyChart) {
                this.weeklyChart.destroy();
            }
            
            this.weeklyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Articles Analyzed',
                        data: chartData.values,
                        backgroundColor: CHART_COLORS.primary,
                        borderRadius: 4,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => `Articles: ${context.raw || 0}`
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                font: { size: 10 },
                                callback: (value) => Math.round(value)
                            }
                        },
                        x: {
                            ticks: {
                                font: { size: 10 }
                            }
                        }
                    },
                    animation: {
                        duration: ANIMATION_DURATION
                    }
                }
            });
        } catch (error) {
            console.error('Failed to initialize chart:', error);
            // Display fallback message
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Chart unavailable</div>`;
            }
        }
    }

    loadChartJsLibrary() {
        const script = document.createElement('script');
        script.src = '../scripts/chart.min.js';
        script.onload = () => {
            console.log('Chart.js loaded dynamically');
            this.initializeChart();
        };
        script.onerror = () => {
            console.error('Failed to load Chart.js dynamically');
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Chart unavailable - Could not load Chart.js</div>`;
            }
        };
        document.head.appendChild(script);
    }

    processWeeklyData() {
        // Default data
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = new Array(7).fill(0);

        try {
            if (this.statsData?.daily_distribution) {
                Object.entries(this.statsData.daily_distribution).forEach(([date, count]) => {
                    try {
                        const dayIndex = new Date(date).getDay();
                        if (!isNaN(dayIndex) && dayIndex >= 0 && dayIndex < 7) {
                            weeklyData[dayIndex] = count;
                        }
                    } catch (dateError) {
                        console.error('Invalid date format:', date, dateError);
                    }
                });
            }

            // Rotate data so it starts from the current day
            const today = new Date().getDay();
            const rotatedData = [...weeklyData.slice(today + 1), ...weeklyData.slice(0, today + 1)];
            const rotatedLabels = [...days.slice(today + 1), ...days.slice(0, today + 1)];

            return {
                labels: rotatedLabels,
                values: rotatedData
            };
        } catch (error) {
            console.error('Error in processWeeklyData:', error);
            return {
                labels: days,
                values: weeklyData
            };
        }
    }
    
    processMonthlyData() {
        // Default data - show last 30 days
        const labels = [];
        const values = new Array(30).fill(0);
        
        try {
            if (this.statsData?.daily_distribution) {
                // Create array of last 30 days
                const dates = [];
                for (let i = 29; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    dates.push(date.toISOString().split('T')[0]);
                }
                
                // Add labels (just show every 5th day for readability)
                dates.forEach((date, index) => {
                    if (index % 5 === 0 || index === 29) {
                        const d = new Date(date);
                        labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
                    } else {
                        labels.push('');
                    }
                    
                    // Add value if it exists in the distribution
                    if (this.statsData.daily_distribution[date]) {
                        values[index] = this.statsData.daily_distribution[date];
                    }
                });
                
                return { labels, values };
            }
            
            // If no data, return empty month view
            for (let i = 0; i < 30; i += 5) {
                labels.push(`Day ${i+1}`);
            }
            
            return { labels, values };
        } catch (error) {
            console.error('Error in processMonthlyData:', error);
            return {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                values: [0, 0, 0, 0]
            };
        }
    }
    
    processYearlyData() {
        try {
            // Prefer monthly distribution for year view instead of quarterly
            if (this.statsData?.monthly_distribution) {
                // Get the past 12 months
                const allMonths = [];
                for (let i = 11; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(1); // First day of month to avoid issues with varying month lengths
                    date.setMonth(date.getMonth() - i);
                    allMonths.push(date.toISOString().split('T')[0].substring(0, 7) + "-01"); // Format as YYYY-MM-01
                }
                
                // Create labels for all 12 months, regardless of data presence
                const labels = allMonths.map(date => {
                    const d = new Date(date);
                    return d.toLocaleString('default', { month: 'short' });
                });
                
                // Get values, defaulting to 0 for months with no data
                const values = allMonths.map(monthDate => {
                    // Find if there's data for this month
                    for (const [date, count] of Object.entries(this.statsData.monthly_distribution)) {
                        if (date.startsWith(monthDate.substring(0, 7))) {
                            return count;
                        }
                    }
                    return 0;
                });
                
                return { labels, values };
            } 
            // Fallback to quarterly if available
            else if (this.statsData?.quarterly_distribution) {
                const quarters = Object.keys(this.statsData.quarterly_distribution).sort();
                const values = quarters.map(q => this.statsData.quarterly_distribution[q]);
                
                return {
                    labels: quarters,
                    values: values
                };
            }
            
            // Default yearly view - show all 12 months with zero values
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return {
                labels: months,
                values: new Array(12).fill(0)
            };
        } catch (error) {
            console.error('Error in processYearlyData:', error);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return {
                labels: months,
                values: new Array(12).fill(0)
            };
        }
    }
    

    setupEventListeners() {
        // Time range selector
        const timeRangeSelector = document.getElementById('timeRangeSelector');
        if (timeRangeSelector) {
            timeRangeSelector.addEventListener('change', (e) => {
                this.currentTimeRange = e.target.value;
                this.initializeChart();
                this.updateStatCardsByTimeRange();
            });
        }
        
        // History button
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                if (typeof navigateTo === 'function') {
                    navigateTo('HistoryPage.html');
                } else {
                    window.location.href = 'HistoryPage.html';
                }
            });
        }
        
        // Menu button
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                if (typeof navigateTo === 'function') {
                    navigateTo('MainMenuPage.html');
                } else {
                    window.location.href = 'MainMenuPage.html';
                }
            });
        }
        
        // Profile button
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                if (typeof navigateTo === 'function') {
                    navigateTo('ProfilePage.html');
                } else {
                    window.location.href = 'ProfilePage.html';
                }
            });
        }
    }

    setupAutoRefresh() {
        setInterval(() => {
            if (!this.isLoading && document.visibilityState !== 'hidden') {
                this.refreshDashboard();
            }
        }, REFRESH_INTERVAL);
    }

    async refreshDashboard() {
        try {
            this.showLoadingState();
            await this.fetchDashboardData();
            this.updateUI();
            this.initializeChart();
        } catch (error) {
            console.error('Failed to refresh dashboard:', error);
            this.showError('Failed to refresh dashboard data');
        } finally {
            this.hideLoadingState();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});