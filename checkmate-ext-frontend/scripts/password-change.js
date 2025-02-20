// Update Password Handler
document.getElementById('updateBtn').addEventListener('click', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const updateBtn = document.getElementById('updateBtn');

    // Remove existing notifications
    document.querySelectorAll('.notification').forEach((n) => n.remove());

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'is-danger');
        return;
    }

    updateBtn.classList.add('is-loading');

    try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required. Please log in.');
        }

        const response = await fetch('http://localhost:5000/user/update-password', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ new_password: newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Password updated successfully', 'is-success');
            document.getElementById('passwordForm').reset();
        } else {
            showNotification(data.error || 'Failed to update password', 'is-danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('An error occurred. Please try again.', 'is-danger');
    } finally {
        updateBtn.classList.remove('is-loading');
    }
});

// Toggle Password Visibility Handlers
document.getElementById('toggleNew').addEventListener('click', () => {
    togglePasswordVisibility('newPassword', 'toggleNewIcon');
});

document.getElementById('toggleConfirm').addEventListener('click', () => {
    togglePasswordVisibility('confirmPassword', 'toggleConfirmIcon');
});

// Helper: Toggle Password Visibility
function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    }
}

// Helper: Show Notification
function showNotification(message, type) {
    const notificationDiv = document.createElement('div');
    notificationDiv.className = `notification ${type}`;
    notificationDiv.innerHTML = `<button class="delete"></button> ${message}`;

    document.getElementById('notificationContainer').appendChild(notificationDiv);

    notificationDiv.querySelector('.delete').addEventListener('click', () => {
        notificationDiv.remove();
    });

    if (type === 'is-success') {
        setTimeout(() => notificationDiv.remove(), 5000);
    }
}
