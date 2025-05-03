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
  planMessage.textContent =
      currentPlan === 'free'
          ? 'Upgrade your plan to access premium features'
          : `You are currently on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan`;

  planCardsContainer.innerHTML = '';
  if (currentPlan !== 'free')
    addPlanCard('free', 'Free', '$0', ['Basic AI Checks', '3 checks/day', 'Standard support'], ['premium','enterprise'].includes(currentPlan) ? 'Downgrade' : 'Current Plan');
  if (currentPlan !== 'premium')
    addPlanCard('premium', 'Premium', '$9.99/mo', ['Advanced AI Checks', 'Unlimited checks', 'Priority support'], 'Upgrade');
  else
    addPlanCard('premium', 'Premium', '$9.99/mo', ['Advanced AI Checks', 'Unlimited checks', 'Priority support'], 'Current Plan', true);
  if (currentPlan !== 'enterprise')
    addPlanCard('enterprise', 'Enterprise', 'Contact Us', ['All Premium features', 'Team features'], 'Upgrade');
  else
    addPlanCard('enterprise', 'Enterprise', '$Contact Us', ['All Premium features', 'Team features'], 'Current Plan', true);

  document.querySelectorAll('.card-btn').forEach(btn => btn.addEventListener('click', handlePlanSelection));
}

function addPlanCard(planId, name, price, features, buttonText, isCurrentPlan = false) {
  const card = document.createElement('div');
  card.className = 'plan-card';
  card.dataset.plan = planId;

  if (isCurrentPlan) {
    const badge = document.createElement('div');
    badge.className = 'plan-badge';
    badge.textContent = 'CURRENT PLAN';
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
  const amount = plan === 'premium' ? '9.99' : '29.99';
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
