import AuthService from '../authentication/auth-service.js';

const authService = new AuthService('https://checkmate-backend-api-1029076451566.us-central1.run.app');

document.addEventListener('DOMContentLoaded', () => {
    const signInButton = document.getElementById('signInToMain');
    const passwordInput = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    const originalSignInButtonText = signInButton.innerHTML;
    const googleButton = document.querySelector('.social-button:first-child'); // Google button
    const facebookButton = document.getElementById('facebookLoginBtn'); // Facebook button    const rememberMeCheckbox = document.getElementById('rememberMe'); // New checkbox element
    const rememberMeCheckbox = document.getElementById('rememberMe'); // New checkbox element

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
        // Read the "Remember Me" checkbox state
        const rememberMe = rememberMeCheckbox.checked;

        clearError(); // Clear any existing errors
        signInButton.innerHTML = '<div class="loading-spinner"></div> Sign In';
        signInButton.disabled = true; // Disable button during login attempt

        try {
            // Pass the rememberMe parameter to the login call
            const result = await authService.login(email, password, rememberMe);
            if (result.success) {
                // Store user data if needed
                if (result.user) {
                    localStorage.setItem('user', JSON.stringify(result.user));
                }
                // set the local storage data for email
                localStorage.setItem('userEmail', email);
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


    function facebookLogin() {
        // Clear any existing errors
        clearError();
    
        // Save the original button content and show loading state
        const originalButtonHTML = facebookButton.innerHTML;
        facebookButton.innerHTML = '<div class="loading-spinner"></div> Facebook';
        facebookButton.disabled = true; // Disable button during login attempt
    
        chrome.identity.launchWebAuthFlow({
            url: "https://www.facebook.com/v19.0/dialog/oauth?client_id=505389282507431&redirect_uri=https://kmgjckbbdjcmoeflecnlmndlgdjfkdfl.chromiumapp.org/facebook-callback&response_type=token&scope=email,public_profile",
            interactive: true
        }, async function(redirectUrl) {
            if (chrome.runtime.lastError || !redirectUrl) {
                console.error("Facebook login failed:", chrome.runtime.lastError);
                facebookButton.innerHTML = originalButtonHTML;
                facebookButton.disabled = false;
                showError("Facebook login failed. Please try again.");
                return;
            }
    
            // Extract the access token from the redirect URL
            const accessToken = new URL(redirectUrl).hash.match(/access_token=([^&]+)/)?.[1];
            
            if (!accessToken) {
                console.error("Access token not found in redirect URL:", redirectUrl);
                facebookButton.innerHTML = originalButtonHTML;
                facebookButton.disabled = false;
                showError("Could not authenticate with Facebook. Please try again.");
                return;
            }
    
            try {
                // Send the token to your backend using the facebookSignIn method from authService
                const result = await authService.facebookSignIn(accessToken);
                
                if (result.success) {
                    // Set the userEmail in localStorage if not already done in the service
                    if (result.user && result.user.email) {
                        localStorage.setItem('userEmail', result.user.email);
                    }
                    
                    // Navigate to main menu
                    navigateTo('MainMenuPage.html');
                } else {
                    facebookButton.innerHTML = originalButtonHTML;
                    facebookButton.disabled = false;
                    showError(result.error || 'Facebook authentication failed');
                }
            } catch (error) {
                console.error("Error during Facebook authentication:", error);
                facebookButton.innerHTML = originalButtonHTML;
                facebookButton.disabled = false;
                showError(error.message || 'Facebook authentication failed');
            }
        });
    }
    
    // Make sure the Facebook button has the correct event listener
    if (facebookButton) {
        facebookButton.addEventListener('click', facebookLogin);
    } else {
        console.error("Facebook login button not found. Make sure the element with id 'facebookLoginBtn' exists.");
    }

    
    // Check if user is already authenticated and redirect if needed
    if (authService.isAuthenticated()) {
        navigateTo('MainMenuPage.html');
    }
});