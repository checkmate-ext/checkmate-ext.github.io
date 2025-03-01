// When the DOM is ready, set the button text and plan message
document.addEventListener('DOMContentLoaded', () => {
  const currentPlan = localStorage.getItem('userPlan') || 'free';
  
  // Get references to your DOM elements
  const planMessage = document.getElementById('planMessage');
  const planCardsContainer = document.getElementById('planCardsContainer');
  
  // Safety check (in case elements are missing)
  if (!planCardsContainer) return;
  
  // Create plan cards with details
  createPlanCards(currentPlan, planCardsContainer);
  
  // Set plan message based on current plan
  if (planMessage) {
    if (currentPlan === 'free') {
      planMessage.innerHTML = 'You are on the <span style="font-weight: 600;">Free</span> plan';
    } else if (currentPlan === 'premium') {
      planMessage.innerHTML = 'You are on the <span style="color:#7B6225; font-weight:700;">Premium</span> plan';
    } else if (currentPlan === 'enterprise') {
      planMessage.innerHTML = 'You are on the <span style="color:#0d47a1; font-weight:700;">Enterprise</span> plan';
    } else {
      planMessage.textContent = `Unknown plan: ${currentPlan}`;
    }
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
      priceClass: 'free-price',
      features: [
        '5 articles per day',
        'Basic reliability scores',
        'Limited history retention (7 days)',
        'Standard support'
      ],
      color: '#3cb371',
      textColor: '#333',
      featureTextColor: '#2e8b57',
      active: currentPlan === 'free'
    },
    {
      name: 'Premium',
      price: '$5/month',
      priceClass: 'premium-price',
      features: [
        '20 articles per day (4x more than Free)',
        'Enhanced reliability analysis with detailed metrics',
        'Extended history retention (30 days)',
        'Priority email support with 24hr response time',
        'Exclusive content insights and source tracking'
      ],
      color: '#ffcc00',
      textColor: '#000000',
      featureTextColor: '#000000',
      active: currentPlan === 'premium'
    },
    {
      name: 'Enterprise',
      price: '$10/month',
      priceClass: 'enterprise-price',
      features: [
        'Unlimited articles per day',
        'Advanced reliability metrics with source verification',
        'Complete history retention (unlimited)',
        '24/7 dedicated support with phone assistance',
        'Source network mapping with trust scores',
        'Team collaboration features with shared folders'
      ],
      color: '#1a73e8',
      textColor: '#000000',
      featureTextColor: '#000000',
      active: currentPlan === 'enterprise'
    }
  ];
  
  // Create a card for each plan
  plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.style.opacity = plan.active ? '1' : '0.85';
    card.style.transform = plan.active ? 'scale(1.03)' : 'scale(1)';
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
    
    // Add a current plan indicator if this is the active plan
    const currentPlanBadge = plan.active ? 
      `<div class="plan-badge">CURRENT</div>` 
      : '';
    
    // Apply special text colors for Premium and Enterprise cards
    const nameColor = plan.textColor;
    const textClass = plan.name === 'Premium' ? 'premium-card-text' : (plan.name === 'Enterprise' ? 'enterprise-card-text' : '');
    
    // Build the feature list HTML with improved readability and custom color
    const featuresList = plan.features.map(feature => 
      `<li>
         <i class="fas fa-check" style="color: ${plan.color};"></i>
         <span style="color: ${plan.featureTextColor};">
           ${feature}
         </span>
       </li>`
    ).join('');
    
    // Create buttons for the plan
    let actionButtons = '';
    
    // Different buttons based on current plan and card
    if (plan.name === 'Free') {
      if (currentPlan === 'free') {
        // Free plan is active - no actions needed
      } else {
        // User on premium or enterprise can downgrade to free
        actionButtons = `<button class="card-btn cancel-btn" data-action="downgrade-to-free">SWITCH TO FREE</button>`;
      }
    } else if (plan.name === 'Premium') {
      if (currentPlan === 'free') {
        // Free user can upgrade to premium
        actionButtons = `<button class="card-btn premium-bg" data-action="upgrade-to-premium">UPGRADE TO PREMIUM</button>`;
      } else if (currentPlan === 'premium') {
        // Premium user can cancel
        actionButtons = `<button class="card-btn cancel-btn" data-action="cancel-premium">CANCEL PREMIUM</button>`;
      } else if (currentPlan === 'enterprise') {
        // Enterprise user can downgrade to premium
        actionButtons = `<button class="card-btn downgrade-btn" data-action="downgrade-to-premium">DOWNGRADE TO PREMIUM</button>`;
      }
    } else if (plan.name === 'Enterprise') {
      if (currentPlan === 'free' || currentPlan === 'premium') {
        // Free or Premium user can upgrade to enterprise
        actionButtons = `<button class="card-btn enterprise-bg" data-action="upgrade-to-enterprise">UPGRADE TO ENTERPRISE</button>`;
      } else if (currentPlan === 'enterprise') {
        // Enterprise user can cancel
        actionButtons = `<button class="card-btn cancel-btn" data-action="cancel-enterprise">CANCEL ENTERPRISE</button>`;
      }
    }
    
    card.innerHTML = `
      ${currentPlanBadge}
      <div class="plan-header">
        <h3 class="plan-name" style="color: ${nameColor}">${plan.name}</h3>
        <div class="plan-price ${plan.priceClass}">${plan.price}</div>
      </div>
      <div class="plan-features">
        <ul>
          ${featuresList}
        </ul>
      </div>
      ${actionButtons}
    `;
    
    container.appendChild(card);
  });
  
  // Add event listeners to all buttons
  const buttons = document.querySelectorAll('.card-btn');
  buttons.forEach(button => {
    button.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      
      switch (action) {
        case 'upgrade-to-premium':
          await updateSubscriptionPlan('premium', 'Successfully upgraded!');
          break;
          
        case 'upgrade-to-enterprise':
          await updateSubscriptionPlan('enterprise', 'Successfully upgraded!');
          break;
          
        case 'cancel-premium':
          if (confirm('Are you sure you want to cancel your Premium subscription?')) {
            await updateSubscriptionPlan('free', 'Subscription cancelled.');
          }
          break;
          
        case 'cancel-enterprise':
          if (confirm('Are you sure you want to cancel your Enterprise subscription?')) {
            await updateSubscriptionPlan('free', 'Subscription cancelled.');
          }
          break;
          
        case 'downgrade-to-premium':
          if (confirm('Are you sure you want to downgrade to Premium?')) {
            await updateSubscriptionPlan('premium', 'Successfully downgraded.');
          }
          break;
          
        case 'downgrade-to-free':
          if (confirm('Are you sure you want to switch to the Free plan?')) {
            await updateSubscriptionPlan('free', 'Successfully switched to Free plan.');
          }
          break;
      }
    });
  });
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

    // For demo/testing purposes, you can use this setTimeout instead of the fetch
    // Uncomment the fetch and comment this for production
    await new Promise(resolve => setTimeout(resolve, 1000));

    
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

    return { success: true };
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