// AuthService is a class that handles all authentication-related tasks
export default class AuthService {
    // Constructor takes the API URL as a parameter
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
            this.token = data.token;

            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // New method to handle Google Sign-In
    async googleSignIn() {
        try {
            // Get Google OAuth token using Chrome Identity API
            const googleToken = await this.getGoogleToken();

            // Get user info from Google
            const userInfo = await this.getGoogleUserInfo(googleToken);

            // Send Google token and user info to your backend
            const response = await fetch(`${this.apiUrl}/login/google/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    google_token: googleToken,
                    email: userInfo.email,
                    name: userInfo.name
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Google sign-in failed');
            }

            // If login successful, save token
            this.token = data.token;
            localStorage.setItem('token', data.token);
            return { success: true };

        } catch (error) {
            console.error('Google sign-in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper method to get Google OAuth token
    async getGoogleToken() {
        try {
            const manifest = chrome.runtime.getManifest();

            // Get token using Chrome Identity API
            const token = await chrome.identity.getAuthToken({
                interactive: true,
                scopes: [
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/userinfo.profile'
                ]
            });

            if (!token) {
                throw new Error('Failed to get Google token');
            }

            return token;
        } catch (error) {
            console.error('Error getting Google token:', error);
            throw new Error('Google authentication failed');
        }
    }

    // Helper method to get user info from Google
    async getGoogleUserInfo(token) {
        try {
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user info from Google');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting user info:', error);
            throw new Error('Failed to get user information');
        }
    }

    // Method to handle token revocation for Google Sign-Out
    async revokeGoogleToken() {
        try {
            const token = await chrome.identity.getAuthToken({ interactive: false });
            if (token) {
                await chrome.identity.removeCachedAuthToken({ token });
                // Optional: Also revoke on Google's servers
                await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
            }
        } catch (error) {
            console.error('Error revoking Google token:', error);
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
                body: JSON.stringify({email, password })
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
            if (payload.exp * 1000 < Date.now()) {
                return false;  // token expired
            }
            return true; // token is valid
        } catch (error) {
            return false;
        }
    }

    // Method to check if user is logged in
    isAuthenticated() {
        return !!this.token && this.isTokenValid();
    }

    // Updated logout method to handle both regular and Google sign-out
    async logout() {
        try {
            await this.revokeGoogleToken(); // Revoke Google token if it exists
        } catch (error) {
            console.error('Error during Google logout:', error);
        } finally {
            this.token = null;
            localStorage.removeItem('token');
        }
    }
}