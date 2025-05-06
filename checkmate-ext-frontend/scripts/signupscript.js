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
            // Show loading state
            const submitButton = event.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<div class="loading-spinner"></div> Signing up...';

            // Use email as name since we removed the name field
            const result = await authService.register(email, email, password);
            
            // Modify the success message to be more compact while preserving functionality
            
            if (result.success) {
                console.log('Registered successfully');
                
                // Hide the form and show success message
                const formSection = document.querySelector('.form-section');
                formSection.innerHTML = `
                    <div class="success-message">
                        <div class="success-icon">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <h2>Registration Successful!</h2>
                        <p>We've sent a verification link to <strong>${email}</strong></p>
                        <p>Please check your inbox and verify your account.</p>
                        <div class="tips">
                            <p><i class="fas fa-info-circle"></i> If you don't see the email:</p>
                            <ul>
                                <li>Check your spam folder</li>
                                <li>Verify your email address</li>
                            </ul>
                        </div>
                        <button class="button" id="goToSignIn">Go to Sign In</button>
                    </div>
                `;
                
                // Add CSS for the success message with more compact styling
                const style = document.createElement('style');
                style.textContent = `
                    .success-message {
                        text-align: center;
                        padding: 15px;
                        animation: fadeIn 0.5s;
                    }
                    .success-icon {
                        font-size: 3.5rem;
                        color: var(--primary-color);
                        margin-bottom: 10px;
                    }
                    .success-message h2 {
                        color: var(--text-dark);
                        font-size: 1.3rem;
                        margin-bottom: 5px;
                    }
                    .success-message p {
                        margin-bottom: 5px;
                        color: #555;
                        font-size: 0.95rem;
                    }
                    .tips {
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        padding: 10px;
                        margin: 12px 0;
                        text-align: left;
                    }
                    .tips p {
                        font-weight: 500;
                        font-size: 0.9rem;
                        margin-bottom: 5px;
                    }
                    .tips ul {
                        margin-left: 20px;
                        margin-top: 2px;
                    }
                    .tips li {
                        margin-bottom: 3px;
                        font-size: 0.85rem;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    .button {
                        margin-top: 8px;
                    }
                `;
                document.head.appendChild(style);
                
                // Add event listener for the "Go to Sign In" button
                document.getElementById('goToSignIn').addEventListener('click', () => {
                    navigateTo('SignInPage.html');
                });
            } else {
                // Reset button state
                submitButton.disabled = false;
                submitButton.textContent = originalText;
                alert(result.error || 'Registration failed. Please try again.');
            }


        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'An error occurred during registration.');
            
            // Reset button state
            const submitButton = event.target.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = 'Sign Up';
        }
    });



});