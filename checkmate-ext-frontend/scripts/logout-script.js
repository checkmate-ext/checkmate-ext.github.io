//// filepath: /c:/Users/ayber/Documents/checkmate-ext.github.io/checkmate-ext-frontend/scripts/logout-script.js
import AuthService from '../authentication/auth-service.js';

// Create an instance of AuthService
const authService = new AuthService('http://localhost:5000');

// Attach a click event. Make sure your logout button has id "logoutBtn"
document.getElementById('logoutBtn').addEventListener('click', () => {
    // Clear the token via AuthService
    authService.logout();
    // Optionally navigate to the sign-in page after logout
    navigateTo('SignInPage.html');
});