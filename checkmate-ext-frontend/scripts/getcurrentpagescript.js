document.addEventListener('DOMContentLoaded', () => {
    const currentPageUrlElement = document.getElementById('currentPageUrl');
    const analyzeButton = document.getElementById('analyzeButton');

    // Get the active tab in the current window when the page loads
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url) {
            // Display the URL before the button is clicked
            currentPageUrlElement.textContent = activeTab.url;

            // Store the URL for sending when the button is clicked
            analyzeButton.dataset.url = activeTab.url;
        } else {
            currentPageUrlElement.textContent = 'No active tab';
        }
    });

    // When the Analyze Current Page button is clicked
    analyzeButton.addEventListener('click', () => {
        const url = analyzeButton.dataset.url;
        if (url) {
            // Send the URL to the Python server
            fetch('http://localhost:5000/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            })
            .then(response => response.json())
            .then(data => {
                // Handle the server response
                console.log(data);
            })
            .catch(error => {
                // Ignore errors
            });
        } else {
            console.error('No URL to send');
        }
    });
});