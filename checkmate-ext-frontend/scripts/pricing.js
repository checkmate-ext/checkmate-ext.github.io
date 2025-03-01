// When the DOM is ready, set the button text and plan message
document.addEventListener('DOMContentLoaded', () => {
  const currentPlan = localStorage.getItem('userPlan') || 'free';
  
  // Get references to your DOM elements
  const planMessage = document.getElementById('planMessage');
  const premiumBtn = document.getElementById('premiumBtn');
  const enterpriseBtn = document.getElementById('enterpriseBtn');
  const planCardsContainer = document.getElementById('planCardsContainer');
  
  // Safety check (in case elements are missing)
  if (!premiumBtn || !enterpriseBtn || !planCardsContainer) return;
  
  // Create plan cards with details
  createPlanCards(currentPlan, planCardsContainer);
  
  // Set button text and plan message based on current plan
  if (currentPlan === 'free') {
    // Free plan
    if (planMessage) {
      planMessage.innerHTML = 'You are on the <span style="font-weight: 600;">Free</span> plan';
    }
    premiumBtn.textContent = 'Upgrade to Premium';
    premiumBtn.style.background = 'linear-gradient(145deg, #f9f1c5, #ffcc00)';
    premiumBtn.style.color = '#7B6225';
    premiumBtn.style.fontWeight = '600';
    premiumBtn.style.border = '1px solid rgba(255, 204, 0, 0.5)';
    
    enterpriseBtn.textContent = 'Upgrade to Enterprise';
    enterpriseBtn.style.background = 'linear-gradient(145deg, #e6f0ff, #1a73e8)';
    enterpriseBtn.style.color = '#0d47a1';
    enterpriseBtn.style.fontWeight = '600';
    enterpriseBtn.style.border = '1px solid rgba(26, 115, 232, 0.5)';
  } else if (currentPlan === 'premium') {
    // Premium plan
    if (planMessage) {
      planMessage.innerHTML = 'You are on the <span style="color:#7B6225; font-weight:700;">Premium</span> plan';
    }
    premiumBtn.textContent = 'Cancel Premium';
    premiumBtn.style.background = '#f2f2f2';
    premiumBtn.style.color = '#666';
    
    enterpriseBtn.textContent = 'Upgrade to Enterprise';
    enterpriseBtn.style.background = 'linear-gradient(145deg, #e6f0ff, #1a73e8)';
    enterpriseBtn.style.color = '#0d47a1';
    enterpriseBtn.style.fontWeight = '600';
    enterpriseBtn.style.border = '1px solid rgba(26, 115, 232, 0.5)';
  } else if (currentPlan === 'enterprise') {
    // Enterprise plan
    if (planMessage) {
      planMessage.innerHTML = 'You are on the <span style="color:#0d47a1; font-weight:700;">Enterprise</span> plan';
    }
    premiumBtn.textContent = 'Downgrade to Premium';
    premiumBtn.style.background = 'linear-gradient(145deg, #f9f1c5, #ffcc00)';
    premiumBtn.style.color = '#7B6225';
    premiumBtn.style.fontWeight = '600';
    premiumBtn.style.border = '1px solid rgba(255, 204, 0, 0.5)';
    
    enterpriseBtn.textContent = 'Cancel Subscription';
    enterpriseBtn.style.background = '#f2f2f2';
    enterpriseBtn.style.color = '#666';
  } else {
    // Unknown plan (fallback)
    if (planMessage) {
      planMessage.textContent = `Unknown plan: ${currentPlan}`;
    }
    premiumBtn.textContent = 'N/A';
    enterpriseBtn.textContent = 'N/A';
  }
});

