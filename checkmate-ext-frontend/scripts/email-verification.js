// email-verification.js
import { API_BASE_URL, ENDPOINTS, AUTH_CONFIG } from '../config/config.js';
document.addEventListener('DOMContentLoaded', () => {
    // Section elements
    const sections = {
        email: document.getElementById('emailSection'),
        code: document.getElementById('codeSection'),
        password: document.getElementById('passwordSection')
    };

    // Form elements
    const elements = {
        userEmail: document.getElementById('userEmail'),
        displayEmail: document.getElementById('displayEmail'),
        verificationCode: document.getElementById('verificationCode'),
        newPassword: document.getElementById('newPassword'),
        confirmPassword: document.getElementById('confirmPassword'),
        message: document.getElementById('message')
    };

    // Button elements
    const buttons = {
        sendCode: document.getElementById('sendCodeButton'),
        confirm: document.getElementById('confirmButton'),
        updatePassword: document.getElementById('updatePasswordButton')
    };

    // Helper functions
    function showMessage(text, type) {
        elements.message.textContent = text;
        elements.message.className = `message ${type}-message`;
        elements.message.style.display = 'block';
    }

    function showSection(sectionName) {
        Object.values(sections).forEach(section => section.style.display = 'none');
        sections[sectionName].style.display = 'block';
    }

    function validatePassword(password) {
        // Basic password requirements
        const hasMinLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[^A-Za-z0-9]/.test(password);

        return hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
    }

    // API calls
    async function sendVerificationCode(email) {
        const response = await fetch(`${API_BASE_URL}/user/send-verification-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        const response = await fetch(`${API_BASE_URL}/user/verify-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Invalid verification code');
        }

        return await response.json();
    }

    async function updatePassword(email, newPassword) {
        const response = await fetch(`${API_BASE_URL}/user/update-forgotten-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, new_password: newPassword })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update password');
        }

        return await response.json();
    }

    // Event listeners
    buttons.sendCode.addEventListener('click', async () => {
        const email = elements.userEmail.value.trim();

        if (!email || !email.includes('@')) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        buttons.sendCode.disabled = true;
        buttons.sendCode.innerHTML = '<div class="loading-spinner"></div>Sending...';
        elements.message.style.display = 'none';

        try {
            await sendVerificationCode(email);
            showSection('code');
            elements.displayEmail.textContent = email;
        } catch (error) {
            showMessage(error.message, 'error');
            buttons.sendCode.disabled = false;
            buttons.sendCode.textContent = 'Send Verification Code';
        }
    });

    buttons.confirm.addEventListener('click', async () => {
        const email = elements.userEmail.value.trim();
        const code = elements.verificationCode.value.trim();

        if (!code || code.length !== 6) {
            showMessage('Please enter a valid 6-digit code', 'error');
            return;
        }

        buttons.confirm.disabled = true;
        buttons.confirm.innerHTML = '<div class="loading-spinner"></div>Verifying...';

        try {
            await verifyCode(email, code);
            showMessage('Code verified successfully!', 'success');
            setTimeout(() => {
                showSection('password');
                elements.message.style.display = 'none';
            }, 1000);
        } catch (error) {
            showMessage(error.message, 'error');
            buttons.confirm.disabled = false;
            buttons.confirm.textContent = 'Verify Code';
        }
    });

    buttons.updatePassword.addEventListener('click', async () => {
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        const email = elements.userEmail.value.trim();

        /*if (!validatePassword(newPassword)) {
            showMessage('Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character', 'error');
            return;
        }*/

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match', 'error');
            return;
        }

        buttons.updatePassword.disabled = true;
        buttons.updatePassword.innerHTML = '<div class="loading-spinner"></div>Updating...';

        try {
            await updatePassword(email, newPassword);
            showMessage('Password updated successfully!', 'success');
            buttons.updatePassword.innerHTML = 'Updated';
        } catch (error) {
            showMessage(error.message, 'error');
            buttons.updatePassword.disabled = false;
            buttons.updatePassword.textContent = 'Update Password';
        }
    });
});