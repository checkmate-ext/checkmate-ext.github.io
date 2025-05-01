/**
 * Global configuration for the CheckMate extension
 */

// Base URL for API endpoints
export const API_BASE_URL = 'http://localhost:5000';

// Authentication settings
export const AUTH_CONFIG = {
    googleClientId: '1029076451566-0jqo4bubftitqf3opbl0kd8gmm89k5qd.apps.googleusercontent.com',
    facebookAppId: '505389282507431'
};

// UI related constants
export const UI_CONFIG = {
    refreshInterval: 300000, // 5 minutes
    animationDuration: 1500,
    chartColors: {
        primary: '#3cb371',
        secondary: '#2e8b57',
        background: '#f8f9fa'
    }
};

// API endpoints (all relative to API_BASE_URL)
export const ENDPOINTS = {
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