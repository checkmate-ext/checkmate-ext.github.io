document.getElementById('signInForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    alert('Signing in with email ' + email + ' and password ' + password);

    try {
        const response = await fetch('http://localhost:5000/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            alert('Sign-in successful with user ID ' + data.user_id);
            console.log('Sign-in successful:', data);
            // Optionally store token in localStorage and navigate
            // localStorage.setItem('authToken', data.token);
            // navigateTo('MainMenuPage.html');
        } else {
            const errorData = await response.json();
            alert(errorData.message);
        }
    } catch (error) {
        console.error('Sign-in error:', error);
        alert('An error occurred during sign-in');
    }
});