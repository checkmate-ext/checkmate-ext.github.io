import AuthService from '../authentication/auth-service.js';

const authService = new AuthService('http://localhost:5000');


document.getElementById('signUpForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        // Use AuthService instead of fetch
        const result = await authService.register(name, email, password);
        if (result.success) {
            console.log('Registered successfully');
            navigateTo('SignInPage.html');
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert(error.message);
    }
});