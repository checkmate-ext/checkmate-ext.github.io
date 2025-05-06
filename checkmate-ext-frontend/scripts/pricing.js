import paymentService from './payment-service.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1) Listen for the CF callback token
  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type !== 'CF_TOKEN') return;
    const plan = localStorage.getItem('cfPlan');
    try {
      const result = await paymentService.queryCheckout(message.token, plan);
      if (result.paymentStatus === 'SUCCESS') {
        chrome.storage.sync.set({ userPlan: plan }, () => renderPricingUI(plan));
        alert('Subscription successful!');
      } else {
        alert('Payment failed: ' + result.errorMessage);
      }
    } catch (err) {
      console.error('CF query error:', err);
      alert('Could not finalize payment.');
    }
  });

  // 2) Load the user's current plan
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

  // Paid flow → initialize CF
  const amount = plan === 'premium' ? '49.99' : '29.99';
  const callbackUrl = chrome.runtime.getURL('cf-callback.html');
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
}

async function changePlan(plan) {
  const res = plan === 'free'
      ? await paymentService.updatePlan(plan)
      : { success: false };
  if (res.success) {
    chrome.storage.sync.set({ userPlan: plan }, () => renderPricingUI(plan));
    localStorage.setItem('userPlan', plan);
    alert(plan === 'free' ? 'Downgraded to Free' : 'Plan updated');
  } else {
    alert('Failed to update plan');
  }
}
