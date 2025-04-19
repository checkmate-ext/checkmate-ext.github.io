/* pricing.js - handles plan display, upgrades, downgrades, and payments */

// When the DOM is ready, set up plan message, cards, and button handlers
document.addEventListener('DOMContentLoaded', () => {
  const currentPlan = localStorage.getItem('userPlan') || 'free';
  const planMessage = document.getElementById('planMessage');
  const planCardsContainer = document.getElementById('planCardsContainer');

  if (!planCardsContainer) return;

  // Dynamically create the plan cards
  createPlanCards(currentPlan, planCardsContainer);

  // Update the header message based on the active plan
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

  // Set up click handlers for all plan action buttons
  wireUpButtons();
});

// Creates the plan cards inside the given container
function createPlanCards(currentPlan, container) {
  container.innerHTML = '';
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

  plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.style.opacity = plan.active ? '1' : '0.85';
    card.style.transform = plan.active ? 'scale(1.03)' : 'scale(1)';
    card.style.marginTop = plan.active ? '15px' : '5px';

    // Styling for special plans
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

    const badge = plan.active ? `<div class="plan-badge">CURRENT</div>` : '';
    const featuresList = plan.features.map(f =>
        `<li><i class="fas fa-check" style="color:${plan.color}"></i><span style="color:${plan.featureTextColor}">${f}</span></li>`
    ).join('');

    let actionButtons = '';
    if (plan.name === 'Free') {
      if (currentPlan !== 'free') actionButtons = `<button class="card-btn cancel-btn" data-action="downgrade-to-free">SWITCH TO FREE</button>`;
    } else if (plan.name === 'Premium') {
      if (currentPlan === 'free') actionButtons = `<button class="card-btn premium-bg" data-action="upgrade-to-premium">UPGRADE TO PREMIUM</button>`;
      if (currentPlan === 'premium') actionButtons = `<button class="card-btn cancel-btn" data-action="cancel-premium">CANCEL PREMIUM</button>`;
      if (currentPlan === 'enterprise') actionButtons = `<button class="card-btn downgrade-btn" data-action="downgrade-to-premium">DOWNGRADE TO PREMIUM</button>`;
    } else if (plan.name === 'Enterprise') {
      if (currentPlan !== 'enterprise') actionButtons = `<button class="card-btn enterprise-bg" data-action="upgrade-to-enterprise">UPGRADE TO ENTERPRISE</button>`;
      else actionButtons = `<button class="card-btn cancel-btn" data-action="cancel-enterprise">CANCEL ENTERPRISE</button>`;
    }

    card.innerHTML = `
      ${badge}
      <div class="plan-header">
        <h3 class="plan-name" style="color:${plan.textColor}">${plan.name}</h3>
        <div class="plan-price ${plan.priceClass}">${plan.price}</div>
      </div>
      <div class="plan-features"><ul>${featuresList}</ul></div>
      ${actionButtons}
    `;

    container.appendChild(card);
  });
}

// Hooks up all card action buttons
function wireUpButtons() {
  const buttons = document.querySelectorAll('.card-btn');
  const form = document.getElementById('payment-form');
  const submitBtn = document.getElementById('submit-payment');

  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      form.style.display = 'none';
      submitBtn.onclick = null;

      switch (action) {
        case 'upgrade-to-premium':
        case 'upgrade-to-enterprise':
          form.style.display = 'block';
          submitBtn.onclick = async () => {
            try {
              const cardInfo = {
                cardNumber:     document.getElementById('card-number').value,
                expireMonth:    document.getElementById('card-month').value,
                expireYear:     document.getElementById('card-year').value,
                cvc:            document.getElementById('card-cvc').value,
                cardHolderName: document.getElementById('card-holder').value
              };
              const { token, error } = await iyzipay.createCardToken(cardInfo);
              if (error) throw new Error(error.message);

              const newPlan = action === 'upgrade-to-premium' ? 'premium' : 'enterprise';
              const res = await fetch('http://localhost:5000/user/subscribe', {
                method: 'POST',
                headers: {
                  'Content-Type':'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ plan: newPlan, paymentToken: token })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.message || data.error);

              localStorage.setItem('userPlan', newPlan);
              alert(`Successfully upgraded to ${newPlan.charAt(0).toUpperCase()+newPlan.slice(1)}!`);
              window.location.reload();
            } catch (err) {
              alert('Payment error: ' + err.message);
            }
          };
          break;

        case 'cancel-premium':
          if (confirm('Cancel Premium subscription?')) updateFree();
          break;
        case 'cancel-enterprise':
          if (confirm('Cancel Enterprise subscription?')) updateFree();
          break;
        case 'downgrade-to-premium':
          if (confirm('Downgrade to Premium?')) doUpdate('premium', 'Downgraded to Premium.');
          break;
        case 'downgrade-to-free':
          if (confirm('Switch to Free plan?')) updateFree();
          break;
      }
    });
  });

  async function updateFree() {
    await doUpdate('free', 'Switched to Free plan.');
  }
  async function doUpdate(plan, msg) {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:5000/user/update-plan', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ plan })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Update failed');
    localStorage.setItem('userPlan', plan);
    alert(msg);
    window.location.reload();
  }
}
