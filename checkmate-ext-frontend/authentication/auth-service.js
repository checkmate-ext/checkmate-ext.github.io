// auth-service.js
export default class AuthService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;  // Store the API URL (e.g., 'http://localhost:5000')
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');  // Get token from localStorage if it exists
        this.googleClientId = "94517049358-tgqqobr0kk38dofd1h5l0bm019url60c.apps.googleusercontent.com"; // Google Client ID
    }

    async login(email, password, rememberMe = false) {
        try {
            const response = await fetch(`${this.apiUrl}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, rememberMe })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Always store the token in localStorage
            localStorage.setItem('token', data.token);
            return { success: true, user: data.user };

            this.token = data.token;

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Method to handle Google Sign-In
    async googleSignIn() {
        return new Promise((resolve, reject) => {
            // Use chrome.identity.getAuthToken to get an OAuth token
            chrome.identity.getAuthToken({ interactive: true }, async (token) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                try {
                    // Get user info from Google with the token
                    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (!userInfoResponse.ok) {
                        throw new Error('Failed to get user info from Google');
                    }

                    const userInfo = await userInfoResponse.json();

                    // Now send the user info to your backend instead of the raw token
                    const response = await fetch(`${this.apiUrl}/auth/google`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            google_id: userInfo.sub,
                            email: userInfo.email,
                            name: userInfo.name
                        })
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Google authentication failed');
                    }

                    // If auth successful, save token
                    this.token = data.token;
                    localStorage.setItem('token', data.token);
                    resolve({ success: true, user: data.user });
                } catch (error) {
                    console.error('Google sign-in error:', error);
                    reject(error);
                }
            });
        });
    }

    // Helper method to dynamically load the Google API script
    loadGoogleApi() {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
                resolve();
                return;
            }

            // Create script tag
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Google API'));
            document.head.appendChild(script);
        });
    }

    async register(name, email, password) {
        try {
            // Make POST request to register endpoint
            const response = await fetch(`${this.apiUrl}/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // If registration successful, save token
            this.token = data.token;
            localStorage.setItem('token', data.token);
            return { success: true };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Method to make authenticated requests to your backend
    async makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
        // Check if we have a token
        if (!this.token) {
            throw new Error('No authentication token');
        }

        // Set up request headers with the token
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };

        // Make the request
        const response = await fetch(`${this.apiUrl}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    }

    isTokenValid() {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            // Decode token payload (assumes JWT format: header.payload.signature)
            const payload = JSON.parse(atob(token.split('.')[1]));
            // exp is in seconds; convert to milliseconds
            return payload.exp * 1000 >= Date.now();
             // token is valid
        } catch (error) {
            return false;
        }
    }

    // Method to check if user is logged in
    isAuthenticated() {
        return !!this.token && this.isTokenValid();
    }

    // Logout method
    async logout() {
        try {
            // First clear the authentication token
            this.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // If using Chrome extension environment and user signed in with Google
            if (typeof chrome !== 'undefined' && chrome.identity) {
                // Try to remove the cached token without any complex logic
                try {
                    chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
                        if (token) {
                            chrome.identity.removeCachedAuthToken({ 'token': token });
                        }
                    });
                } catch (err) {
                    console.warn('Error clearing Google token:', err);
                    // Continue regardless of error
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if there's an error, make sure tokens are cleared
            this.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return { success: false, error: error.message };
        }
    }
}