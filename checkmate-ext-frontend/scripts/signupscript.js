// signup.js

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('googleSignUpButton').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('GoogleSignUpPage.html');
    });
    document.getElementById('facebookSignUpButton').addEventListener('click', (event) => {
        event.preventDefault();
        navigateTo('FacebookSignUpPage.html');
    });
});


document.getElementById('signUpForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Optional: Add password confirmation check
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/user/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
    
        if (response.ok) {
            const data = await response.json();
            console.log(data.message);
            // Optionally navigate to another page
        } else {
            const errorData = await response.json();
            alert(errorData.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred during registration');
    }
});