class PaymentService {
    constructor() {
        this.token = localStorage.getItem('token') || null;
        // Get the API base URL from window object
        this.apiBaseUrl = window.API_BASE_URL;
        this.handleRedirectCallback();
    }

    loadToken() {
        this.token = localStorage.getItem('token') || null;
        return this.token;
    }

    getHeaders() {
        if (!this.loadToken()) throw new Error('Not authenticated');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // ① Initialize CheckoutForm
    async initializeCheckout(plan, price, callbackUrl) {
        const resp = await fetch(`${this.apiBaseUrl}/cf/initialize`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ plan, price, callbackUrl })
        });
        if (!resp.ok) throw new Error('CF init failed');
        return resp.json();
    }

    // ② Query CheckoutForm result
    async queryCheckout(token, plan) {
        const resp = await fetch(`${this.apiBaseUrl}/cf/query`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ token, plan })
        });
        if (!resp.ok) throw new Error('CF query failed');
        return resp.json();
    }

    // Existing methods…
    async getCurrentSubscription() {
        const resp = await fetch(`${this.apiBaseUrl}/user/stats`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        if (!resp.ok) throw new Error('Fetch subscription failed');
        const data = await resp.json();
        return { success: true, plan: data.subscription_plan };
    }

    async updatePlan(plan) {
        const resp = await fetch(`${this.apiBaseUrl}/user/update-plan`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ plan })
        });
        if (!resp.ok) return { success: false, error: (await resp.json()).error };
        return { success: true };
    }


    // Find the handleRedirectCallback method and update it to:
    async handleRedirectCallback() {
    try {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get('token');
        const plan = localStorage.getItem('cfPlan');
        
        if (!token || !plan) {
        throw new Error('Missing token or plan information');
        }
        
        // Send message to main extension context
        chrome.runtime.sendMessage({
        type: 'CF_TOKEN',
        token: token,
        plan: plan
        });
        
        // Optionally close this window after short delay
        setTimeout(() => {
        window.close();
        }, 1000);
        
        return true;
    } catch (e) {
        console.error('Error in redirect callback:', e);
        return false;
    } finally {
        // Clean up URL and storage
        localStorage.removeItem('pendingPlan');
        history.replaceState(null, '', window.location.pathname);
    }
    }
}

const paymentService = new PaymentService();
export default paymentService;