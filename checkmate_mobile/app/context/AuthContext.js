// context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { router, useSegments, useRootNavigationState } from 'expo-router';
import { AuthStorage } from '../storage/AuthStorage';
import {API_URL} from '../constants/Config';

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

    useProtectedRoute(user);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        try {
            const token = await AuthStorage.getToken();
            const userData = await AuthStorage.getUser();
            console.log('token is',token)
            if (token && userData) {
                setUser(userData);
                setToken(token);
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

            console.log("token:",data.token);
            if (!response.ok) {
                throw new Error(data.message);
            }

            // Store token and user data
            await AuthStorage.setToken(data.token);
            await AuthStorage.setUser(data.user);

            setUser(data.user);
            setToken(data.token);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async function signOut() {
        await AuthStorage.clearAll();
        setUser(null);
        setToken(null);
        router.replace('/login');
    }

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signOut,
                user,
                loading,
                token,
            }}>
            {children}
        </AuthContext.Provider>
    );
}