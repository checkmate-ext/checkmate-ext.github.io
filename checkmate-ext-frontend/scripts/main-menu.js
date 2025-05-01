import { API_BASE_URL, ENDPOINTS, AUTH_CONFIG } from '../config/config.js';

async function fetchDailyStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/user/stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        updateDashboard(data);
    } catch (error) {
        console.error('Error fetching daily stats:', error);
        // You might want to show an error state in the dashboard
        updateDashboard({
            daily_usage_left: '-',
            articles_analyzed: '-'
        });
    }
}

// Function to update the dashboard UI
function updateDashboard(data) {
    // Find the stat cards in the dashboard
    const statCards = document.querySelectorAll('.mini-stat-card');

    // Update daily usage percentage
    const usageCard = statCards[0];
    if (usageCard) {
        const valueElement = usageCard.querySelector('.mini-stat-value');
        const titleElement = usageCard.querySelector('.mini-stat-title');
        if (valueElement && titleElement) {
            valueElement.textContent = `${data.daily_usage_left}`;
            titleElement.textContent = 'Daily Usage Left';
        }
    }

    // Update articles analyzed
    const articlesCard = statCards[1];
    if (articlesCard) {
        const valueElement = articlesCard.querySelector('.mini-stat-value');
        const titleElement = articlesCard.querySelector('.mini-stat-title');
        if (valueElement && titleElement) {
            valueElement.textContent = data.articles_analyzed;
            titleElement.textContent = 'Articles Today';
        }
    }
}

// Function to start periodic updates
function startDashboardUpdates() {
    // Fetch immediately on load
    fetchDailyStats();

    // Then fetch every 5 minutes
    setInterval(fetchDailyStats, 5 * 60 * 1000);
}

// Start the dashboard updates when the DOM is loaded
document.addEventListener('DOMContentLoaded', fetchDailyStats);

