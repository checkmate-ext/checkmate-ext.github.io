import AuthService from '../authentication/auth-service.js';

const authService = new AuthService('http://localhost:5000');

document.getElementById('signInForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const result = await authService.login(email, password);
        if (result.success) {
            // Optionally alert token or log it if needed
            alert('Signed in successfully! with token: ' + authService.token);
            // navigate to main menu
            navigateTo('MainMenuPage.html');
        }
    } catch (error) {
        alert(error.message || 'An error occurred during sign-in');
    }
});