document.addEventListener('DOMContentLoaded', () => {
    // Handle radio button selection styling
    const radioButtons = document.querySelectorAll('.custom-radio input');
    radioButtons.forEach(radio => {
        // Set initial state
        if (radio.checked) {
            radio.parentElement.classList.add('active');
        }
        
        radio.addEventListener('change', () => {
            // Remove active class from all labels
            document.querySelectorAll('.custom-radio').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to checked radio's label
            if (radio.checked) {
                radio.parentElement.classList.add('active');
            }
        });
    });

    // Check if we should select the reliability score issue radio
    const reportType = localStorage.getItem('reportType');
    if (reportType === 'reliability') {
        const reliabilityRadio = document.querySelector('input[value="Reliability Score Issue"]');
        if (reliabilityRadio) {
            reliabilityRadio.checked = true;
            // Trigger change event to update styling
            reliabilityRadio.dispatchEvent(new Event('change'));
        }
        
        // Clear the reportType from localStorage
        localStorage.removeItem('reportType');
    }

    // Form submission handler
    document.getElementById('reportForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const form = e.target;
        const formData = new FormData(form);
        const reportType = formData.get('reportType');
        const message = formData.get('message');
        const token = localStorage.getItem('token');

        // Add loading state to button
        const submitBtn = document.getElementById('sendReportBtn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE_URL}/report`, {
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
                
                // Reset radio button styling
                document.querySelectorAll('.custom-radio').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Set the first radio button as checked and active
                const firstRadio = document.querySelector('.custom-radio input');
                if (firstRadio) {
                    firstRadio.checked = true;
                    firstRadio.parentElement.classList.add('active');
                }
            } else {
                showNotification(data.error || 'Failed to send report', 'is-danger');
            }
        } catch (error) {
            console.error(error);
            showNotification('An error occurred. Please try again.', 'is-danger');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
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