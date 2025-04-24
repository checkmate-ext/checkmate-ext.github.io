import AuthService from '../authentication/auth-service.js';

// Create an instance of AuthService
const authService = new AuthService('http://localhost:5000');

// Attach a click event to the logout button
document.getElementById('logoutBtn').addEventListener('click', async () => {
    // Clear the token via AuthService
    await authService.logout();
    
    // Navigate to SignInPage instead of FirstPage
    navigateTo('SignInPage.html');
});