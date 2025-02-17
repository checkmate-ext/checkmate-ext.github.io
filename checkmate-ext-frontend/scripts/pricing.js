document.getElementById('premiumBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:5000/user/update-plan', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ plan: 'premium' })  // Explicitly set plan to 'premium'
        });

        if (!response.ok) {
            // Handle HTTP errors (e.g., 401, 403, 500)
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update plan');
        }

        const data = await response.json();
        alert('Successfully upgraded to premium!');
        
        // Optionally refresh the page or update UI elements
        window.location.reload();
        
    } catch (error) {
        console.error('Update failed:', error);
        alert(error.message || 'Failed to update plan. Please try again.');
    }
});

document.getElementById('enterpriseBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:5000/user/update-plan', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ plan: 'enterprise' })  // Explicitly set plan to 'premium'
        });

        if (!response.ok) {
            // Handle HTTP errors (e.g., 401, 403, 500)
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update plan');
        }

        const data = await response.json();
        alert('Successfully upgraded to enterprise!');
        
        // Optionally refresh the page or update UI elements
        window.location.reload();
        
    } catch (error) {
        console.error('Update failed:', error);
        alert(error.message || 'Failed to update plan. Please try again.');
    }
});