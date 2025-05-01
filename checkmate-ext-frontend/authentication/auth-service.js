// auth-service.js
export default class AuthService {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;  // Store the API URL (e.g., 'http://localhost:5000')
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');  // Get token from localStorage if it exists
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

            // Store the token in localStorage
            this.token = data.token;
            localStorage.setItem('token', data.token);
            
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async googleSignIn() {
        return new Promise((resolve, reject) => {
            // Use Chrome's identity API to get an access token
            chrome.identity.getAuthToken({ interactive: true }, async (token) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome identity error:', chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                    return;
                }

                try {
                    // Get user info from Google with the token
                    const userInfoResponse = await fetch(
                        'https://www.googleapis.com/oauth2/v3/userinfo',
                        { headers: { Authorization: `Bearer ${token}` }}
                    );

                    if (!userInfoResponse.ok) {
                        const errorText = await userInfoResponse.text();
                        console.error('Failed to get user info:', errorText);
                        resolve({ success: false, error: 'Failed to get user info from Google' });
                        return;
                    }

                    const userInfo = await userInfoResponse.json();

                    // Send the user info and access token to your backend
                    const response = await fetch(`${this.apiUrl}/auth/google_userinfo`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            google_id: userInfo.sub,
                            email: userInfo.email,
                            name: userInfo.name,
                            access_token: token,
                            client_type: 'extension'
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        resolve({ success: false, error: errorData.message || 'Google authentication failed' });
                        return;
                    }

                    const data = await response.json();

                    // If auth successful, save token
                    this.token = data.token;
                    localStorage.setItem('token', data.token);
                    resolve({ success: true, user: data.user });
                } catch (error) {
                    console.error('Google sign-in error:', error);
                    resolve({ success: false, error: error.message || 'Google authentication failed' });
                }
            });
        });
    }

    async facebookSignIn(accessToken) {
        try {
            // Send the Facebook access token to your backend
            const response = await fetch(`${this.apiUrl}/auth/facebook`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    facebook_token: accessToken,
                    client_type: 'extension'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Facebook authentication failed (${response.status})`);
            }

            const data = await response.json();

            // Store token in class property and localStorage
            this.token = data.token;
            localStorage.setItem('token', data.token);
            
            // Store user email only, not the entire user object
            if (data.user && data.user.email) {
                localStorage.setItem('userEmail', data.user.email);
            }

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Facebook sign-in error:', error);
            return { success: false, error: error.message };
        }
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
        } catch (error) {
            return false;
        }
    }

    isAuthenticated() {
        return !!this.token && this.isTokenValid();
    }

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