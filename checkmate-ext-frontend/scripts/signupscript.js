import AuthService from '../authentication/auth-service.js';

const authService = new AuthService(API_BASE_URL);

document.addEventListener('DOMContentLoaded', () => {
    // Add password visibility toggle functionality
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.parentElement.querySelector('input').id;
            const passwordInput = document.getElementById(targetId);
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Toggle the eye icon
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Handle form submission
    document.getElementById('signUpForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            // Use email as name since we removed the name field
            const result = await authService.register(email, email, password);
            if (result.success) {
                console.log('Registered successfully');
                navigateTo('SignInPage.html');
            } else {
                alert(result.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'An error occurred during registration.');
        }
    });
});