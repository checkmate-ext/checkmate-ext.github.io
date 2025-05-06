// scripts/callback-handler.js
import paymentService from './payment-service.js';

(async () => {
  const statusEl = document.getElementById('status');
  const p = new URLSearchParams(location.search);
  const token = p.get('token'), plan = p.get('plan');
  
  if (!token) {
    statusEl.textContent = 'No token in URL.';
    return;
  }
  
  try {
    const result = await paymentService.queryCheckout(token, plan);
    
    if (result.paymentStatus === 'SUCCESS') {
      statusEl.innerHTML = '<h2 style="color:green">Payment successful!</h2>';
      
      // Send message to the extension about successful payment
      chrome.runtime.sendMessage({ 
        type: 'CF_TOKEN', 
        token: token, 
        plan: plan,
        success: true
      });
      
      // Close this window after a short delay
      setTimeout(() => {
        window.close();
      }, 2000);
    } else {
      statusEl.innerHTML = `<h2 style="color:red">${result.errorMessage || result.paymentStatus}</h2>`;
    }
  } catch (e) {
    statusEl.textContent = 'Error: ' + e.message;
  }
})();