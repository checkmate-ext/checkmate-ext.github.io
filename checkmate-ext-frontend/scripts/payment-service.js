class PaymentService {
    constructor() {
        this.token = localStorage.getItem('token') || null;
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
        const resp = await fetch(`${API_BASE_URL}/cf/initialize`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ plan, price, callbackUrl })
        });
        if (!resp.ok) throw new Error('CF init failed');
        return resp.json();
    }

    // ② Query CheckoutForm result
    async queryCheckout(token, plan) {
        const resp = await fetch(`${API_BASE_URL}/cf/query`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ token, plan })
        });
        if (!resp.ok) throw new Error('CF query failed');
        return resp.json();
    }

    // Existing methods…
    async getCurrentSubscription() {
        const resp = await fetch(`${API_BASE_URL}/user/stats`, {
            method: 'GET',
            headers: this.getHeaders()
        });
        if (!resp.ok) throw new Error('Fetch subscription failed');
        const data = await resp.json();
        return { success: true, plan: data.subscription_plan };
    }

    async updatePlan(plan) {
        const resp = await fetch(`${API_BASE_URL}/user/update-plan`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ plan })
        });
        if (!resp.ok) return { success: false, error: (await resp.json()).error };
        return { success: true };
    }
}

const paymentService = new PaymentService();
export default paymentService;
