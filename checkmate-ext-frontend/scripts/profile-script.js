// Update user profile information
document.addEventListener('DOMContentLoaded', () => {
    // Get user email from localStorage
    const userEmail = localStorage.getItem('userEmail') || 'namesurname@email.com';
    const profileEmailElement = document.querySelector('.profile-email');
    
    if (profileEmailElement) {
        // Simply display the email without profile picture
        profileEmailElement.textContent = userEmail;
        profileEmailElement.style.fontWeight = '500';
        profileEmailElement.style.fontSize = '16px';
        profileEmailElement.style.textAlign = 'center';
        profileEmailElement.style.padding = '10px 0';
    }
    
    // Enhance profile section
    const profileSection = document.querySelector('.profile-section');
    if (profileSection) {
        profileSection.style.background = 'linear-gradient(135deg, rgba(60,179,113,0.05), rgba(46,139,87,0.15))';
        profileSection.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
        profileSection.style.border = '1px solid rgba(60,179,113,0.1)';
    }
    
    // Style the edit button - removed lock icon
    const editBtn = document.getElementById('editBtn');
    if (editBtn) {
        editBtn.style.background = 'linear-gradient(135deg, #3cb371, #2e8b57)';
        editBtn.style.border = 'none';
        editBtn.style.padding = '10px 20px';
        editBtn.style.boxShadow = '0 4px 10px rgba(46,139,87,0.3)';
        editBtn.textContent = 'Change Password';
        editBtn.style.fontWeight = '500';
        editBtn.style.color = 'white';
    }
    
    // Get the current plan from localStorage
    const currentPlan = localStorage.getItem('userPlan') || 'free';
    
    // Update plan information and button styling
    const planInfo = document.querySelector('.plan-info');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const planBox = document.querySelector('.plan-box');
    
    if (planInfo) {
        // Capitalize the first letter of the plan name
        const planName = currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1);
        
        // Apply premium styling for premium/enterprise users
        if (currentPlan.toLowerCase() === 'premium' || currentPlan.toLowerCase() === 'enterprise') {
            // Apply golden gradient to plan box
            if (planBox) {
                planBox.style.background = 'linear-gradient(145deg, #f9f1c5 0%, #ffcc00 100%)';
                planBox.style.boxShadow = '0 4px 12px rgba(255, 204, 0, 0.25)';
                planBox.style.border = '1px solid rgba(255, 204, 0, 0.5)';
            }
            
            // Make plan info text fancier
            planInfo.innerHTML = `<span style="display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 18px; margin-right: 4px;">✨</span>
                <span style="font-weight: bold; color: #7B6225;">Premium Plan</span>
                <span style="font-size: 18px; margin-left: 4px;">✨</span>
            </span>`;
            
            // Add a premium badge
            const badge = document.createElement('div');
            badge.innerHTML = `<div style="background: #ffcc00; color: #7B6225; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; position: absolute; top: -10px; right: 10px; border: 1px solid #7B6225; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transform: rotate(3deg);">PREMIUM</div>`;
            planBox.style.position = 'relative'; // Make sure the box has position relative for the badge positioning
            planBox.appendChild(badge);
            
        } else {
            planInfo.innerHTML = `<span style="font-weight: 500;">Current Plan: <span style="color: #3cb371;">${planName}</span></span>`;
        }
    }
    
    if (upgradeBtn) {
        // Set button styling based on plan
        switch (currentPlan.toLowerCase()) {
            case 'premium':
                upgradeBtn.textContent = 'Manage Plan';
                upgradeBtn.style.background = 'linear-gradient(145deg, #ffeb3b 0%, #ffc107 100%)';
                upgradeBtn.style.color = '#7B6225';
                upgradeBtn.style.fontWeight = 'bold';
                upgradeBtn.style.boxShadow = '0 4px 10px rgba(255, 204, 0, 0.3)';
                upgradeBtn.style.border = '1px solid rgba(255, 204, 0, 0.6)';
                break;
            case 'enterprise':
                upgradeBtn.textContent = 'Enterprise Settings';
                upgradeBtn.style.background = 'linear-gradient(145deg, #ffeb3b 0%, #ffc107 100%)';
                upgradeBtn.style.color = '#7B6225';
                upgradeBtn.style.fontWeight = 'bold';
                upgradeBtn.style.boxShadow = '0 4px 10px rgba(255, 204, 0, 0.3)';
                upgradeBtn.style.border = '1px solid rgba(255, 204, 0, 0.6)';
                break;
            default: // 'free'
                upgradeBtn.textContent = 'Upgrade Now';
                upgradeBtn.style.background = '#ffcc00';
                upgradeBtn.style.color = '#7B6225';
                upgradeBtn.style.fontWeight = 'bold';
        }
    }
    
    // Style the past searches (dashboard) button
    const pastSearchesBtn = document.getElementById('pastSearches');
    if (pastSearchesBtn) {
        pastSearchesBtn.style.background = 'white';
        pastSearchesBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        pastSearchesBtn.style.border = '1px solid #eee';
        pastSearchesBtn.style.borderLeft = '4px solid #3cb371';
    }
    
    // Add History button
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper && pastSearchesBtn) {
        const historyBtn = document.createElement('div');
        historyBtn.id = 'historyBtn';
        historyBtn.className = 'past-searches';
        historyBtn.innerHTML = `
            <img src="../images/clock.256x256.png" alt="History">
            <span>View Search History</span>
        `;
        historyBtn.style.background = 'white';
        historyBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        historyBtn.style.border = '1px solid #eee';
        historyBtn.style.borderLeft = '4px solid #3cb371';
        historyBtn.style.marginTop = '10px';
        historyBtn.style.cursor = 'pointer';
        
        // Insert after pastSearches
        pastSearchesBtn.parentNode.insertBefore(historyBtn, pastSearchesBtn.nextSibling);
        
        // Add event listener
        historyBtn.addEventListener('click', () => {
            // Use the navigate function from navigate.js
            if (typeof navigateTo === 'function') {
                navigateTo('HistoryPage.html');
            } else {
                // Fallback if navigateTo is not available
                window.location.href = 'HistoryPage.html';
            }
        });
    }
    
    // If premium, add animated gold glow effect
    if (currentPlan.toLowerCase() === 'premium' || currentPlan.toLowerCase() === 'enterprise') {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            @keyframes goldPulse {
                0% { box-shadow: 0 0 8px rgba(255, 204, 0, 0.5); }
                50% { box-shadow: 0 0 16px rgba(255, 204, 0, 0.8); }
                100% { box-shadow: 0 0 8px rgba(255, 204, 0, 0.5); }
            }
            #upgradeBtn:hover {
                animation: goldPulse 1.5s infinite;
                transform: translateY(-2px);
            }
        `;
        document.head.appendChild(styleElement);
    }
});