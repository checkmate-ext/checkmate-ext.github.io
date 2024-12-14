document.addEventListener('DOMContentLoaded', () => {
    const currentPageUrlElement = document.getElementById('currentPageUrl');

    // Get the active tab in the current window
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url) {
            currentPageUrlElement.textContent = activeTab.url;
        } else {
            currentPageUrlElement.textContent = 'No active tab';
        }
    });
});