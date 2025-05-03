/**
 * Global configuration for the CheckMate extension
 * Non-module version that works with regular script tags
 */

// Make all variables available in the global scope
window.API_BASE_URL = 'https://checkmate-backend-api-1029076451566.us-central1.run.app';

// Authentication settings
window.AUTH_CONFIG = {
    googleClientId: '1029076451566-0jqo4bubftitqf3opbl0kd8gmm89k5qd.apps.googleusercontent.com',
    facebookAppId: '505389282507431'
};

// UI related constants
window.UI_CONFIG = {
    refreshInterval: 300000, // 5 minutes
    animationDuration: 1500,
    chartColors: {
        primary: '#3cb371',
        secondary: '#2e8b57',
        background: '#f8f9fa'
    }
};

// API endpoints (all relative to API_BASE_URL)
window.ENDPOINTS = {
    login: '/user/login',
    register: '/user/register',
    googleAuth: '/auth/google_userinfo',
    facebookAuth: '/auth/facebook',
    updatePassword: '/user/update-password',
    updateForgottenPassword: '/user/update-forgotten-password',
    verifyEmail: '/user/verify-email',
    search: '/scrap_and_search',
    stats: '/user/stats',
    history: '/user/history',
    article: '/article', // Requires ID appended: `/article/${id}`
    report: '/report'
};