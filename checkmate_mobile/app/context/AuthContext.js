import { createContext, useContext, useState, useEffect } from 'react';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { AuthStorage } from '../storage/AuthStorage';
import {API_URL} from '../constants/Config';
// Make sure to install: npm install jwt-decode
import * as jwtDecode from 'jwt-decode';

const AuthContext = createContext({});

// This hook can be used to access the user info.
export function useAuth() {
    return useContext(AuthContext);
}

// This hook will protect the route access based on user authentication.
function useProtectedRoute(user) {
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    useEffect(() => {
        if (!navigationState?.key) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to the sign-in page.
            router.replace('/login');
        } else if (user && inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/(tabs)/home');
        }
    }, [user, segments, navigationState?.key]);
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);

    useProtectedRoute(user);

    useEffect(() => {
        loadUser();
    }, []);

    // Set up token validation check
    useEffect(() => {
        if (token) {
            // Check token validity immediately
            checkTokenValidity();

            // Set up interval to periodically check token
            const tokenCheckInterval = setInterval(() => {
                checkTokenValidity();
            }, 30000); // Check every 30 seconds

            return () => clearInterval(tokenCheckInterval);
        } else {
            setIsTokenValid(false);
        }
    }, [token]);

    // Function to check if token is expired using decode
    function isTokenExpired(token) {
        try {
            const decoded = jwtDecode.jwtDecode(token);
            const currentTime = Date.now() / 1000;

            // If expiry time exists and has passed
            if (decoded.exp && decoded.exp < currentTime) {
                console.log('Token expired based on expiry time');
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error decoding token:', error);
            return true; // Treat decode errors as expired tokens
        }
    }

    // Function to check token validity
    async function checkTokenValidity() {
        if (!token) {
            setIsTokenValid(false);
            return false;
        }

        // First check if token is expired via decode
        if (isTokenExpired(token)) {
            console.log('Token expired, logging out');
            await signOut();
            return false;
        }

        // Then try to make a request to a protected endpoint
        try {
            // Using the user/stats endpoint as it should be lightweight
            const response = await fetch(`${API_URL}/user/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const data = await response.json();

                // Check for token-specific errors
                if (data.error && (
                    data.error.includes('Token') ||
                    data.error.includes('token') ||
                    response.status === 401
                )) {
                    console.log('Token validation failed:', data.error);
                    await signOut();
                    return false;
                }
            }

            // If we get here, token is valid
            setIsTokenValid(true);
            return true;
        } catch (error) {
            console.error('Error validating token:', error);
            // Don't automatically sign out for network errors
            // as they might be temporary
            if (error.message.includes('Token') || error.message.includes('token')) {
                await signOut();
                return false;
            }
            return isTokenValid; // Keep previous state if network error
        }
    }

    async function loadUser() {
        try {
            const storedToken = await AuthStorage.getToken();
            const userData = await AuthStorage.getUser();

            if (storedToken && userData) {
                // Check if the stored token is expired before setting state
                if (isTokenExpired(storedToken)) {
                    console.log('Stored token is expired, clearing auth data');
                    await AuthStorage.clearAll();
                } else {
                    setToken(storedToken);
                    setUser(userData);
                    setIsTokenValid(true); // Assume valid until checked
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    }

    async function signIn(email, password) {
        try {
            // Make API call to your backend
            const response = await fetch(`${API_URL}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            // Store token and user data
            await AuthStorage.setToken(data.token);
            await AuthStorage.setUser(data.user);

            setUser(data.user);
            setToken(data.token);
            setIsTokenValid(true);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function signOut() {
        await AuthStorage.clearAll();
        setUser(null);
        setToken(null);
        setIsTokenValid(false);
        router.replace('/login');
    }

    // Function to get authenticated headers for API requests
    function getAuthHeaders() {
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    }

    // Function to refresh token if needed (for future implementation)
    async function refreshToken() {
        // This would be implemented if your backend supports refresh tokens
        console.log('Token refresh would happen here if supported by the backend');
    }

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signOut,
                user,
                loading,
                token,
                isTokenValid,
                checkTokenValidity,
                getAuthHeaders,
            }}>
            {children}
        </AuthContext.Provider>
    );
}