// Constants
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
            this.updateUI();
            try {
                this.initializeChart();
            } catch(chartError) {
                console.error('Failed to initialize chart with fallback data:', chartError);
            }
        }
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
        const errorContainer = document.getElementById('errorContainer') || this.createErrorContainer();
        errorContainer.textContent = message;
        errorContainer.classList.add('visible');
        setTimeout(() => {
            errorContainer.classList.remove('visible');
        }, 5000);
    }

    createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'errorContainer';
        container.className = 'error-message';
        document.querySelector('.container').prepend(container);
        return container;
    }

    async fetchDashboardData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Use a timeout promise to prevent long hangs
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            );

            // The fetch promise
            const fetchPromise = fetch('http://localhost:5000/user/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Race the fetch against the timeout
            const response = await Promise.race([fetchPromise, timeoutPromise]);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.statsData = await response.json();
            return this.statsData;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            throw error;
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
        
        if (!this.statsData.articles_analyzed) {
            this.statsData.articles_analyzed = 0;
        }
        
        if (!this.statsData.daily_limit) {
            this.statsData.daily_limit = 10; // Fallback value
        }
        
        const percentage = (this.statsData.articles_analyzed / this.statsData.daily_limit) * 100;

        // Animate the progress bar
        usageBar.style.transition = 'width 1s ease-in-out';
        usageBar.style.width = `${percentage}%`;

        // Update the label
        usageLabel.textContent = `${Math.round(percentage)}% of daily limit used`;
    }

    updateAllStatCards() {
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
                title: 'Reliability',
                value: `${Number(this.statsData.weekly_accuracy || 0).toFixed(2)}%`,
                subtitle: 'last 7 days'
            },
            {
                title: 'Total Articles',
                value: this.statsData.total_articles || 0,
                subtitle: 'all time'
            }
        ];

        stats.forEach(stat => this.updateStatCard(stat.title, stat.value, stat.subtitle));
    }

    updateStatCard(title, value, subtitle) {
        const cards = document.querySelectorAll('.stat-card');
        for (const card of cards) {
            const titleEl = card.querySelector('.stat-title');
            if (titleEl && titleEl.textContent === title) {
                const valueEl = card.querySelector('.stat-value');
                const subtitleEl = card.querySelector('.stat-subtitle');

                // Animate value changes
                if (valueEl) this.animateValue(valueEl, value);
                if (subtitleEl) subtitleEl.textContent = subtitle;
                break;
            }
        }
    }

    animateValue(element, newValue) {
        if (!element) return;
        
        let start = 0;
        try {
            start = parseInt(element.textContent.replace(/\D/g, '')) || 0;
        } catch (e) {
            start = 0;
        }
        
        let end = 0;
        try {
            end = parseInt(newValue.toString().replace(/\D/g, '')) || 0;
        } catch (e) {
            end = 0;
        }
        
        const duration = 1000;
        const steps = 20;
        const step = (end - start) / steps;
        
        let current = start;
        let counter = 0;
        
        const update = () => {
            counter++;
            current += step;
            if (counter >= steps || (step > 0 && current >= end) || (step < 0 && current <= end)) {
                element.textContent = newValue;
            } else {
                element.textContent = Math.round(current).toString();
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    }

    updateUserInfo() {
        const welcomeText = document.querySelector('.welcome-text');
        if (welcomeText && this.statsData.subscription_plan) {
            welcomeText.textContent = `Welcome Back`;
        }
    }

    animateElements() {
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
                console.error('Weekly chart canvas element not found');
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
            
            let weeklyData;
            try {
                weeklyData = this.processWeeklyData();
            } catch (error) {
                console.error('Error processing weekly data:', error);
                weeklyData = {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    values: [0, 0, 0, 0, 0, 0, 0]
                };
            }
            
            if (this.weeklyChart) {
                this.weeklyChart.destroy();
            }
            
            this.weeklyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: weeklyData.labels,
                    datasets: [{
                        label: 'Articles Analyzed',
                        data: weeklyData.values,
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

    setupEventListeners() {
        // Refresh button
        const refreshButton = document.getElementById('refreshBtn');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                if (!this.isLoading) {
                    this.refreshDashboard();
                }
            });
        }

        // Add hover effects for stat cards
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.transition = 'transform 0.3s ease';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
    }

    setupAutoRefresh() {
        setInterval(() => {
            if (!this.isLoading) {
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

// Add required CSS
const style = document.createElement('style');
style.textContent = `
    .loading {
        opacity: 0.7;
        pointer-events: none;
    }

    .error-message {
        color: #dc3545;
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        background-color: #f8d7da;
        display: none;
        animation: fadeIn 0.3s ease-in;
    }

    .error-message.visible {
        display: block;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .stat-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
});