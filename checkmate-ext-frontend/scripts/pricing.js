// When the DOM is ready, set the button text and plan message
document.addEventListener('DOMContentLoaded', () => {
    const currentPlan = localStorage.getItem('userPlan') || 'free';
  
    // Get references to your DOM elements
    const planMessage = document.getElementById('planMessage');
    const premiumBtn = document.getElementById('premiumBtn');
    const enterpriseBtn = document.getElementById('enterpriseBtn');
  
    // Safety check (in case elements are missing)
    if (!premiumBtn || !enterpriseBtn) return;
  
    // Set button text and plan message based on current plan
    if (currentPlan === 'free') {
      // Free plan
      if (planMessage) {
        planMessage.textContent = 'You are on the Free plan. Upgrade below:';
      }
      premiumBtn.textContent = 'Upgrade to Premium ($5/mo)';
      enterpriseBtn.textContent = 'Upgrade to Enterprise ($10/mo)';
    } else if (currentPlan === 'premium') {
      // Premium plan
      if (planMessage) {
        planMessage.textContent = 'You are on the Premium plan.';
      }
      premiumBtn.textContent = 'Cancel Premium';
      enterpriseBtn.textContent = 'Upgrade to Enterprise';
    } else if (currentPlan === 'enterprise') {
      // Enterprise plan
      if (planMessage) {
        planMessage.textContent = 'You are on the Enterprise plan.';
      }
      // Hide the premium button or repurpose it
      premiumBtn.style.display = 'none';
      enterpriseBtn.textContent = 'Cancel Subscription';
    } else {
      // Unknown plan (fallback)
      if (planMessage) {
        planMessage.textContent = `Unknown plan: ${currentPlan}`;
      }
      premiumBtn.textContent = 'N/A';
      enterpriseBtn.textContent = 'N/A';
    }
  });
  
  // Shared function for plan updates
  async function updateSubscriptionPlan(newPlan, successMessage) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }
  
      const response = await fetch('http://localhost:5000/user/update-plan', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      });
  
      // Handle network errors
      if (!response) {
        throw new Error('Network error occurred. Please check your connection.');
      }
  
      // Parse error response before throwing
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update plan');
      }
  
      const responseData = await response.json();
  
      // Update local storage only after successful server update
      localStorage.setItem('userPlan', newPlan);
      alert(successMessage);
      window.location.reload();
  
      return responseData;
    } catch (error) {
      console.error('Update failed:', error);
      alert(error.message || 'Failed to update plan. Please try again.');
      throw error;
    }
  }
  
  // Premium button handler
  document.getElementById('premiumBtn')?.addEventListener('click', async () => {
    const currentPlan = localStorage.getItem('userPlan') || 'free';
  
    if (currentPlan === 'free') {
      await updateSubscriptionPlan('premium', 'Successfully upgraded to premium!');
    } else if (currentPlan === 'premium') {
      await updateSubscriptionPlan('free', 'Premium subscription cancelled.');
    } else {
      alert('This action is not available.');
    }
  });
  
  // Enterprise button handler
  document.getElementById('enterpriseBtn')?.addEventListener('click', async () => {
    const currentPlan = localStorage.getItem('userPlan') || 'free';
  
    if (['free', 'premium'].includes(currentPlan)) {
      await updateSubscriptionPlan('enterprise', 'Successfully upgraded to enterprise!');
    } else if (currentPlan === 'enterprise') {
      await updateSubscriptionPlan('free', 'Enterprise subscription cancelled.');
    } else {
      alert('This action is not available.');
    }
  });
  