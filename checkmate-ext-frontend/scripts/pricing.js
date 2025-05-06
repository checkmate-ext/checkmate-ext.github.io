import paymentService from './payment-service.js';

document.addEventListener('DOMContentLoaded', () => {
  // Listen for the payment callback message from callback-handler.js
  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type !== 'CF_TOKEN') return;
    
    const plan = message.plan || localStorage.getItem('cfPlan');
    
    try {
      // Show a loading state
      const planMessage = document.getElementById('planMessage');
      if (planMessage) {
        planMessage.innerHTML = '<em>Processing your payment...</em>';
      }
      
      // Validate the payment was successful
      const result = await paymentService.queryCheckout(message.token, plan);
      
      if (result.paymentStatus === 'SUCCESS') {
        // Update storage in both places
        chrome.storage.sync.set({ userPlan: plan });
        localStorage.setItem('userPlan', plan);
        
        // Show success message
        showNotification(`Successfully subscribed to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan!`, 'success');
        
        // Update the UI
        renderPricingUI(plan);
      } else {
        showNotification('Payment failed: ' + (result.errorMessage || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('CF query error:', err);
      showNotification('Could not finalize payment', 'error');
    }
  });

  // Load the user's current plan
  loadUserPlan();
});

async function loadUserPlan() {
  try {
    const info = await paymentService.getCurrentSubscription();
    renderPricingUI(info.success ? info.plan : await getStoredPlan());
  } catch {
    renderPricingUI(await getStoredPlan());
  }
}

function getStoredPlan() {
  return new Promise(resolve => {
    // First check localStorage
    const localPlan = localStorage.getItem('userPlan');
    if (localPlan) {
      resolve(localPlan);
      return;
    }

    // Fall back to chrome.storage.sync
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(['userPlan'], res => {
        const plan = res.userPlan || 'free';
        // Synchronize to localStorage for future consistency
        localStorage.setItem('userPlan', plan);
        resolve(plan);
      });
    } else {
      resolve('free');
    }
  });
}

function renderPricingUI(currentPlan) {
  const planCardsContainer = document.getElementById('planCardsContainer');
  const planMessage = document.getElementById('planMessage');
  
  // Keep the header message as is
  planMessage.textContent =
      currentPlan === 'free'
          ? 'Upgrade your plan to access premium features'
          : `You are currently on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan`;

  planCardsContainer.innerHTML = '';
  
  // Show Free plan card
  if (currentPlan === 'free' || currentPlan === 'Free') {
    // If on Free plan, show as current
    addPlanCard('free', 'Free', '₺0', ['Basic AI Checks', '5 checks/day', 'Standard support'], 'Current Plan', true);
  } else {
    // Otherwise show downgrade option
    addPlanCard('free', 'Free', '₺0', ['Basic AI Checks', '5 checks/day', 'Standard support'], 'Downgrade');
  }
  
  // Show Premium plan card
  if (currentPlan === 'premium' || currentPlan === 'Premium') {
    // If on Premium plan, show as current
    addPlanCard('premium', 'Premium', '₺49.99/mo', ['Advanced AI Checks', '50 checks/day', 'Priority support'], 'Current Plan', true);
  } else {
    // Otherwise show upgrade option
    addPlanCard('premium', 'Premium', '₺49.99/mo', ['Advanced AI Checks', '50 checks/day', 'Priority support'], 'Upgrade');
  }
  
  // Show Enterprise plan card
  if (currentPlan === 'enterprise' || currentPlan === 'Enterprise') {
    // If on Enterprise plan, show as current
    addPlanCard('enterprise', 'Enterprise', 'Contact Us', ['All Premium features', 'Team features'], 'Current Plan', true);
  } else {
    // Otherwise show upgrade option
    addPlanCard('enterprise', 'Enterprise', 'Contact Us', ['All Premium features', 'Team features'], 'Upgrade');
  }

  document.querySelectorAll('.card-btn').forEach(btn => btn.addEventListener('click', handlePlanSelection));
}

