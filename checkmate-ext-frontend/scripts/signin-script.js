import AuthService from '../authentication/auth-service.js';

const authService = new AuthService('http://localhost:5000');

document.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.getElementById('signInToMain');

    const originalSignInButtonText = signInButton.innerHTML;

    document.getElementById('signInForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        signInButton.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const result = await authService.login(email, password);
            if (result.success) {
                // Optionally alert token or log it if needed
                alert('Signed in successfully! with token: ' + authService.token);
                // navigate to main menu
                navigateTo('MainMenuPage.html');
            }
        } catch (error) {
            signInButton.innerHTML = originalSignInButtonText;
            alert(error.message || 'An error occurred during sign-in');

        }
    });
});
