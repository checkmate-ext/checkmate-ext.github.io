document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const updateBtn = document.getElementById('updateBtn');
    const passwordForm = document.getElementById('passwordForm');
    const backBtn = document.getElementById('backBtn');
    
    // Navigation buttons
    const homeBtn = document.getElementById('homeBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const reportBtn = document.getElementById('reportBtn');

    // Initialize password toggle buttons
    initializePasswordToggles();
    
    // Check input fields to enable/disable submit button
    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('input', checkFormValidity);
    });

    // Form submission handler
    passwordForm.addEventListener('submit', handlePasswordUpdate);
    
    // Navigation events
    if (backBtn) backBtn.addEventListener('click', () => window.history.back());
    if (homeBtn) homeBtn.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'navigate', destination: 'main' }));
    if (settingsBtn) settingsBtn.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'navigate', destination: 'settings' }));
    if (reportBtn) reportBtn.addEventListener('click', () => chrome.runtime.sendMessage({ action: 'navigate', destination: 'report' }));

    // Initialize password toggles
    function initializePasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                
                if (passwordInput) {
                    // Toggle password visibility
                    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordInput.setAttribute('type', type);
                    
                    // Toggle the eye icon
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye');
                        icon.classList.toggle('fa-eye-slash');
                    }
                }
            });
        });
    }

    // Check if form is valid
    function checkFormValidity() {
        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        // Enable button only if all fields have values and new password matches confirmation
        updateBtn.disabled = !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword;
    }

    // Handle form submission
    async function handlePasswordUpdate(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Show loading state
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<span class="loading-spinner"></span>Updating...';

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required. Please log in again.');
            }

            const response = await fetch(`${API_BASE_URL}/user/update-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    current_password: currentPasswordInput.value.trim(),
                    new_password: newPasswordInput.value.trim() 
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Password updated successfully!', 'is-success');
                passwordForm.reset();
                updateBtn.disabled = true;
                
                // Automatically redirect after 2 seconds on success
                setTimeout(() => {
                    chrome.runtime.sendMessage({ action: 'navigate', destination: 'profile' });
                }, 2000);
            } else {
                showNotification(data.error || 'Failed to update password. Please try again.', 'is-danger');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showNotification(error.message || 'An error occurred. Please try again.', 'is-danger');
        } finally {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Update Password';
        }
    }

    // Validate form before submission
    function validateForm() {
        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('All fields are required', 'is-danger');
            return false;
        }

        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'is-danger');
            return false;
        }

        return true;
    }

    // Show notification
    function showNotification(message, type) {
        // Clear existing notifications
        const container = document.getElementById('notificationContainer');
        container.innerHTML = '';
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete';
        deleteButton.innerHTML = '×';
        deleteButton.addEventListener('click', () => notification.remove());
        
        // Add content
        notification.appendChild(deleteButton);
        notification.appendChild(document.createTextNode(message));
        
        // Add to container
        container.appendChild(notification);
        
        // Auto-dismiss success notifications after 5 seconds
        if (type === 'is-success') {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
    }
});