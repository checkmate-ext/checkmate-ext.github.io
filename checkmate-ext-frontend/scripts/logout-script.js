import AuthService from '../authentication/auth-service.js';
import { API_BASE_URL, ENDPOINTS, AUTH_CONFIG } from '../config/config.js';
// Create an instance of AuthService
const authService = new AuthService(API_BASE_URL);	

// Attach a click event to the logout button
document.getElementById('logoutBtn').addEventListener('click', async () => {
    // Clear the token via AuthService
    await authService.logout();
    
    // Navigate to SignInPage instead of FirstPage
    navigateTo('SignInPage.html');
});