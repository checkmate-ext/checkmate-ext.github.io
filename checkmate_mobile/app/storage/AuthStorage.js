// storage/AuthStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_data';

export const AuthStorage = {
    // Store JWT token
    setToken: async (token) => {
        try {
            await AsyncStorage.setItem(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error storing token:', error);
        }
    },

    // Get stored JWT token
    getToken: async () => {
        try {
            return await AsyncStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    // Remove stored JWT token
    removeToken: async () => {
        try {
            await AsyncStorage.removeItem(TOKEN_KEY);
        } catch (error) {
            console.error('Error removing token:', error);
        }
    },

    // Store user data
    setUser: async (userData) => {
        try {
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        } catch (error) {
            console.error('Error storing user data:', error);
        }
    },

    // Get stored user data
    getUser: async () => {
        try {
            const userData = await AsyncStorage.getItem(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },

    // Clear all auth data
    clearAll: async () => {
        try {
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        } catch (error) {
            console.error('Error clearing auth data:', error);
        }
    }
};