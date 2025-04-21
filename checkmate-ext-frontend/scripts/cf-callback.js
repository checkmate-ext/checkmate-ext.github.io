// cf-callback.js

// Immediately run on load
(async () => {
    // 1. Grab the `token` from the URL
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    if (!token) {
        console.error('No token in callback URL');
        return;
    }

    // 2. Tell the rest of your extension about it
    //    (Use runtime.sendMessage so your popup/pricing.js can hear it)
    chrome.runtime.sendMessage({ type: 'CF_TOKEN', token });

    // 3. Close this window
    window.close();
})();
