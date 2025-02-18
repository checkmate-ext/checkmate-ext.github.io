document.addEventListener('DOMContentLoaded', () => {
    const emailSection = document.getElementById('emailSection');
    const codeSection = document.getElementById('codeSection');
    const userEmail = document.getElementById('userEmail');
    const displayEmail = document.getElementById('displayEmail');
    const sendCodeButton = document.getElementById('sendCodeButton');
    const confirmButton = document.getElementById('confirmButton');
    const message = document.getElementById('message');

    function showMessage(text, type) {
        message.textContent = text;
        message.className = `message ${type}-message`;
        message.style.display = 'block';
    }

    async function sendVerificationCode(email) {
        const response = await fetch('http://localhost:5000/user/send-verification-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            const data = await response.json();
            if (response.status === 404) {
                throw new Error('Email not registered');
            }
            throw new Error(data.message || 'Failed to send verification code');
        }

        return await response.json();
    }

    async function verifyCode(email, code) {
        const response = await fetch('http://localhost:5000/user/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                code: code
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Invalid verification code');
        }

        return await response.json();
    }

    sendCodeButton.addEventListener('click', async () => {
        const email = userEmail.value.trim();

        if (!email || !email.includes('@')) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        sendCodeButton.disabled = true;
        sendCodeButton.innerHTML = '<div class="loading-spinner"></div>Sending...';
        message.style.display = 'none';

        try {
            await sendVerificationCode(email);
            emailSection.style.display = 'none';
            displayEmail.textContent = email;
            codeSection.style.display = 'block';
        } catch (error) {
            showMessage(error.message || 'Failed to send verification code. Please try again.', 'error');
            sendCodeButton.disabled = false;
            sendCodeButton.textContent = 'Send Verification Code';
        }
    });

    confirmButton.addEventListener('click', async () => {
        const email = userEmail.value.trim();
        const code = document.getElementById('verificationCode').value.trim();

        if (!code || code.length !== 6) {
            showMessage('Please enter a valid 6-digit code', 'error');
            return;
        }

        confirmButton.disabled = true;
        confirmButton.innerHTML = '<div class="loading-spinner"></div>Verifying...';

        try {
            await verifyCode(email, code);
            showMessage('Verification successful!', 'success');
            // Store the email for password reset
            localStorage.setItem('resetEmail', email);
            // Navigate to update password page
            setTimeout(() => {
                navigateTo('UpdatePasswordPage.html');
            }, 1000);
        } catch (error) {
            showMessage(error.message || 'Invalid code. Please try again.', 'error');
            confirmButton.disabled = false;
            confirmButton.textContent = 'Verify Code';
        }
    });
});