// Function to create detailed plan cards
function createPlanCards(currentPlan, container) {
  // Clear existing content
  container.innerHTML = '';
  
  // Define plan features
  const plans = [
    {
      name: 'Free',
      price: '$0',
      features: [
        '5 articles per day',
        'Basic reliability scores',
        'Limited history retention (7 days)',
        'Standard support'
      ],
      color: '#3cb371',
      active: currentPlan === 'free'
    },
    {
      name: 'Premium',
      price: '$5/month',
      features: [
        '20 articles per day',
        'Enhanced reliability analysis',
        'Extended history (30 days)',
        'Priority support',
        'Exclusive content insights'
      ],
      color: '#ffcc00',
      textColor: '#7B6225',
      active: currentPlan === 'premium',
      upgrade: currentPlan === 'free' ? 'Upgrade to Premium' : null,
      upgradeAction: () => handlePlanChange('premium')
    },
    {
      name: 'Enterprise',
      price: '$10/month',
      features: [
        'Unlimited articles per day',
        'Advanced reliability metrics',
        'Complete history retention',
        '24/7 dedicated support',
        'Source network mapping',
        'Team collaboration features'
      ],
      color: '#1a73e8',
      textColor: '#0d47a1',
      active: currentPlan === 'enterprise',
      upgrade: ['free', 'premium'].includes(currentPlan) ? 'Upgrade to Enterprise' : null,
      upgradeAction: () => handlePlanChange('enterprise')
    }
  ];
  
  // Create a card for each plan
  plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.style.opacity = plan.active ? '1' : '0.75';
    card.style.transform = plan.active ? 'scale(1.05)' : 'scale(1)';
    card.style.marginTop = plan.active ? '15px' : '5px'; // Add margin for active plan
    
    // Apply special styling for Premium and Enterprise plans
    if (plan.name === 'Premium') {
      card.style.background = 'linear-gradient(145deg, #f9f1c5 0%, #ffcc00 15%)';
      card.style.boxShadow = plan.active ? '0 8px 20px rgba(255, 204, 0, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)';
      card.style.border = '1px solid rgba(255, 204, 0, 0.5)';
    } else if (plan.name === 'Enterprise') {
      card.style.background = 'linear-gradient(145deg, #e6f0ff 0%, #1a73e8 15%)';
      card.style.boxShadow = plan.active ? '0 8px 20px rgba(26, 115, 232, 0.3)' : '0 4px 12px rgba(0,0,0,0.1)';
      card.style.border = '1px solid rgba(26, 115, 232, 0.5)';
    } else {
      card.style.background = 'white';
      card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      card.style.border = '1px solid #eee';
    }
    
    // Add a current plan indicator if this is the active plan - FIXED BADGE VISIBILITY
    const currentPlanBadge = plan.active ? 
      `<div class="plan-badge">CURRENT</div>` 
      : '';
    
    // Apply special text colors for Premium and Enterprise cards
    const nameColor = plan.textColor || '#333';
    
    // Build the feature list HTML
    const featuresList = plan.features.map(feature => 
      `<li><i class="fas fa-check" style="color: ${plan.color}; margin-right: 5px;"></i>${feature}</li>`
    ).join('');
    
    // Create upgrade button if applicable
    const upgradeButton = plan.upgrade ? 
      `<button class="card-upgrade-btn" style="
          background: ${plan.name === 'Premium' ? '#ffcc00' : '#1a73e8'};
          color: ${plan.name === 'Premium' ? '#7B6225' : 'white'};
          border: none;
          border-radius: 6px;
          padding: 8px 10px;
          margin-top: 10px;
          width: 100%;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s ease;
         ">${plan.upgrade}</button>` : '';
    
    card.innerHTML = `
      ${currentPlanBadge}
      <div class="plan-header">
        <h3 class="plan-name" style="color: ${nameColor}">${plan.name}</h3>
        <div class="plan-price">${plan.price}</div>
      </div>
      <div class="plan-features">
        <ul>
          ${featuresList}
        </ul>
      </div>
      ${upgradeButton}
    `;
    
    container.appendChild(card);
    
    // Add event listener to the upgrade button if it exists
    if (plan.upgrade) {
      const btn = card.querySelector('.card-upgrade-btn');
      btn.addEventListener('click', plan.upgradeAction);
    }
  });
}

// Handle plan change actions (for in-card buttons)
async function handlePlanChange(newPlan) {
  const currentPlan = localStorage.getItem('userPlan') || 'free';
  
  if (newPlan === 'premium' && currentPlan === 'free') {
    await updateSubscriptionPlan('premium', 'Successfully upgraded to Premium!');
  } else if (newPlan === 'enterprise' && ['free', 'premium'].includes(currentPlan)) {
    await updateSubscriptionPlan('enterprise', 'Successfully upgraded to Enterprise!');
  } else {
    alert('This action is not available.');
  }
}

// Shared function for plan updates
async function updateSubscriptionPlan(newPlan, successMessage) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Store the original button text for reset if needed
    const activeButton = document.activeElement;
    const originalText = activeButton.textContent;
    
    // Show loading indicator on the active button 
    activeButton.innerHTML = '<span class="loading-spinner"></span> Processing...';
    activeButton.disabled = true;

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
    
    // Show success message
    const notification = document.createElement('div');
    notification.className = 'plan-notification';
    notification.textContent = successMessage;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.background = '#3cb371';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      setTimeout(() => notification.remove(), 500);
    }, 3000);
    
    // Reload the page
    setTimeout(() => window.location.reload(), 1000);

    return responseData;
  } catch (error) {
    console.error('Update failed:', error);
    
    // Reset button
    const activeButton = document.activeElement;
    if (activeButton && activeButton.disabled) {
      activeButton.innerHTML = originalText || activeButton.textContent;
      activeButton.disabled = false;
    }
    
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
    if (confirm('Are you sure you want to cancel your Premium subscription?')) {
      await updateSubscriptionPlan('free', 'Premium subscription cancelled.');
    }
  } else if (currentPlan === 'enterprise') {
    // Handle downgrade from Enterprise to Premium
    if (confirm('Are you sure you want to downgrade to Premium?')) {
      await updateSubscriptionPlan('premium', 'Successfully downgraded to Premium.');
    }
  } else {
    alert('This action is not available.');
  }
});

// Enterprise button handler
document.getElementById('enterpriseBtn')?.addEventListener('click', async () => {
  const currentPlan = localStorage.getItem('userPlan') || 'free';

  if (['free', 'premium'].includes(currentPlan)) {
    await updateSubscriptionPlan('enterprise', 'Successfully upgraded to Enterprise!');
  } else if (currentPlan === 'enterprise') {
    if (confirm('Are you sure you want to cancel your Enterprise subscription?')) {
      await updateSubscriptionPlan('free', 'Enterprise subscription cancelled.');
    }
  } else {
    alert('This action is not available.');
  }
});