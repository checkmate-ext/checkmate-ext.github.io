// AuthService is a class that handles all authentication-related tasks
export default class AuthService {
    // Constructor takes the API URL as a parameter
    constructor(apiUrl) {
        this.apiUrl = apiUrl;  // Store the API URL (e.g., 'http://your-backend-url')
        this.token = localStorage.getItem('token');  // Get token from localStorage if it exists
    }

    // Method to handle user login
    async login(email, password) {
        try {
            // Make POST request to login endpoint
            const response = await fetch(`${this.apiUrl}/user/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // If login successful, save token
            this.token = data.token;
            localStorage.setItem('token', data.token);
            return { success: true };

        } catch (error) {
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

    // Method to logout user
    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }
}