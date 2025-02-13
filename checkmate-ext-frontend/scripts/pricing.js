document.addEventListener("DOMContentLoaded", () => {
    const premiumButton = document.querySelector('.premium');
    const enterpriseButton = document.querySelector('.enterprise');

    async function updateUserPlan(plan) {
        try {
            const response = await fetch('http://localhost:5000/user/update-plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ plan })
            });

            const result = await response.json();
            alert(response.ok ? `Plan updated to ${plan}` : `Failed: ${result.error}`);
        } catch (error) {
            console.error('Update failed:', error);
            alert('Server error. Please try again.');
        }
    }

    premiumButton.addEventListener('click', () => updateUserPlan('Premium'));
    enterpriseButton.addEventListener('click', () => updateUserPlan('Enterprise'));
});