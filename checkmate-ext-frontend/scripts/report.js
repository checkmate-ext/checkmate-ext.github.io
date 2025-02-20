document.getElementById('reportForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const reportType = formData.get('reportType');
    const message = formData.get('message');
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('http://localhost:5000/report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ reportType, message })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message, 'is-success');
            form.reset();
        } else {
            showNotification(data.error || 'Failed to send report', 'is-danger');
        }
    } catch (error) {
        console.error(error);
        showNotification('An error occurred. Please try again.', 'is-danger');
    }
});

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