function addPlanCard(planId, name, price, features, buttonText, isCurrentPlan = false) {
  const card = document.createElement('div');
  card.className = 'plan-card';
  card.dataset.plan = planId;
  
  // Make sure the card has position relative for absolute badge positioning
  card.style.position = 'relative';

  if (isCurrentPlan) {
    const badge = document.createElement('div');
    badge.className = 'plan-badge';
    badge.textContent = 'CURRENT PLAN';
    
    // Set explicit styling to ensure visibility across themes
    badge.style.position = 'absolute';
    badge.style.top = '10px'; // Changed from -10px to prevent cutoff
    badge.style.right = '10px';
    badge.style.backgroundColor = planId === 'premium' ? '#ffcc00' : 
                               planId === 'enterprise' ? '#1a73e8' : 
                               '#3cb371'; // Specific colors for each plan
    badge.style.color = planId === 'premium' ? '#7B6225' : '#ffffff';
    badge.style.padding = '3px 8px';
    badge.style.borderRadius = '10px';
    badge.style.fontSize = '10px';
    badge.style.fontWeight = 'bold';
    badge.style.transform = 'rotate(3deg)';
    badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    badge.style.zIndex = '100';
    badge.style.border = planId === 'premium' ? '1px solid #7B6225' : 
                        planId === 'enterprise' ? '1px solid #0d47a1' : 
                        '1px solid #2e8b57';
    
    card.appendChild(badge);
  }

  const header = document.createElement('div');
  header.className = 'plan-header';
  
  const nameDiv = document.createElement('div');
  nameDiv.className = 'plan-name';
  nameDiv.textContent = name;
  
  const priceDiv = document.createElement('div');
  priceDiv.className = `plan-price ${planId}-price`;
  priceDiv.textContent = price;
  
  header.append(nameDiv, priceDiv);
  card.append(header);

  const ul = document.createElement('ul');
  ul.className = 'plan-features';
  features.forEach(f => {
    const li = document.createElement('li');
    const icon = document.createElement('i');
    icon.className = 'fas fa-check';
    icon.style.color = planId === 'premium' ? '#ffcc00' : planId === 'enterprise' ? '#1a73e8' : '#3cb371';
    li.append(icon, document.createTextNode(' ' + f));
    ul.append(li);
  });
  card.append(ul);

  if (!isCurrentPlan) {
    const btn = document.createElement('button');
    btn.className = `card-btn ${planId}-bg`;
    btn.textContent = buttonText;
    btn.dataset.plan = planId;
    card.append(btn);
  }

  document.getElementById('planCardsContainer').append(card);
}

async function handlePlanSelection(e) {
  const plan = e.target.dataset.plan;
  if (e.target.textContent === 'Current Plan') return;
  if (e.target.textContent.includes('Downgrade')) {
    if (confirm(`Downgrade to ${plan}?`)) return changePlan(plan);
    else return;
  }
  if (plan === 'free') return changePlan(plan);

  // Paid flow → initialize payment
  const amount = plan === 'premium' ? '49.99' : '29.99';
  const extCallback = chrome.runtime.getURL('extension-ui/callback.html');
  const callbackUrl = `${window.API_BASE_URL}/iyzico/callback`
  + `?plan=${plan}`
  + `&returnUrl=${encodeURIComponent(extCallback)}`;
  
  // Show processing state
  e.target.disabled = true;
  e.target.innerHTML = '<span class="loading-spinner"></span> Processing...';
  
  try {
    const { paymentPageUrl, token } = await paymentService.initializeCheckout(plan, amount, callbackUrl);

    // Store for later query
    localStorage.setItem('cfToken', token);
    localStorage.setItem('cfPlan', plan);

    // Open the Iyzico checkout page in a new popup window
    chrome.windows.create({
      url: paymentPageUrl,
      type: 'popup',
      width: 450,
      height: 700
    });
  } catch (error) {
    console.error('Payment initialization failed:', error);
    showNotification('Could not initialize payment', 'error');
    
    // Reset button
    e.target.disabled = false;
    e.target.textContent = e.target.dataset.plan === 'premium' ? 'Upgrade' : 'Contact Us';
  }
}

async function changePlan(plan) {
  // Show loading/processing indicator
  const activeButton = document.activeElement;
  if (activeButton && activeButton.tagName === 'BUTTON') {
    activeButton.disabled = true;
    const originalText = activeButton.textContent;
    activeButton.innerHTML = '<span class="loading-spinner"></span> Processing...';
  }
  
  try {
    const res = plan === 'free'
        ? await paymentService.updatePlan(plan)
        : { success: false };
        
    if (res.success) {
      // Update both storage locations
      chrome.storage.sync.set({ userPlan: plan });
      localStorage.setItem('userPlan', plan);
      
      // Show notification
      showNotification(plan === 'free' ? 'Successfully downgraded to Free plan' : 'Plan updated', 'success');
      
      // Refresh the UI
      renderPricingUI(plan);
    } else {
      showNotification('Failed to update plan', 'error');
      
      // Reset button
      if (activeButton) {
        activeButton.disabled = false;
        activeButton.textContent = originalText || 'Try Again';
      }
    }
  } catch (error) {
    console.error('Plan change error:', error);
    showNotification('Error updating plan', 'error');
    
    // Reset button
    if (activeButton) {
      activeButton.disabled = false;
      activeButton.textContent = originalText || 'Try Again';
    }
  }
}

function showNotification(message, type) {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.plan-notification');
  existingNotifications.forEach(n => n.remove());
  
  // Create new notification
  const notification = document.createElement('div');
  notification.className = 'plan-notification';
  notification.textContent = message;
  
  // Style based on type
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.background = type === 'success' ? '#3cb371' : '#e74c3c';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '8px';
  notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  notification.style.zIndex = '1000';
  notification.style.opacity = '1';
  notification.style.transition = 'opacity 0.5s ease';
  
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}