// app/context/DeepLinkContext.js
import React, { createContext, useContext, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';
import { API_URL } from '../constants/Config';

// Create context
const DeepLinkContext = createContext({});

// Hook to use the context
export const useDeepLinkContext = () => useContext(DeepLinkContext);

export function DeepLinkProvider({ children }) {
    // Set up deep link handler
    useEffect(() => {
        // Function to handle incoming links
        const handleDeepLink = async (event) => {
            const url = event?.url;

            if (!url) return;

            console.log('Deep link detected:', url);

            // Handle custom scheme links (checkmate://)
            if (url.startsWith('checkmate://')) {
                const articleUrl = url.replace('checkmate://', '');
                if (articleUrl) {
                    router.push({
                        pathname: '/new-search',
                        params: { sharedUrl: decodeURIComponent(articleUrl) }
                    });
                }
            }
        };

        // Add event listener for deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened from a deep link
        Linking.getInitialURL().then(url => {
            if (url) {
                handleDeepLink({ url });
            }
        });

        // Clean up the event listener on unmount
        return () => subscription.remove();
    }, []);

    // Function to create share URL
    const generateShareUrl = (articleUrl) => {
        if (!articleUrl) return null;

        if (Platform.OS === 'ios') {
            return `checkmate://${encodeURIComponent(articleUrl)}`;
        } else {
            return `checkmate://${encodeURIComponent(articleUrl)}`;
        }
    };

    return (
        <DeepLinkContext.Provider value={{ generateShareUrl }}>
            {children}
        </DeepLinkContext.Provider>
    );
}