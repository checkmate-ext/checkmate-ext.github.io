// signin-script.js
import AuthService from '../authentication/auth-service.js';

const authService = new AuthService('http://localhost:5000');

document.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.getElementById('signInToMain');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const originalSignInButtonText = signInButton.innerHTML;
    const googleButton = document.querySelector('.social-button:first-child'); // Google button
    const facebookButton = document.querySelector('.social-button:last-child'); // Facebook button

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

    // Handle regular sign-in form submission
    document.getElementById('signInForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        clearError(); // Clear any existing errors
        signInButton.innerHTML = '<div class="loading-spinner"></div> Sign In';
        signInButton.disabled = true; // Disable button during login attempt

        try {
            const result = await authService.login(email, password);
            if (result.success) {
                // Store user data if needed
                if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
                navigateTo('MainMenuPage.html');
            } else {
                signInButton.innerHTML = originalSignInButtonText;
                signInButton.disabled = false; // Re-enable button
                showError('Invalid email or password');
            }
        } catch (error) {
            signInButton.innerHTML = originalSignInButtonText;
            signInButton.disabled = false; // Re-enable button
            showError(error.message || 'An error occurred during sign-in');
        }
    });

    // Handle Google sign-in button click
    googleButton.addEventListener('click', async () => {
        clearError(); // Clear any existing errors

        // Save the original button content and show loading state
        const originalButtonHTML = googleButton.innerHTML;
        googleButton.innerHTML = '<div class="loading-spinner"></div> Google';
        googleButton.disabled = true; // Disable button during login attempt

        try {
            const result = await authService.googleSignIn();
            if (result.success) {
                // Store user data if needed
                if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
                // Navigate to dashboard or main page
                navigateTo('MainMenuPage.html');
            } else {
                // Handle error
                googleButton.innerHTML = originalButtonHTML;
                googleButton.disabled = false; // Re-enable button
                showError(result.error || 'Google sign-in failed');
            }
        } catch (error) {
            googleButton.innerHTML = originalButtonHTML;
            googleButton.disabled = false; // Re-enable button
            showError(error.message || 'Google sign-in failed');
            console.error('Google sign-in error:', error);
        }
    });

    // Handle Facebook sign-in (placeholder for future implementation)
    facebookButton.addEventListener('click', () => {
        showError('Facebook sign-in is not implemented yet');
    });

    // Check if user is already authenticated and redirect if needed
    if (authService.isAuthenticated()) {
        navigateTo('MainMenuPage.html');
    }
});