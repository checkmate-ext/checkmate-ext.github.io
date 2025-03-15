import AuthService from '../authentication/auth-service.js';

const authService = new AuthService('http://localhost:5000');





document.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.getElementById('signInToMain');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const originalSignInButtonText = signInButton.innerHTML;
    const googleButton = document.querySelector('.social-button:first-child'); // This selects the Google button

    // Function to show error
    const showError = (message) => {
        passwordInput.classList.add('is-danger');
        passwordError.textContent = message;
        passwordError.classList.add('is-visible');
    };

    // Function to clear error
    const clearError = () => {
        passwordInput.classList.remove('is-danger');
        passwordError.textContent = '';
        passwordError.classList.remove('is-visible');
    };

    // Clear error when user starts typing
    passwordInput.addEventListener('input', clearError);

    document.getElementById('signInForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        clearError(); // Clear any existing errors
        signInButton.innerHTML = '<div class="loading-spinner"></div>';

        try {
            const result = await authService.login(email, password);
            if (result.success) {
                navigateTo('MainMenuPage.html');
            } else {
                signInButton.innerHTML = originalSignInButtonText;
                showError('Invalid email or password');
            }
        } catch (error) {
            signInButton.innerHTML = originalSignInButtonText;
            showError(error.message || 'An error occurred during sign-in');
        }
    });

    googleButton.addEventListener('click', async () => {
        try {
            const result = await authService.googleSignIn();
            if (result.success) {
                // Navigate to dashboard or main page
                navigateTo('MainMenuPage.html');
            } else {
                // Handle error
                showError(result.error);
            }
        } catch (error) {
            showError('Google sign-in failed');
        }
    });
});